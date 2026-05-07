module.exports = {
    name: 'menu',                    // Command name = .menu
    alias: ['help', 'list'],         // .help or .list also works
    async execute(m, { config, commands }) {
        let text = `*${config.botName}* ${config.themeEmoji}\n\n`
        commands.forEach(cmd => {
            text += `${config.prefix}${cmd.name}\n`
        })
        await m.reply(text)          // m.reply() is built-in now
    }
}
