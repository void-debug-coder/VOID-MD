module.exports = {
    name: 'whoami',
    desc: 'Check if you are bot owner',
    category: 'general',
    async execute({ reply, m, isOwner, sock }) {
        const botNum = sock.user?.id?.split('@')[0] || 'unknown'
        const yourNum = m.sender.split('@')[0]
        reply(`Bot number: ${botNum}\nYour number: ${yourNum}\nOwner: ${isOwner? 'Yes ✅' : 'No ❌'}`)
    }
}
