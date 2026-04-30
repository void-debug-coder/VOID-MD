module.exports = {
    name: 'autolike',
    alias: ['alstatus'],
    desc: 'Toggle auto like status',
    category: 'public',
    async execute({ reply, config, saveConfig }) {
        config.autolike =!config.autolike
        saveConfig()
        reply(`Autolike Status: ${config.autolike? 'ON ✅' : 'OFF ❌'}`)
    }
}
