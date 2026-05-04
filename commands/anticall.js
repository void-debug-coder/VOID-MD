module.exports = {
    name: 'anticall',
    alias: ['ac'],
    react: '📞',
    category: 'owner',
    desc: 'Enable/disable anti-call',
    async execute(m, { VoidMD, args, owner, sender }) {
        const senderNum = sender.replace(/[^0-9]/g, '');
        if (!owner || senderNum!== owner) return;

        const action = args[0]?.toLowerCase();
        if (!action) {
            return await VoidMD.sendMessage(m.key.remoteJid, {
                text: `Usage:.anticall on/off\nCurrent: ${global.anticall? 'ON' : 'OFF'}`
            }, { quoted: m });
        }

        global.anticall = action === 'on';
        await VoidMD.sendMessage(m.key.remoteJid, {
            text: `${global.anticall? '✅' : '❌'} Anti-Call ${global.anticall? 'enabled' : 'disabled'}`
        }, { quoted: m });
    }
}
