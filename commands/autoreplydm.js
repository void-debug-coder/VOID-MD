let dmReplyListener = null;
let replyMessage = 'Hey! This is VOID-MD bot. I will reply soon 💀';

module.exports = {
    name: 'autoreplydm',
    alias: ['ardm', 'dmreply'],
    desc: 'Auto reply to all DMs',
    react: '💬',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, text }) {
        const arg = text.toLowerCase().trim();

        if (arg === 'on') {
            if (dmReplyListener) return m.reply('AutoReply DM already ON 💬');

            await m.reply(`AutoReply DM enabled ✅\n\nReply: "${replyMessage}"`);

            dmReplyListener = async ({ messages }) => {
                for (let msg of messages) {
                    const chatId = msg.key.remoteJid;
                    const isGroup = chatId.endsWith('@g.us');
                    const isStatus = chatId === 'status@broadcast';

                    // Only DM, not from bot, not status
                    if (!msg.key.fromMe &&!isGroup &&!isStatus) {
                        try {
                            // Skip if already replied in last 5 min to avoid spam
                            const sender = msg.key.remoteJid;
                            if (global.dmReplyCooldown?.[sender] && Date.now() - global.dmReplyCooldown[sender] < 300000) continue;

                            if (!global.dmReplyCooldown) global.dmReplyCooldown = {};
                            global.dmReplyCooldown[sender] = Date.now();

                            await VoidMD.sendPresenceUpdate('composing', chatId);
                            await new Promise(r => setTimeout(r, 2000));
                            await VoidMD.sendMessage(chatId, { text: replyMessage }, { quoted: msg });
                            await VoidMD.sendPresenceUpdate('paused', chatId);

                        } catch (e) {
                            console.log('[AUTOREPLY DM ERROR]', e);
                        }
                    }
                }
            };

            VoidMD.ev.on('messages.upsert', dmReplyListener);

        } else if (arg === 'off') {
            if (!dmReplyListener) return m.reply('AutoReply DM already OFF 💀');
            VoidMD.ev.removeListener('messages.upsert', dmReplyListener);
            dmReplyListener = null;
            await m.reply('AutoReply DM disabled ❌');

        } else if (arg.startsWith('set ')) {
            replyMessage = text.slice(4).trim();
            await m.reply(`AutoReply message set to:\n"${replyMessage}" ✅`);

        } else {
            await m.reply(`*AutoReply DM:* ${dmReplyListener? 'ON ✅' : 'OFF ❌'}\n*Message:* "${replyMessage}"\n\nUsage:\n.autoreplydm on - Enable\n.autoreplydm off - Disable\n.autoreplydm set Hello there - Set custom reply`);
        }
    }
}
