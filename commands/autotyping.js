module.exports = {
    name: 'autotyping', alias: ['at'], desc: 'Toggle typing on all messages', category: 'owner',
    async execute({ reply, args, isOwner, config, saveConfig }) {
        if (!isOwner) return reply('*Owner only* 💀')
        if (args[0] === 'on') { config.autotyping = true; config.autorecording = false; config.autonline = false; saveConfig(); reply('*Autotyping ON* 💀') }
        else if (args[0] === 'off') { config.autotyping = false; saveConfig(); reply('*Autotyping OFF* 💀') }
        else { reply(`*Autotyping:* ${config.autotyping? 'ON ✅' : 'OFF ❌'}\nUse:.autotyping on/off`) }
    }
}
