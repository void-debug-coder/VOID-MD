module.exports = {
    name: 'resetowner',
    alias: ['ro'],
    react: '🔄',
    category: 'owner',
    desc: 'Force set yourself as owner',
    async execute(m, { VoidMD, sender }) {
        const fs = require('fs');
        // LID SAFE
        const newOwner = sender.split('@')[0].split(':')[0];
        fs.writeFileSync('./owner.json', JSON.stringify({ owner: newOwner }));
        
        await VoidMD.sendMessage(m.key.remoteJid, {
            react: { text: '✅', key: m.key }
        });
        
        await VoidMD.sendMessage(m.key.remoteJid, { 
            text: `✅ Owner reset to: ${newOwner}\n\nNow restart bot or wait 1 min for reload.` 
        }, { quoted: m });
    }
}
