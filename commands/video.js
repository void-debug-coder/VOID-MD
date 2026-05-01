module.exports = {
    name: 'video',
    alias: ['ytmp4', 'ytvideo'],
    desc: 'Download videos from YouTube',
    category: 'download',
    async execute({ reply, args }) {
        if (!args[0]) return reply('Send video name. Ex:.video faded')
        reply(`Downloading video... 💀\nAdd your YouTube API here.`)
    }
}
