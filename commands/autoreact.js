let reactListener = null;
const emojis = ['❤️', '😂', '🔥', '👍', '💀', '✨', '🤝', '💯']; // Random picks

module.exports = {
    name: 'autoreact',
    alias: ['arreact'],
    desc: 'Auto react to all messages',
    react: '💫',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, text }) {
        const arg = text.toLowerCase().trim();
        
        if (arg === 'on') {
            if (reactListener) return m.reply('Autoreact already ON 💫');
            
            await m.reply('Autoreact enabled ✅\nBot will react to all messages');
            
            reactListener = async ({ messages }) => {
                for (let msg of messages) {
                    if (!msg.key.fromMe && msg.key.remoteJid !== 'status@broadcast') {
                        try {
                            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                            await VoidMD.sendMessage(msg.key.remoteJid, {
                                react: { text: emoji, key: msg.key }
                            });
                            await new Promise(r => setTimeout(r, 2000)); // 2s delay per react
                        } catch {}
                    }
                }
            };
            
            VoidMD.ev.on('messages.upsert', reactListener);
            
        } else if (arg === 'off') {
            if (!reactListener) return m.reply('Autoreact already OFF 💀');
            VoidMD.ev.removeListener('messages.upsert', reactListener);
            reactListener = null;
            await m.reply('Autoreact disabled ❌');
            
        } else if (arg.startsWith('emoji ')) {
            const customEmoji = arg.split(' ')[1];
            if (!customEmoji) return m.reply('Provide emoji: .autoreact emoji 👍');
            emojis.length = 0;
            emojis.push(customEmoji);
            await m.reply(`Autoreact emoji set to ${customEmoji}`);
            
        } else {
            await m.reply(`*Autoreact:* ${reactListener? 'ON ✅' : 'OFF ❌'}\n*Emoji:* ${emojis[0]}\n\nUsage:\n.autoreact on - Enable\n.autoreact off - Disable\n.autoreact emoji ❤️ - Set custom emoji`);
        }
    }
}
