const axios = require('axios');

const styles = {
    'neon': 'https://api.akuari.my.id/ephoto/neon?text=',
    'neonlight': 'https://api.akuari.my.id/ephoto/neonlight?text=',
    'thunder': 'https://api.akuari.my.id/ephoto/thunder?text=',
    'matrix': 'https://api.akuari.my.id/ephoto/matrix?text=',
    'fire': 'https://api.akuari.my.id/ephoto/fire?text=',
    'joker': 'https://api.akuari.my.id/ephoto/joker?text=',
    'dragon': 'https://api.akuari.my.id/ephoto/dragon?text=',
    'wolf': 'https://api.akuari.my.id/ephoto/wolf?text=',
    'galaxy': 'https://api.akuari.my.id/ephoto/galaxy?text=',
    'gold': 'https://api.akuari.my.id/ephoto/gold?text=',
    'silver': 'https://api.akuari.my.id/ephoto/silver?text=',
    'metal': 'https://api.akuari.my.id/ephoto/metal?text=',
    'blackpink': 'https://api.akuari.my.id/ephoto/blackpink?text=',
    'blood': 'https://api.akuari.my.id/ephoto/blood?text=',
    'broken': 'https://api.akuari.my.id/ephoto/broken?text=',
    'carbon': 'https://api.akuari.my.id/ephoto/carbon?text=',
    'cloud': 'https://api.akuari.my.id/ephoto/cloud?text=',
    'devil': 'https://api.akuari.my.id/ephoto/devil?text=',
    'glitch': 'https://api.akuari.my.id/ephoto/glitch?text=',
    'gradient': 'https://api.akuari.my.id/ephoto/gradient?text=',
    'graffiti': 'https://api.akuari.my.id/ephoto/graffiti?text=',
    'ice': 'https://api.akuari.my.id/ephoto/ice?text=',
    'lava': 'https://api.akuari.my.id/ephoto/lava?text=',
    'magma': 'https://api.akuari.my.id/ephoto/magma?text=',
    'neon2': 'https://api.akuari.my.id/ephoto/neon2?text=',
    'neondevil': 'https://api.akuari.my.id/ephoto/neondevil?text=',
    'rainbow': 'https://api.akuari.my.id/ephoto/rainbow?text=',
    'sand': 'https://api.akuari.my.id/ephoto/sand?text=',
    'space': 'https://api.akuari.my.id/ephoto/space?text=',
    'steel': 'https://api.akuari.my.id/ephoto/steel?text=',
    'stone': 'https://api.akuari.my.id/ephoto/stone?text=',
    'toxic': 'https://api.akuari.my.id/ephoto/toxic?text=',
    'water': 'https://api.akuari.my.id/ephoto/water?text='
};

module.exports = {
    name: 'name',
    alias: ['textfx', 'decorate'],
    desc: 'Decorate name with text effects',
    react: '🎨',
    category: 'convert',
    async execute(m, { VoidMD, text }) {
        if (!text) {
            const styleList = Object.keys(styles).join(', ');
            return m.reply(`Usage:.name style|text\n\nExample:.name neon|VOID\n\n*Styles:* ${styleList}`);
        }

        const args = text.split('|');
        if (args.length < 2) {
            return m.reply('Format:.name style|text\n\n.name fire|DANIEL');
        }

        const style = args[0].trim().toLowerCase();
        const name = args[1].trim();

        if (!styles[style]) {
            const styleList = Object.keys(styles).slice(0, 15).join(', ');
            return m.reply(`Invalid style 💀\n\n*Available:* ${styleList}...`);
        }

        if (!name) return m.reply('Add name after |\n\n.name neon|VOID');
        if (name.length > 20) return m.reply('Name too long. Max 20 chars 💀');

        await m.react('⏳');
        try {
            const api = styles[style] + encodeURIComponent(name);
            const { data } = await axios.get(api);

            if (!data.respon) return m.reply('Generation failed 💀');

            await VoidMD.sendMessage(m.chat, {
                image: { url: data.respon },
                caption: `🎨 *Name Decorated*\n\n*Style:* ${style}\n*Text:* ${name}`
            }, { quoted: m });

            await m.react('✅');
        } catch (e) {
            console.log('[NAME ERROR]', e);
            await m.reply('API failed. Try different style 💀');
        }
    }
  }
