let statusViewListener = null;

module.exports = {
    name: 'autoviewstatus',
    alias: ['autoview', 'viewstatus', 'autoseen'],
    desc: 'Auto view all WhatsApp statuses',
    react: '👀',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, text }) {
        const arg = text.toLowerCase().trim();
        
        if (arg === 'on') {
            if (statusViewListener) return m.reply('Autoview status already ON 👀');
            
            await m.reply('Autoview status enabled ✅\nBot will view all new statuses');
            
            statusViewListener = async ({ messages }) => {
                for (let msg of messages) {
                    if (msg.key.remoteJid === 'status@broadcast' && !msg.key.fromMe) {
                        try {
                            await VoidMD.readMessages([msg.key]);
                            await new Promise(r => setTimeout(r, 1000)); // 1s delay per view
                        } catch {}
                    }
                }
            };
            
            VoidMD.ev.on('messages.upsert', statusViewListener);
            
        } else if (arg === 'off') {
            if (!statusViewListener) return m.reply('Autoview status already OFF 💀');
            VoidMD.ev.removeListener('messages.upsert', statusViewListener);
            statusViewListener = null;
            await m.reply('Autoview status disabled ❌');
            
        } else {
            await m.reply(`*Autoview Status:* ${statusViewListener? 'ON ✅' : 'OFF ❌'}\n\nUsage:\n.autoviewstatus on - Enable\n.autoviewstatus off - Disable`);
        }
    }
}
