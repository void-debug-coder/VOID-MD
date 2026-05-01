module.exports = {
    name: 'autoreact',
    alias: ['areact'],
    desc: 'Toggle auto react to messages',
    category: 'owner',
    async execute({ reply, config, saveConfig, isOwner }) {
        if (!isOwner) return reply('Only bot number can use this 💀')
        config.autoreact =!config.autoreact
        saveConfig()
        reply(`Autoreact: ${config.autoreact? 'ON ✅' : 'OFF ❌'}`)
    }
}
