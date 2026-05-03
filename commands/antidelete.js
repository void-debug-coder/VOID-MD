let antiDeleteListener = null;
let storeListener = null;
let messageStore = new Map(); // chatId -> array of last 200 msgs

module.exports = {
    name: 'antidelete',
    alias: ['antidel'],
    desc: 'Resend all deleted messages + media',
    react: '🗑️',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, text }) {
        const arg = text.toLowerCase().trim();

        if (arg === 'on') {
            if (antiDeleteListener) return m.reply('Antidelete already ON 🗑️');

            await m.reply('Antidelete EVERYTHING enabled ✅\nStores text, images, videos, stickers, docs');

            // Store all incoming messages
            storeListener = async ({ messages }) => {
                for (let msg of messages) {
                    if (!msg.key.fromMe && msg.message) {
                        const chatId = msg.key.remoteJid;
                        if (!messageStore.has(chatId)) messageStore.set(chatId, []);
                        let msgs = messageStore.get(chatId);
                        msgs.push(msg);
                        if (msgs.length > 200) msgs.shift(); // Keep last 200 per chat
                    }
                }
            };

            // Detect deletes + resend
            antiDeleteListener = async ({ messages }) => {
                for (let msg of messages) {
                    if (msg.message?.protocolMessage?.type === 0) { // REVOKE
                        const deletedKey = msg.message.protocolMessage.key;
                        const chatId = deletedKey.remoteJid;
                        const msgs = messageStore.get(chatId) || [];
                        const original = msgs.find(m => m.key.id === deletedKey.id);

                        if (original) {
                            const sender = original.key.participant || original.key.remoteJid;
                            const senderName = original.pushName || sender.split('@')[0];
                            const isGroup = chatId.endsWith('@g.us');

                            try {
                                // Check message type and resend
                                if (original.message.conversation || original.message.extendedTextMessage) {
                                    const text = original.message.conversation || original.message.extendedTextMessage.text;
                                    await VoidMD.sendMessage(chatId, {
                                        text: `🗑️ *Antidelete*\n\n*From:* @${sender.split('@')[0]}\n*Deleted Text:* ${text}`,
                                        mentions: [sender]
                                    });

                                } else if (original.message.imageMessage) {
                                    const caption = original.message.imageMessage.caption || '';
                                    await VoidMD.sendMessage(chatId, {
                                        image: await VoidMD.downloadMediaMessage(original),
                                        caption: `🗑️ *Antidelete*\n\n*From:* @${sender.split('@')[0]}\n*Deleted Image:* ${caption}`,
                                        mentions: [sender]
                                    });

                                } else if (original.message.videoMessage) {
                                    const caption = original.message.videoMessage.caption || '';
                                    await VoidMD.sendMessage(chatId, {
                                        video: await VoidMD.downloadMediaMessage(original),
                                        caption: `🗑️ *Antidelete*\n\n*From:* @${sender.split('@')[0]}\n*Deleted Video:* ${caption}`,
                                        mentions: [sender]
                                    });

                                } else if (original.message.stickerMessage) {
                                    await VoidMD.sendMessage(chatId, {
                                        sticker: await VoidMD.downloadMediaMessage(original)
                                    });
                                    await VoidMD.sendMessage(chatId, {
                                        text: `🗑️ *Antidelete*\n\n*From:* @${sender.split('@')[0]}\nDeleted a sticker`,
                                        mentions: [sender]
                                    });

                                } else if (original.message.documentMessage) {
                                    const fileName = original.message.documentMessage.fileName || 'Document';
                                    await VoidMD.sendMessage(chatId, {
                                        document: await VoidMD.downloadMediaMessage(original),
                                        fileName: fileName,
                                        mimetype: original.message.documentMessage.mimetype,
                                        caption: `🗑️ *Antidelete*\n\n*From:* @${sender.split('@')[0]}\n*Deleted File:* ${fileName}`,
                                        mentions: [sender]
                                    });

                                } else if (original.message.audioMessage) {
                                    await VoidMD.sendMessage(chatId, {
                                        audio: await VoidMD.downloadMediaMessage(original),
                                        mimetype: 'audio/mp4',
                                        ptt: original.message.audioMessage.ptt || false
                                    });
                                    await VoidMD.sendMessage(chatId, {
                                        text: `🗑️ *Antidelete*\n\n*From:* @${sender.split('@')[0]}\nDeleted an audio`,
                                        mentions: [sender]
                                    });

                                } else {
                                    await VoidMD.sendMessage(chatId, {
                                        text: `🗑️ *Antidelete*\n\n*From:* @${sender.split('@')[0]}\nDeleted an unsupported message type`,
                                        mentions: [sender]
                                    });
                                }
                            } catch (e) {
                                console.log('[ANTIDELETE ERROR]', e);
                                await VoidMD.sendMessage(chatId, {
                                    text: `🗑️ *Antidelete*\n\nFailed to recover deleted message from @${sender.split('@')[0]}`,
                                    mentions: [sender]
                                });
                            }
                        }
                    }
                }
            };

            VoidMD.ev.on('messages.upsert', storeListener);
            VoidMD.ev.on('messages.upsert', antiDeleteListener);

        } else if (arg === 'off') {
            if (!antiDeleteListener) return m.reply('Antidelete already OFF 💀');
            VoidMD.ev.removeListener('messages.upsert', antiDeleteListener);
            VoidMD.ev.removeListener('messages.upsert', storeListener);
            antiDeleteListener = null;
            storeListener = null;
            messageStore.clear();
            await m.reply('Antidelete disabled ❌\nCleared all stored messages');

        } else if (arg === 'clear') {
            messageStore.clear();
            await m.reply('Cleared all stored messages from RAM ✅');

        } else if (arg === 'count') {
            let total = 0;
            messageStore.forEach(msgs => total += msgs.length);
            await m.reply(`*Antidelete Stats*\n\nStatus: ${antiDeleteListener? 'ON ✅' : 'OFF ❌'}\nStored chats: ${messageStore.size}\nTotal messages: ${total}`);

        } else {
            await m.reply(`*Antidelete Everything:* ${antiDeleteListener? 'ON ✅' : 'OFF ❌'}\n\nUsage:\n.antidelete on - Enable\n.antidelete off - Disable\n.antidelete clear - Clear stored msgs\n.antidelete count - Show stats`);
        }
    }
                                }
