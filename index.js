const {default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion} = require('@whiskeysockets/baileys')
const pino = require('pino')
const express = require('express')
const fs = require('fs')
const qrcode = require('qrcode')

const config = require('./config')
const app = express()
const PORT = process.env.PORT || 3000

let sock, qrCodeData, botNumber, botConnected = false

// START BOT
async function startBot() {
    const {state, saveCreds} = await useMultiFileAuthState('session')
    const {version} = await fetchLatestBaileysVersion()
    
    sock = makeWASocket({
        version,
        logger: pino({level: 'silent'}),
        printQRInTerminal: false,
        auth: state,
        browser: ['VOID-MD', 'Chrome', '1.0.0']
    })

    // CONNECTION UPDATES
    sock.ev.on('connection.update', async (update) => {
        const {connection, lastDisconnect, qr} = update
        
        if(qr) {
            qrCodeData = await qrcode.toDataURL(qr)
            console.log('QR Generated - Scan with 254112843071')
        }
        
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut
            console.log('Connection closed. Reconnecting:', shouldReconnect)
            if(shouldReconnect) {
                setTimeout(startBot, 3000)
            } else {
                console.log('Logged out. Delete session folder and restart.')
            }
            botConnected = false
        } else if(connection === 'open') {
            console.log('VOID-MD CONNECTED 💀')
            botConnected = true
            botNumber = sock.user.id.split(':')[0]
            qrCodeData = null
            
            // Startup message to QR scanner number
            await sock.sendMessage(sock.user.id, {
                text: `*VOID-MD ONLINE 💀*\n\n*Bot Number:* +${botNumber}\n*Prefix:* ${config.prefix}\n*Mode:* Private - Only you can use commands\n\nType ${config.prefix}menu`
            })
        }
    })

    sock.ev.on('creds.update', saveCreds)

    // MESSAGE HANDLER - ONLY QR SCANNER CAN USE 💀
    sock.ev.on('messages.upsert', async ({messages, type}) => {
        try {
            const m = messages[0]
            if(!m.message || type!== 'notify') return
            
            const from = m.key.remoteJid
            const isGroup = from.endsWith('@g.us')
            const sender = isGroup? m.key.participant : from
            const senderNum = sender.split('@')[0]
            
            // BOT NUMBER = NUMBER THAT SCANNED QR
            const botNum = sock.user?.id?.split(':')[0]
            
            // ONLY RESPOND TO QR SCANNER NUMBER
            if(senderNum!== botNum) {
                console.log(`[BLOCKED] ${senderNum} tried to use bot. Only ${botNum} allowed`)
                return
            }
            
            // GET MESSAGE BODY - ALL TYPES
            const body = m.message.conversation || 
                        m.message.extendedTextMessage?.text || 
                        m.message.imageMessage?.caption || 
                        m.message.videoMessage?.caption || 
                        m.message.buttonsResponseMessage?.selectedButtonId || 
                        m.message.listResponseMessage?.singleSelectReply?.selectedRowId || ''
            
            if(!body) return
            
            // COMMAND PARSING
            const prefix = config.prefix
            const isCmd = body.startsWith(prefix)
            const command = isCmd? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : ''
            const args = body.trim().split(/ +/).slice(1)
            const q = args.join(' ')
            
            console.log(`[CMD] ${command} | [FROM] ${senderNum} | [BODY] ${body}`)
            
            // AUTO READ
            if(config.autoread) await sock.readMessages([m.key])
            
            // REPLY FUNCTION
            const reply = (text) => sock.sendMessage(from, {text}, {quoted: m})
            
            // ===== COMMANDS START =====
            
            if(command === 'ping') {
                const start = new Date().getTime()
                const msg = await reply('Pinging...')
                const end = new Date().getTime()
                return await sock.sendMessage(from, {
                    text: `*Pong! 💀*\nLatency: ${end - start}ms\n*Bot:* +${botNum}`,
                    edit: msg.key
                })
            }
            
            if(command === 'menu' || command === 'help') {
                const age = new Date().getFullYear() - 2006
                return reply(`*💀 VOID-MD MENU 💀*

*Controller:* +${botNum}
*Mode:* Private
*Prefix:* ${config.prefix}
*Age:* ${age}

*COMMANDS*
${prefix}ping - Check speed
${prefix}menu - Show menu
${prefix}restart - Restart bot
${prefix}setbio [text] - Change bio
${prefix}birthday - Bday countdown
${prefix}logout - Logout bot

_Only +${botNum} can use commands_
_© MR VOID 2026_`)
            }
            
            if(command === 'restart') {
                await reply('*Restarting VOID-MD...*')
                process.exit(1)
            }
            
            if(command === 'setbio') {
                if(!q) return reply(`Usage: ${prefix}setbio VOID-MD 💀`)
                await sock.updateProfileStatus(q)
                return reply(`*Bio updated* ✅\n\nNew bio: ${q}`)
            }
            
            if(command === 'birthday') {
                const bday = new Date('2026-05-05T00:00:00')
                const now = new Date()
                const diff = bday - now
                const days = Math.ceil(diff / 86400000)
                const hours = Math.floor(diff % 86400000 / 3600000)
                
                if(diff <= 0) {
                    return reply(`*🎂🎉 HAPPY 20TH BIRTHDAY MR VOID 🎉🎂*\n\n*Today is May 5th 2026*\n\nVOID-MD creator turned 20!\n\nDrop your wishes 💀*`)
                } else {
                    return reply(`*🎂 VOID BIRTHDAY COUNTDOWN 🎂*\n\n*Date:* May 5th 2026\n*Days Left:* ${days}\n*Hours:* ${hours}\n\n_You turn 20 💀_`)
                }
            }
            
            if(command === 'logout') {
                await reply('*Logging out VOID-MD...*\n\nDelete session to scan new QR')
                await sock.logout()
                return
            }
            
            // ===== COMMANDS END =====
            
        } catch (err) {
            console.log('Error in messages.upsert:', err)
        }
    })
}

