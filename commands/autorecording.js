module.exports = {
    name: 'autorecording',
    alias: ['recording', 'record'],
    desc: 'Fake recording for 10 seconds in all groups',
    react: '🎙️',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD }) {
        try {
            const groups = await VoidMD.groupFetchAllParticipating();
            const ids = Object.keys(groups);
            
            if (ids.length === 0) return m.reply('Bot is not in any groups 💀');
            
            await m.reply(`Faking recording in ${ids.length} groups for 10sec... 🎙️`);
            
            // Start recording in all groups
            await Promise.all(ids.map(id => 
                VoidMD.sendPresenceUpdate('recording', id).catch(() => {})
            ));
            
            // Stop after 10sec
            setTimeout(async () => {
                await Promise.all(ids.map(id => 
                    VoidMD.sendPresenceUpdate('paused', id).catch(() => {})
                ));
                await m.reply('Done faking recording in all groups ✅');
            }, 10000);
            
        } catch (e) {
            await m.reply('Failed to fake recording 💀');
        }
    }
}
