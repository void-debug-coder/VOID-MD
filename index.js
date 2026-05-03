const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const express = require('express');

// EXPRESS SERVER FOR RENDER
const app = express();
const PORT = process.env.PORT || 10000;
app.get('/', (req, res) => res.send('VOID-MD Running 💀'));
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
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const VoidMD = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: ['VOID-MD', 'Chrome', '1.0.0']
    });

    VoidMD.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) console.log('[QR] Scan to connect VOID-MD');
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('[CONNECTION] closed, reconnecting:', shouldReconnect);
            if (shouldReconnect) startVoid();
        } else if (connection === 'open') {
            console.log('[CONNECTION] VOID-MD Connected ✅');
        }
    });

    VoidMD.ev.on('creds.update', saveCreds);

    // MESSAGE HANDLER
    VoidMD.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        // Basic message object setup
        m.message = m.message.ephemeralMessage?.message || m.message;
        const type = Object.keys(m.message)[0];
        const body = m.message.conversation || m.message[type]?.text || m.message[type]?.caption || '';
        const prefix = '.'; // Your command prefix
        const isCmd = body.startsWith(prefix);
        const command = isCmd ? body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : '';
        const args = body.trim().split(/ +/).slice(1);
        const text = args.join(' ');
        const sender = m.key.remoteJid;
        const isGroup = sender.endsWith('@g.us');
        const senderName = m.pushName || 'User';

        // Reply function
        m.reply = (text) => VoidMD.sendMessage(sender, { text }, { quoted: m });

        // Log commands
        if (isCmd) console.log(`[CMD] ${command} | [FROM] ${sender} | [NAME] ${senderName}`);

        // COMMAND HANDLER WITH REACTIONS
        if (isCmd && commands.has(command)) {
            const cmdData = commands.get(command);
            const emoji = cmdData.react || '💀'; // Use command emoji or default skull
            
            try {
                // React to command
                await VoidMD.sendMessage(sender, { 
                    react: { 
                        text: emoji, 
                        key: m.key 
                    } 
                });

                await cmdData.execute(m, { 
                    VoidMD, 
                    text, 
                    args, 
                    command, 
                    isGroup,
                    sender,
                    senderName 
                });

                // React with checkmark on success
                await VoidMD.sendMessage(sender, { 
                    react: { 
                        text: '✅', 
                        key: m.key 
                    } 
                });

            } catch (e) {
                console.log('[CMD ERROR]', e);
                // React with X on error
                await VoidMD.sendMessage(sender, { 
                    react: { 
                        text: '❌', 
                        key: m.key 
                    } 
                });
                m.reply('Command failed 💀');
            }
            return;
        }

        // Default ping if no command found
        if (command === 'ping') {
            const start = Date.now();
            await VoidMD.sendMessage(sender, { react: { text: '🏓', key: m.key } });
            await m.reply('Pong!');
            await m.reply(`Speed: ${Date.now() - start}ms 💀`);
        }
    });
}

startVoid();
