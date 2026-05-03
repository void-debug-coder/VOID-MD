const axios = require('axios');

module.exports = {
    name: 'truth',
    alias: [],
    desc: 'Truth question',
    react: '❓',
    category: 'fun',
    async execute(m, { VoidMD }) {
        try {
            const { data } = await axios.get('https://api.akuari.my.id/game/truth');
            await m.reply(`❓ *Truth*\n\n${data.respon}`);
        } catch (e) {
            await m.reply('Truth API failed 💀');
        }
    }
}
