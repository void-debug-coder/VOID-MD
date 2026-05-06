module.exports = {
    name: 'menu',
    alias: ['help', 'list'],
    async execute(m, { config, commands }) {
        let text = `*${config.botName} Menu* ${config.themeEmoji}\n\n`
        text += `*Prefix:* ${config.prefix}\n`
        text += `*Commands:* ${commands.size}\n\n`

        commands.forEach(cmd => {
            text += `${config.themeEmoji} ${config.prefix}${cmd.name}\n`
        })

        await m.reply(text)
    }
}
