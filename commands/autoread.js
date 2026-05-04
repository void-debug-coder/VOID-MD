let readListener = null;

module.exports = {
    name: 'autoread',
    alias: ['ar', 'readall'],
    react: '📖',
    category: 'owner',
    desc: 'Auto mark all messages as read',
    async execute(m, { VoidMD, args, owner, sender }) {
        // LID SAFE OWNER CHECK
        const senderNum = sender.replace(/[^0-9]/g, '');
        if (senderNum!== owner) {
            return await VoidMD.sendMessage(m.key.remoteJid, { 
                text: 'Only owner can use this' 
            }, { quoted: m });
        }

        const arg = args[0]?.toLowerCase();
        
        if (arg === 'on') {
            if (readListener) {
                return await VoidMD.sendMessage(m.key.remoteJid, { 
                    text: 'Autoread already ON 📖' 
                }, { quoted: m });
            }
            
            await VoidMD.sendMessage(m.key.remoteJid, { 
                text: 'Autoread enabled ✅\nBot will mark all messages as read' 
            }, { quoted: m });
            
            readListener = async ({ messages }) => {
                for (let msg of messages) {
                    if (!msg.key.fromMe && msg.key.remoteJid!== 'status@broadcast') {
                        try {
                            await VoidMD.readMessages([msg.key]);
                            await new Promise(r => setTimeout(r, 800));
                        } catch (e) {
                            console.log('[AUTOREAD ERROR]', e.message);
                        }
                    }
                }
            };
            
            VoidMD.ev.on('messages.upsert', readListener);
            global.autoread = true;
            
        } else if (arg === 'off') {
            if (!readListener) {
                return await VoidMD.sendMessage(m.key.remoteJid, { 
                    text: 'Autoread already OFF 💀' 
                }, { quoted: m });
            }
            VoidMD.ev.off('messages.upsert', readListener);
            readListener = null;
            global.autoread = false;
            await VoidMD.sendMessage(m.key.remoteJid, { 
                text: 'Autoread disabled ❌' 
            }, { quoted: m });
            
        } else {
            await VoidMD.sendMessage(m.key.remoteJid, { 
                text: `*Autoread:* ${readListener? 'ON ✅' : 'OFF ❌'}\n\nUsage:\n.autoread on - Enable\n.autoread off - Disable` 
            }, { quoted: m });
        }
    }
}
