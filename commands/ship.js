module.exports = {
    name: 'ship',
    alias: ['couple'],
    desc: 'Love calculator',
    react: '❤️',
    category: 'fun',
    async execute(m, { VoidMD, text }) {
        const users = m.mentionedJid;
        if (users.length < 2) return m.reply('Tag 2 people\n\n.ship @user1 @user2');
        const percent = Math.floor(Math.random() * 101);
        const name1 = users[0].split('@')[0];
        const name2 = users[1].split('@')[0];
        let status = 'Friends';
        if (percent > 80) status = 'Perfect Couple 💍';
        else if (percent > 60) status = 'Good Match 💕';
        else if (percent > 40) status = 'Maybe... 🤔';
        else if (percent > 20) status = 'Friendzoned 😅';
        else status = 'Enemies 💀';

        await m.reply(`❤️ *Love Calculator*\n\n@${name1} + @${name2}\n*Score:* ${percent}%\n*Status:* ${status}`, {
            mentions: users
        });
    }
}
