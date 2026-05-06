const yts = require('yt-search')
const fetch = require('node-fetch')

module.exports = {
    name: 'play',
    alias: ['song', 'music', 'yta'],
    react: '🎵',
    desc: 'Search & download YouTube audio',
    category: 'download',
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply(`*What song?* ${global.themeemoji}\nExample: ${global.prefix}play gengetone maduka`)
        
        await m.reply(`Searching ${global.themeemoji}`)
        
        try {
            // 1. Search YouTube
            const search = await yts(text)
            const video = search.videos[0]
            if (!video) return m.reply('*Song not found* 💀')
            
            if (video.seconds > 600) return m.reply('*Too long* 💀\nMax 10 minutes only')
            
            // 2. Get download link from API
            const apiUrl = `https://api.davidcyriltech.my.id/youtube/mp3?url=${video.url}`
            const res = await fetch(apiUrl)
            const data = await res.json()
            
            if (!data.success) return m.reply('*Download failed* 💀\nTry another song')
            
            // 3. Send song info + audio
            let caption = `*${global.botname} Player* ${global.themeemoji}\n\n`
            caption += `*Title:* ${video.title}\n`
            caption += `*Duration:* ${video.timestamp}\n`
            caption += `*Views:* ${video.views.toLocaleString()}\n`
            caption += `*Uploaded:* ${video.ago}\n\n`
            caption += `_Sending audio..._`
            
            await VoidMD.sendMessage(m.chat, { 
                image: { url: video.thumbnail },
                caption: caption
            }, { quoted: m })
            
            await VoidMD.sendMessage(m.chat, { 
                audio: { url: data.result.download_url },
                mimetype: 'audio/mpeg',
                fileName: `${video.title}.mp3`
            }, { quoted: m })
            
        } catch (err) {
            console.log(err)
            m.reply('*Error occurred* 💀\nAPI might be down. Try again later')
        }
    }
              }
