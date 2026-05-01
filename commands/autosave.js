module.exports = {
    name: 'autosave',
    alias: ['asave'],
    desc: 'Toggle auto save new contacts',
    category: 'owner',
    async execute({ reply, config, saveConfig, isOwner }) {
        if (!isOwner) return reply('Only bot number can use this 💀')
        config.autosave =!config.autosave
        saveConfig()
        reply(`Autosave: ${config.autosave? 'ON ✅' : 'OFF ❌'}`)
    }
}
