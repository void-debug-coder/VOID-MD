const fs = require('fs');
const path = require('path');
const os = require('os');

// LOCAL FILE PATH
const BOT_IMAGE = path.join(__dirname, '..', 'assets', 'menu.jpg');

module.exports = {
    name: 'menu',
    alias: ['help', 'commands', 'list'],
    desc: 'Show bot menu',
    react: '📜',
    category: 'core',
    async execute(m, { VoidMD, prefix, commands }) {
        const uptime = process.uptime();
        const uptimeStr = formatUptime(uptime);
        const usedRAM = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalRAM = (os.totalmem() / 1024 / 1024).toFixed(2);
        const platform = os.platform();

        const categories = {};
        commands.forEach(cmd => {
            const cat = cmd.category || 'misc';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd);
        });

        const isOwner = m.sender === VoidMD.user.id || m.sender.includes(VoidMD.user.id.split(':')[0]);

        let menuText = `╭─〔 *VOID-MD* 〕\n`;
        menuText += `│\n`;
        menuText += `│ 👤 *User:* @${m.sender.split('@')[0]}\n`;
        menuText += `│ 🤖 *Bot:* ${VoidMD.user.name || 'VOID-MD'}\n`;
        menuText += `│ ⏰ *Uptime:* ${uptimeStr}\n`;
        menuText += `│ 💾 *RAM:* ${usedRAM}MB / ${totalRAM}GB\n`;
        menuText += `│ 🖥️ *Platform:* ${platform}\n`;
        menuText += `│ 📊 *Commands:* ${commands.size}\n`;
        menuText += `│ 🔰 *Prefix:* ${prefix}\n`;
        menuText += `│\n`;
        menuText += `╰────────────\n\n`;

        const categoryEmojis = {
            owner: '👑', group: '👥', game: '🎮', core: '⚙️',
            download: '📥', convert: '🔄', search: '🔍',
            tools: '🛠️', fun: '🎉', misc: '📦'
        };

        const sortedCats = Object.entries(categories).sort((a, b) => {
            const order = ['core', 'game', 'group', 'tools', 'owner', 'download', 'convert', 'search', 'fun', 'misc'];
            return order.indexOf(a[0]) - order.indexOf(b[0]);
        });

        for (const [cat, cmds] of sortedCats) {
            if (cat === 'owner' &&!isOwner) continue;

            const emoji = categoryEmojis[cat] || '📌';
            menuText += `╭─〔 ${emoji} *${cat.toUpperCase()}* 〕\n`;

            cmds.sort((a, b) => a.name.localeCompare(b.name)).forEach(cmd => {
                menuText += `│ ▢ ${prefix}${cmd.name}\n`;
            });

            menuText += `╰────────────\n\n`;
        }

        menuText += `*Note:* Type ${prefix}help <command> for details\n`;
        menuText += `*Example:* ${prefix}help tictactoe\n\n`;
        menuText += `_Powered by VOID-MD 💀_`;

        // Send with local image
        try {
            // Check if file exists first
            if (!fs.existsSync(BOT_IMAGE)) {
                throw new Error('menu.jpg not found in assets folder');
            }

            const imageBuffer = fs.readFileSync(BOT_IMAGE);
            await VoidMD.sendMessage(m.chat, {
                image: imageBuffer,
                caption: menuText,
                mentions: [m.sender]
            }, { quoted: m });

        } catch (e) {
            console.log('[MENU IMAGE ERROR]', e.message);
            await VoidMD.sendMessage(m.chat, {
                text: menuText + '\n\n⚠️ *Menu image missing* - Add menu.jpg to assets/',
                mentions: [m.sender]
            }, { quoted: m });
        }
    }
}

function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
                }
