module.exports = {
    name: 'anticall',
    alias: ['ac'],
    desc: 'Toggle anticall - auto reject calls',
    category: 'owner',
    async execute({ reply, config, saveConfig, isOwner }) {
        if (!isOwner) return reply('Only bot number can use this 💀')
        config.anticall =!config.anticall
        saveConfig()
        reply(`Anticall: ${config.anticall? 'ON ✅' : 'OFF ❌'}`)
    }
}
