module.exports = {
    name: 'autoview',
    alias: ['av', 'statusview'],
    desc: 'Toggle auto view + react status',
    category: 'owner',
    async execute({ reply, config, saveConfig, isOwner }) {
        if (!isOwner) return reply('Owner only 💀')
        config.autoview = !config.autoview
        saveConfig()
        reply(`Autoview: ${config.autoview ? 'ON ✅' : 'OFF ❌'}`)
    }
}
