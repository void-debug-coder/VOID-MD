module.exports = {
    name: 'calc',
    alias: ['calculate'],
    desc: 'Calculator',
    react: '🧮',
    category: 'tools',
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply('Math expression?\n\n.calc 5*5+10');
        try {
            // Basic safety - only allow math chars
            if (/[^0-9+\-*/().\s]/.test(text)) return m.reply('Invalid chars. Only numbers + - * / ( ) 💀');
            const result = eval(text);
            await m.reply(`🧮 *Calculator*\n\n${text} = ${result}`);
        } catch (e) {
            await m.reply('Invalid expression 💀');
        }
    }
}
