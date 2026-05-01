module.exports = {
    name: 'ping',
    desc: 'Check bot response time',
    category: 'general',
    async execute({ reply }) {
        const start = Date.now()
        await reply('Pong!')
        const end = Date.now()
        reply(`Response: ${end - start}ms 💀`)
    }
}
