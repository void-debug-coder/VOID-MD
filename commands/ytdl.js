const axios = require('axios');

module.exports = {
    name: 'ytdl',
    alias: ['yt', 'ytmp3', 'ytmp4'],
    desc: 'Download YouTube audio/video',
    react: '📥',
    category: 'download',
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply('Send YouTube link\n\n.yt https://youtu.be/xxx\n.ytmp3 https://youtu.be/xxx\n.ytmp4 https://youtu.be/xxx');

        const url = text.trim();
        if (!url.includes('youtube.com') &&!url.includes('youtu.be')) {
            return m.reply('Invalid YouTube link 💀');
        }

        await m.react('⏳');
        try {
            // Using free API - replace with your own if it dies
            const isAudio = m.body.startsWith('.ytmp3') || m.body.startsWith('.yta');
            const api = `https://api.akuari.my.id/downloader/youtube?link=${url}`;

            const { data } = await axios.get(api);
            if (!data.respon) return m.reply('Download failed 💀');

            const title = data.respon.title;
            const dl = isAudio? data.respon.audio : data.respon.video;

            if (!dl) return m.reply('Media not found 💀');

            await m.reply(`📥 *Downloading*\n\n*Title:* ${title}\n*Type:* ${isAudio? 'Audio' : 'Video'}`);

            if (isAudio) {
                await VoidMD.sendMessage(m.chat, {
                    audio: { url: dl },
                    mimetype: 'audio/mpeg',
                    fileName: `${title}.mp3`
                }, { quoted: m });
            } else {
                await VoidMD.sendMessage(m.chat, {
                    video: { url: dl },
                    caption: `📥 *${title}*`,
                    fileName: `${title}.mp4`
                }, { quoted: m });
            }

            await m.react('✅');
        } catch (e) {
            console.log('[YTDL ERROR]', e);
            await m.reply('Download failed. Link may be private/age-restricted 💀');
        }
    }
}
