module.exports = {
    name: 'broadcast',
    alias: ['bc', 'all'],
    desc: 'Send message to all groups',
    react: '📢',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply('Message? Example:.bc Bot update live');
        const groups = await VoidMD.groupFetchAllParticipating();
        const ids = Object.keys(groups);
        await m.reply(`Broadcasting to ${ids.length} groups...`);
        let sent = 0;
        for (let id of ids) {
            try {
                await VoidMD.sendMessage(id, { text: `*VOID-MD ANNOUNCEMENT* 💀\n\n${text}` });
                sent++;
                await new Promise(r => setTimeout(r, 2000)); // 2s delay to avoid ban
            } catch {}
        }
        await m.reply(`Broadcast done ✅\nSent: ${sent}/${ids.length}`);
    }
}
