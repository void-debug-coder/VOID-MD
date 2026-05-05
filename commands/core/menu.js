module.exports = {
    name: 'menu',
    alias: ['help', 'list'],
    react: '📜',
    desc: 'Show all commands',
    category: 'core',
    async execute(m, { VoidMD, commands, prefix }) {
        let menu = `*${global.themeemoji} ${global.botname} MENU*\n\n`
        menu += `*Prefix:* ${prefix}\n*Total:* ${commands.size}\n\n`

        const categories = {}
        commands.forEach(cmd => {
            const cat = cmd.category || 'other'
            if (!categories[cat]) categories[cat] = []
            categories[cat].push(cmd)
        })

        for (let cat in categories) {
            menu += `*━━━ ${cat.toUpperCase()} ━━━*\n`
            categories[cat].forEach(cmd => {
                menu += `${prefix}${cmd.name} - ${cmd.desc}\n`
            })
            menu += `\n`
        }

        menu += `*Mode:* ${global.public? 'Public':'Private'}\n*Owner:* ${global.owner}`

        await VoidMD.sendMessage(m.chat, { text: menu }, { quoted: m })
    }
}
