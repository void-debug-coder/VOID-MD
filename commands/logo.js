const axios = require('axios');

module.exports = {
    name: 'logo',
    alias: ['textlogo'],
    desc: 'Create text logo',
    react: '🎨',
    category: 'convert',
    async execute(m, { VoidMD, text }) {
        const args = text.split('|');
        if (args.length < 2) {
            return m.reply('Usage:.logo Style|Text\n\nStyles: neon, thunder, matrix, joker, dragon\n\nExample:.logo neon|VOID-MD');
        }

        const style = args[0].trim().toLowerCase();
        const txt = args[1].trim();

        if (!txt) return m.reply('Add text after |\n\n.logo neon|VOID-MD');
        if (txt.length > 20) return m.reply('Text too long. Max 20 chars 💀');

        await m.react('⏳');
        try {
            // Free logo API
            const styles = {
                neon: 'https://api.akuari.my.id/ephoto/neon?text=',
                thunder: 'https://api.akuari.my.id/ephoto/thunder?text=',
                matrix: 'https://api.akuari.my.id/ephoto/matrix?text=',
                joker: 'https://api.akuari.my.id/ephoto/joker?text=',
                dragon: 'https://api.akuari.my.id/ephoto/dragon?text='
            };

            const apiUrl = styles[style];
            if (!apiUrl) return m.reply(`Invalid style 💀\n\nAvailable: ${Object.keys(styles).join(', ')}`);

            const { data } = await axios.get(apiUrl + encodeURIComponent(txt));
            if (!data.respon) return m.reply('Logo generation failed 💀');

            await VoidMD.sendMessage(m.chat, {
                image: { url: data.respon },
                caption: `🎨 *Logo Generated*\n\n*Style:* ${style}\n*Text:* ${txt}`
            }, { quoted: m });

            await m.react('✅');
        } catch (e) {
            console.log('[LOGO ERROR]', e);
            await m.reply('Logo API down 💀');
        }
    }
}
