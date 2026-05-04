module.exports = {
    name: 'anticall',
    alias: ['ac'],
    react: '📞',
    category: 'owner',
    desc: 'Enable/disable anti-call',
    async execute(m, { VoidMD, args, owner, sender }) {
        const senderNum = sender.split('@')[0].split(':')[0];
        if (senderNum!== owner) {
            await VoidMD.sendMessage(m.key.remoteJid, {
                react: { text: '🚫', key: m.key }
            });
            return await VoidMD.sendMessage(m.key.remoteJid, { text: 'Only owner can use this' }, { quoted: m });
        }

        const action = args[0]?.toLowerCase();
        if (!action) {
            return await VoidMD.sendMessage(m.key.remoteJid, {
                text: `Usage:.anticall on/off\nCurrent: ${global.anticall? 'ON' : 'OFF'}`
            }, { quoted: m });
        }

        if (action === 'on') {
            global.anticall = true;
            await VoidMD.sendMessage(m.key.remoteJid, {
                react: { text: '✅', key: m.key }
            });
            await VoidMD.sendMessage(m.key.remoteJid, { text: '✅ Anti-Call enabled' }, { quoted: m });
        } else if (action === 'off') {
            global.anticall = false;
            await VoidMD.sendMessage(m.key.remoteJid, {
                react: { text: '❌', key: m.key }
            });
            await VoidMD.sendMessage(m.key.remoteJid, { text: '❌ Anti-Call disabled' }, { quoted: m });
        }
    }
}
