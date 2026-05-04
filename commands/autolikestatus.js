module.exports = {
    name: 'autolikestatus',
    alias: ['als'],
    category: 'owner',
    desc: 'Auto like status',
    async execute(m, { VoidMD, args, owner, sender }) {
        if (sender.split('@')[0]!== owner) {
            return await VoidMD.sendMessage(m.key.remoteJid, { text: 'Only owner can use this' }, { quoted: m });
        }

        const action = args[0]?.toLowerCase(); // SAFE

        if (!action) {
            return await VoidMD.sendMessage(m.key.remoteJid, { 
                text: `Usage:.autolikestatus on/off\nCurrent: ${global.autolikestatus? 'ON' : 'OFF'}` 
            }, { quoted: m });
        }

        if (action === 'on') {
            global.autolikestatus = true;
            await VoidMD.sendMessage(m.key.remoteJid, { text: '✅ Auto Like Status enabled' }, { quoted: m });
        } else if (action === 'off') {
            global.autolikestatus = false;
            await VoidMD.sendMessage(m.key.remoteJid, { text: '❌ Auto Like Status disabled' }, { quoted: m });
        } else {
            await VoidMD.sendMessage(m.key.remoteJid, { text: 'Use.autolikestatus on/off' }, { quoted: m });
        }
    }
}
