const axios = require('axios');

module.exports = {
    name: 'github',
    alias: ['gh', 'repo'],
    desc: 'Search GitHub repos',
    react: '💻',
    category: 'search',
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply('Repo name?\n\n.github baileys');
        await m.react('⏳');
        try {
            const { data } = await axios.get(`https://api.github.com/search/repositories?q=${encodeURIComponent(text)}&per_page=5`);
            if (!data.items?.length) return m.reply('No repos found 💀');
            let msg = `💻 *GitHub: ${text}*\n\n`;
            data.items.forEach((v, i) => {
                msg += `*${i + 1}. ${v.full_name}*\n⭐ ${v.stargazers_count} | 🍴 ${v.forks_count}\n${v.description || 'No desc'}\n${v.html_url}\n\n`;
            });
            await m.reply(msg);
            await m.react('✅');
        } catch (e) {
            await m.reply('GitHub search failed 💀');
        }
    }
}
