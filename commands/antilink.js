module.exports = {
    name: 'antilink', alias: ['al'], desc: 'Toggle antilink', category: 'owner',
    async execute({ reply, args, isOwner, config, saveConfig, isGroup }) {
        if (!isOwner) return reply('*Owner only* 💀')
        if (!isGroup) return reply('*Group only* 💀')
        if (args[0] === 'on') { config.antilink = true; saveConfig(); reply('*Antilink ON* 💀\nBot must be admin') }
        else if (args[0] === 'off') { config.antilink = false; saveConfig(); reply('*Antilink OFF* 💀') }
        else { reply(`*Antilink:* ${config.antilink? 'ON ✅' : 'OFF ❌'}\nUse:.antilink on/off`) }
    }
}
