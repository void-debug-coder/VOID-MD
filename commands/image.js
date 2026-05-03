const axios = require('axios');

module.exports = {
    name: 'image',
    alias: ['img', 'pinterest'],
    desc: 'Search images',
    react: '🖼️',
    category: 'search',
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply('What image?\n\n.image car');
        await m.react('⏳');
        try {
            const { data } = await axios.get(`https://api.akuari.my.id/search/pinterest?query=${encodeURIComponent(text)}`);
            if (!data.respon?.length) return m.reply('No images found 💀');
            const img = data.respon[Math.floor(Math.random() * data.respon.length)];
            await VoidMD.sendMessage(m.chat, {
                image: { url: img },
                caption: `🖼️ *Result:* ${text}`
            }, { quoted: m });
            await m.react('✅');
        } catch (e) {
            await m.reply('Image search failed 💀');
        }
    }
}
