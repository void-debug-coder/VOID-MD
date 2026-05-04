const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

const commands = new Map();
const prefix = '.';

// Load all commands
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    fs.readdirSync(commandsPath).forEach(file => {
        if (!file.endsWith('.js')) return;
        const command = require(path.join(commandsPath, file));
        if (command.name) {
            commands.set(command.name, command);
            console.log(`Loaded command: ${command.name}`);
        }
    });
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: ['VOID-MD', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode!== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
        if (!body.startsWith(prefix)) return;

        const args = body.slice(prefix.length).trim().split(/ +/);
        const cmdName = args.shift().toLowerCase();

        const command = commands.get(cmdName) || [...commands.values()].find(c => c.alias?.includes(cmdName));
        if (!command) return;

        try {
            // THIS LINE PASSES COMMANDS TO MENU - FIXES Commands: 0
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
