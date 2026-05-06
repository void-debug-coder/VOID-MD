const fs = require('fs')
const { smsg } = require('./lib/simple')
require('./config')

// Load database
global.db = { data: { users: {}, chats: {}, settings: {} } }
if (fs.existsSync('./database/database.json')) {
    global.db.data = JSON.parse(fs.readFileSync('./database/database.json'))
}

setInterval(() => {
    fs.writeFileSync('./database/database.json', JSON.stringify(global.db.data, null, 2))
}, 30 * 1000)

module.exports = async (VoidMD, m, store) => {
    try {
        m = smsg(VoidMD, m, store)
        if (!m) return

        const prefix = global.prefix
        const isCmd = m.body.startsWith(prefix)
        const command = isCmd? m.body.slice(prefix.length).trim().split(' ')[0].toLowerCase() : ''
        const args = m.body.trim().split(/ +/).slice(1)
        const text = args.join(' ')

        const sender = m.sender
        const isGroup = m.isGroup
        const groupMetadata = isGroup? await VoidMD.groupMetadata(m.chat).catch(e => {}) : ''
        const groupAdmins = isGroup? groupMetadata.participants.filter(v => v.admin!== null).map(v => v.id) : []
        const isAdmin = isGroup? groupAdmins.includes(sender) : false
        const isBotAdmin = isGroup? groupAdmins.includes(VoidMD.user.id.split(':')[0] + '@s.whatsapp.net') : false
        const isOwner = [VoidMD.user.id.split(':')[0],...global.owner].map(v => v + '@s.whatsapp.net').includes(sender)

        // Init DB
        if (isGroup) global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {}
        global.db.data.users[sender] = global.db.data.users[sender] || {}

        // GroupShield Hook - add your logic here
        if (isGroup && global.db.data.chats[m.chat]?.groupshield) {
            const shield = global.db.data.chats[m.chat].groupshield
            if (shield.antilink && /chat\.whatsapp\.com|t\.me/i.test(m.text) &&!isAdmin) {
                await VoidMD.sendMessage(m.chat, { delete: m.key })
                await VoidMD.groupParticipantsUpdate(m.chat, [sender], 'remove')
                return VoidMD.sendMessage(m.chat, { text: `*Link detected* 🔗\n@${sender.split('@')[0]} removed`, mentions: [sender] })
            }
        }

        // Load plugins
        const plugins = fs.readdirSync('./plugins').filter(file => file.endsWith('.js'))
        for (let file of plugins) {
            const plugin = require(`./plugins/${file}`)
            if (plugin.name === command || plugin.alias?.includes(command)) {
                if (plugin.category === 'owner' &&!isOwner) return m.reply(global.mess.owner)
                if (plugin.category === 'admin' &&!isAdmin) return m.reply(global.mess.admin)

                await plugin.execute(m, { VoidMD, text, args, command, isGroup, isAdmin, isBotAdmin, isOwner, db: global.db })
            }
        }

    } catch (err) {
        console.log(err)
    }
    }
