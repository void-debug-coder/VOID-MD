module.exports = {
    name: 'vv',
    alias: ['viewonce', 'rvo'],
    desc: 'Download view once photos/videos',
    category: 'tools',
    async execute({ reply, m, sock, from }) {
        if (!m.quoted) return reply('Reply to a view once message 💀')
        if (!m.quoted.message?.viewOnceMessageV2) return reply('That is not view once 💀')
        const msg = m.quoted.message.viewOnceMessageV2.message
        const type = Object.keys(msg)[0]
        const media = await m.quoted.download()
        await sock.sendMessage(from, { [type]: media, caption: 'ViewOnce saved 💀' }, { quoted: m })
    }
}
