const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, jidDecode } = require("@whiskeysockets/baileys")
const pino = require("pino")
const fs = require('fs')
const path = require('path')
const express = require('express')
const qrcode = require('qrcode')
const { smsg } = require('./lib/functions')
const settings = require('./settings')

const app = express()
const PORT = process.env.PORT || 10000
const commands = new Map()
let latestQR = null

global.botname = settings.botName
global.themeemoji = settings.themeEmoji
global.owner = settings.ownerNumber
global.prefix = settings.prefix

// Load from commands folder using absolute path
const loadCommands = (dir) => {
    const cmdPath = path.join(__dirname, dir)
    if (!fs.existsSync(cmdPath)) {
        console.log('[CMD] commands folder missing')
        return
    }
    const files = fs.readdirSync(cmdPath).filter(f => f.endsWith('.js'))
    console.log('Files in commands:', files)
    for (const file of files) {
        const filePath = path.join(cmdPath, file)
        try {
            delete require.cache[require.resolve(filePath)]
            const cmd = require(filePath)
            if (cmd?.name) {
                commands.set(cmd.name, cmd)
                console.log(`[CMD] Loaded: ${cmd.name}`)
            }
        } catch (e) {
            console.log(`[CMD ERROR] ${file}:`, e.message)
        }
    }
}
loadCommands('./commands')

app.get('/', async (req, res) => {
    if (latestQR) {
        res.send(`<body style="background:#000;text-align:center;padding-top:10vh;"><img src="${latestQR}" style="width:300px;"><h2 style="color:#fff;">Scan QR</h2></body>`)
    } else {
        res.send(`<body style="background:#000;color:#0f0;text-align:center;padding-top:20vh;"><h1>${global.botname} Online</h1><p>Commands: ${commands.size}</p></body>`)
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
        browser: [global.botname, "Chrome", "1.0.0"],
        auth: state
    })

    VoidMD.decodeJid = (jid) => {
        if (!jid) return jid
        if (/:\d+@/gi.test(jid)) {
            const decode = jidDecode(jid) || {}
            return decode.user && decode.server && decode.user + '@' + decode.server || jid
        } else return jid
    }

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
        const m = messages[0]
        if (!m.message || m.key.fromMe) return

        const msg = smsg(VoidMD, m)
        const body = msg.text || ''
        if (!body.startsWith(global.prefix)) return

        const args = body.slice(global.prefix.length).trim().split(/ +/)
        const cmdName = args.shift().toLowerCase()
        const text = args.join(' ')
        const cmd = commands.get(cmdName) || [...commands.values()].find(c => c.alias?.includes(cmdName))

        if (!cmd) return

        console.log(`[CMD] ${cmdName}`)
        try {
            await cmd.execute(msg, { VoidMD, args, text, prefix: global.prefix, commands })
        } catch (e) {
            console.log(`[ERROR] ${cmdName}:`, e.message)
        }
    })
}

startBot()

// Keep Render alive
setInterval(() => {
    if (process.env.RENDER_EXTERNAL_URL) {
        require('https').get(process.env.RENDER_EXTERNAL_URL).on('error', () => {})
    }
}, 240000)
