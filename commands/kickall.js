module.exports = {
    name: 'kickall',
    alias: ['nuke'],
    desc: 'Remove all non-admin members',
    react: '☢️',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, isGroup, isBotAdmin }) {
        if (!isGroup) return m.reply('Groups only 💀');
        if (!isBotAdmin) return m.reply('Bot needs admin 💀');

        const groupMeta = await VoidMD.groupMetadata(m.chat);
        const botId = VoidMD.user.id;
        
        // Get non-admins, exclude bot and owner
        const toKick = groupMeta.participants
            .filter(p => !p.admin && p.id !== botId && p.id !== m.sender)
            .map(p => p.id);

        if (toKick.length === 0) return m.reply('No members to kick 💀');

        await m.reply(`☢️ *NUKE INITIATED*\n\nRemoving ${toKick.length} members...`);

        // Kick in batches of 5 to avoid rate limit
        for (let i = 0; i < toKick.length; i += 5) {
            const batch = toKick.slice(i, i + 5);
            try {
                await VoidMD.groupParticipantsUpdate(m.chat, batch, 'remove');
                await new Promise(r => setTimeout(r, 2000)); // 2s delay between batches
            } catch (e) {
                console.log('[KICKALL ERROR]', e);
            }
        }

        await m.reply(`☢️ *NUKE COMPLETE*\n\nRemoved ${toKick.length} members`);
    }
}
