const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys")
const pino = require("pino")
const fs = require('fs')
const path = require('path')
const express = require('express')
const qrcode = require('qrcode')

// CONFIG - EDIT HERE
const config = {
    botName: 'VOID-MD',
    owner: '254112843071', // your number
    prefix: '.',
    themeEmoji: '💀'
}

const app = express()
const PORT = process.env.PORT || 10000
const commands = new Map()
let latestQR = null

// SIMPLE MESSAGE PARSER - NO MORE LIB/
const parseMsg = (VoidMD, m) => {
    if (!m) return m
    m.isGroup = m.key.remoteJid.endsWith('@g.us')
    m.from = m.key.remoteJid
    m.sender = m.key.participant || m.key.remoteJid
    m.text = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || ''
    m.reply = (text) => VoidMD.sendMessage(m.from, { text }, { quoted: m })
    return m
}

// LOAD COMMANDS
const cmdPath = path.join(__dirname, 'commands')
if (fs.existsSync(cmdPath)) {
    const files = fs.readdirSync(cmdPath).filter(f => f.endsWith('.js'))
    console.log('Loading commands:', files)
    for (const file of files) {
        try {
            const cmd = require(path.join(cmdPath, file))
            if (cmd.name) {
                commands.set(cmd.name, cmd)
                console.log(`[LOADED] ${cmd.name}`)
            }
        } catch (e) {
            console.log(`[ERROR] ${file}:`, e.message)
        }
    }
}

app.get('/', async (req, res) => {
    if (latestQR) {
        res.send(`<body style="background:#000;text-align:center;padding-top:10vh;"><img src="${latestQR}" style="width:300px;"><h2 style="color:#fff;">${config.botName}</h2></body>`)
    } else {
        res.send(`<body style="background:#000;color:#0f0;text-align:center;padding-top:20vh;"><h1>${config.botName} Online</h1><p>Commands: ${commands.size}</p></body>`)
    }
})
app.listen(PORT, () => console.log(`Server: ${PORT}`))

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    const { version } = await fetchLatestBaileysVersion()

    const VoidMD = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        browser: [config.botName, "Chrome", "1.0.0"],
        auth: state
    })

    VoidMD.ev.on('creds.update', saveCreds)

    VoidMD.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        if (qr) {
            latestQR = await qrcode.toDataURL(qr)
            console.log('QR ready')
        }
        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode
            if (code === DisconnectReason.loggedOut) {
                fs.rmSync('./session', { recursive: true, force: true })
            }
            setTimeout(startBot, 3000)
        }
        if (connection === 'open') {
            latestQR = null
            console.log(`Bot connected: ${VoidMD.user.id}`)
        }
    })

    VoidMD.ev.on('messages.upsert', async ({ messages }) => {
        try {
            const m = messages[0]
            if (!m.message || m.key.fromMe) return

            const msg = parseMsg(VoidMD, m)
            if (!msg.text.startsWith(config.prefix)) return

            const args = msg.text.slice(config.prefix.length).trim().split(/ +/)
            const cmdName = args.shift().toLowerCase()
            const cmd = commands.get(cmdName) || [...commands.values()].find(c => c.alias?.includes(cmdName))

            if (!cmd) return

            console.log(`[CMD] ${cmdName} from ${msg.sender}`)
            await cmd.execute(msg, { VoidMD, args, config, commands })
        } catch (e) {
            console.log(`[CRASH]`, e.message)
        }
    })
}

startBot()

// Keep alive
setInterval(() => {
    if (process.env.RENDER_EXTERNAL_URL) {
        require('https').get(process.env.RENDER_EXTERNAL_URL).on('error', () => {})
    }
}, 240000)
