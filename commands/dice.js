module.exports = {
    name: 'dice',
    alias: ['roll'],
    desc: 'Roll a dice 1-6',
    react: '🎲',
    category: 'game',
    async execute(m, { VoidMD, text }) {
        const guess = parseInt(text.trim());
        const roll = Math.floor(Math.random() * 6) + 1;
        const diceEmoji = ['⚀','⚁','⚂','⚃','⚄','⚅'][roll - 1];

        if (!guess || guess < 1 || guess > 6) {
            return m.reply(`🎲 *Dice Roll*\n\n${diceEmoji} You rolled: ${roll}`);
        }

        const won = guess === roll;
        await m.reply(`🎲 *Dice Roll*\n\nYour guess: ${guess}\nRolled: ${roll} ${diceEmoji}\n\n${won? 'JACKPOT 🎉' : 'Try again 💀'}`);
    }
}
