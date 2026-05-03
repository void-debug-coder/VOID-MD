const play = require('play-dl');
module.exports = {
    name: 'play',
    alias: ['song', 'music'],
    desc: 'Download audio - Free tier safe',
    react: '🎵',
    category: 'download',
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply('Song name? Example:.play Arcade Dreams');

        try {
            await m.reply('Searching YouTube... 🎵');
            let yt = await play.search(text, { limit: 1 });
            if (!yt[0]) return m.reply('Song not found 💀');

            if (yt[0].durationInSec > 480) {
                return m.reply('Song too long >8min. Free tier limit 💀');
            }

            await m.reply(`*FOUND* 💀\n*Title:* ${yt[0].title}\n_Downloading..._`);

            let stream = await play.stream(yt[0].url, { quality: 2 });

            await VoidMD.sendMessage(m.chat, {
                audio: stream.stream,
                mimetype: 'audio/mpeg',
                fileName: `${yt[0].title.slice(0, 30)}.mp3`
            }, { quoted: m });

        } catch (e) {
            console.log('[PLAY ERROR]', e.message);
            m.reply('Download failed. Try shorter song or check logs 💀');
        }
    }
}
