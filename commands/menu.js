module.exports = {
    name: 'menu',
    alias: ['help'],
    desc: 'Show all commands',
    react: '📜',
    category: 'main',
    async execute(m) {
        const fs = require('fs');
        const path = require('path');
        let txt = `*VOID-MD MENU* 💀\n\n`;
        const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.js'));
        txt += files.map((f, i) => `${i+1}..${f.replace('.js','')}`).join('\n');
        txt += `\n\n_Total: ${files.length} commands_`;
        await m.reply(txt);
    }
}
