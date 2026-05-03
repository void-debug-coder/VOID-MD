let onlineInterval = null;

module.exports = {
    name: 'autoonline',
    alias: ['online', 'alwayson'],
    desc: 'Keep bot online 24/7',
    react: '🟢',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, text }) {
        const arg = text.toLowerCase().trim();

        if (arg === 'on') {
            if (onlineInterval) return m.reply('Autoonline already ON 🟢');

            await m.reply('Autoonline enabled ✅\nBot will show online 24/7');

            // Set online immediately
            await VoidMD.sendPresenceUpdate('available');

            // Keep refreshing every 10sec
            onlineInterval = setInterval(async () => {
                try {
                    await VoidMD.sendPresenceUpdate('available');
                } catch {}
            }, 10000);

        } else if (arg === 'off') {
            if (!onlineInterval) return m.reply('Autoonline already OFF 💀');
            clearInterval(onlineInterval);
            onlineInterval = null;
            await VoidMD.sendPresenceUpdate('unavailable');
            await m.reply('Autoonline disabled ❌\nBot now offline');

        } else {
            await m.reply(`*Autoonline:* ${onlineInterval? 'ON ✅' : 'OFF ❌'}\n\nUsage:\n.autoonline on - Stay online\n.autoonline off - Go offline`);
        }
    }
}
