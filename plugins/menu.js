const fs = require('fs')

module.exports = {
    name: 'menu',
    alias: ['help', 'list', 'commands'],
    react: '📜',
    desc: 'Show all VOID-MD commands',
    category: 'general',
    async execute(m, { VoidMD }) {
        const uptime = process.uptime()
        const hours = Math.floor(uptime / 3600)
        const minutes = Math.floor((uptime % 3600) / 60)
        const seconds = Math.floor(uptime % 60)
        
        let menuText = `*${global.botname} Menu* ${global.themeemoji}\n\n`
        menuText += `*Bot Info*\n`
        menuText += `◦ Prefix: ${global.prefix}\n`
        menuText += `◦ Uptime: ${hours}h ${minutes}m ${seconds}s\n`
        menuText += `◦ Owner: wa.me/${global.owner[0]}\n`
        menuText += `◦ Total Commands: 6\n\n`
        
        menuText += `*🤖 AI*\n`
        menuText += `◦ ${global.prefix}ai <text> - Chat with AI\n`
        menuText += `◦ Alias: .gpt, .ask\n\n`
        
        menuText += `*🛡️ Admin*\n`
        menuText += `◦ ${global.prefix}groupshield on/off - 4-in-1 protection\n`
        menuText += `◦ Alias: .shield, .protect\n\n`
        
        menuText += `*📥 Download*\n`
        menuText += `◦ ${global.prefix}play <song> - YouTube MP3\n`
        menuText += `◦ Alias: .song, .music, .yta\n`
        menuText += `◦ ${global.prefix}sticker - Image/Video to sticker\n`
        menuText += `◦ Alias: .s, .stiker\n\n`
        
        menuText += `*📡 Tools*\n`
        menuText += `◦ ${global.prefix}ping <url> - Check website speed\n`
        menuText += `◦ Alias: .netcheck, .speed\n\n`
        
        menuText += `*📜 General*\n`
        menuText += `◦ ${global.prefix}menu - Show this list\n`
        menuText += `◦ ${global.prefix}policy - Terms & privacy\n\n`
        
        menuText += `_Type ${global.prefix}policy to read rules_ ${global.themeemoji}\n`
        menuText += `_Powered by Baileys MD_`
        
        await VoidMD.sendMessage(m.chat, { 
            image: { url: 'https://files.catbox.moe/q0tpt6.png' },
            caption: menuText 
        }, { quoted: m })
    }
          }
