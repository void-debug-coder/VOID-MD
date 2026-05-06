module.exports = {
    name: 'ping',
    alias: ['p'],
    async execute(m, { config }) {
        const start = Date.now()
        await m.reply('Pinging...')
        const end = Date.now()
        await m.reply(`*Pong!* ${config.themeEmoji}\nResponse: ${end - start}ms`)
    }
}
