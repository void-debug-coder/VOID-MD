module.exports = {
    name: 'menu',
    alias: ['help'],
    async execute(m, { prefix }) {
        await m.reply(`*VOID-MD Menu* 💀\n\nPrefix: ${prefix}\nCommands loaded successfully.`)
    }
}
