const axios = require('axios');

module.exports = {
    name: 'google',
    alias: ['search', 'g'],
    desc: 'Search Google',
    react: '🔍',
    category: 'search',
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply('What to search?\n\n.google cats');
        await m.react('⏳');
        try {
            const { data } = await axios.get(`https://api.akuari.my.id/search/google?query=${encodeURIComponent(text)}`);
            if (!data.respon?.length) return m.reply('No results 💀');
            let msg = `🔍 *Google: ${text}*\n\n`;
            data.respon.slice(0, 5).forEach((v, i) => {
                msg += `*${i + 1}. ${v.title}*\n${v.desc}\n${v.link}\n\n`;
            });
            await m.reply(msg);
            await m.react('✅');
        } catch (e) {
            await m.reply('Search failed 💀');
        }
    }
}
