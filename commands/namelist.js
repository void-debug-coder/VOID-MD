module.exports = {
    name: 'namelist',
    alias: ['styles', 'fxlist'],
    desc: 'List all name decoration styles',
    react: '📋',
    category: 'convert',
    async execute(m, { VoidMD }) {
        const styles = [
            'neon', 'neonlight', 'neon2', 'neondevil',
            'thunder', 'matrix', 'fire', 'joker', 'dragon', 'wolf',
            'galaxy', 'gold', 'silver', 'metal', 'blackpink',
            'blood', 'broken', 'carbon', 'cloud', 'devil',
            'glitch', 'gradient', 'graffiti', 'ice', 'lava',
            'magma', 'rainbow', 'sand', 'space', 'steel',
            'stone', 'toxic', 'water'
        ];

        let msg = `🎨 *Name Decoration Styles*\n\n`;
        msg += styles.map((s, i) => `${i + 1}. ${s}`).join('\n');
        msg += `\n\n*Usage:*.name style|YourName\n*Example:*.name fire|DANIEL`;

        await m.reply(msg);
    }
}
