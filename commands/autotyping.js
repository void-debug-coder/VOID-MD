module.exports = {
    name: 'autotyping',
    alias: ['typing', 'type'],
    desc: 'Fake typing for 10 seconds in all groups',
    react: '⌨️',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD }) {
        try {
            const groups = await VoidMD.groupFetchAllParticipating();
            const ids = Object.keys(groups);
            
            if (ids.length === 0) return m.reply('Bot is not in any groups 💀');
            
            await m.reply(`Faking typing in ${ids.length} groups for 10sec... ⌨️`);
            
            // Start typing in all groups
            await Promise.all(ids.map(id => 
                VoidMD.sendPresenceUpdate('composing', id).catch(() => {})
            ));
            
            // Stop after 10sec
            setTimeout(async () => {
                await Promise.all(ids.map(id => 
                    VoidMD.sendPresenceUpdate('paused', id).catch(() => {})
                ));
                await m.reply('Done faking typing in all groups ✅');
            }, 10000);
            
        } catch (e) {
            await m.reply('Failed to fake typing 💀');
        }
    }
}
