module.exports = {
    name: 'autolike',
    alias: ['alstatus'],
    desc: 'Toggle auto like status',
    category: 'owner',
    async execute({ reply, config, saveConfig, isOwner }) {
        if (!isOwner) return reply('Only bot number can use this 💀')
        config.autolike =!config.autolike
        saveConfig()
        reply(`Autolike Status: ${config.autolike? 'ON ✅' : 'OFF ❌'}`)
    }
}
