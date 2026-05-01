module.exports = {
    name: 'antidelete',
    alias: ['ad'],
    desc: 'Toggle antidelete - shows deleted messages',
    category: 'owner',
    async execute({ reply, config, saveConfig, isOwner }) {
        if (!isOwner) return reply('Only bot number can use this 💀')
        config.antidelete =!config.antidelete
        saveConfig()
        reply(`Antidelete: ${config.antidelete? 'ON ✅' : 'OFF ❌'}`)
    }
}
