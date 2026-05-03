module.exports = {
    name: 'mode',
    alias: ['public', 'private', 'botmode'],
    desc: 'Switch bot to public or private mode',
    react: '🔧',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { text, setBotMode, botMode, OWNER_NUMBER }) {
        const mode = text.toLowerCase();

        if (mode === 'public') {
            setBotMode('public');
            return m.reply('Bot mode set to *PUBLIC* 🌐\nEveryone can use commands now.');
        }

        if (mode === 'private') {
            setBotMode('private');
            return m.reply('Bot mode set to *PRIVATE* 🔒\nOnly you can use commands now.');
        }

        return m.reply(`*Current mode:* ${botMode.toUpperCase()} 💀\n*Owner:* ${OWNER_NUMBER}\n\nUsage:\n.mode public - Anyone can use bot\n.mode private - Only owner can use bot`);
    }
}
