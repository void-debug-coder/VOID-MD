module.exports = {
    name: 'play',
    alias: ['song', 'music', 'ytmp3'],
    desc: 'Download songs from YouTube',
    category: 'download',
    async execute({ reply, args }) {
        if (!args[0]) return reply('Send song name. Ex:.play faded')
        reply(`Searching *${args.join(' ')}*... 💀\nAdd your YouTube API here.`)
    }
}
