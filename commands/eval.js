module.exports = {
    name: 'eval',
    alias: ['>', 'ev'],
    desc: 'Execute JavaScript code',
    react: '💻',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply('Code? Example:.eval 2+2');
        try {
            let result = await eval(`(async () => { ${text} })()`);
            if (typeof result!== 'string') result = require('util').inspect(result);
            await m.reply(`*Result:*\n${result}`);
        } catch (e) {
            await m.reply(`*Error:*\n${e.message}`);
        }
    }
}
