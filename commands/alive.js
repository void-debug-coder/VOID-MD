module.exports = {
    name: 'alive',
    alias: ['bot', 'online'],
    async execute(m, { config }) {
        await m.reply(`*${config.botName} is Alive* ${config.themeEmoji}\n\n*Prefix:* ${config.prefix}\n*Runtime:* Node.js\n*Platform:* Render`)
    }
}
