const os = require('os');
module.exports = {
    name: 'stats',
    alias: ['status', 'bot'],
    desc: 'Show bot statistics',
    react: '📊',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, botMode, OWNER_NUMBER }) {
        const used = process.memoryUsage();
        const groups = await VoidMD.groupFetchAllParticipating();
        const txt = `*VOID-MD STATS* 💀\n\n` +
            `*Mode:* ${botMode.toUpperCase()}\n` +
            `*Owner:* ${OWNER_NUMBER}\n` +
            `*Uptime:* ${Math.floor(process.uptime()/60)} min\n` +
            `*RAM:* ${(used.rss/1024/1024).toFixed(2)} MB / 512 MB\n` +
            `*Groups:* ${Object.keys(groups).length}\n` +
            `*Platform:* ${os.platform()}\n` +
            `*Node:* ${process.version}`;
        await m.reply(txt);
    }
}
