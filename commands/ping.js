module.exports = {
    name: 'ping',
    alias: ['p'],
    react: '🏓',
    category: 'core',
    desc: 'Check bot speed',
    async execute(m, { VoidMD }) {
        const start = Date.now();
        let msg = await VoidMD.sendMessage(m.key.remoteJid, { text: 'Pinging...' }, { quoted: m });
        const end = Date.now();
        await VoidMD.sendMessage(m.key.remoteJid, {
            text: `🏓 *Pong!*\nLatency: ${end - start}ms`
        }, { quoted: msg });
    }
}
