module.exports = {
    name: 'join',
    desc: 'Join WhatsApp group via link',
    react: '➕',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, text }) {
        if (!text) return m.reply('Group link? Example:.join https://chat.whatsapp.com/xxx');
        try {
            const code = text.split('https://chat.whatsapp.com/')[1];
            if (!code) return m.reply('Invalid link 💀');
            await VoidMD.groupAcceptInvite(code);
            await m.reply('Joined group ✅');
        } catch (e) {
            await m.reply('Failed to join. Link expired or I was kicked 💀');
        }
    }
}
