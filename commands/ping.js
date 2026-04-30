module.exports = {
    name: 'ping', alias: ['speed', 'pong'], desc: 'Check bot response time', category: 'general',
    async execute({ reply, sock, from, m }) {
        const start = Date.now()
        const msg = await reply('*Testing...* 💀')
        await sock.sendMessage(from, { text: `*Pong!* 🏓\n*Speed:* ${Date.now() - start}ms`, edit: msg.key })
    }
}
