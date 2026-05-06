const fetch = require('node-fetch')

module.exports = {
    name: 'ai',
    alias: ['gpt', 'ask'],
    react: '🧠',
    desc: 'AI Chat Assistant',
    category: 'ai',
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply(`*Ask me anything*\n\nExample: .ai write a joke about Safaricom bundles`)
        
        await VoidMD.sendMessage(m.chat, { react: { text: '⏳', key: m.key }})
        try {
            let res = await fetch(`https://api.davidcyriltech.my.id/ai/chatbot?query=${encodeURIComponent(text)}`)
            let data = await res.json()
            
            if (!data.result) throw new Error('No response')
            await m.reply(`*VOID-AI* ${global.themeemoji}\n\n${data.result}`)
        } catch (e) {
            console.log(e)
            await m.reply('*AI is overloaded. Try again in 10s*')
        }
    }
}
