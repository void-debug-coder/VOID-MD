const { Sticker, StickerTypes } = require('wa-sticker-formatter');

module.exports = {
    name: 'sticker',
    alias: ['s', 'stiker'],
    desc: 'Convert image/video to sticker',
    react: '✨',
    category: 'convert',
    async execute(m, { VoidMD, isQuoted }) {
        const qmsg = isQuoted? m.quoted : m;
        const mime = qmsg.mimetype || '';

        if (!/image|video/.test(mime)) {
            return m.reply('Reply to image/video or send with caption.sticker 💀');
        }

        if (mime.includes('video') && qmsg.seconds > 10) {
            return m.reply('Video too long. Max 10s for stickers 💀');
        }

        await m.react('⏳');
        try {
            const buffer = await VoidMD.downloadMediaMessage(qmsg);

            const sticker = new Sticker(buffer, {
                pack: 'VOID-MD',
                author: '@' + m.sender.split('@')[0],
                type: StickerTypes.FULL,
                quality: 70
            });

            const stickerBuffer = await sticker.toBuffer();
            await VoidMD.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });
            await m.react('✅');

        } catch (e) {
            console.log('[STICKER ERROR]', e);
            await m.reply('Failed to create sticker 💀');
        }
    }
}
