module.exports = {
    name: 'gpt',
    alias: ['chatgpt'],
    desc: 'ChatGPT 3.5 features',
    category: 'fun',
    async execute({ reply, args }) {
        if (!args[0]) return reply('Ask ChatGPT. Ex:.gpt explain quantum physics')
        reply('ChatGPT feature ready. Add your API key 💀')
    }
}
