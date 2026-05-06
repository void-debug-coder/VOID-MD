module.exports = {
    name: 'menu',
    alias: ['help', 'list'],
    description: 'Show bot menu',
    async execute(m, { VoidMD, prefix }) {
        await m.reply('*VOID-MD Menu* 💀\n\nPrefix: ' + prefix + '\n\nBot is online.')
    }
}
