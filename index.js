const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');
const QRCode = require('qrcode');

// ===== CONFIG =====
const PREFIX = '.';
const PORT = process.env.PORT || 10000;
// ==================

const app = express();
let latestQR = null;
let botStatus = 'Starting...';
let botMode = 'public'; // 'public' or 'private'
let OWNER_NUMBER = null; // ← Auto-set when QR is scanned

// EXPRESS ROUTES
app.get('/', (req, res) => {
    res.send(`VOID-MD ${botStatus} 💀 | Mode: ${botMode} | Owner: ${OWNER_NUMBER || 'Not set'}<br><a href="/qr">Click here for QR Code</a>`);
});

app.get('/qr', async (req, res) => {
    if (botStatus === 'Connected') {
        return res.send('<h2>VOID-MD Already Connected ✅</h2><p>Bot is live. No QR needed.</p>');
    }
    if (!latestQR) {
        return res.send('<h2>Generating QR...</h2><p>Refresh in 5 seconds 💀</p><script>setTimeout(()=>location.reload(),5000)</script>');
    }
    try {
        const qrImage = await QRCode.toDataURL(latestQR);
        res.send(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#0d1117;margin:0;">
            <div style="text-align:center;color:#fff;font-family:Arial;">
                <h1>VOID-MD QR 💀</h1>
                <img src="${qrImage}" style="border:8px solid #fff;border-radius:20px;width:300px;" />
                <p style="font-size:18px;margin-top:20px;">Scan with WhatsApp → Link Device</p>
                <p style="color:#888;">QR expires in 20s. Page auto-refreshes.</p>
                <p style="color:#0f0;">You become the owner after scan</p>
            </div>
            <script>setTimeout(()=>location.reload(),20000)</script>
        </body></html>`);
    } catch (e) {
        res.send('Error generating QR');
    }
});

app.listen(PORT, () => console.log(`[SERVER] Running on ${PORT}`));

// COMMAND LOADER
const commands = new Map();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    fs.readdirSync(commandsPath).filter(f => f.endsWith('.js')).forEach(file => {
        try {
            const command = require(`./commands/${file}`);
            commands.set(command.name, command);
            if (command.alias) command.alias.forEach(a => commands.set(a, command));
        } catch (e) {
            console.log(`[ERROR] Failed to load ${file}:`, e.message);
        }
    });
    console.log(`[COMMANDS] Loaded ${commands.size} commands`);
}

// TEMP FOLDER CLEANUP - every 1hr
setInterval(() => {
    if (fs.existsSync('./temp')) {
        fs.readdirSync('./temp').forEach(f => {
            try { fs.unlinkSync(`./temp/${f}`); } catch {}
        });
    }
}, 3600000);

// START BOT
async function startVoid() {
    botStatus = 'Generating QR...';
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const VoidMD = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        browser: ['VOID-MD', 'Chrome', '1.0.0']
    });

    VoidMD.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            latestQR = qr;
            botStatus = 'Scan QR';
            console.log('[QR] New QR generated. Visit /qr to scan');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('[CONNECTION] closed, reconnecting:', shouldReconnect);
            botStatus = 'Reconnecting...';
            if (shouldReconnect) startVoid();
            else {
                botStatus = 'Logged Out';
                OWNER_NUMBER = null; // Reset owner on logout
                console.log('[CONNECTION] Logged out. Delete session folder to get new QR');
            }
        } else if (connection === 'open') {
            OWNER_NUMBER = VoidMD.user.id; // ← AUTO-SET OWNER TO SCANNED NUMBER
            console.log('[CONNECTION] VOID-MD Connected ✅ | Owner:', OWNER_NUMBER);
            botStatus = 'Connected';
            latestQR = null;
        }
    });

    VoidMD.ev.on('creds.update', saveCreds);

    // MESSAGE HANDLER
    VoidMD.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        m.message = m.message.ephemeralMessage?.message || m.message;
        const type = Object.keys(m.message)[0];
        const body = m.message.conversation || m.message[type]?.text || m.message[type]?.caption || '';
        const isCmd = body.startsWith(PREFIX);
        const command = isCmd ? body.slice(PREFIX.length).trim().split(' ')[0].toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(' ');
        const sender = m.key.remoteJid;
        const isGroup = sender.endsWith('@g.us');
        const senderName = m.pushName || 'User';
        const isOwner = sender === OWNER_NUMBER || m.key.fromMe;

        // Reply function
        m.reply = (text) => VoidMD.sendMessage(sender, { text }, { quoted: m });

        // PUBLIC/PRIVATE MODE CHECK
        if (isCmd && botMode === 'private' && !isOwner) return;

        if (isCmd) console.log(`[CMD] ${command} | [FROM] ${sender} | Mode: ${botMode} | Owner: ${isOwner}`);

        // COMMAND HANDLER WITH REACTIONS
        if (isCmd && commands.has(command)) {
            const cmdData = commands.get(command);
            const emoji = cmdData.react || '💀';

            // Owner-only check
            if (cmdData.ownerOnly && !isOwner) {
                return await VoidMD.sendMessage(sender, { react: { text: '⛔', key: m.key } });
            }

            try {
                await VoidMD.sendMessage(sender, { react: { text: emoji, key: m.key } });
                await cmdData.execute(m, {
                    VoidMD,
                    text,
                    args,
                    command,
                    isGroup,
                    senderName,
                    isOwner,
                    OWNER_NUMBER,
                    botMode,
                    setBotMode: (mode) => { botMode = mode; }
                });
                await VoidMD.sendMessage(sender, { react: { text: '✅', key: m.key } });
            } catch (e) {
                console.log('[CMD ERROR]', command, e.message);
                await VoidMD.sendMessage(sender, { react: { text: '❌', key: m.key } });
                m.reply('Command failed 💀');
            }
            return;
        }

        // Default ping
        if (command === 'ping') {
            const start = Date.now();
            await VoidMD.sendMessage(sender, { react: { text: '🏓', key: m.key } });
            await m.reply(`Pong! ${Date.now() - start}ms 💀\nMode: ${botMode}\nOwner: ${OWNER_NUMBER === sender? 'You' : 'No'}`);
        }
    });
}

startVoid();
