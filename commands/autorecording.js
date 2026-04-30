module.exports = {
    name: 'autorecording',
    alias: ['arc'],
    desc: 'Toggle auto recording presence',
    category: 'public',
    async execute({ reply, config, saveConfig }) {
        config.autorecording =!config.autorecording
        if (config.autorecording) config.autotyping = false
        saveConfig()
        reply(`Autorecording: ${config.autorecording? 'ON ✅' : 'OFF ❌'}`)
    }
}
