module.exports = {
    name: 'qr',
    alias: ['qrcode'],
    desc: 'Generate QR code',
    react: '📱',
    category: 'tools',
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply('Text for QR?\n\n.qr Hello World');
        await m.react('⏳');
        try {
            await VoidMD.sendMessage(m.chat, {
                image: { url: `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(text)}` },
                caption: `📱 *QR Code*\n${text}`
            }, { quoted: m });
            await m.react('✅');
        } catch (e) {
            await m.reply('QR generation failed 💀');
        }
    }
}
