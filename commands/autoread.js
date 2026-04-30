module.exports = {
    name: 'autoread',
    alias: ['ar'],
    desc: 'Toggle auto read messages',
    category: 'owner',
    async execute({ reply, config, saveConfig, isOwner }) {
        if (!isOwner) return reply('Owner only 💀')
        config.autoread = !config.autoread
        saveConfig()
        reply(`Autoread: ${config.autoread ? 'ON ✅' : 'OFF ❌'}`)
    }
}
