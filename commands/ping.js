module.exports = {
    name: 'ping',
    async execute(m, { config }) {
        const start = Date.now()
        await m.reply('Pinging...')
        await m.reply(`*Pong!* ${config.themeEmoji}\nSpeed: ${Date.now() - start}ms`)
    }
}
