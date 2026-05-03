const axios = require('axios');

module.exports = {
    name: 'npm',
    alias: ['package'],
    desc: 'Search NPM packages',
    react: '📦',
    category: 'search',
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply('Package name?\n\n.npm axios');
        await m.react('⏳');
        try {
            const { data } = await axios.get(`https://api.npms.io/v2/search?q=${encodeURIComponent(text)}&size=5`);
            if (!data.results?.length) return m.reply('No packages found 💀');
            let msg = `📦 *NPM: ${text}*\n\n`;
            data.results.forEach((v, i) => {
                const p = v.package;
                msg += `*${i + 1}. ${p.name}*\n${p.description || 'No desc'}\n*Version:* ${p.version}\nhttps://npmjs.com/${p.name}\n\n`;
            });
            await m.reply(msg);
            await m.react('✅');
        } catch (e) {
            await m.reply('NPM search failed 💀');
        }
    }
}
