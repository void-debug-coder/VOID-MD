module.exports = {
    name: 'meme',
    alias: ['memes'],
    react: '🤣',
    category: 'fun',
    desc: 'Send random meme',
    async execute(m, { VoidMD }) {
        await VoidMD.sendMessage(m.key.remoteJid, {
            text: 'Here\'s a meme 😂\n\nhttps://i.imgflip.com/1bij.jpg'
        }, { quoted: m });
    }
}
