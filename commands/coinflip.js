module.exports = {
    name: 'coinflip',
    alias: ['cf', 'flip'],
    desc: 'Flip a coin',
    react: '🪙',
    category: 'game',
    async execute(m, { VoidMD, text }) {
        const choice = text.toLowerCase().trim();
        if (choice!== 'heads' && choice!== 'tails') {
            return m.reply('Pick heads or tails\n\n.coinflip heads\n.coinflip tails');
        }

        await m.react('🪙');
        await new Promise(r => setTimeout(r, 1500)); // suspense

        const result = Math.random() < 0.5? 'heads' : 'tails';
        const won = choice === result;

        const emoji = result === 'heads'? '👑' : '🔥';
        await m.reply(`🪙 *Coin Flip*\n\nYou picked: ${choice}\nResult: ${result} ${emoji}\n\n${won? 'You WIN 🎉' : 'You LOSE 💀'}`);
    }
}
