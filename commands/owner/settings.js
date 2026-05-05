module.exports = {
    name: 'settings',
    alias: ['set'],
    react: '⚙️',
    desc: 'Toggle bot settings',
    category: 'owner',
    async execute(m, { VoidMD, senderNum, owner, args }) {
        if (senderNum!== owner) {
            return VoidMD.sendMessage(m.chat, { text: '*Owner only command* 💀' }, { quoted: m })
        }

        const [setting, value] = args
        const toggle = value === 'on'? true : value === 'off'? false : null

        const settings = {
            'anticall': 'Anti-Call',
            'autoread': 'Auto Read',
            'autoviewstatus': 'Auto View Status',
            'autolikestatus': 'Auto Like Status',
            'autotyping': 'Auto Typing',
            'autorecording': 'Auto Recording',
            'alwaysonline': 'Always Online',
            'public': 'Public Mode'
        }

        if (!setting ||!settings[setting]) {
            let list = `*${global.themeemoji} VOID-MD SETTINGS*\n\n`
            for (let key in settings) {
                list += `*${key}:* ${global[key]? 'ON ✅':'OFF ❌'}\n`
            }
            list += `\n*Usage:* ${global.prefix}settings <name> on/off\n*Example:* ${global.prefix}settings anticall on`
            return VoidMD.sendMessage(m.chat, { text: list }, { quoted: m })
        }

        if (toggle === null) {
            return VoidMD.sendMessage(m.chat, {
                text: `*${settings[setting]}:* ${global[setting]? 'ON ✅':'OFF ❌'}\n\nUse: ${global.prefix}settings ${setting} on/off`
            }, { quoted: m })
        }

        global[setting] = toggle
        await VoidMD.sendMessage(m.chat, {
            text: `*${settings[setting]}:* ${toggle? 'ON ✅':'OFF ❌'}`
        }, { quoted: m })
    }
}
