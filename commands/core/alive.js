module.exports = {
    name: 'alive',
    alias: ['bot'],
    react: '💀',
    desc: 'Check if bot online',
    category: 'core',
    async execute(m, { VoidMD }) {
        const uptime = process.uptime()
        const h = Math.floor(uptime / 3600)
        const min = Math.floor((uptime % 3600) / 60)
        const s = Math.floor(uptime % 60)

        await VoidMD.sendMessage(m.chat, {
            text: `*${global.themeemoji} ${global.botname} ONLINE*\n\n*Uptime:* ${h}h ${min}m ${s}s\n*Mode:* ${global.public? 'Public':'Private'}\n*Prefix:* ${global.prefix}\n*Owner:* ${global.owner}\n\nType ${global.prefix}menu for commands`
        }, { quoted: m })
    }
}
