module.exports = {
    name: 'chatbot',
    alias: ['cb'],
    desc: 'Toggle auto reply when tagged',
    category: 'owner',
    async execute({ reply, config, saveConfig, isOwner }) {
        if (!isOwner) return reply('Owner only 💀')
        config.chatbot = !config.chatbot
        saveConfig()
        reply(`Chatbot: ${config.chatbot ? 'ON ✅' : 'OFF ❌'}`)
    }
}
