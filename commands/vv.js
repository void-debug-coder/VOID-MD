module.exports = {
    name: 'vv',
    alias: ['viewonce', 'reveal'],
    desc: 'Reveal view-once media',
    react: '👁️',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, isQuoted }) {
        if (!isQuoted) return m.reply('Reply to a view-once image/video 💀');

        const qmsg = m.quoted;
        const isViewOnce = qmsg.message?.imageMessage?.viewOnce ||
                          qmsg.message?.videoMessage?.viewOnce ||
                          qmsg.message?.viewOnceMessageV2 ||
                          qmsg.message?.viewOnceMessageV2Extension;

        if (!isViewOnce) return m.reply('That is not a view-once message 💀');

        try {
            // Extract actual media from view-once wrapper
            let mediaMsg = qmsg.message.imageMessage || qmsg.message.videoMessage;

            // Handle newer view-once format
            if (qmsg.message.viewOnceMessageV2) {
                mediaMsg = qmsg.message.viewOnceMessageV2.message.imageMessage ||
                          qmsg.message.viewOnceMessageV2.message.videoMessage;
            }
            if (qmsg.message.viewOnceMessageV2Extension) {
                mediaMsg = qmsg.message.viewOnceMessageV2Extension.message.imageMessage ||
                          qmsg.message.viewOnceMessageV2Extension.message.videoMessage;
            }

            if (!mediaMsg) return m.reply('Unsupported view-once type 💀');

            const buffer = await VoidMD.downloadMediaMessage(qmsg);
            const caption = mediaMsg.caption || '';
            const sender = qmsg.key.participant || qmsg.key.remoteJid;

            if (mediaMsg.mimetype?.includes('image')) {
                await VoidMD.sendMessage(m.chat, {
                    image: buffer,
                    caption: `👁️ *VV Reveal*\n\n*From:* @${sender.split('@')[0]}\n*Caption:* ${caption}`,
                    mentions: [sender]
                }, { quoted: m });

            } else if (mediaMsg.mimetype?.includes('video')) {
                await VoidMD.sendMessage(m.chat, {
                    video: buffer,
                    caption: `👁️ *VV Reveal*\n\n*From:* @${sender.split('@')[0]}\n*Caption:* ${caption}`,
                    mentions: [sender]
                }, { quoted: m });
            }

            await m.react('✅');

        } catch (e) {
            console.log('[VV ERROR]', e);
            await m.reply('Failed to reveal view-once 💀\nMedia may have expired');
        }
    }
}
