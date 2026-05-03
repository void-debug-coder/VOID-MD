const axios = require('axios');

module.exports = {
    name: 'weather',
    alias: ['cuaca'],
    desc: 'Check weather',
    react: '⛅',
    category: 'search',
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply('Which city?\n\n.weather Kisii');
        await m.react('⏳');
        try {
            const { data } = await axios.get(`https://api.akuari.my.id/search/weather?query=${encodeURIComponent(text)}`);
            if (!data.respon) return m.reply('City not found 💀');
            const w = data.respon;
            await m.reply(`⛅ *Weather: ${w.location}*\n\n*Temp:* ${w.temp}°C\n*Condition:* ${w.weather}\n*Humidity:* ${w.humidity}\n*Wind:* ${w.wind}\n*Feels like:* ${w.feels_like}°C`);
            await m.react('✅');
        } catch (e) {
            await m.reply('Weather API failed 💀');
        }
    }
}
