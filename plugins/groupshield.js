module.exports = {
    name: 'groupshield',
    alias: ['shield', 'protect'],
    react: '🛡️',
    desc: 'Enable all group protection',
    category: 'admin',
    async execute(m, { VoidMD, text, isGroup, isAdmin, isBotAdmin, db }) {
        if (!isGroup) return m.reply('*Group only*')
        if (!isAdmin) return m.reply('*Admin only*')
        if (!isBotAdmin) return m.reply('*Make me admin first*')
        
        const action = text?.toLowerCase()
        db.data.chats[m.chat].groupshield = db.data.chats[m.chat].groupshield || {}
        
        if (action === 'on') {
            db.data.chats[m.chat].groupshield = {
                antilink: true,
                antispam: true, 
                antitoxic: true,
                antibot: true
            }
            await m.reply(`*GroupShield Activated* 🛡️\n\n✅ *Antilink* - Kicks link spammers\n✅ *Antispam* - 5 msgs/10s = kick\n✅ *Antitoxic* - Deletes insults\n✅ *Antibot* - Blocks other bots\n\n*VOID-MD protecting* ${global.themeemoji}`)
            
        } else if (action === 'off') {
            db.data.chats[m.chat].groupshield = {}
            await m.reply('*GroupShield Disabled* ❌')
            
        } else {
            let status = db.data.chats[m.chat].groupshield
            let on = Object.values(status || {}).some(v => v)
            await m.reply(`*GroupShield Status:* ${on ? 'ON 🛡️' : 'OFF ❌'}\n\n*Usage:* .groupshield on/off`)
        }
    }
}
