module.exports = {
    name: 'autonline', alias: ['ao'], desc: 'Toggle always online', category: 'owner',
    async execute({ reply, args, isOwner, config, saveConfig, sock }) {
        if (!isOwner) return reply('*Owner only* 💀')
        if (args[0] === 'on') { config.autonline = true; config.autotyping = false; config.autorecording = false; saveConfig(); await sock.sendPresenceUpdate('available'); reply('*Autonline ON* 💀') }
        else if (args[0] === 'off') { config.autonline = false; saveConfig(); await sock.sendPresenceUpdate('unavailable'); reply('*Autonline OFF* 💀') }
        else { reply(`*Autonline:* ${config.autonline? 'ON ✅' : 'OFF ❌'}\nUse:.autonline on/off`) }
    }
}
