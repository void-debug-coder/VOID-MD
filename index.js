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
let startAttempts = 0

app.get('/', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>${config.botName} 💀</title>
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
                min-height: 280px;
                min-width: 280px;
            }
            #qrcode img { display: block; width: 250px; height: 250px; }
            .steps { text-align: left; margin-top: 20px; font-size: 13px; line-height: 1.8; color: #ccc; }
            .steps b { color: #8b5cf6; }
            .bot-num { color: #8b5cf6; font-size: 18px; margin-top: 10px; }
            .loading { color: #000; padding: 100px 40px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <img src="${config.botImage}" alt="${config.botName}" class="bot-avatar" onerror="this.style.display='none'">
            <h1>${config.botName} 💀</h1>
            <div class="status ${botNumber? 'connected' : qrCodeData? 'waiting' : 'error'}" id="status">
                ${botStatus}
            </div>
            ${botNumber? 
                `<div class="bot-num">Connected: +${botNumber}</div>
                 <div style="margin-top:15px; font-size:13px; color:#aaa;">Bot is active and ready 💀</div>` : 
                `<div id="qrcode">${qrCodeData? `<img src="${qrCodeData}" />` : '<div class="loading">Generating QR...</div>'}</div>
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
            setTimeout(() => location.reload(), 3000)
        </script>
    </body>
    </html>
    `
    res.send(html)
})

async function startBot() {
    startAttempts++
    console.log(`Starting bot attempt ${startAttempts}...`)
    
    try {
        // Force delete old session if exists 💀
        if (fs.existsSync('./session')) {
            fs.rmSync('./session', { recursive: true, force: true })
            console.log('Deleted old session')
        }
        fs.mkdirSync('./session')
        
        const { state, saveCreds } = await useMultiFileAuthState('./session')
        
        const sock = makeWASocket({
            logger: pino({ level: 'silent' }),
            auth: state,
            browser: Browsers.ubuntu(config.botName),
            printQRInTerminal: false,
            version: [2, 3000, 1023223821],
            syncFullHistory: false,
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: true
        })

        sock.ev.on('creds.update', saveCreds)
        
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update
            
            if (qr) {
                botStatus = 'Scan QR to connect'
                try {
                    qrCodeData = await QRCode.toDataURL(qr, { width: 250, margin: 2 })
                    console.log('QR generated successfully 💀')
                } catch (err) {
                    console.log('QR generation failed:', err)
                    botStatus = 'QR Error: ' + err.message
                }
            }
            
            if (connection === 'close') {
                const code = lastDisconnect?.error?.output?.statusCode
                console.log('Connection closed:', code)
                qrCodeData = null
                botNumber = null
                
                if (code === DisconnectReason.loggedOut || code === 405 || code === 401) {
                    botStatus = 'Session expired. Resetting...'
                    console.log('Deleting session and restarting...')
                    if (fs.existsSync('./session')) {
                        fs.rmSync('./session', { recursive: true, force: true })
                    }
                } else {
                    botStatus = 'Restarting... New QR incoming'
                }
                
                setTimeout(startBot, 3000)
            }
            
            if (connection === 'open') {
                botNumber = sock.user.id.split(':')[0]
                botStatus = 'VOID-MD CONNECTED 💀'
                qrCodeData = null
                startAttempts = 0
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
                const menuText = `*${config.botName} MENU 💀*
                
*🔓 Public*
${config.prefix}ping - Speed test
${config.prefix}menu - This menu

*🔒 Owner Toggles*
${config.prefix}alwaysonline - ${config.alwaysonline? 'ON' : 'OFF'}
${config.prefix}antidelete - ${config.antidelete? 'ON' : 'OFF'}
${config.prefix}autoread - ${config.autoread? 'ON' : 'OFF'}
${config.prefix}autotyping - ${config.autotyping? 'ON' : 'OFF'}
${config.prefix}autorecording - ${config.autorecording? 'ON' : 'OFF'}
${config.prefix}anticall - ${config.anticall? 'ON' : 'OFF'}

Bot: +${botNum}
Prefix: ${config.prefix}`
                return sock.sendMessage(from, { text: menuText })
            }
            
            if (!isOwner) return sock.sendMessage(from, { text: 'Only owner can use this 💀' })
            
            const toggleCmds = ['alwaysonline', 'antiban', 'anticall', 'antidelete', 'antilink', 'autobio', 'autolike', 'autoreact', 'autoread', 'autorecording', 'autosave', 'autotyping', 'autoview', 'chatbot']
            
            if (toggleCmds.includes(cmd)) {
                config[cmd] =!config[cmd]
                await sock.sendMessage(from, { text: `*${cmd.toUpperCase()}* ${config[cmd]? 'ON' : 'OFF'} 💀` })
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

    } catch (err) {
        console.log('Fatal bot error:', err)
        botStatus = 'Error: ' + err.message
        setTimeout(startBot, 5000)
    }
}

app.listen(config.port, () => {
    console.log(`${config.botName} running on port ${config.port} 💀`)
    startBot()
})
