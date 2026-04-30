const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const pino = require('pino')
const fs = require('fs')
const { Boom } = require('@hapi/boom')

let config = JSON.parse(fs.readFileSync('./config.json'))
const BOT_IMAGE = 'https://files.catbox.moe/bhiw6e.png'
const VERSION = '1.2.0'

let commands = new Map()

// Load commands
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

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const { version } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: ['VOID-MD', 'Chrome', '1.2.0']
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode!== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        } else if (connection === 'open') {
            // AUTO-SET OWNER TO SCANNED NUMBER 💀
            const ownerJid = sock.user.id
            const ownerNum = ownerJid.split(':')[0]

            if (config.OWNER_NUMBER!== ownerNum) {
                config.OWNER_NUMBER = ownerNum
                saveConfig()
                console.log(`Owner auto-set to: ${ownerNum} 💀`)
                await sock.sendMessage(ownerJid, {
                    text: `*VOID-MD ${VERSION} ACTIVATED* 💀\n\n*Owner:* @${ownerNum}\n*Prefix:* ${config.PREFIX}\n\nType ${config.PREFIX}menu to start`
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

        // Autoread
        if (config.autoread) await sock.readMessages([m.key])

        // Autoview status
        if (from === 'status@broadcast' && config.autoview) {
            await sock.readMessages([m.key])
            try { await sock.sendMessage(from, { react: { text: '💀', key: m.key } }) } catch {}
        }

        // Antilink
        if (isGroup && config.antilink && body.includes('chat.whatsapp.com/')) {
            const groupMetadata = await sock.groupMetadata(from)
            const botAdmin = groupMetadata.participants.find(p => p.id === sock.user.id.split(':')[0] + '@s.whatsapp.net')?.admin
            const senderAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin
            if (botAdmin &&!senderAdmin &&!isOwner) {
                await sock.sendMessage(from, { text: `*Antilink detected* 💀\n@${sender.split('@')[0]} kicked`, mentions: [sender] }, { quoted: m })
                await sock.groupParticipantsUpdate(from, [sender], 'remove')
            }
        }

        // Autotyping/Autorecording
        if (config.autotyping &&!isGroup) {
            await sock.sendPresenceUpdate('composing', from)
            setTimeout(() => sock.sendPresenceUpdate('paused', from), 3000)
        }
        if (config.autorecording &&!isGroup) {
            await sock.sendPresenceUpdate('recording', from)
            setTimeout(() => sock.sendPresenceUpdate('paused', from), 3000)
        }

        // Commands
        if (isCmd) {
            const cmd = commands.get(command)
            if (!cmd) return

            // Ban check
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
                reply(`*Error:* ${e.message} 💀`)
            }
        }
    })

    // Antidelete
    sock.ev.on('messages.update', async (update) => {
        if (!config.antidelete) return
        for (const { key, update: msgUpdate } of update) {
            if (msgUpdate?.messageStubType === 1) {
                const msg = await sock.loadMessage(key.remoteJid, key.id)
                if (msg?.message) {
                    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '*Media deleted* 💀'
                    await sock.sendMessage(key.remoteJid, {
                        text: `*ANTIDELETE* 💀\n*From:* @${key.participant?.split('@')[0] || 'Unknown'}\n*Message:* ${text}`,
                        mentions: [key.participant]
                    })
                }
            }
        }
    })
}

startBot()
