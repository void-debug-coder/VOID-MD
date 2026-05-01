module.exports = {
    name: 'antiban',
    alias: ['safe'],
    desc: 'Toggle anti ban mode - slower responses',
    category: 'owner',
    async execute({ reply, config, saveConfig, isOwner }) {
        if (!isOwner) return reply('Only bot number can use this 💀')
        config.antiban =!config.antiban
        saveConfig()
        reply(`Antiban Mode: ${config.antiban? 'ON ✅' : 'OFF ❌'}\nBot will add delays to avoid bans.`)
    }
}
