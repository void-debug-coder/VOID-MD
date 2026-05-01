module.exports = {
    name: 'chatbot',
    alias: ['cb'],
    desc: 'Toggle auto reply when tagged',
    category: 'owner',
    async execute({ reply, config, saveConfig, isOwner }) {
        if (!isOwner) return reply('Only bot number can use this 💀')
        config.chatbot =!config.chatbot
        saveConfig()
        reply(`Chatbot: ${config.chatbot? 'ON ✅' : 'OFF ❌'}`)
    }
}
