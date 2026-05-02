const {default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion} = require('@whiskeysockets/baileys')
const pino = require('pino')
const express = require('express')
const fs = require('fs')
const qrcode = require('qrcode')

const config = require('./config')
const app = express()
const PORT = process.env.PORT || 3000

let sock, qrCodeData, botNumber, botConnected = false

async function startBot() {
    const {state, saveCreds} = await useMultiFileAuthState('session')
    const {version} = await fetchLatestBaileysVersion()
    
    sock = makeWASocket({
        version,
        logger: pino({level: 'silent'}),
        printQRInTerminal: false,
        auth: state,
        browser: ['VOID-MD', 'Chrome', '1.0.0'],
        getMessage: async () => ({})
    })

    sock.ev.on('connection.update', async (update) => {
        const {connection, lastDisconnect, qr} = update
        
        if(qr) {
            qrCodeData = await qrcode.toDataURL(qr)
            console.log('[QR] Scan to connect VOID-MD')
        }
        
        if(connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode
            const shouldReconnect = statusCode!== DisconnectReason.loggedOut
            console.log('[CONNECTION] Closed. Code:', statusCode, 'Reconnect:', shouldReconnect)
            if(shouldReconnect) {
                setTimeout(startBot, 3000)
            } else {
                console.log('[CONNECTION] Logged out. Delete session folder.')
            }
            botConnected = false
        } else if(connection === 'open') {
            botNumber = sock.user.id.split(':')[0]
            botConnected = true
            qrCodeData = null
            console.log('VOID-MD CONNECTED 💀 FULL PUBLIC | Bot:', botNumber)
        }
    })

    sock.ev.on('creds.update', saveCreds)

    // MESSAGE HANDLER - 100% PUBLIC 💀 NO RESTRICTIONS
    sock.ev.on('messages.upsert', async ({messages, type}) => {
        try {
            const m = messages[0]
            if(!m.message || m.key.fromMe) return
            if(type!== 'notify') return
            
            const from = m.key.remoteJid
            const isGroup = from.endsWith('@g.us')
            const sender = isGroup? m.key.participant : from
            const senderNum = sender.split('@')[0]
            const pushname = m.pushName || 'User'
            
            const body = m.message.conversation || 
                        m.message.extendedTextMessage?.text || 
                        m.message.imageMessage?.caption || 
                        m.message.videoMessage?.caption || 
                        m.message.buttonsResponseMessage?.selectedButtonId || ''
            
            if(!body) return
            
            const prefix = config.prefix
            const isCmd = body.startsWith(prefix)
            const command = isCmd? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : ''
            const args = body.trim().split(/ +/).slice(1)
            const q = args.join(' ')
            
            console.log(`[CMD] ${command} | [FROM] ${senderNum} | [NAME] ${pushname}`)
            
            if(config.autoread) await sock.readMessages([m.key])
            const reply = (text) => sock.sendMessage(from, {text}, {quoted: m})
            
            // ===== ALL COMMANDS PUBLIC =====
            
            if(command === 'ping') {
                const start = Date.now()
                const msg = await reply('Pinging...')
                const latency = Date.now() - start
                return await sock.sendMessage(from, {
                    text: `*Pong! 💀*\nLatency: ${latency}ms\nBot: +${botNumber}\nUser: @${senderNum}`,
                    edit: msg.key,
                    mentions: [sender]
                })
            }
            
            if(command === 'menu' || command === 'help') {
                const age = new Date().getFullYear() - 2006
                return reply(`*💀 VOID-MD MENU 💀*

*Bot:* +${botNumber}
*Creator:* ${config.ownerName}
*Prefix:* ${config.prefix}
*Mode:* FULL PUBLIC
*User:* @${senderNum}

*ALL COMMANDS PUBLIC*
${prefix}ping - Check speed
${prefix}menu - This menu
${prefix}owner - Owner info
${prefix}birthday - Bday countdown
${prefix}restart - Restart bot
${prefix}setbio [text] - Change bio
${prefix}broadcast [msg] - Announce
${prefix}logout - Logout bot

_Everyone can use everything 💀_
_© MR VOID 2026_`, {mentions: [sender]})
            }
            
            if(command === 'owner') {
                return reply(`*💀 BOT CREATOR 💀*\n\n*Name:* ${config.ownerName}\n*Number:* wa.me/${config.ownerNumber}\n*Bot:* wa.me/${botNumber}\n\n_But anyone can control the bot 💀_`)
            }
            
            if(command === 'birthday') {
                const bday = new Date('2026-05-05T00:00:00')
                const now = new Date()
                const diff = bday - now
                const days = Math.ceil(diff / 86400000)
                
                if(diff <= 0) {
                    return reply(`*🎂🎉 TODAY IS MR VOID'S BIRTHDAY 🎉🎂*\n\n*May 5th 2026*\n\nVOID-MD creator turns 20!\n\nDrop wishes for everyone 💀*`)
                } else {
                    return reply(`*🎂 MR VOID BIRTHDAY COUNTDOWN 🎂*\n\n*Date:* May 5th 2026\n*Days Left:* ${days}\n\n_He turns 20 💀_`)
                }
            }
            
            if(command === 'restart') {
                await reply(`*Restarting VOID-MD...*\n\nRequested by @${senderNum} 💀`, {mentions: [sender]})
                process.exit(1)
            }
            
            if(command === 'setbio') {
                if(!q) return reply(`Usage: ${prefix}setbio VOID-MD 💀\n\nAnyone can change it`)
                await sock.updateProfileStatus(q)
                return reply(`*Bio updated* ✅\n\nNew bio: ${q}\nChanged by @${senderNum} 💀`, {mentions: [sender]})
            }
            
            if(command === 'broadcast') {
                if(!q) return reply(`Usage: ${prefix}broadcast Hello everyone\n\nAnyone can broadcast`)
                return reply(`*📢 BROADCAST FROM @${senderNum} 📢*\n\n${q}\n\n_Public bot 💀_`, {mentions: [sender]})
            }
            
            if(command === 'logout') {
                await reply(`*Logging out...*\n\nRequested by @${senderNum}\nAnyone can logout this bot 💀`, {mentions: [sender]})
                await sock.logout()
                return
            }
            
        } catch (err) {
            console.log('[ERROR]', err)
        }
    })
}

