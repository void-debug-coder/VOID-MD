module.exports = {
    name: 'autobio',
    alias: ['ab'],
    desc: 'Toggle auto bio update',
    category: 'owner',
    async execute({ reply, config, saveConfig, isOwner }) {
        if (!isOwner) return reply('Only bot number can use this 💀')
        config.autobio =!config.autobio
        saveConfig()
        reply(`Autobio: ${config.autobio? 'ON ✅' : 'OFF ❌'}`)
    }
}
