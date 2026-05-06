require('./settings')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const chalk = require('chalk')
const path = require('path')
const { smsg, sleep, delay } = require('./lib/functions')
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    jidDecode,
    jidNormalizedUser,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys")
const NodeCache = require("node-cache")
const pino = require("pino")
const readline = require("readline")
const { rmSync } = require('fs')
const express = require('express')
const qrcode = require('qrcode')
const store = require('./lib/store')
const settings = require('./settings')

const app = express()
const PORT = process.env.PORT || 3000
const commands = new Map()
let latestQR = null
let botStatus = 'Starting...'

// Auto-save store
setInterval(() => store.writeToFile(), settings.storeWriteInterval)

// RAM Monitor + Auto Restart
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 400) {
        console.log('⚠️ RAM >400MB, restarting...')
        process.exit(1)
    }
}, 30000)

// GC every 1 min
setInterval(() => {
    if (global.gc) {
        global.gc()
        console.log('🧹 GC completed')
    }
}, 60000)

// Load owner
let OWNER_NUMBER = settings.ownerNumber
const OWNER_FILE = './data/owner.json'
if (fs.existsSync(OWNER_FILE)) {
    try {
        OWNER_NUMBER = JSON.parse(fs.readFileSync(OWNER_FILE)).owner
    } catch {}
}

global.botname = settings.botName
global.themeemoji = settings.themeEmoji
global.owner = OWNER_NUMBER
global.prefix = settings.prefix

// Global toggles
global.anticall = false
global.autoread = false
global.autoviewstatus = false
global.autolikestatus = false
global.autotyping = false
global.autorecording = false
global.alwaysonline = false
global.public = true

// Load commands recursively from ./plugins
const loadCommands = (dir) => {
    if (!fs.existsSync(dir)) {
        console.log(chalk.yellow(`[WARN] Plugins folder '${dir}' not found. Creating...`))
        fs.mkdirSync(dir, { recursive: true })
        return
    }
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file)
        if (fs.statSync(filePath).isDirectory()) {
            loadCommands(filePath)
        } else if (file.endsWith('.js')) {
            try {
                delete require.cache[require.resolve(filePath)] // Hot reload fix
                const command = require(filePath)
                if (command.name) {
                    commands.set(command.name, command)
                    console.log(`[CMD] Loaded: ${command.name}`)
                }
            } catch (e) {
                console.log(chalk.red(`[CMD ERROR] ${file}:`), e.message)
            }
        }
    })
}
loadCommands('./plugins')

// Keep alive
app.get('/ping', (req, res) => res.send('Alive'))
setInterval(() => {
    if (process.env.RENDER_EXTERNAL_URL) {
        require('https').get(`${process.env.RENDER_EXTERNAL_URL}/ping`).on('error', () => {})
    }
}, 240000)

// Web UI
app.get('/', async (req, res) => {
    if (botStatus === 'Connected') {
        res.send(`<html><body style="background:#000;color:#0f0;font-family:monospace;text-align:center;padding-top:15vh;"><h1>✅ ${global.botname} ONLINE</h1><p>Owner: ${OWNER_NUMBER}</p><p>Commands: ${commands.size}</p><p>Mode: ${global.public? 'PUBLIC':'PRIVATE'}</p><p>RAM: ${(process.memoryUsage().rss/1024/1024).toFixed(2)}MB</p><p>Prefix: ${global.prefix}</p></body></html>`)
    } else if (latestQR) {
        res.send(`<html><head><meta http-equiv="refresh" content="20"></head><body style="background:#000;color:#fff;font-family:monospace;text-align:center;padding-top:10vh;"><h1>🌟 Scan QR Code</h1><img src="${latestQR}" style="border:5px solid #0f0;width:300px;"><p>WhatsApp > Linked Devices</p></body></html>`)
    } else {
        res.send(`<html><body style="background:#000;color:#fff;font-family:monospace;text-align:center;padding-top:20vh;"><h1>${global.botname}</h1><p>${botStatus}</p></body></html>`)
    }
})

