module.exports = {
    name: 'backup',
    alias: ['export'],
    desc: 'Export group member list',
    react: '💾',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, isGroup }) {
        if (!isGroup) return m.reply('Groups only 💀');

        const groupMeta = await VoidMD.groupMetadata(m.chat);
        const members = groupMeta.participants;

        let data = `*Group Backup*\n\n*Name:* ${groupMeta.subject}\n*ID:* ${groupMeta.id}\n*Created:* ${new Date(groupMeta.creation * 1000).toLocaleDateString()}\n*Members:* ${members.length}\n\n*Admins:*\n`;
        
        members.filter(p => p.admin).forEach(p => {
            data += `👑 @${p.id.split('@')[0]}\n`;
        });

        data += `\n*Members:*\n`;
        members.filter(p => !p.admin).forEach(p => {
            data += `👤 @${p.id.split('@')[0]}\n`;
        });

        await VoidMD.sendMessage(m.chat, {
            text: data,
            mentions: members.map(p => p.id)
        });

        // Send as document too
        await VoidMD.sendMessage(m.sender, {
            document: Buffer.from(data),
            fileName: `${groupMeta.subject}_backup.txt`,
            mimetype: 'text/plain',
            caption: `💾 Backup of ${groupMeta.subject}`
        });

        await m.reply('Backup sent to your DM ✅');
    }
}
