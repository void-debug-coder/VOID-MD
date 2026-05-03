let statusLikeListener = null;

module.exports = {
    name: 'autolikestatus',
    alias: ['autolike', 'likestatus'],
    desc: 'Auto like all WhatsApp statuses',
    react: '❤️',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, text }) {
        const arg = text.toLowerCase().trim();
        
        if (arg === 'on') {
            if (statusLikeListener) return m.reply('Autolike status already ON ❤️');
            
            await m.reply('Autolike status enabled ✅\nBot will heart all new statuses');
            
            statusLikeListener = async ({ messages }) => {
                for (let msg of messages) {
                    if (msg.key.remoteJid === 'status@broadcast' && !msg.key.fromMe) {
                        try {
                            await VoidMD.sendMessage(msg.key.remoteJid, {
                                react: { text: '❤️', key: msg.key }
                            });
                            await new Promise(r => setTimeout(r, 1500)); // 1.5s delay per like
                        } catch {}
                    }
                }
            };
            
            VoidMD.ev.on('messages.upsert', statusLikeListener);
            
        } else if (arg === 'off') {
            if (!statusLikeListener) return m.reply('Autolike status already OFF 💀');
            VoidMD.ev.removeListener('messages.upsert', statusLikeListener);
            statusLikeListener = null;
            await m.reply('Autolike status disabled ❌');
            
        } else {
            await m.reply(`*Autolike Status:* ${statusLikeListener? 'ON ✅' : 'OFF ❌'}\n\nUsage:\n.autolikestatus on - Enable\n.autolikestatus off - Disable`);
        }
    }
}
