const axios = require('axios');

module.exports = {
    name: 'lyrics',
    alias: ['lyric'],
    desc: 'Get song lyrics',
    react: '🎶',
    category: 'search',
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply('Song name?\n\n.lyrics faded');
        await m.react('⏳');
        try {
            const { data } = await axios.get(`https://api.akuari.my.id/search/lyrics?query=${encodeURIComponent(text)}`);
            if (!data.respon) return m.reply('Lyrics not found 💀');
            const { title, artist, lyrics } = data.respon;
            await m.reply(`🎶 *${title}*\n*Artist:* ${artist}\n\n${lyrics.slice(0, 4000)}`);
            await m.react('✅');
        } catch (e) {
            await m.reply('Lyrics API failed 💀');
        }
    }
}
