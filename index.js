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

// HARDCODED OWNER FOR FREE TIER - CHANGE THIS TO YOUR NUMBER
let OWNER_NUMBER = '254112843071'; 
const OWNER_FILE = './owner.json';

// Try loading from file, but fallback to hardcoded if missing
if (fs.existsSync(OWNER_FILE)) {
    try {
        OWNER_NUMBER = JSON.parse(fs.readFileSync(OWNER_FILE)).owner;
        console.log('[OWNER LOAD] From file:', OWNER_NUMBER);
    } catch (e) {
        console.log('[OWNER LOAD] Corrupt file, using hardcoded:', OWNER_NUMBER);
    }
} else {
    console.log('[OWNER LOAD] No file, using hardcoded:', OWNER_NUMBER);
}

// Global settings
global.anticall = false;
global.autoread = false;
global.autoviewstatus = false;
global.autolikestatus = false;
global.autotyping = false;
global.autorecording = false;
global.alwaysonline = false;
global.public = true;

// Load commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    fs.readdirSync(commandsPath).forEach(file => {
        if (!file.endsWith('.js')) return;
        try {
            const command = require(path.join(commandsPath, file));
            if (command.name) {
                commands.set(command.name, command);
                console.log(`[CMD LOAD] Loaded: ${command.name}`);
            }
        } catch (e) {
            console.log(`[CMD LOAD] Failed ${file}:`, e.message);
        }
    });
}

// Keep alive for Render
app.get('/ping', (req, res) => res.send('Bot alive'));
setInterval(() => {
    if (process.env.RENDER_EXTERNAL_URL) {
        require('https').get(`https://${process.env.RENDER_EXTERNAL_URL}/ping`).on('error', () => {});
    }
}, 240000);

// Web UI
app.get('/', async (req, res) => {
    if (botStatus === 'Connected') {
        res.send(`<html><body style="background:#0a0a0a;color:#0f0;font-family:monospace;text-align:center;padding-top:20vh;"><h1>✅ VOID-MD Connected</h1><p>Owner: ${OWNER_NUMBER}</p><p>Commands: ${commands.size}</p><p>Mode: ${global.public? 'PUBLIC' : 'PRIVATE'}</p></body></html>`);
    } else if (latestQR) {
        res.send(`<html><head><meta http-equiv="refresh" content="20"></head><body style="background:#0a0a0a;color:#fff;font-family:monospace;text-align:center;padding-top:10vh;"><h1>🌟 Scan QR</h1><img src="${latestQR}" style="border:5px solid #0f0;"><p>WhatsApp > Linked Devices</p></body></html>`);
    } else {
        res.send(`<html><body style="background:#0a0a0a;color:#fff;font-family:monospace;text-align:center;padding-top:20vh;"><h1>VOID-MD</h1><p>${botStatus}</p></body></html>`);
    }
});

app.listen(PORT, () => console.log(`[SERVER] Running on port ${PORT}`));

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
            markOnlineOnConnect: global.alwaysonline,
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
                console.log('[QR] Ready');
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
                botStatus = 'Disconnected';
                latestQR = null;
                if (shouldReconnect) {
                    console.log('[RECONNECT] Reconnecting in 5s...');
                    setTimeout(startBot, 5000);
                } else {
                    console.log('[LOGOUT] Logged out');
                }
            } else if (connection === 'open') {
                botStatus = 'Connected';
                latestQR = null;
                console.log('[READY] Connected. Owner:', OWNER_NUMBER);
                
                try {
                    fs.writeFileSync(OWNER_FILE, JSON.stringify({ owner: OWNER_NUMBER }));
                } catch {}
            }
        });

        // Anti-call handler - FIXED QUOTES
        sock.ev.on('call', async (calls) => {
            if (!global.anticall) return;
            for (let call of calls) {
                if (call.status === 'offer') {
                    await sock.rejectCall(call.id, call.from);
                    await sock.sendMessage(call.from, {
                        text: '*Anti-Call is active*\n\nCalls are not allowed.'
                    });
                }
            }
        });

        // Auto-view status
        sock.ev.on('messages.upsert', async ({ messages }) => {
            if (!global.autoviewstatus) return;
            for (let msg of messages) {
                if (msg.key.remoteJid === 'status@broadcast') {
                    try {
                        await sock.readMessages([msg.key]);
                        if (global.autolikestatus) {
                            await sock.sendMessage(msg.key.remoteJid, {
                                react: { text: '💚', key: msg.key }
                            });
                        }
                    } catch {}
                }
            }
        });

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type!== 'notify') return;
            const m = messages[0];
            if (!m.message) return;

            const botNumber = sock.user?.id?.replace(/[^0-9]/g, '');
            let sender = m.key.participant || m.key.remoteJid;
            const senderNum = sender.replace(/[^0-9]/g, '');

            console.log('[OWNER CHECK] Sender:', senderNum, '| Owner:', OWNER_NUMBER, '| Bot:', botNumber);

            if (senderNum === botNumber) return;

            // Auto-read
            if (global.autoread &&!m.key.fromMe && m.key.remoteJid!== 'status@broadcast') {
                try {
                    await sock.readMessages([m.key]);
                } catch {}
            }

            const body = m.message.conversation
                || m.message.extendedTextMessage?.text
                || m.message.imageMessage?.caption
                || m.message.videoMessage?.caption
                || '';

            if (!body.startsWith(prefix)) return;

            // Private mode check
            if (!global.public && senderNum!== OWNER_NUMBER) {
                console.log('[BLOCKED] Private mode - non-owner');
                return;
            }

            const args = body.slice(prefix.length).trim().split(/ +/);
            const cmdName = args.shift().toLowerCase();

            const command = commands.get(cmdName) || [...commands.values()].find(c => c.alias?.includes(cmdName));
            if (!command) return;

            try {
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
                    text: `Error: ${e.message}`
                }, { quoted: m }).catch(() => {});
            }
        });

    } catch (error) {
        console.log('[BOT CRASH]', error.message);
        botStatus = 'Crashed: ' + error.message;
        setTimeout(startBot, 10000);
    }
}

startBot();
