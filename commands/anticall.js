module.exports = {
    name: 'anticall',
    alias: ['ac'],
    category: 'owner',
    desc: 'Enable/disable anti-call',
    async execute(m, { VoidMD, args, owner, sender }) {
        // Owner check
        if (sender.split('@')[0]!== owner) {
            return await VoidMD.sendMessage(m.key.remoteJid, { text: 'Only owner can use this' }, { quoted: m });
        }

        // SAFE: Check if args[0] exists first
        const action = args[0]?.toLowerCase(); //? = optional chaining

        if (!action) {
            return await VoidMD.sendMessage(m.key.remoteJid, { 
                text: `Usage:.anticall on/off\nCurrent: ${global.anticall? 'ON' : 'OFF'}` 
            }, { quoted: m });
        }

        if (action === 'on') {
            global.anticall = true;
            await VoidMD.sendMessage(m.key.remoteJid, { text: '✅ Anti-Call enabled' }, { quoted: m });
        } else if (action === 'off') {
            global.anticall = false;
            await VoidMD.sendMessage(m.key.remoteJid, { text: '❌ Anti-Call disabled' }, { quoted: m });
        } else {
            await VoidMD.sendMessage(m.key.remoteJid, { text: 'Use.anticall on/off' }, { quoted: m });
        }
    }
}
