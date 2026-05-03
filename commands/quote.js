const axios = require('axios');

module.exports = {
    name: 'quote',
    alias: ['quotes'],
    desc: 'Random quote',
    react: '💭',
    category: 'fun',
    async execute(m, { VoidMD }) {
        try {
            const { data } = await axios.get('https://api.akuari.my.id/random/quote');
            await m.reply(`💭 *Quote*\n\n"${data.respon.quote}"\n\n*— ${data.respon.author}*`);
        } catch (e) {
            await m.reply('Quote API failed 💀');
        }
    }
}
