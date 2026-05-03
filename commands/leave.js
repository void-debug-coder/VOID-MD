module.exports = {
    name: 'leave',
    desc: 'Leave current group',
    react: '👋',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, isGroup }) {
        if (!isGroup) return m.reply('Use this in a group 💀');
        await m.reply('Leaving... 👋');
        await VoidMD.groupLeave(m.chat);
    }
}
