module.exports = {
    name: 'groupset',
    alias: ['gset'],
    desc: 'Change group settings',
    react: '⚙️',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, text, isGroup, isBotAdmin }) {
        if (!isGroup) return m.reply('Groups only 💀');
        if (!isBotAdmin) return m.reply('Bot needs admin 💀');

        const arg = text.toLowerCase().trim();

        if (arg === 'close') {
            await VoidMD.groupSettingUpdate(m.chat, 'announcement');
            await m.reply('🔒 Group closed - Only admins can send messages');
        } else if (arg === 'open') {
            await VoidMD.groupSettingUpdate(m.chat, 'not_announcement');
            await m.reply('🔓 Group opened - Everyone can send messages');
        } else if (arg === 'lock') {
            await VoidMD.groupSettingUpdate(m.chat, 'locked');
            await m.reply('🔒 Group info locked - Only admins can edit');
        } else if (arg === 'unlock') {
            await VoidMD.groupSettingUpdate(m.chat, 'unlocked');
            await m.reply('🔓 Group info unlocked - Everyone can edit');
        } else if (arg.startsWith('name ')) {
            const newName = text.slice(5).trim();
            await VoidMD.groupUpdateSubject(m.chat, newName);
            await m.reply(`✏️ Group name changed to: ${newName}`);
        } else if (arg.startsWith('desc ')) {
            const newDesc = text.slice(5).trim();
            await VoidMD.groupUpdateDescription(m.chat, newDesc);
            await m.reply(`📝 Group description updated`);
        } else {
            await m.reply(`*Group Settings*\n\n.gset close - Admins only chat\n.gset open - Everyone chat\n.gset lock - Lock group info\n.gset unlock - Unlock info\n.gset name NewName - Change name\n.gset desc NewDesc - Change desc`);
        }
    }
}
