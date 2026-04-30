module.exports = {
    name: 'autorecording',
    alias: ['arc'],
    desc: 'Toggle auto recording presence',
    category: 'owner',
    async execute({ reply, config, saveConfig, isOwner }) {
        if (!isOwner) return reply('Owner only 💀')
        config.autorecording = !config.autorecording
        if (config.autorecording) config.autotyping = false
        saveConfig()
        reply(`Autorecording: ${config.autorecording ? 'ON ✅' : 'OFF ❌'}`)
    }
}
