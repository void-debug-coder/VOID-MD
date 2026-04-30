module.exports = {
    name: 'antilink',
    alias: ['al'],
    desc: 'Toggle antilink - kicks users who send links',
    category: 'group',
    async execute({ reply, config, saveConfig, isOwner, isGroup }) {
        if (!isGroup) return reply('Group only 💀')
        if (!isOwner) return reply('Owner only 💀')
        config.antilink = !config.antilink
        saveConfig()
        reply(`Antilink: ${config.antilink ? 'ON ✅' : 'OFF ❌'}`)
    }
}