// EXPRESS SERVER FOR QR + BIRTHDAY SITE
app.get('/', (req, res) => {
    const today = new Date().toISOString().slice(5,10)
    const isBday = today === '05-05'
    const age = new Date().getFullYear() - 2006
    
    if(isBday) {
        res.send(`
        <!DOCTYPE html><html><head><title>VOID-MD B-DAY 💀</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');body{background:#000;color:#0f0;font-family:'Orbitron',monospace;text-align:center;margin:0;overflow:hidden}.glitch{font-size:3rem;text-shadow:0 0 10px #0f0,0 0 20px #0f0;animation:glitch 1s infinite}@keyframes glitch{0%,100%{transform:translate(0)}20%{transform:translate(-2px,2px)}40%{transform:translate(-2px,-2px)}60%{transform:translate(2px,2px)}80%{transform:translate(2px,-2px)}}.cake{font-size:8rem;animation:bounce 2s infinite}@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}</style></head><body><div class="glitch">💀 VOID-MD BIRTHDAY 💀</div><div class="cake">🎂</div><h1>MR VOID TURNS ${age} TODAY</h1><h2>MAY 5TH 2026</h2><p>Bot: +${botNumber || 'Loading...'}</p><p>Status: ${botConnected?'ONLINE 💀':'OFFLINE'}</p></body></html>
        `)
    } else {
        res.send(botConnected? `
            <div style="background:#000;color:#0f0;font-family:monospace;padding:20px;text-align:center"><h1>💀 ${config.botName} CONNECTED 💀</h1><p>Controller: +${botNumber}</p><p>B-Day: May 5th | Age: ${age}</p><p>Mode: Private</p></div>
        ` : qrCodeData? `
            <div style="text-align:center;background:#000;color:#fff;padding:20px;font-family:monospace"><h1>${config.botName} QR</h1><p style="color:#0f0">Scan with 254112843071</p><img src="${qrCodeData}" width="300" style="border:5px solid lime"><p>WhatsApp > Linked Devices</p><script>setTimeout(()=>location.reload(),5000)</script></div>
        ` : '<h1 style="text-align:center">Starting VOID-MD...</h1><script>setTimeout(()=>location.reload(),3000)</script>')
    }
})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    startBot()
})
