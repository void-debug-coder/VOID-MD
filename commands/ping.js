module.exports = {
    name: 'ping',
    alias: ['p', 'speed'],
    desc: 'Check bot response time',
    category: 'general',
    async execute({ reply, uptime }) {
        const start = Date.now()
        await reply('Testing...💀')
        const end = Date.now()
        reply(`*Pong!* 🏓\n*Speed:* ${end - start}ms\n*Uptime:* ${uptime()}`)
    }
}
