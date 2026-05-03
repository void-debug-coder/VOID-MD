module.exports = {
    name: 'autopresence',
    alias: ['fake', 'presence'],
    desc: 'Fake typing/recording for 10sec in all groups',
    react: '🎭',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, text }) {
        try {
            const groups = await VoidMD.groupFetchAllParticipating();
            const ids = Object.keys(groups);
            const type = text.toLowerCase().trim();
            
            if (ids.length === 0) return m.reply('Bot is not in any groups 💀');
            
            let presence, label, emoji;
            
            if (type === 'typing' || type === 'type') {
                presence = 'composing';
                label = 'typing';
                emoji = '⌨️';
            } else if (type === 'recording' || type === 'record' || type === 'rec') {
                presence = 'recording';
                label = 'recording';
                emoji = '🎙️';
            } else {
                return m.reply('*Usage:*\n.autopresence typing - Fake typing 10s\n.autopresence recording - Fake recording 10s');
            }
            
            await m.reply(`Faking ${label} in ${ids.length} groups for 10sec... ${emoji}`);
            
            // Start in all groups
            await Promise.all(ids.map(id => 
                VoidMD.sendPresenceUpdate(presence, id).catch(() => {})
            ));
            
            // Stop after 10sec
            setTimeout(async () => {
                await Promise.all(ids.map(id => 
                    VoidMD.sendPresenceUpdate('paused', id).catch(() => {})
                ));
                await m.reply(`Done faking ${label} in all groups ✅`);
            }, 10000);
            
        } catch (e) {
            await m.reply('Failed to fake presence 💀');
        }
    }
}
