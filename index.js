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
let OWNER_NUMBER = null;

const OWNER_FILE = './owner.json';
if (fs.existsSync(OWNER_FILE)) {
    OWNER_NUMBER = JSON.parse(fs.readFileSync(OWNER_FILE)).owner;
    console.log('Owner loaded:', OWNER_NUMBER);
}

// Global settings
global.anticall = false;
global.autolikestatus = false;
global.autoviewstatus = false;

// Load commands
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

app.get('/ping', (req, res) => res.send('Bot alive'));
setInterval(() => {
    require('https').get(`https://${process.env.RENDER_EXTERNAL_URL}/ping`).on('error', () => {});
}, 240000);

app.get('/', async (req, res) => {
    if (botStatus === 'Connected') {
        res.send(`<html><body style="background:#0a0a0a;color:#0f0;font-family:monospace;text-align:center;padding-top:20vh;"><h1>✅ VOID-MD Connected</h1><p>Owner: ${OWNER_NUMBER}</p><p>Commands: ${commands.size}</p></body></html>`);
    } else if (latestQR) {
        res.send(`<html><head><meta http-equiv="refresh" content="20"></head><body style="background:#0a0a0a;color:#fff;font-family:monospace;text-align:center;padding-top:10vh;"><h1>🌟 Scan QR</h1><p style="color:#0f0;">You will become bot owner</p><img src="${latestQR}" style="border:5px solid #0f0;"><p>WhatsApp > Linked Devices</p></body></html>`);
    } else {
        res.send(`<html><body style="background:#0a0a0a;color:#fff;font-family:monospace;text-align:center;padding-top:20vh;"><h1>VOID-MD</h1><p>${botStatus}</p></body></html>`);
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

async function startBot() {
    try {
        console.log('[BOT] Starting Baileys...');
        if (!fs.existsSync('./session')) fs.mkdirSync('./session');

        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const { version } = await fetchLatestBaileysVersion();
        console.log('[BOT] Baileys version:', version);

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            auth: state,
            browser: ['VOID-MD', 'Chrome', '1.0.0'],
            getMessage: async () => { return { conversation: 'VOID-MD' } },
            markOnlineOnConnect: true,
            syncFullHistory: false,
            fireInitQueries: false
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            console.log('[CONNECTION]', connection);

            if (qr) {
                latestQR = await qrcode.toDataURL(qr);
                botStatus = 'Waiting for QR scan';
                console.log('QR ready at your Render URL');
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
                botStatus = 'Disconnected';
                latestQR = null;
                if (shouldReconnect) setTimeout(startBot, 5000);
                else {
                    if (fs.existsSync(OWNER_FILE)) fs.unlinkSync(OWNER_FILE);
                    OWNER_NUMBER = null;
                }
            } else if (connection === 'open') {
                botStatus = 'Connected';
                latestQR = null;
                if (!OWNER_NUMBER && sock.user?.id) {
                    OWNER_NUMBER = sock.user.id.split(':')[0].split('@')[0];
                    fs.writeFileSync(OWNER_FILE, JSON.stringify({ owner: OWNER_NUMBER }));
                    console.log('OWNER SET TO:', OWNER_NUMBER);
                    await sock.sendMessage(OWNER_NUMBER + '@s.whatsapp.net', {
                        text: `✅ *You are now VOID-MD owner*\nNumber: ${OWNER_NUMBER}\n\nType ${prefix}ping to test`
                    }).catch(() => {});
                }
                console.log('Connected. Owner:', OWNER_NUMBER);
            }
        });

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type!== 'notify') return;
            const m = messages[0];
            if (!m.message) return;

            const botNumber = sock.user?.id?.split(':')[0].split('@')[0];
            let sender = m.key.participant || m.key.remoteJid;
            const senderNum = sender.split('@')[0].split(':')[0];
            if (senderNum === botNumber) return;

            const body = m.message.conversation
                || m.message.extendedTextMessage?.text
                || m.message.imageMessage?.caption
                || m.message.videoMessage?.caption
                || '';
            console.log('[MSG]', sender, ':', body);

            if (!body.startsWith(prefix)) return;

            const args = body.slice(prefix.length).trim().split(/ +/);
            const cmdName = args.shift().toLowerCase();
            console.log('[CMD]', cmdName);

            const command = commands.get(cmdName) || [...commands.values()].find(c => c.alias?.includes(cmdName));
            if (!command) return;

            try {
                // GLOBAL AUTO REACT - uses command.react or default ⚡
                await sock.sendMessage(m.key.remoteJid, {
                    react: { text: command.react || '⚡', key: m.key }
                }).catch(() => {});

                await command.execute(m, {
                    VoidMD: sock,
                    commands,
                    args,
                    prefix,
                    owner: OWNER_NUMBER,
                    sender: sender
                });
            } catch (e) {
                console.log(`[CMD ERROR] ${cmdName}:`, e.message);
                await sock.sendMessage(m.key.remoteJid, {
                    react: { text: '❌', key: m.key }
                }).catch(() => {});
                await sock.sendMessage(m.key.remoteJid, { text: `Error: ${e.message}` }, { quoted: m }).catch(() => {});
            }
        });

    } catch (error) {
        console.log('[BOT CRASH]', error.message);
        botStatus = 'Crashed: ' + error.message;
        setTimeout(startBot, 10000);
    }
}

startBot();
