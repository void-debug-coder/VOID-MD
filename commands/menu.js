const os = require('os')
const process = require('process')

module.exports = {
    name: 'menu',
    alias: ['help', 'list', 'cmd', 'cmds'],
    desc: 'Display VOID-MD command menu',
    category: 'general',
    async execute({ reply, commands, BOT_NAME, VERSION, uptime, PREFIX, BOT_IMAGE, sock, from, m }) {
        const start = Date.now()

        // Group commands by category
        const categories = {}
        let totalCmds = 0

        commands.forEach((cmd, name) => {
            if (cmd.name!== name) return // skip aliases
            if (!cmd.category ||!cmd.desc) return // skip broken cmds
            if (!categories[cmd.category]) categories[cmd.category] = []
            categories[cmd.category].push(cmd)
            totalCmds++
        })

        // Category order + emojis
        const catOrder = ['general', 'owner', 'group', 'download', 'media', 'fun', 'tools']
        const catEmojis = {
            general: '⚙️',
            owner: '👑',
            group: '👥',
            download: '📥',
            media: '🎭',
            fun: '🎮',
            tools: '🛠️'
        }

        const sortedCats = Object.keys(categories).sort((a, b) => {
            const ia = catOrder.indexOf(a)
            const ib = catOrder.indexOf(b)
            if (ia!== -1 && ib!== -1) return ia - ib
            if (ia!== -1) return -1
            if (ib!== -1) return 1
            return a.localeCompare(b)
        })

        // System stats
        const used = process.memoryUsage()
        const ram = `${(used.rss / 1024 / 1024).toFixed(0)}MB`
        const ping = Date.now() - start
        const platform = os.type()
        const nodeVer = process.version
        const up = uptime()

        // Helper for padding
        const pad = (str, len) => str.toString().padEnd(len, ' ')

        // Header - 31 chars wide
        let text = `╔═════════════════════════════╗\n`
        text += `║ 💀 *${pad(BOT_NAME, 23)}* 💀 ║\n`
        text += `╠═════════════════════════════╣\n`
        text += `║ ▢ Version : ${pad(VERSION, 14)} ║\n`
        text += `║ ▢ Uptime : ${pad(up, 14)} ║\n`
        text += `║ ▢ Prefix : ${pad(`[ ${PREFIX} ]`, 14)} ║\n`
        text += `║ ▢ Ping : ${pad(ping + 'ms', 14)} ║\n`
        text += `║ ▢ RAM : ${pad(ram, 14)} ║\n`
        text += `║ ▢ Platform : ${pad(platform, 14)} ║\n`
        text += `║ ▢ Node : ${pad(nodeVer, 14)} ║\n`
        text += `║ ▢ Commands : ${pad(totalCmds, 14)} ║\n`
        text += `╚═════════════════════════════╝\n\n`

        // Categories
        for (const category of sortedCats) {
            const emoji = catEmojis[category] || '📁'
            const catName = category.toUpperCase()
            const count = categories[category].length
            const title = `${emoji} ${catName} [${count}]`

            text += `┏━━ ${title} ${'━'.repeat(Math.max(0, 24 - title.length))}┓\n`

            categories[category]
               .sort((a, b) => a.name.localeCompare(b.name))
               .forEach((cmd, i) => {
                    const isLast = i === categories[category].length - 1
                    const branch = isLast? '┗' : '┣'
                    text += `${branch}❯ ${PREFIX}${cmd.name}\n`
                    text += `┃ └ ${cmd.desc}\n`
                })
            text += `\n`
        }

        text += `┌─────────────────────────────┐\n`
        text += `│ 💀 *VOID-MD by Mr Void* 💀 │\n`
        text += `│ Type ${PREFIX}help <command> │\n`
        text += `└─────────────────────────────┘`

        // Send with rich preview
        try {
            await sock.sendMessage(from, {
                image: { url: BOT_IMAGE },
                caption: text,
                contextInfo: {
                    externalAdReply: {
                        title: `${BOT_NAME} ${VERSION}`,
                        body: `${totalCmds} Commands | ${ping}ms`,
                        thumbnailUrl: BOT_IMAGE,
                        sourceUrl: 'https://github.com',
                        mediaType: 1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: m })
        } catch {
            await reply(text)
        }
    }
}