app.listen(PORT, () => console.log(chalk.green(`[SERVER] Port ${PORT}`)))

// Pairing code setup
const pairingCode = process.argv.includes("--pairing-code")
const rl = process.stdin.isTTY? readline.createInterface({ input: process.stdin, output: process.stdout }) : null
const question = (text) => rl? new Promise(r => rl.question(text, r)) : Promise.resolve(OWNER_NUMBER)

async function startBot() {
    try {
        console.log(chalk.cyan(`[BOT] Starting ${global.botname}...`))
        if (!fs.existsSync('./session')) fs.mkdirSync('./session')
        if (!fs.existsSync('./data')) fs.mkdirSync('./data')

        const { state, saveCreds } = await useMultiFileAuthState('./session')
        const { version } = await fetchLatestBaileysVersion()
        const msgRetryCounterCache = new NodeCache()

        const VoidMD = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal:!pairingCode,
            browser: [global.botname, "Chrome", settings.version],
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" }))
            },
            markOnlineOnConnect: global.alwaysonline,
            generateHighQualityLinkPreview: true,
            getMessage: async (key) => {
                return store.loadMessage(jidNormalizedUser(key.remoteJid), key.id)?.message || ""
            },
            msgRetryCounterCache
        })

        store.bind(VoidMD.ev)

        VoidMD.decodeJid = (jid) => {
            if (!jid) return jid
            if (/:\d+@/gi.test(jid)) {
                let decode = jidDecode(jid) || {}
                return decode.user && decode.server && decode.user + '@' + decode.server || jid
            } else return jid
        }

        VoidMD.ev.on('creds.update', saveCreds)

        // Pairing Code
        if (pairingCode &&!VoidMD.authState.creds.registered) {
            let phoneNumber = await question(chalk.bgBlack(chalk.greenBright(`Enter WhatsApp number with country code:\nExample: 254712345678 : `)))
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '')

            setTimeout(async () => {
                try {
                    let code = await VoidMD.requestPairingCode(phoneNumber, settings.pairCode)
                    code = code?.match(/.{1,4}/g)?.join("-") || code
                    console.log(chalk.black(chalk.bgGreen(`Pair Code: `)), chalk.black(chalk.white(code)))
                } catch (e) {
                    console.log(chalk.red('Pair code failed:', e.message))
                }
            }, 3000)
        }

        // Connection
        VoidMD.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update

            if (qr) {
                latestQR = await qrcode.toDataURL(qr)
                botStatus = 'Scan QR'
                console.log('[QR] Ready at /')
            }

            if (connection === 'close') {
                const code = lastDisconnect?.error?.output?.statusCode
                botStatus = 'Disconnected'
                latestQR = null
                if (code === DisconnectReason.loggedOut || code === 401) {
                    try { rmSync('./session', { recursive: true, force: true }) } catch {}
                    console.log(chalk.red('Logged out. Restarting...'))
                    setTimeout(startBot, 3000)
                } else {
                    console.log('[RECONNECT] 5s...')
                    setTimeout(startBot, 5000)
                }
            } else if (connection === 'open') {
                botStatus = 'Connected'
                latestQR = null
                console.log(chalk.green(`✅ ${global.botname} Connected: ${VoidMD.user.id}`))

                // Auto follow newsletters
                for (let jid of settings.newsletterJids) {
                    try { await VoidMD.newsletterFollow(jid) } catch {}
                }

                // Save owner
                fs.writeFileSync(OWNER_FILE, JSON.stringify({ owner: OWNER_NUMBER }))

                // Startup msg
                const botJid = VoidMD.user.id.split(':')[0] + '@s.whatsapp.net'
                await VoidMD.sendMessage(botJid, {
                    text: `*${global.themeemoji} ${global.botname} ACTIVE*\n\n*Time:* ${new Date().toLocaleString()}\n*RAM:* ${(process.memoryUsage().rss/1024/1024).toFixed(2)}MB\n*Mode:* ${global.public? 'Public':'Private'}\n*Prefix:* ${global.prefix}\n*Commands:* ${commands.size}\n\n*Update:* ${settings.channels.update}`
                })

                console.log(chalk.cyan(`< ========== ${global.botname} ${settings.version} ========== >`))
            }
        })

        // Anti-call
        const antiCallNotified = new Set()
        VoidMD.ev.on('call', async (calls) => {
            if (!global.anticall) return
            for (let call of calls) {
                const caller = call.from
                if (!caller) continue
                try {
                    if (call.id) await VoidMD.rejectCall(call.id, caller).catch(() => {})
                    if (!antiCallNotified.has(caller)) {
                        antiCallNotified.add(caller)
                        setTimeout(() => antiCallNotified.delete(caller), 60000)
                        await VoidMD.sendMessage(caller, { text: '*📵 Anti-Call ON*\nCalls blocked.' })
                    }
                    setTimeout(() => VoidMD.updateBlockStatus(caller, 'block').catch(() => {}), 1000)
                } catch {}
            }
        })

        // Auto status
        VoidMD.ev.on('messages.upsert', async ({ messages }) => {
            for (let msg of messages) {
                if (msg.key.remoteJid === 'status@broadcast' && global.autoviewstatus) {
                    try {
                        await VoidMD.readMessages([msg.key])
                        if (global.autolikestatus) {
                            await VoidMD.sendMessage(msg.key.remoteJid, { react: { text: '💚', key: msg.key } })
                        }
                    } catch {}
                }
            }
        })

        // Command handler
        VoidMD.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type!== 'notify') return
            const m = messages[0]
            if (!m.message || m.key.fromMe) return

            const msg = smsg(VoidMD, m)
            store.saveMessage(msg.chat, msg.id, msg)

            const botNum = VoidMD.user?.id?.replace(/[^0-9]/g, '')
            const senderNum = msg.sender.replace(/[^0-9]/g, '')
            if (senderNum === botNum) return

            if (global.autoread && msg.chat!== 'status@broadcast') {
                try { await VoidMD.readMessages([msg.key]) } catch {}
            }
            if (global.autotyping) try { await VoidMD.sendPresenceUpdate('composing', msg.chat) } catch {}
            if (global.autorecording) try { await VoidMD.sendPresenceUpdate('recording', msg.chat) } catch {}

            if (!msg.body || !msg.body.startsWith(global.prefix)) return
            if (!global.public && senderNum!== OWNER_NUMBER) return

            const args = msg.body.slice(global.prefix.length).trim().split(/ +/)
            const cmdName = args.shift().toLowerCase()
            const text = args.join(' ')
            const cmd = commands.get(cmdName) || [...commands.values()].find(c => c.alias?.includes(cmdName))
            if (!cmd) return

            console.log(chalk.magenta(`[CMD] ${cmdName} from ${senderNum}`))

            try {
                await VoidMD.sendMessage(msg.chat, { react: { text: cmd.react || '⚡', key: msg.key } }).catch(() => {})
                await cmd.execute(msg, {
                    VoidMD,
                    commands,
                    args,
                    text,
                    prefix: global.prefix,
                    owner: OWNER_NUMBER,
                    sender: msg.sender,
                    senderNum,
                    isGroup: msg.isGroup,
                    isAdmin: msg.isAdmin,
                    isBotAdmin: msg.isBotAdmin,
                    isOwner: senderNum === OWNER_NUMBER
                })
            } catch (e) {
                console.log(chalk.red(`[ERROR] ${cmdName}:`), e.message)
                await VoidMD.sendMessage(msg.chat, { text: `*Error* ${global.themeemoji}\n${e.message}` }, { quoted: msg }).catch(() => {})
            }
        })

    } catch (error) {
        console.log(chalk.red('[CRASH]'), error.message)
        botStatus = 'Crashed'
        setTimeout(startBot, 10000)
    }
}

startBot()

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)
