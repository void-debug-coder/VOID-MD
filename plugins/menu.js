module.exports = {
    name: 'menu',
    alias: ['help'],
    react: '📜',
    desc: 'Show menu',
    async execute(m, { VoidMD }) {
        let text = `*${global.botname} Menu* ${global.themeemoji}\n\n`
        text += `*Commands:*\n`
        text += `◦ ${global.prefix}menu - This menu\n`
        text += `◦ ${global.prefix}ping - Test bot\n\n`
        text += `_Owner: wa.me/${global.owner}_`
        await VoidMD.sendMessage(m.chat, { text }, { quoted: m })
    }
}
