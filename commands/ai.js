module.exports = {
    name: 'ai',
    alias: ['gpt', 'ask'],
    desc: 'Chat with AI',
    category: 'fun',
    async execute({ reply, args }) {
        if (!args[0]) return reply('Ask me something. Ex:.ai who are you')
        reply('AI feature ready. Connect OpenAI/Gemini API here 💀')
    }
}
