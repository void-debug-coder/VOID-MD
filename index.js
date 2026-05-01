const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const path = require('path')
const pino = require('pino')

let config = require('./config.json')
const saveConfig = () => fs.writeFileSync('./config.json', JSON.stringify(config, null, 2))

const commands = new Map()
const commandsDir = path.join(__dirname, 'commands')

// Load commands
fs.readdirSync(commandsDir).forEach(file => {
    if (file.endsWith('.js')) {
        const cmd = require(path.join(commandsDir, file))
        commands.set(cmd.name, cmd)
        console.log(`Loaded: ${cmd.name}`)
        if (cmd.alias) cmd.alias.forEach(a => commands.set(a, cmd))
    }
})
console.log(`Total commands loaded: ${commands.size}`)

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session')
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: Browsers.macOS('Desktop')
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode!== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        } else if (connection === 'open') {
            console.log('Bot connected. Number:', sock.user?.id?.split('@')[0])
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message || m.key.fromMe) return

        const from = m.key.remoteJid
        const isGroup = from.endsWith('@g.us')
        const sender = m.key.participant || from
        const senderNum = sender.split('@')[0].replace(/[^0-9]/g, '')
        const botNum = sock.user?.id?.split('@')[0] || ''
        const isOwner = senderNum === botNum

        const body = m.message.conversation || m.message.extendedTextMessage?.text || ''
        if (!body.startsWith(config.PREFIX)) return

        const args = body.slice(config.PREFIX.length).trim().split(/ +/)
        const cmdName = args.shift().toLowerCase()
        const command = commands.get(cmdName)
        if (!command) return

        const reply = (text) => sock.sendMessage(from, { text }, { quoted: m })

        try {
            await command.execute({
                reply, sock, m, from, args, isGroup, isOwner,
                config, saveConfig, commands,
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
            console.log(e)
            reply('Error executing command 💀')
        }
    })
}

startBot()
