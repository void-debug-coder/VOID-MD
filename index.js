const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const http = require('http')
const path = require('path')
const qrcode = require('qrcode')

let config = JSON.parse(fs.readFileSync('./config.json'))
const BOT_IMAGE = 'https://files.catbox.moe/bhiw6e.png'
const VERSION = '1.2.5'
const PORT = process.env.PORT || 10000

let commands = new Map()
let botStatus = 'Starting...'
let currentQR = null

if (!fs.existsSync('./commands')) fs.mkdirSync('./commands')
if (!fs.existsSync('./banned.json')) fs.writeFileSync('./banned.json', '[]')

const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'))
console.log(`Loading ${commandFiles.length} command files...`)

for (const file of commandFiles) {
    try {
        const cmd = require(`./commands/${file}`)
        if (!cmd.name) continue
        commands.set(cmd.name, cmd)
        if (cmd.alias) cmd.alias.forEach(a => commands.set(a, cmd))
    } catch (e) {
        console.log(`Error loading ${file}:`, e.message)
    }
}
console.log(`Total commands loaded: ${commands.size}`)

const saveConfig = () => fs.writeFileSync('./config.json', JSON.stringify(config, null, 2))

const uptime = () => {
    const sec = process.uptime()
    const h = Math.floor(sec / 3600)
    const m = Math.floor(sec % 3600 / 60)
    const s = Math.floor(sec % 60)
    return `${h}h ${m}m ${s}s`
}

const server = http.createServer(async (req, res) => {
    if (req.url === '/') {
        let html = `
<!DOCTYPE html>
<html>
<head>
    <title>VOID-MD ${VERSION}</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            background: #0a0a0a;
            color: #fff;
            font-family: monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            flex-direction: column;
            text-align: center;
        }
  .container { padding: 20px; max-width: 400px; }
        h1 { color: #00ff00; margin-bottom: 10px; font-size: 24px; }
  .status { color: #888; margin-bottom: 20px; }
        img { max-width: 300px; border: 2px solid #00ff00; border-radius: 10px; }
  .connected { color: #00ff00; font-size: 20px; }
  .info { margin-top: 20px; color: #666; font-size: 12px; }
  .warning { color: #ff0; font-size: 12px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>VOID-MD ${VERSION}</h1>
        <div class="status">Status: ${botStatus}</div>
        ${currentQR?
            `<img src="${currentQR}" alt="QR Code"><p>Scan with WhatsApp > Linked Devices</p><div class="warning">QR refreshes every 20s. Scan fast!</div>` :
            `<div class="connected">Bot Connected</div><p>Owner: ${config.OWNER_NUMBER || 'Not set'}</p>`
        }
        <div class="info">
            Commands: ${commands.size} | Prefix: ${config.PREFIX}<br>
            Uptime: ${uptime()}
        </div>
    </div>
    <script>setTimeout(() => location.reload(), 3000)</script>
</body>
</html>`
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(html)
    }
})

server.listen(PORT, () => console.log(`Server running on ${PORT}`))

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'info' }),
        auth: state,
        printQRInTerminal: false,
        browser: ['VOID-MD', 'Chrome', '124.0.0'],
        markOnlineOnConnect: false,
        syncFullHistory: false
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            botStatus = 'Scan QR Code'
            currentQR = await qrcode.toDataURL(qr)
            console.log('QR CODE GENERATED - SCAN NOW')
        }

        if (connection === 'close') {
            botStatus = 'Disconnected'
            currentQR = null
            const statusCode = lastDisconnect?.error?.output?.statusCode
            console.log('Connection closed with code:', statusCode)
            
            if (statusCode === DisconnectReason.loggedOut) {
                console.log('LOGGED OUT - DELETE SESSION FOLDER ON GITHUB')
                botStatus = 'Logged out - delete session folder'
            } else if (statusCode === 405) {
                console.log('ERROR 405 - Number banned. Wait 24hrs or use new number')
                botStatus = 'Error 405 - Number banned'
            } else {
                console.log('Reconnecting in 5s...')
                setTimeout(startBot, 5000)
            }
        } else if (connection === 'open') {
            botStatus = 'Connected'
            currentQR = null
            console.log('VOID-MD CONNECTED - READY FOR COMMANDS')

            const ownerJid = sock.user.id
            const ownerNum = ownerJid.split(':')[0].split('@')[0]
            config.OWNER_NUMBER = ownerNum
            saveConfig()
            console.log(`Owner set to: ${ownerNum}`)
            
            await sock.sendMessage(ownerJid, { text: `VOID-MD ${VERSION} ONLINE\nSend ${config.PREFIX}menu to test` })
        }
    })

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        console.log(`Message event: ${type}`)
        const m = messages[0]
        if (!m.message || m.key.fromMe) return

        const from = m.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const sender = m.key.participant || from
        const senderNum = sender.split('@')[0].split(':')[0]
        const isOwner = senderNum === config.OWNER_NUMBER
        const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ''
        const isCmd = body.startsWith(config.PREFIX)
        const command = isCmd? body.slice(config.PREFIX.length).trim().split(' ')[0].toLowerCase() : ''
        const args = body.trim().split(/ +/).slice(1)

        if (isCmd) console.log(`[CMD] ${command} | From: ${senderNum} | Owner: ${isOwner}`)

        if (config.autoread) await sock.readMessages([m.key])

        if (isCmd) {
            const cmd = commands.get(command)
            if (!cmd) {
                console.log(`[CMD] Not found: ${command}`)
                return
            }

            const banned = JSON.parse(fs.readFileSync('./banned.json'))
            if (banned.includes(sender) &&!isOwner) return

            const reply = (text, opts = {}) => sock.sendMessage(from, { text,...opts }, { quoted: m })

            try {
                console.log(`[CMD] Executing: ${command}`)
                await cmd.execute({
                    reply, sock, m, from, isGroup, isOwner, args, command,
                    config, saveConfig, commands,
                    quoted: m.message.extendedTextMessage?.contextInfo?.quotedMessage,
                    mentioned: m.message.extendedTextMessage?.contextInfo?.mentionedJid || [],
                    PREFIX: config.PREFIX, BOT_NAME: config.BOT_NAME,
                    VERSION, uptime, BOT_IMAGE
                })
            } catch (e) {
                console.error(`[CMD] Error:`, e)
                reply(`Error: ${e.message}`)
            }
        }
    })
}

startBot()
