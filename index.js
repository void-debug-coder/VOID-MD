const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');
const qrcode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

const commands = new Map();
const prefix = '.';

let latestQR = null;
let botStatus = 'Starting...';

// Load all commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    fs.readdirSync(commandsPath).forEach(file => {
        if (!file.endsWith('.js')) return;
        try {
            const command = require(path.join(commandsPath, file));
            if (command.name) {
                commands.set(command.name, command);
                console.log(`Loaded command: ${command.name}`);
            }
        } catch (e) {
            console.log(`Failed to load ${file}:`, e.message);
        }
    });
}

// Serve QR on webpage
app.get('/', async (req, res) => {
    if (botStatus === 'Connected') {
        res.send(`
            <html>
                <head><title>VOID-MD</title></head>
                <body style="background:#0a0a0a;color:#0f0;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
                    <div style="text-align:center;">
                        <h1>✅ VOID-MD Connected</h1>
                        <p>Bot is online and ready</p>
                        <p>Commands loaded: ${commands.size}</p>
                    </div>
                </body>
            </html>
        `);
    } else if (latestQR) {
        res.send(`
            <html>
                <head>
                    <title>Scan QR - VOID-MD</title>
                    <meta http-equiv="refresh" content="20">
                </head>
                <body style="background:#0a0a0a;color:#fff;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
                    <div style="text-align:center;">
                        <h1>🌟 VOID-MD WhatsApp Bot</h1>
                        <p>Scan this QR with WhatsApp</p>
                        <img src="${latestQR}" style="border:5px solid #0f0;border-radius:10px;">
                        <p style="color:#888;">WhatsApp > Linked Devices > Link a device</p>
                        <p style="color:#555;">Page refreshes every 20s</p>
                    </div>
                </body>
            </html>
        `);
    } else {
        res.send(`
            <html>
                <body style="background:#0a0a0a;color:#fff;font-family:monospace;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;">
                    <div style="text-align:center;">
                        <h1>VOID-MD</h1>
                        <p>Status: ${botStatus}</p>
                        <p>Generating QR code...</p>
                    </div>
                </body>
            </html>
        `);
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: state,
        browser: ['VOID-MD', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            latestQR = await qrcode.toDataURL(qr);
            botStatus = 'Waiting for QR scan';
            console.log('QR generated. Open your Render URL to scan');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode!== DisconnectReason.loggedOut;
            botStatus = 'Disconnected';
            latestQR = null;
            if (shouldReconnect) {
                botStatus = 'Reconnecting...';
                startBot();
            } else {
                botStatus = 'Logged out';
            }
        } else if (connection === 'open') {
            botStatus = 'Connected';
            latestQR = null;
            console.log('Connected to WhatsApp');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';
        if (!body.startsWith(prefix)) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();

        const command = commands.get(cmdName) || [...commands.values()].find(c => c.alias?.includes(cmdName));
        if (!command) return;

        try {
            await sock.sendReadReceipt(m.key.remoteJid, m.key.participant || m.key.remoteJid, [m.key.id]);
            if (command.react) await sock.sendMessage(m.key.remoteJid, { react: { text: command.react, key: m.key } });

            await command.execute(m, {
                VoidMD: sock,
                commands: commands,
                args: args,
                prefix: prefix
            });
        } catch (e) {
            console.log(`[CMD ERROR] ${cmdName}:`, e.message);
        }
    });
}

startBot();
