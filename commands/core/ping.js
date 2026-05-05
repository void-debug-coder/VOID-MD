module.exports = {
    name: 'ping',
    alias: ['p'],
    react: '🏓',
    desc: 'Speed test',
    category: 'core',
    async execute(m, { VoidMD }) {
        const start = Date.now()
        const msg = await VoidMD.sendMessage(m.chat, { text: '*Pinging...*' }, { quoted: m })
        const speed = Date.now() - start
        await VoidMD.sendMessage(m.chat, {
            text: `*🏓 Pong!*\n\n*Speed:* ${speed}ms\n*RAM:* ${(process.memoryUsage().rss/1024/1024).toFixed(2)}MB\n*${global.botname}* ${global.themeemoji}`,
            edit: msg.key
        })
    }
}
