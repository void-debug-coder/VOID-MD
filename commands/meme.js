const axios = require('axios');

module.exports = {
    name: 'meme',
    alias: ['memes'],
    desc: 'Random meme',
    react: '😂',
    category: 'fun',
    async execute(m, { VoidMD }) {
        await m.react('⏳');
        try {
            const { data } = await axios.get('https://api.akuari.my.id/random/meme');
            await VoidMD.sendMessage(m.chat, {
                image: { url: data.respon.url },
                caption: `😂 *${data.respon.title}*`
            }, { quoted: m });
            await m.react('✅');
        } catch (e) {
            await m.reply('Meme API failed 💀');
        }
    }
}
