module.exports = {
    name: 'autoview',
    alias: ['av'],
    desc: 'Toggle auto view + react status',
    category: 'owner',
    async execute({ reply, config, saveConfig, isOwner }) {
        if (!isOwner) return reply('Only bot number can use this 💀')
        config.autoview =!config.autoview
        saveConfig()
        reply(`Autoview: ${config.autoview? 'ON ✅' : 'OFF ❌'}`)
    }
}
