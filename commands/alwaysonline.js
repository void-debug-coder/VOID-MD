module.exports = {
    name: 'alwaysonline',
    alias: ['ao', 'autonline'],
    desc: 'Toggle always online presence',
    category: 'owner',
    async execute({ reply, config, saveConfig, isOwner }) {
        if (!isOwner) return reply('Only bot number can use this 💀')
        config.autonline =!config.autonline
        saveConfig()
        reply(`Always Online: ${config.autonline? 'ON ✅' : 'OFF ❌'}\nRestart bot to apply.`)
    }
}
