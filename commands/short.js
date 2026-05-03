const axios = require('axios');

module.exports = {
    name: 'short',
    alias: ['shorturl'],
    desc: 'Shorten URL',
    react: '🔗',
    category: 'tools',
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply('URL?\n\n.short https://verylongurl.com/xxx');
        if (!text.startsWith('http')) return m.reply('Add https:// 💀');
        await m.react('⏳');
        try {
            const { data } = await axios.get(`https://api.akuari.my.id/tools/shortlink?link=${encodeURIComponent(text)}`);
            if (!data.respon) return m.reply('Shorten failed 💀');
            await m.reply(`🔗 *Short URL*\n\n*Original:* ${text}\n*Short:* ${data.respon}`);
            await m.react('✅');
        } catch (e) {
            await m.reply('Shortener API failed 💀');
        }
    }
}
