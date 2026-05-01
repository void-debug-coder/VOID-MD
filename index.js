const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const path = require('path')
const pino = require('pino')
const qrcode = require('qrcode')
const express = require('express')

let config = require('./config.json')
const saveConfig = () => fs.writeFileSync('./config.json', JSON.stringify(config, null, 2))

const commands = new Map()
const commandsDir = path.join(__dirname, 'commands')

// Express server for Render QR page
const app = express()
const PORT = process.env.PORT || 3000
let qrCodeData = null
let botConnected = false
global.botNum = 'Not connected'

app.get('/', (req, res) => {
    if (botConnected) {
        res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>VOID-MD Connected</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="background:#0d1117;color:#fff;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
            <div style="text-align:center;padding:20px;">
                <h1 style="color:#00ff00;">💀 VOID-MD CONNECTED 💀</h1>
                <p style="font-size:18px;">Bot is online and running</p>
                <p>Number: ${global.botNum}</p>
                <p style="color:#888;">Prefix: ${config.PREFIX}</p>
            </div>
        </body>
        </html>
        `)
    } else if (qrCodeData) {
        res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Scan QR - VOID-MD</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="background:#0d1117;color:#fff;font-family:monospace;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;padding:20px;">
            <div style="text-align:center;max-width:400px;">
                <h1>💀 VOID-MD QR CODE 💀</h1>
                <p>1. Open WhatsApp > Linked Devices</p>
                <p>2. Tap "Link a Device"</p>
                <p>3. Scan this QR</p>
                <img src="${qrCodeData}" style="border:5px solid #00ff00;border-radius:10px;width:100%;max-width:300px;">
                <p style="color:#888;font-size:12px;">QR refreshes every 20s</p>
                <script>setTimeout(() => location.reload(), 20000)</script>
            </div>
        </body>
        </html>
        `)
    } else {
        res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>VOID-MD Loading</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="background:#0d1117;color:#fff;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
            <div style="text-align:center;">
                <h1>💀 VOID-MD 💀</h1>
                <p>Generating QR Code...</p>
                <p style="color:#888;">Refresh in 5 seconds</p>
                <script>setTimeout(() => location.reload(), 5000)</script>
            </div>
        </body>
        </html>
        `)
    }
})

// CRITICAL: Bind to port or Render kills it
app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`)
})

// Load commands
console.log('Loading commands...')
fs.readdirSync(commandsDir).forEach(file => {
    if (file.endsWith('.js')) {
        try {
            const cmd = require(path.join(commandsDir, file))
            commands.set(cmd.name, cmd)
            if (cmd.alias) cmd.alias.forEach(a => commands.set(a, cmd))
        } catch (e) {
            console.log(`Failed to load ${file}:`, e.message)
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
        getMessage: async () => ({ conversation: 'VOID-MD' })
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update

        if (qr) {
            console.log('QR Generated - Check website')
            qrCodeData = await qrcode.toDataURL(qr)
            botConnected = false
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode!== DisconnectReason.loggedOut
            console.log('Connection closed. Reconnecting:', shouldReconnect)
            botConnected = false
            qrCodeData = null
            global.botNum = 'Disconnected'
            if (shouldReconnect) setTimeout(() => startBot(), 3000)
        } else if (connection === 'open') {
            global.botNum = sock.user?.id?.split('@')[0]
            console.log(`Bot connected: ${global.botNum}`)
            botConnected = true
            qrCodeData = null
        }
    })

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

            const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ''

            if (config.autoread) await sock.readMessages([m.key])
            if (!body.startsWith(config.PREFIX)) return

            const args = body.slice(config.PREFIX.length).trim().split(/ +/)
            const cmdName = args.shift().toLowerCase()
            const command = commands.get(cmdName)
            if (!command) return

            const reply = (text) => sock.sendMessage(from, { text }, { quoted: m })
            if (config.antiban) await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))

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
            console.log('Error:', e)
        }
    })
}

startBot()
