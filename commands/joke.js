const axios = require('axios');

module.exports = {
    name: 'joke',
    alias: ['jokes'],
    desc: 'Random joke',
    react: '🤣',
    category: 'fun',
    async execute(m, { VoidMD }) {
        try {
            const { data } = await axios.get('https://api.akuari.my.id/random/joke');
            await m.reply(`🤣 *Joke*\n\n${data.respon}`);
        } catch (e) {
            await m.reply('Joke API failed 💀');
        }
    }
}
