module.exports = {
    name: 'antilink',
    alias: ['al'],
    desc: 'Toggle antilink - kicks users who send links',
    category: 'owner',
    async execute({ reply, config, saveConfig, isOwner, isGroup }) {
        if (!isOwner) return reply('Only bot number can use this 💀')
        if (!isGroup) return reply('Group only 💀')
        config.antilink =!config.antilink
        saveConfig()
        reply(`Antilink: ${config.antilink? 'ON ✅' : 'OFF ❌'}`)
    }
}
