const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const path = require('path')
const pino = require('pino')
const qrcode = require('qrcode-terminal')

let config = require('./config.json')
const saveConfig = () => fs.writeFileSync('./config.json', JSON.stringify(config, null, 2))

const commands = new Map()
const commandsDir = path.join(__dirname, 'commands')

// Load all commands
console.log('Loading commands...')
fs.readdirSync(commandsDir).forEach(file => {
    if (file.endsWith('.js')) {
        try {
            const cmd = require(path.join(commandsDir, file))
            commands.set(cmd.name, cmd)
            console.log(`✅ Loaded: ${cmd.name}`)
            if (cmd.alias) {
                cmd.alias.forEach(a => commands.set(a, cmd))
            }
        } catch (e) {
            console.log(`❌ Failed to load ${file}:`, e.message)
        }
    }
})
console.log(`Total commands: ${commands.size}`)

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const { version } = await fetchLatestBaileysVersion()
    
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: Browsers.macOS('Desktop'),
        // printQRInTerminal removed - deprecated
        getMessage: async (key) => {
            return { conversation: 'VOID-MD' }
        }
    })

    sock.ev.on('creds.update', saveCreds)

    // Connection + QR Handler
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log('\n╔═════════════════════════════╗')
            console.log('║ SCAN QR CODE TO LOGIN ║')
            console.log('╚═════════════════════════════╝\n')
            qrcode.generate(qr, { small: true })
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode!== DisconnectReason.loggedOut
            console.log('Connection closed. Reason:', lastDisconnect?.error?.message)
            console.log('Reconnecting:', shouldReconnect)
            if (shouldReconnect) {
                setTimeout(() => startBot(), 3000)
            } else {
                console.log('Logged out. Delete session folder and scan again.')
            }
        } else if (connection === 'open') {
            const botNum = sock.user?.id?.split('@')[0]
            console.log('\n╔═════════════════════════════╗')
            console.log('║ VOID-MD CONNECTED 💀 ║')
            console.log('╠═════════════════════════════╣')
            console.log(`║ Bot Number: ${botNum.padEnd(15)}║`)
            console.log(`║ Commands: ${commands.size.toString().padEnd(17)}║`)
            console.log(`║ Prefix: ${config.PREFIX.padEnd(20)}║`)
            console.log('╚═════════════════════════════╝\n')
        }
    })

    // Message Handler
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type!== 'notify') return
        const m = messages[0]
        if (!m.message || m.key.fromMe) return

        try {
            const from = m.key.remoteJid
            const isGroup = from.endsWith('@g.us')
            const sender = m.key.participant || from
            const senderNum = sender.split('@')[0].replace(/[^0-9]/g, '')
            const botNum = sock.user?.id?.split('@')[0] || ''
            const isOwner = senderNum === botNum

            // Get message text
            const body = m.message.conversation || 
                        m.message.extendedTextMessage?.text || 
                        m.message.imageMessage?.caption || 
                        m.message.videoMessage?.caption || ''

            // Auto read
            if (config.autoread) {
                await sock.readMessages([m.key])
            }

            // Check prefix
            if (!body.startsWith(config.PREFIX)) return

            const args = body.slice(config.PREFIX.length).trim().split(/ +/)
            const cmdName = args.shift().toLowerCase()
            const command = commands.get(cmdName)
            if (!command) return

            const reply = (text) => sock.sendMessage(from, { text }, { quoted: m })

            // Antiban delay
            if (config.antiban) {
                await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
            }

            // Execute command
            await command.execute({
                reply, 
                sock, 
                m, 
                from, 
                args, 
                isGroup, 
                isOwner,
                config, 
                saveConfig, 
                commands,
                BOT_NAME: config.BOT_NAME,
                VERSION: config.VERSION,
                PREFIX: config.PREFIX,
                BOT_IMAGE: config.BOT_IMAGE,
                uptime: () => {
                    let s = Math.floor(process.uptime())
                    let h = Math.floor(s / 3600); s %= 3600
                    let m = Math.floor(s / 60); s %= 60
                    return `${h}h ${m}m ${s}s`
                }
            })

        } catch (e) {
            console.log('Error in message handler:', e)
        }
    })
}

// Start bot
startBot()

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    console.log('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
    console.log('Unhandled Rejection:', err)
})
