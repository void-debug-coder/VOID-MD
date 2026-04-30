module.exports = {
    name: 'menu', alias: ['help', 'list', 'commands'], desc: 'Show all bot commands', category: 'general',
    async execute({ reply, commands, PREFIX, BOT_NAME, VERSION, uptime, isOwner, config, sock, from, m, BOT_IMAGE }) {
        const categories = {}
        commands.forEach((cmd, name) => {
            if (name!== cmd.name) return
            const cat = cmd.category || 'general'
            if (!categories[cat]) categories[cat] = []
            categories[cat].push(cmd)
        })
        let text = `╭─── *${BOT_NAME}* ───╮\n│ *Version:* ${VERSION}\n│ *Uptime:* ${uptime()}\n│ *Prefix:* ${PREFIX}\n│ *Commands:* ${commands.size}\n╰─────────────────╯\n\n`
        if (isOwner) {
            text += `*⚙️ SYSTEM TOGGLES*\n├ Autoview: ${config.autoview? '✅' : '❌'}\n├ Autotyping: ${config.autotyping? '✅' : '❌'}\n├ Autorecording: ${config.autorecording? '✅' : '❌'}\n├ Autonline: ${config.autonline? '✅' : '❌'}\n├ Autoread: ${config.autoread? '✅' : '❌'}\n├ Antidelete: ${config.antidelete? '✅' : '❌'}\n├ Antilink: ${config.antilink? '✅' : '❌'}\n└ Chatbot: ${config.chatbot? '✅' : '❌'}\n\n`
        }
        text += `*📑 COMMAND LIST*\n`
        for (const [cat, cmds] of Object.entries(categories)) {
            if (cat === 'owner' &&!isOwner) continue
            text += `\n*${cat.toUpperCase()}* [${cmds.length}]\n`
            cmds.forEach((cmd, i) => { text += `${i === cmds.length - 1? '└' : '├'} ${PREFIX}${cmd.name} - ${cmd.desc}\n` })
        }
        text += `\n💀 *${BOT_NAME}* by Mr Void`
        try { await sock.sendMessage(from, { image: { url: BOT_IMAGE }, caption: text }, { quoted: m }) } catch { reply(text) }
    }
}
