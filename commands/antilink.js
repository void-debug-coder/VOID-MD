let antiLinkListener = null;

module.exports = {
    name: 'antilink',
    alias: ['nolink', 'antilinks'],
    desc: 'Kick anyone who sends ANY link',
    react: '🔗',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, text, isGroup, isBotAdmin }) {
        const arg = text.toLowerCase().trim();

        if (arg === 'on') {
            if (!isGroup) return m.reply('Use in groups only 💀');
            if (!isBotAdmin) return m.reply('Bot needs admin to kick 💀');
            if (antiLinkListener) return m.reply('Antilink already ON 🔗');

            await m.reply('Antilink EVERYTHING enabled ✅\nAll links = instant kick');

            antiLinkListener = async ({ messages }) => {
                for (let msg of messages) {
                    if (msg.key.fromMe) continue;
                    const chatId = msg.key.remoteJid;
                    if (!chatId.endsWith('@g.us')) continue;

                    const messageText = msg.message?.conversation ||
                                      msg.message?.extendedTextMessage?.text ||
                                      msg.message?.imageMessage?.caption ||
                                      msg.message?.videoMessage?.caption || '';

                    // Catch EVERY possible link format
                    const linkRegex = /(https?:\/\/|www\.|t\.me\/|wa\.me\/|chat\.whatsapp\.com\/|discord\.gg\/|discord\.com\/invite\/|bit\.ly\/|tinyurl\.com\/|t\.co\/|goo\.gl\/|fb\.me\/|instagram\.com\/|youtube\.com\/|youtu\.be\/|tiktok\.com\/|\.com|\.net|\.org|\.io|\.gg|\.xyz|\.me|\.ly|\.co\.|\.app|\.link|\.site|\.online|\.store|\.tech)/i;
                    
                    if (linkRegex.test(messageText)) {
                        const sender = msg.key.participant || msg.key.remoteJid;
                        const groupMeta = await VoidMD.groupMetadata(chatId);
                        const participant = groupMeta.participants.find(p => p.id === sender);

                        // Don't kick admins or bot itself
                        if (participant?.admin || sender === VoidMD.user.id) continue;

                        try {
                            // Delete the link message first
                            await VoidMD.sendMessage(chatId, { delete: msg.key });

                            // Send kick notice
                            await VoidMD.sendMessage(chatId, {
                                text: `🔗 *Antilink*\n\n@${sender.split('@')[0]} sent a link and was removed\n\n*Zero tolerance*`,
                                mentions: [sender]
                            });

                            // Kick
                            await VoidMD.groupParticipantsUpdate(chatId, [sender], 'remove');
                        } catch (e) {
                            console.log('[ANTILINK ERROR]', e);
                        }
                    }
                }
            };

            VoidMD.ev.on('messages.upsert', antiLinkListener);

        } else if (arg === 'off') {
            if (!antiLinkListener) return m.reply('Antilink already OFF 💀');
            VoidMD.ev.removeListener('messages.upsert', antiLinkListener);
            antiLinkListener = null;
            await m.reply('Antilink disabled ❌');

        } else {
            await m.reply(`*Antilink Everything:* ${antiLinkListener? 'ON ✅' : 'OFF ❌'}\n\nDetects: http, https, www, .com, .net, .org, wa.me, t.me, discord.gg, bit.ly, and 20+ more\n\nUsage:\n.antilink on - Enable\n.antilink off - Disable`);
        }
    }
}
