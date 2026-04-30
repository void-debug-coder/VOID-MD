module.exports = {
    name: 'autoview',
    alias: ['av', 'statusview'],
    desc: 'Toggle auto view + react status',
    category: 'public',
    async execute({ reply, config, saveConfig }) {
        config.autoview =!config.autoview
        saveConfig()
        reply(`Autoview: ${config.autoview? 'ON ✅' : 'OFF ❌'}`)
    }
}
