const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const path = require('path')
const pino = require('pino')
const http = require('http')
const qrcode = require('qrcode')

// ===== CONFIG =====
const PREFIX = '.'
const BOT_NAME = 'VOID-MD'
const OWNER_NAME = 'Mr Void'
const OWNER_NUMBER = '254112843071' // Your main number
const BOT_NUMBER = '254738440805' // Bot number that scans QR
const BOT_IMAGE = 'https://files.catbox.moe/bhiw6e.png'
const VERSION = 'v1.2.7'
const PORT = process.env.PORT || 10000

let config = JSON.parse(fs.readFileSync('./config.json'))
const startTime = Date.now()
const msgStore = new Map()
let currentQR = null
let botStatus = 'Starting...'

// ===== LOAD COMMANDS =====
const commands = new Map()
const commandsPath = path.join(__dirname, 'commands')
if (!fs.existsSync('./banned.json')) fs.writeFileSync('./banned.json', '[]')

fs.readdirSync(commandsPath).forEach(file => {
    if (file.endsWith('.js')) {
        try {
            const command = require(path.join(commandsPath, file))
            if (!command.name) {
                console.log(`SKIP ${file}: missing name`)
                return
            }
            commands.set(command.name, command)
            if (command.alias) {
                command.alias.forEach(alias => commands.set(alias, command))
            }
            console.log(`Loaded: ${command.name}`)
        } catch (e) {
            console.log(`ERROR loading ${file}:`, e.message)
        }
    }
})
console.log(`Total commands loaded: ${commands.size}`)

// ===== WEB SERVER FOR QR =====
const server = http.createServer(async (req, res) => {
    if (req.url === '/') {
        let html = `
<!DOCTYPE html>
<html>
<head>
    <title>${BOT_NAME} ${VERSION}</title>
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
        <h1>${BOT_NAME} ${VERSION}</h1>
        <div class="status">Status: ${botStatus}</div>
        ${currentQR?
            `<img src="${currentQR}" alt="QR Code"><p>WhatsApp > Linked Devices > Link a Device</p><div class="warning">Scan within 20s. QR auto-refreshes.</div>` :
            `<div class="connected">Bot Connected</div><p>Owner: ${config.OWNER_NUMBER || 'Not set'}</p>`
        }
        <div class="info">
            Commands: ${commands.size} | Prefix: ${PREFIX}<br>
            Uptime: ${uptime()}
        </div>
    <script>setTimeout(() => location.reload(), 3000)</script>
</body>
</html>`
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(html)
    }
})

server.listen(PORT, () => console.log(`Server running on ${PORT}`))

const uptime = () => {
    let s = Math.floor((Date.now() - startTime) / 1000)
    let h = Math.floor(s / 3600), min = Math.floor(s % 3600 / 60)
    s = Math.floor(s % 60)
    return `${h}h ${min}m ${s}s`
}

const saveConfig = () => fs.writeFileSync('./config.json', JSON.stringify(config, null, 2))

