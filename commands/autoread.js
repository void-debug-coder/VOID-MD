let readListener = null;

module.exports = {
    name: 'autoread',
    alias: ['ar', 'readall'],
    desc: 'Auto mark all messages as read',
    react: '📖',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, text }) {
        const arg = text.toLowerCase().trim();
        
        if (arg === 'on') {
            if (readListener) return m.reply('Autoread already ON 📖');
            
            await m.reply('Autoread enabled ✅\nBot will mark all messages as read');
            
            readListener = async ({ messages }) => {
                for (let msg of messages) {
                    if (!msg.key.fromMe && msg.key.remoteJid !== 'status@broadcast') {
                        try {
                            await VoidMD.readMessages([msg.key]);
                            await new Promise(r => setTimeout(r, 800)); // 800ms delay
                        } catch {}
                    }
                }
            };
            
            VoidMD.ev.on('messages.upsert', readListener);
            
        } else if (arg === 'off') {
            if (!readListener) return m.reply('Autoread already OFF 💀');
            VoidMD.ev.removeListener('messages.upsert', readListener);
            readListener = null;
            await m.reply('Autoread disabled ❌');
            
        } else {
            await m.reply(`*Autoread:* ${readListener? 'ON ✅' : 'OFF ❌'}\n\nUsage:\n.autoread on - Enable\n.autoread off - Disable`);
        }
    }
}
