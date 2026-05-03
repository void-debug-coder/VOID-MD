module.exports = {
    name: 'tagall',
    alias: ['everyone', 'all'],
    desc: 'Tag all group members',
    react: '📢',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, text, isGroup }) {
        if (!isGroup) return m.reply('Use in groups only 💀');

        const groupMeta = await VoidMD.groupMetadata(m.chat);
        const members = groupMeta.participants.map(p => p.id);
        const msg = text || 'Attention everyone 📢';

        await VoidMD.sendMessage(m.chat, {
            text: `${msg}\n\n${members.map(m => '@' + m.split('@')[0]).join(' ')}`,
            mentions: members
        });
    }
}
