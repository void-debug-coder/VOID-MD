module.exports = {
    name: 'autotyping',
    alias: ['at'],
    desc: 'Toggle auto typing presence',
    category: 'owner',
    async execute({ reply, config, saveConfig, isOwner }) {
        if (!isOwner) return reply('Only bot number can use this 💀')
        config.autotyping =!config.autotyping
        if (config.autotyping) config.autorecording = false
        saveConfig()
        reply(`Autotyping: ${config.autotyping? 'ON ✅' : 'OFF ❌'}`)
    }
}
