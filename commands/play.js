const axios = require('axios');
const yts = require('yt-search');

module.exports = {
    name: 'play',
    alias: ['song', 'music', 'mp3'],
    desc: 'Search and download song from YouTube',
    react: '🎵',
    category: 'download',
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply('What song?\n\n.play Faded Alan Walker');

        const query = text.trim();
        await m.react('🔍');

        try {
            // Step 1: Search - 2s timeout for Render
            const search = await yts({ query, pages: 1 });
            const video = search.videos[0];

            if (!video) return m.reply('No songs found 💀');

            // Reject long videos on Render free
            const durationSec = video.seconds;
            if (durationSec > 600) { // 10 min max
                return m.reply(`Song too long: ${video.timestamp}\nMax 10min on free tier 💀`);
            }

            const { title, timestamp, views, ago, url, thumbnail, author } = video;

            await m.reply(`🎵 *Found Song*\n\n*Title:* ${title}\n*Duration:* ${timestamp}\n*Views:* ${views.toLocaleString()}\n*Channel:* ${author.name}\n*Uploaded:* ${ago}\n\n⏳ Downloading...`);

            await m.react('⏳');

            // Step 2: Use lightweight API with timeout
            const api = `https://api.akuari.my.id/downloader/youtube?link=${url}`;
            const { data } = await axios.get(api, { timeout: 20000 }); // 20s timeout

            if (!data.respon ||!data.respon.audio) {
                return m.reply('Download failed. API down or song restricted 💀');
            }

            const audioUrl = data.respon.audio;

            // Step 3: Stream directly - don't download to buffer on Render
            await VoidMD.sendMessage(m.chat, {
                audio: { url: audioUrl }, // Stream from URL, saves RAM
                mimetype: 'audio/mpeg',
                fileName: `${title.slice(0, 30)}.mp3`, // Limit filename length
                contextInfo: {
                    externalAdReply: {
                        title: title.slice(0, 40),
                        body: `VOID-MD | ${timestamp}`,
                        thumbnailUrl: thumbnail,
                        sourceUrl: url,
                        mediaType: 1,
                        renderLargerThumbnail: false // Saves bandwidth
                    }
                }
            }, { quoted: m });

            await m.react('✅');

        } catch (e) {
            console.log('[PLAY ERROR]', e.message);
            if (e.code === 'ECONNABORTED') {
                await m.reply('Timeout 💀 Song too big for free tier. Try shorter songs');
            } else {
                await m.reply('Failed to download 💀 Try again or use different keywords');
            }
            await m.react('❌');
        }
    }
}
