const games = new Map(); // chatId -> game state

module.exports = {
    name: 'tictactoe',
    alias: ['ttt'],
    desc: 'Play TicTacToe',
    react: '🎮',
    category: 'game',
    async execute(m, { VoidMD, text, isGroup }) {
        if (!isGroup) return m.reply('Play in groups only 💀');

        const chatId = m.chat;
        const arg = text.toLowerCase().trim();
        const sender = m.sender;

        // Start new game
        if (arg === 'start' || arg === '') {
            if (games.has(chatId)) return m.reply('Game already running! Use.ttt end to stop');

            games.set(chatId, {
                board: Array(9).fill('⬜'),
                playerX: sender,
                playerO: null,
                turn: sender,
                moves: 0
            });

            await m.reply(`🎮 *TicTacToe Started*\n\n${renderBoard(games.get(chatId).board)}\n\n*Player X:* @${sender.split('@')[0]}\n*Player O:* Waiting... join with.ttt join\n\n*Your turn X:*.ttt 1-9`, { mentions: [sender] });
            return;
        }

        // Join game
        if (arg === 'join') {
            const game = games.get(chatId);
            if (!game) return m.reply('No game running. Start with.ttt');
            if (game.playerO) return m.reply('Game full 💀');
            if (game.playerX === sender) return m.reply('You are already X 💀');

            game.playerO = sender;
            await m.reply(`🎮 *Player O Joined*\n\n${renderBoard(game.board)}\n\n*X:* @${game.playerX.split('@')[0]}\n*O:* @${sender.split('@')[0]}\n\n*Turn X:*.ttt 1-9`, { mentions: [game.playerX, sender] });
            return;
        }

        // End game
        if (arg === 'end') {
            if (!games.has(chatId)) return m.reply('No game to end 💀');
            games.delete(chatId);
            return m.reply('Game ended 🗑️');
        }

        // Make move
        const pos = parseInt(arg);
        if (isNaN(pos) || pos < 1 || pos > 9) return m.reply('Use.ttt 1-9 to place\n.ttt join to enter\n.ttt end to stop');

        const game = games.get(chatId);
        if (!game) return m.reply('No game running. Start with.ttt');
        if (!game.playerO) return m.reply('Waiting for Player O to join with.ttt join');
        if (sender!== game.turn) return m.reply('Not your turn 💀');
        if (game.board[pos - 1]!== '⬜') return m.reply('Spot taken 💀');

        const symbol = sender === game.playerX? '❌' : '⭕';
        game.board[pos - 1] = symbol;
        game.moves++;
        game.turn = sender === game.playerX? game.playerO : game.playerX;

        // Check win
        const winner = checkWin(game.board);
        if (winner) {
            const winSymbol = winner === '❌'? 'X' : 'O';
            const winnerId = winner === '❌'? game.playerX : game.playerO;
            await VoidMD.sendMessage(chatId, {
                text: `🎮 *Game Over*\n\n${renderBoard(game.board)}\n\n*Winner:* @${winnerId.split('@')[0]} ${winner}`,
                mentions: [winnerId]
            });
            games.delete(chatId);
            return;
        }

        // Check draw
        if (game.moves === 9) {
            await m.reply(`🎮 *Draw*\n\n${renderBoard(game.board)}\n\nNo winner 💀`);
            games.delete(chatId);
            return;
        }

        // Continue
        const nextSymbol = game.turn === game.playerX? 'X' : 'O';
        await VoidMD.sendMessage(chatId, {
            text: `🎮 *TicTacToe*\n\n${renderBoard(game.board)}\n\n*Turn ${nextSymbol}:* @${game.turn.split('@')[0]}`,
            mentions: [game.turn]
        });
    }
}

function renderBoard(b) {
    return `${b[0]}${b[1]}${b[2]}\n${b[3]}${b[4]}${b[5]}\n${b[6]}${b[7]}${b[8]}`;
}

function checkWin(b) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let w of wins) {
        if (b[w[0]]!== '⬜' && b[w[0]] === b[w[1]] && b[w[1]] === b[w[2]]) return b[w[0]];
    }
    return null;
            }
