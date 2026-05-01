const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys')
const express = require('express')
const QRCode = require('qrcode')
const pino = require('pino')
const fs = require('fs')
const config = require('./config')

const app = express()
let qrCodeData = null
let botStatus = 'Starting...'
let botNumber = null

app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>VOID-MD 💀</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                background: #0a0a0a; 
                color: #fff; 
                font-family: 'Courier New', monospace;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 20px;
            }
          .container { 
                max-width: 400px; 
                width: 100%;
                text-align: center;
                background: #1a1a1a;
                padding: 30px;
                border-radius: 15px;
                border: 2px solid #8b5cf6;
                box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
            }
          .bot-avatar {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                border: 3px solid #8b5cf6;
                margin: 0 auto 15px;
                object-fit: cover;
                box-shadow: 0 0 15px rgba(139, 92, 246, 0.5);
            }
            h1 { color: #8b5cf6; margin-bottom: 10px; font-size: 28px; }
          .status { 
                padding: 12px; 
                margin: 20px 0;
                border-radius: 8px;
                font-weight: bold;
                font-size: 14px;
            }
          .status.waiting { background: #f59e0b; color: #000; }
          .status.connected { background: #10b981; color: #000; }
          .status.error { background: #ef4444; }
            #qrcode { 
                background: #fff; 
                padding: 15px; 
                border-radius: 10px;
                margin: 20px 0;
                display: inline-block;
            }
            #qrcode img { display: block; width: 250px; height: 250px; }
          .steps { text-align: left; margin-top: 20px; font-size: 13px; line-height: 1.8; }
          .steps b { color: #8b5cf6; }
          .bot-num { color: #8b5cf6; font-size: 18px; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <img src="${config.botImage}" alt="VOID-MD" class="bot-avatar" onerror="this.style.display='none'">
            <h1>${config.botName} 💀</h1>
            <div class="status ${botNumber? 'connected' : 'waiting'}" id="status">
                ${botStatus}
            </div>
            ${botNumber? 
                `<div class="bot-num">Connected: +${botNumber}</div>
                 <div style="margin-top:15px; font-size:13px; color:#aaa;">Bot is active and ready 💀</div>` : 
                `<div id="qrcode">${qrCodeData? `<img src="${qrCodeData}" />` : '<div style="color:#000; padding:40px;">Generating QR...</div>'}</div>
                <div class="steps">
                    <b>How to connect:</b><br>
                    1. WhatsApp > Linked Devices<br>
                    2. Tap "Link a Device"<br>
                    3. Scan QR code above<br>
                    4. Bot connects automatically
                </div>`
            }
        </div>
        <script>
            if (!${botNumber? 'true' : 'false'}) {
                setInterval(() => location.reload(), 3000)
            }
        </script>
    </body>
    </html>
    `
    res.send(html)
})

async function startBot() {
    if (!fs.existsSync('./session')) fs.mkdirSync('./session')
    const { state, saveCreds } = await useMultiFileAuthState('./session')
    
    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: Browsers.ubuntu('VOID-MD'),
        printQRInTerminal: false,
        version: [2, 3000, 1023223821],
        syncFullHistory: false,
        markOnlineOnConnect: false
    })

    sock.ev.on('creds.update', saveCreds)
    
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update
        
        if (qr) {
            botStatus = 'Scan QR to connect'
            qrCodeData = await QRCode.toDataURL(qr)
            console.log('QR generated - check website 💀')
        }
        
        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode
            console.log('Connection closed:', code)
            qrCodeData = null
            botNumber = null
            botStatus = 'Disconnected. Reloading...'
            if (code!== DisconnectReason.loggedOut) {
                setTimeout(startBot, 3000)
            } else {
                botStatus = 'Logged out. Delete session folder 💀'
            }
        }
        
        if (connection === 'open') {
            botNumber = sock.user.id.split(':')[0]
            botStatus = 'VOID-MD CONNECTED 💀'
            qrCodeData = null
            console.log('VOID-MD CONNECTED:', botNumber)
            if (config.alwaysonline) {
                sock.sendPresenceUpdate('available')
                setInterval(() => sock.sendPresenceUpdate('available'), 10000)
            }
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0]
        if (!m.message) return
        
        const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ''
        const from = m.key.remoteJid
        
        if (!text.startsWith(config.prefix)) {
            if (!m.key.fromMe) {
                if (config.autoread) await sock.readMessages([m.key])
                if (config.autotyping) await sock.sendPresenceUpdate('composing', from)
                if (config.autorecording) await sock.sendPresenceUpdate('recording', from)
            }
            return
        }
        
        const cmd = text.slice(1).split(' ')[0].toLowerCase()
        const botNum = sock.user.id.split(':')[0].split('@')[0]
        const sender = (m.key.participant || from).split('@')[0]
        const isOwner = m.key.fromMe || config.ownerNumber.includes(sender) || sender === botNum
        
        if (cmd === 'ping') {
            const start = Date.now()
            await sock.sendMessage(from, { text: `Pong! ${Date.now() - start}ms 💀` })
        }
        
        if (cmd === 'menu') {
            const menuText = `*VOID-MD MENU 💀*
            
*🔓 Public*
${config.prefix}ping - Speed test
${config.prefix}menu - This menu

*🔒 Owner Toggles*
${config.prefix}alwaysonline - ${config.alwaysonline? 'ON' : 'OFF'}
${config.prefix}antidelete - ${config.antidelete? 'ON' : 'OFF'}
${config.prefix}autoread - ${config.autoread? 'ON' : 'OFF'}
${config.prefix}autotyping - ${config.autotyping? 'ON' : 'OFF'}
${config.prefix}autorecording - ${config.autorecording? 'ON' : 'OFF'}
${config.prefix}autolike - ${config.autolike? 'ON' : 'OFF'}
${config.prefix}autoreact - ${config.autoreact? 'ON' : 'OFF'}
${config.prefix}autoview - ${config.autoview? 'ON' : 'OFF'}
${config.prefix}anticall - ${config.anticall? 'ON' : 'OFF'}
${config.prefix}antilink - ${config.antilink? 'ON' : 'OFF'}
${config.prefix}antiban - ${config.antiban? 'ON' : 'OFF'}
${config.prefix}autobio - ${config.autobio? 'ON' : 'OFF'}
${config.prefix}autosave - ${config.autosave? 'ON' : 'OFF'}
${config.prefix}chatbot - ${config.chatbot? 'ON' : 'OFF'}

Bot: +${botNum}
Prefix: ${config.prefix}`
            return sock.sendMessage(from, { text: menuText })
        }
        
        if (!isOwner) return sock.sendMessage(from, { text: 'Only owner can use this 💀' })
        
        const toggleCmds = [
            'alwaysonline', 'antiban', 'anticall', 'antidelete', 'antilink', 
            'autobio', 'autolike', 'autoreact', 'autoread', 'autorecording', 
            'autosave', 'autotyping', 'autoview', 'chatbot'
        ]
        
        if (toggleCmds.includes(cmd)) {
            config[cmd] =!config[cmd]
            await sock.sendMessage(from, { 
                text: `*${cmd.toUpperCase()}* ${config[cmd]? 'ON' : 'OFF'} 💀` 
            })
            
            if (cmd === 'alwaysonline') {
                sock.sendPresenceUpdate(config.alwaysonline? 'available' : 'unavailable')
            }
        }
    })

    sock.ev.on('call', async (calls) => {
        if (config.anticall) {
            for (let call of calls) {
                await sock.rejectCall(call.id, call.from)
            }
        }
    })
}

app.listen(config.port, () => {
    console.log(`VOID-MD running on port ${config.port} 💀`)
    startBot()
})
