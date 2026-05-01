module.exports = {
    name: 'statusdl',
    alias: ['sdl', 'savestatus'],
    desc: 'Download status when replied',
    category: 'download',
    async execute({ reply, m, sock, from }) {
        if (!m.quoted || m.quoted.key.remoteJid!== 'status@broadcast') return reply('Reply to a status 💀')
        const media = await m.quoted.download()
        const type = Object.keys(m.quoted.message)[0]
        await sock.sendMessage(from, { [type]: media, caption: 'Status saved 💀' }, { quoted: m })
    }
}
