module.exports = {
    name: 'spam',
    alias: [],
    desc: 'Spam messages - Owner only',
    react: '💣',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, text }) {
        const args = text.split(' ');
        const count = parseInt(args[0]) || 5;
        const msg = args.slice(1).join(' ') || 'SPAM';

        if (count > 20) return m.reply('Max 20 messages 💀');
        if (count < 1) return m.reply('Min 1 message 💀');

        await m.reply(`💣 Spamming ${count}x...`);

        for (let i = 0; i < count; i++) {
            await VoidMD.sendMessage(m.chat, { text: `${msg} ${i + 1}/${count}` });
            await new Promise(r => setTimeout(r, 1000)); // 1s delay
        }
    }
}
