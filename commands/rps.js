module.exports = {
    name: 'rps',
    alias: ['rockpaperscissors'],
    desc: 'Play RPS vs bot',
    react: '✊',
    category: 'game',
    async execute(m, { VoidMD, text }) {
        const choice = text.toLowerCase().trim();
        const moves = { rock: '✊', paper: '✋', scissors: '✌️' };

        if (!moves[choice]) {
            return m.reply('Pick rock, paper, or scissors\n\n.rps rock\n.rps paper\n.rps scissors');
        }

        const botChoice = Object.keys(moves)[Math.floor(Math.random() * 3)];
        const user = moves[choice];
        const bot = moves[botChoice];

        let result;
        if (choice === botChoice) result = 'DRAW 😐';
        else if (
            (choice === 'rock' && botChoice === 'scissors') ||
            (choice === 'paper' && botChoice === 'rock') ||
            (choice === 'scissors' && botChoice === 'paper')
        ) result = 'YOU WIN 🎉';
        else result = 'YOU LOSE 💀';

        await m.reply(`✊ *RPS*\n\nYou: ${user} ${choice}\nBot: ${bot} ${botChoice}\n\n${result}`);
    }
}
