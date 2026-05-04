module.exports = {
    name: 'ping',
    alias: ['p'],
    react: '🏓',
    category: 'core',
    desc: 'Check bot response',
    async execute(m, { VoidMD }) {
        const start = Date.now();
        await VoidMD.sendMessage(m.key.remoteJid, { text: 'Pinging...' }, { quoted: m });
        const end = Date.now();
        await VoidMD.sendMessage(m.key.remoteJid, { text: `Pong! ${end - start}ms` });
    }
}
