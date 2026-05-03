module.exports = {
    name: 'promoteall',
    alias: ['opall'],
    desc: 'Make all members admin',
    react: '👑',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, isGroup, isBotAdmin }) {
        if (!isGroup) return m.reply('Groups only 💀');
        if (!isBotAdmin) return m.reply('Bot needs admin 💀');

        const groupMeta = await VoidMD.groupMetadata(m.chat);
        const toPromote = groupMeta.participants
            .filter(p => !p.admin)
            .map(p => p.id);

        if (toPromote.length === 0) return m.reply('Everyone already admin 💀');

        await m.reply(`👑 Promoting ${toPromote.length} members...`);

        for (let i = 0; i < toPromote.length; i += 5) {
            const batch = toPromote.slice(i, i + 5);
            try {
                await VoidMD.groupParticipantsUpdate(m.chat, batch, 'promote');
                await new Promise(r => setTimeout(r, 2000));
            } catch {}
        }

        await m.reply(`👑 All ${toPromote.length} members promoted`);
    }
}
