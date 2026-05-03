const axios = require('axios');

module.exports = {
    name: 'ai',
    alias: ['gpt', 'ask'],
    desc: 'Ask AI anything',
    react: '🤖',
    category: 'tools',
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply('Ask me something\n\n.ai What is quantum physics?');

        await VoidMD.sendPresenceUpdate('composing', m.chat);
        try {
            // Free API - no key needed
            const api = `https://api.akuari.my.id/ai/gpt?chat=${encodeURIComponent(text)}`;
            const { data } = await axios.get(api);

            if (!data.respon) return m.reply('AI is sleeping 💀');

            await m.reply(`🤖 *AI*\n\n${data.respon}`);
            await VoidMD.sendPresenceUpdate('paused', m.chat);

        } catch (e) {
            console.log('[AI ERROR]', e);
            await m.reply('AI failed to respond 💀');
            await VoidMD.sendPresenceUpdate('paused', m.chat);
        }
    }
}