// ===== START BOT =====
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'info' }),
        browser: ['VOID-MD', 'Chrome', '124.0.0'],
        markOnlineOnConnect: false,
        syncFullHistory: false,
        getMessage: async (key) => {
            if (msgStore.has(key.id)) return msgStore.get(key.id).message
            return { conversation: '' }
        }
    })

    // AUTO ONLINE
    if (config.autonline) {
        setInterval(() => {
            sock.sendPresenceUpdate('available')
        }, 10000)
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            botStatus = 'Scan QR Code'
            currentQR = await qrcode.toDataURL(qr)
            console.log('QR CODE GENERATED - CHECK WEBPAGE')
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
            } else if (statusCode === 440) {
                console.log('ERROR 440 - Conflict. Close other WhatsApp Web sessions')
                botStatus = 'Error 440 - Close other sessions'
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
            console.log(`Owner auto-set to: ${ownerNum}`)

            await sock.sendMessage(OWNER_NUMBER + '@s.whatsapp.net', {
                text: `*${BOT_NAME} ${VERSION}* is online 💀\n\n*Prefix:* ${PREFIX}\n*Commands:* ${commands.size}\n*Owner:* ${ownerNum}`
            })
        }
    })

    // ===== MESSAGE HANDLER =====
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type!== 'notify') return
        const m = messages[0]
        if (!m.message) return

        const from = m.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const sender = m.key.participant || m.key.remoteJid
        const senderNum = sender.split('@')[0].split(':')[0]
        const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ''

        // DEBUG: Log every message
        console.log(`MSG from ${senderNum} in ${from}: ${body.slice(0, 50)}`)

        // Store messages for antidelete
        if (!m.key.fromMe && config.antidelete) {
            msgStore.set(m.key.id, {
                sender: sender,
                from: from,
                message: m.message,
                timestamp: Date.now()
            })
            if (msgStore.size > 100) {
                const firstKey = msgStore.keys().next().value
                msgStore.delete(firstKey)
            }
        }

        if (m.key.fromMe) return

        // Reload config every message
        try {
            config = JSON.parse(fs.readFileSync('./config.json'))
        } catch (e) {
            console.log('Config reload error:', e.message)
        }

        // OWNER CHECK - Check all 3 numbers
        const isOwner = senderNum === OWNER_NUMBER || senderNum === BOT_NUMBER || senderNum === config.OWNER_NUMBER
        const isBot = senderNum === BOT_NUMBER

        console.log(`DEBUG: senderNum=${senderNum} | OWNER_NUMBER=${OWNER_NUMBER} | BOT_NUMBER=${BOT_NUMBER} | config=${config.OWNER_NUMBER} | isOwner=${isOwner}`)

        // AUTO VIEW + REACT STATUS
        if (config.autoview && from === 'status@broadcast') {
            try {
                await sock.readMessages([m.key])
                const emojis = ['❤️', '😂', '😮', '😢', '🙏', '👍', '🔥', '💀', '😭', '🥺']
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
                await sock.sendMessage(from, {
                    react: { text: randomEmoji, key: m.key }
                })
                console.log(`Viewed + reacted ${randomEmoji} to status from ${senderNum}`)
            } catch (e) {
                console.log('Status view/react error:', e.message)
            }
            return
        }

        // AUTO READ
        if (config.autoread) {
            try {
                await sock.readMessages([m.key])
            } catch (e) {}
        }

        // ANTILINK
        if (config.antilink && isGroup &&!isOwner) {
            const linkRegex = /chat\.whatsapp\.com\/[A-Za-z0-9]{20,}/i
            if (linkRegex.test(body)) {
                try {
                    const groupMetadata = await sock.groupMetadata(from)
                    const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net'
                    const botAdmin = groupMetadata.participants.find(p => p.id === botJid)?.admin
                    if (botAdmin) {
                        await sock.sendMessage(from, {
                            text: `*Antilink Detected* ⚠️\n@${senderNum} sent a link.`,
                            mentions: [sender]
                        }, { quoted: m })
                        await sock.groupParticipantsUpdate(from, [sender], 'remove')
                        return
                    }
                } catch (e) {
                    console.log('Antilink error:', e.message)
                }
            }
        }

        // CHATBOT
        if (config.chatbot && m.message.extendedTextMessage?.contextInfo?.mentionedJid?.includes(sock.user.id)) {
            const replies = ['Hey 💀', 'Yo Mr Void', 'What\'s up?', 'Bot here', 'Say that again?']
            const randomReply = replies[Math.floor(Math.random() * replies.length)]
            await sock.sendMessage(from, { text: randomReply }, { quoted: m })
            return
        }

        // PRESENCE
        if (!config.autonline) {
            if (config.autotyping) {
                await sock.sendPresenceUpdate('composing', from)
                setTimeout(async () => {
                    await sock.sendPresenceUpdate('paused', from)
                }, 3000)
            } else if (config.autorecording) {
                await sock.sendPresenceUpdate('recording', from)
                setTimeout(async () => {
                    await sock.sendPresenceUpdate('paused', from)
                }, 3000)
            }
        }

        // COMMAND HANDLER
        if (!body.startsWith(PREFIX)) return

        const args = body.trim().split(/ +/).slice(1)
        const cmdName = body.trim().split(/ +/)[0].toLowerCase().slice(PREFIX.length)
        const cmd = commands.get(cmdName)

        console.log(`[CMD] Received: ${cmdName} | From: ${senderNum} | Owner: ${isOwner} | Exists: ${!!cmd}`)

        if (!cmd) {
            console.log(`[CMD] Not found: ${cmdName}`)
            return
        }

        // BANNED CHECK
        const banned = JSON.parse(fs.readFileSync('./banned.json'))
        if (banned.includes(sender) &&!isOwner) {
            console.log(`[CMD] Banned user: ${senderNum}`)
            return
        }

        const reply = (text) => sock.sendMessage(from, { text }, { quoted: m })

        try {
            console.log(`[CMD] Executing: ${cmdName}`)
            await cmd.execute({
                sock, m, from, sender, isGroup, isOwner, isBot, args, body,
                PREFIX, BOT_NAME, OWNER_NAME, OWNER_NUMBER, BOT_NUMBER, BOT_IMAGE, VERSION, commands, config, saveConfig,
                uptime,
                reply,
                mentioned: m.message.extendedTextMessage?.contextInfo?.mentionedJid || [],
                quoted: m.message.extendedTextMessage?.contextInfo?.quotedMessage? {
                    sender: m.message.extendedTextMessage.contextInfo.participant,
                    message: m.message.extendedTextMessage.contextInfo.quotedMessage
                } : null
            })
        } catch (e) {
            console.error(`[CMD] Error in ${cmdName}:`, e)
            reply(`❌ Error: ${e.message}`)
        }
    })

    // ANTI DELETE
    sock.ev.on('messages.update', async (updates) => {
        if (!config.antidelete) return

        for (const { key, update } of updates) {
            if (update.messageStubType === 8 && msgStore.has(key.id)) {
                const msg = msgStore.get(key.id)
                const deletedBy = key.participant || key.remoteJid

                if (deletedBy === sock.user.id) return

                let text = `*ANTI DELETE* 💀\n\n`
                text += `*Deleted by:* @${deletedBy.split('@')[0]}\n`
                text += `*Original sender:* @${msg.sender.split('@')[0]}\n`
                text += `*Time:* ${new Date(msg.timestamp).toLocaleTimeString()}\n\n`
                text += `*Message:* \n`

                const content = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || '_Media message_'
                text += content

                await sock.sendMessage(msg.from, {
                    text,
                    mentions: [deletedBy, msg.sender]
                })

                msgStore.delete(key.id)
            }
        }
    })
}

startBot()
