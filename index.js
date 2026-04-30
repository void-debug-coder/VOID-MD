const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const http = require('http')
const { Boom } = require('@hapi/boom')
const qrcode = require('qrcode')

let config = JSON.parse(fs.readFileSync('./config.json'))
const BOT_IMAGE = 'https://files.catbox.moe/bhiw6e.png'
const VERSION = '1.2.0'
const PORT = process.env.PORT || 3000

let commands = new Map()
let currentQR = null
let botStatus = 'Starting...'

// Load all commands
fs.readdirSync('./commands').forEach(file => {
    if (file.endsWith('.js')) {
        const cmd = require(`./commands/${file}`)
        commands.set(cmd.name, cmd)
        if (cmd.alias) cmd.alias.forEach(a => commands.set(a, cmd))
    }
})

const saveConfig = () => fs.writeFileSync('./config.json', JSON.stringify(config, null, 2))

const uptime = () => {
    const sec = process.uptime()
    const h = Math.floor(sec / 3600)
    const m = Math.floor(sec % 3600 / 60)
    const s = Math.floor(sec % 60)
    return `${h}h ${m}m ${s}s`
}

// Web server to display QR
const server = http.createServer(async (req, res) => {
    if (req.url === '/') {
        let html = `
<!DOCTYPE html>
<html>
<head>
    <title>VOID-MD ${VERSION}</title>
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
       .container { padding: 20px; }
        h1 { color: #00ff00; margin-bottom: 10px; }
       .status { color: #888; margin-bottom: 20px; }
        img { max-width: 300px; border: 2px solid #00ff00; border-radius: 10px; }
       .connected { color: #00ff00; font-size: 20px; }
       .info { margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>💀 VOID-MD ${VERSION}</h1>
        <div class="status">Status: ${botStatus}</div>
        ${currentQR? 
            `<img src="${currentQR}" alt="QR Code"><p>Scan with WhatsApp > Linked Devices</p>` : 
            `<div class="connected">✅ Bot Connected</div><p>Owner: ${config.OWNER_NUMBER || 'Not set'}</p>`
        }
        <div class="info">
            Commands: ${commands.size} | Prefix: ${config.PREFIX}<br>
            Uptime: ${uptime()}
        </div>
    </div>
    <script>setTimeout(() => location.reload(), 5000)</script>
</body>
</html>`
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(html)
    }
})

server.listen(PORT, () => console.log(`Server running on ${PORT}`))

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: ['VOID-MD', 'Chrome', '1.2.0']
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        // Generate QR for webpage
        if (qr) {
            botStatus = 'Scan QR Code'
            currentQR = await qrcode.toDataURL(qr)
            console.log('QR Code updated - check webpage')
        }

        if (connection === 'close') {
            botStatus = 'Disconnected'
            currentQR = null
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode!== DisconnectReason.loggedOut
            console.log('Connection closed, reconnecting:', shouldReconnect)
            if (shouldReconnect) startBot()
        } else if (connection === 'open') {
            botStatus = 'Connected'
            currentQR = null
            
            // AUTO-SET OWNER TO SCANNED NUMBER 💀
            const ownerJid = sock.user.id
            const ownerNum = ownerJid.split(':')[0]

            if (config.OWNER_NUMBER!== ownerNum) {
                config.OWNER_NUMBER = ownerNum
                saveConfig()
                console.log(`Owner auto-set to: ${ownerNum} 💀`)
                await sock.sendMessage(ownerJid, {
                    text: `*VOID-MD ${VERSION} ACTIVATED* 💀\n\n*Owner:* @${ownerNum}\n*Prefix:* ${config.PREFIX}\n*Commands:* ${commands.size}\n\nType ${config.PREFIX}menu to start`,
                    mentions: [ownerJid]
                })
            } else {
                console.log('VOID-MD connected 💀')
            }

            if (config.autonline) sock.sendPresenceUpdate('available')
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return

        const from = m.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const sender = m.key.participant || from
        const isOwner = sender.split('@')[0] === config.OWNER_NUMBER
        const body = m.message.conversation || m.message.extendedTextMessage?.text || ''
        const isCmd = body.startsWith(config.PREFIX)
        const command = isCmd? body.slice(1).trim().split(' ')[0].toLowerCase() : ''
        const args = body.trim().split(/ +/).slice(1)
        const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage
        const mentioned = m.message.extendedTextMessage?.contextInfo?.mentionedJid || []

        if (config.autoread) await sock.readMessages([m.key])

        if (from === 'status@broadcast' && config.autoview) {
            await sock.readMessages([m.key])
            try { await sock.sendMessage(from, { react: { text: '💀', key: m.key } }) } catch {}
        }

        if (isGroup && config.antilink && body.includes('chat.whatsapp.com/')) {
            const groupMetadata = await sock.groupMetadata(from)
            const botAdmin = groupMetadata.participants.find(p => p.id === sock.user.id.split(':')[0] + '@s.whatsapp.net')?.admin
            const senderAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin
            if (botAdmin &&!senderAdmin &&!isOwner) {
                await sock.sendMessage(from, { text: `*Antilink detected* 💀\n@${sender.split('@')[0]} kicked`, mentions: [sender] }, { quoted: m })
                await sock.groupParticipantsUpdate(from, [sender], 'remove')
            }
        }

        if (config.autotyping &&!isGroup) {
            await sock.sendPresenceUpdate('composing', from)
            setTimeout(() => sock.sendPresenceUpdate('paused', from), 3000)
        }

        if (config.autorecording &&!isGroup) {
            await sock.sendPresenceUpdate('recording', from)
            setTimeout(() => sock.sendPresenceUpdate('paused', from), 3000)
        }

        if (isCmd) {
            const cmd = commands.get(command)
            if (!cmd) return

            const banned = JSON.parse(fs.readFileSync('./banned.json'))
            if (banned.includes(sender) &&!isOwner) return

            const reply = (text, opts = {}) => sock.sendMessage(from, { text,...opts }, { quoted: m })

            try {
                await cmd.execute({
                    reply, sock, m, from, isGroup, isOwner, args, command,
                    config, saveConfig, commands, quoted, mentioned,
                    PREFIX: config.PREFIX, BOT_NAME: config.BOT_NAME,
                    VERSION, uptime, BOT_IMAGE
                })
            } catch (e) {
                console.error('Command error:', e)
                reply(`*Error:* ${e.message} 💀`)
            }
        }
    })

    sock.ev.on('messages.update', async (update) => {
        if (!config.antidelete) return
        for (const { key, update: msgUpdate } of update) {
            if (msgUpdate?.messageStubType === 1) {
                try {
                    const msg = await sock.loadMessage(key.remoteJid, key.id)
                    if (msg?.message) {
                        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '*Media deleted* 💀'
                        await sock.sendMessage(key.remoteJid, {
                            text: `*ANTIDELETE* 💀\n*From:* @${key.participant?.split('@')[0] || 'Unknown'}\n*Message:* ${text}`,
                            mentions: [key.participant]
                        })
                    }
                } catch {}
            }
        }
    })
}

startBot()