app.get('/', (req, res) => {
    const today = new Date().toISOString().slice(5,10)
    const isBday = today === '05-05'
    const age = new Date().getFullYear() - 2006
    
    if(isBday) {
        res.send(`<!DOCTYPE html><html><head><title>VOID-MD B-DAY 💀</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');body{background:#000;color:#0f0;font-family:'Orbitron',monospace;text-align:center;margin:0}.glitch{font-size:3rem;text-shadow:0 0 10px #0f0;animation:glitch 1s infinite}@keyframes glitch{0%,100%{transform:translate(0)}20%{transform:translate(-2px,2px)}80%{transform:translate(2px,-2px)}}.cake{font-size:8rem;animation:bounce 2s infinite}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}</style></head><body><div class="glitch">💀 VOID-MD BIRTHDAY 💀</div><div class="cake">🎂</div><h1>MR VOID TURNS ${age} TODAY</h1><h2>MAY 5TH 2026</h2><p>Bot: +${botNumber || 'Loading...'}</p><p>Status: ${botConnected?'ONLINE 💀':'OFFLINE'}</p><p>Mode: FULL PUBLIC</p></body></html>`)
    } else {
        res.send(botConnected? `<div style="background:#000;color:#0f0;font-family:monospace;padding:20px;text-align:center"><h1>💀 VOID-MD ONLINE 💀</h1><p>Bot: +${botNumber}</p><p>Creator: ${config.ownerName}</p><p>Age: ${age}</p><p>Mode: FULL PUBLIC - Everyone controls it</p></div>` : qrCodeData? `<div style="text-align:center;background:#000;color:#fff;padding:20px;font-family:monospace"><h1>VOID-MD QR</h1><p style="color:#0f0">Scan to connect</p><img src="${qrCodeData}" width="300" style="border:5px solid lime"><script>setTimeout(()=>location.reload(),5000)</script></div>` : '<h1 style="text-align:center">Starting...</h1><script>setTimeout(()=>location.reload(),3000)</script>')
    }
})

app.listen(PORT, () => {
    console.log(`[SERVER] Running on ${PORT}`)
    startBot()
})
