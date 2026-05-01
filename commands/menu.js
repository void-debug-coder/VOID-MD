const os = require('os')
const process = require('process')

module.exports = {
    name: 'menu',
    alias: ['help', 'list', 'commands'],
    desc: 'Display VOID-MD command menu',
    category: 'general',
    async execute({ reply, commands, BOT_NAME, VERSION, uptime, PREFIX, BOT_IMAGE, sock, from, m, isOwner }) {
        const start = Date.now()
        const categories = {}
        let totalCmds = 0
        let ownerCmds = 0

        commands.forEach((cmd, name) => {
            if (cmd.name!== name) return
            if (!cmd.category ||!cmd.desc) return
            if (!categories[cmd.category]) categories[cmd.category] = []
            categories[cmd.category].push(cmd)
            totalCmds++
            if (cmd.category === 'owner') ownerCmds++
        })

        const catOrder = ['general', 'download', 'tools', 'fun', 'group', 'owner']
        const catData = {
            general: { emoji: '⚙️', title: 'GENERAL' },
            owner: { emoji: '👑', title: 'OWNER' },
            group: { emoji: '👥', title: 'GROUP' },
            download: { emoji: '📥', title: 'DOWNLOAD' },
            tools: { emoji: '🛠️', title: 'TOOLS' },
            fun: { emoji: '🎮', title: 'FUN' }
        }

        const sortedCats = Object.keys(categories).sort((a, b) => {
            const ia = catOrder.indexOf(a), ib = catOrder.indexOf(b)
            if (ia!== -1 && ib!== -1) return ia - ib
            if (ia!== -1) return -1
            if (ib!== -1) return 1
            return a.localeCompare(b)
        })

        const used = process.memoryUsage()
        const ram = `${(used.rss / 1024 / 1024).toFixed(0)} MB`
        const ping = Date.now() - start
        const platform = os.type()
        const nodeVer = process.version
        const up = uptime()
        const botNum = sock.user?.id?.split('@')[0] || 'Unknown'
        const publicCmds = totalCmds - ownerCmds

        // Header
        let text = `╭═══〘 *${BOT_NAME}* 〙═══⊷❍\n`
        text += `┃╭─────────────────\n`
        text += `┃│👤 *Owner:* wa.me/${botNum}\n`
        text += `┃│📌 *Prefix:* [ ${PREFIX} ]\n`
        text += `┃│⚡ *Version:* ${VERSION}\n`
        text += `┃│📊 *Total Cmds:* ${totalCmds}\n`
        text += `┃│🔓 *Public:* ${publicCmds} | 🔒 *Owner:* ${ownerCmds}\n`
        text += `┃│⏱️ *Uptime:* ${up}\n`
        text += `┃│🚀 *Ping:* ${ping}ms\n`
        text += `┃│💾 *RAM:* ${ram}\n`
        text += `┃│🖥️ *Platform:* ${platform}\n`
        text += `┃│🟢 *Node:* ${nodeVer}\n`
        text += `┃│👑 *Rank:* ${isOwner? 'Owner' : 'User'}\n`
        text += `┃╰─────────────────\n`
        text += `╰══════════════════⊷❍\n\n`

        // Commands by category
        for (const category of sortedCats) {
            if (category === 'owner' &&!isOwner) continue
            
            const data = catData[category] || { emoji: '📁', title: category.toUpperCase() }
            const count = categories[category].length
            
            text += `╭─❏ *${data.emoji} ${data.title}* ❏\n`
            text += `┃\n`
            
            categories[category].sort((a, b) => a.name.localeCompare(b.name))
               .forEach(cmd => {
                    text += `┃◦ ${PREFIX}${cmd.name}\n`
                    text += `┃ └ ${cmd.desc}\n`
                })
            text += `╰─────────────────\n\n`
        }

        // Footer
        text += `╭═══〘 *VOID-MD* 〙═══⊷❍\n`
        text += `┃💀 *Type:* ${PREFIX}help <cmd>\n`
        text += `┃💀 *Ex:* ${PREFIX}help play\n`
        text += `┃💀 *Powered by Mr Void*\n`
        text += `╰══════════════════⊷❍`

        try {
            await sock.sendMessage(from, {
                image: { url: BOT_IMAGE },
                caption: text,
                contextInfo: {
                    externalAdReply: {
                        title: `${BOT_NAME} ${VERSION}`,
                        body: `${totalCmds} Commands | ${isOwner? 'Owner Mode' : 'Public Mode'}`,
                        thumbnailUrl: BOT_IMAGE,
                        sourceUrl: 'https://github.com',
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m })
        } catch {
            await reply(text)
        }
    }
            }
