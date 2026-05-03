const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 10000;
let latestQR = null;
let botStatus = 'Starting...';

app.get('/', (req, res) => {
    res.send(`VOID-MD ${botStatus} 💀<br><a href="/qr">Click here for QR Code</a>`);
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
            console.log(`[ERROR] Failed to load ${file}:`, e);
        }
    });
    console.log(`[COMMANDS] Loaded ${commands.size} commands`);
}

// TEMP FOLDER CLEANUP
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
        } else if (connection === 'open') {
            console.log('[CONNECTION] VOID-MD Connected ✅');
            botStatus = 'Connected';
            latestQR = null;
        }
    });

    VoidMD.ev.on('creds.update', saveCreds);

    // MESSAGE HANDLER WITH REACTIONS
    VoidMD.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        m.message = m.message.ephemeralMessage?.message || m.message;
        const type = Object.keys(m.message)[0];
        const body = m.message.conversation || m.message[type]?.text || m.message[type]?.caption || '';
        const prefix = '.';
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(' ');
        const sender = m.key.remoteJid;
        const isGroup = sender.endsWith('@g.us');
        const senderName = m.pushName || 'User';

        m.reply = (text) => VoidMD.sendMessage(sender, { text }, { quoted: m });

        if (isCmd) console.log(`[CMD] ${command} | [FROM] ${sender} | [NAME] ${senderName}`);

        if (isCmd && commands.has(command)) {
            const cmdData = commands.get(command);
            const emoji = cmdData.react || '💀';
            try {
                await VoidMD.sendMessage(sender, { react: { text: emoji, key: m.key } });
                await cmdData.execute(m, { VoidMD, text, args, command, isGroup, sender, senderName });
                await VoidMD.sendMessage(sender, { react: { text: '✅', key: m.key } });
            } catch (e) {
                console.log('[CMD ERROR]', e);
                await VoidMD.sendMessage(sender, { react: { text: '❌', key: m.key } });
                m.reply('Command failed 💀');
            }
            return;
        }

        if (command === 'ping') {
            const start = Date.now();
            await VoidMD.sendMessage(sender, { react: { text: '🏓', key: m.key } });
            await m.reply('Pong!');
            await m.reply(`Speed: ${Date.now() - start}ms 💀`);
        }
    });
}

startVoid();
