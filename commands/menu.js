const os = require('os');
const axios = require('axios');

module.exports = {
    name: 'menu',
    alias: ['help', 'list', 'h'],
    desc: 'Display bot menu with image',
    react: '🌟',
    category: 'core',
    async execute(m, { VoidMD, commands }) {
        // ===== CONFIG =====
        const botName = 'VOID-MD';
        const ownerName = 'Void Dev';
        const imageUrl = 'https://files.catbox.moe/bhiw6e.png';
        const prefix = '.';
        const version = '1.0.0';
        // ==================

        const jid = m.key.remoteJid; // Fix 1: Use jid instead of m.chat
        const sender = m.key.participant || m.key.remoteJid; // Fix 2: Proper sender
        const pushName = m.pushName || sender.split('@')[0];

        let menuText = '';

        try {
            // System stats
            const uptime = process.uptime();
            const h = Math.floor(uptime / 3600);
            const min = Math.floor((uptime % 3600) / 60);
            const s = Math.floor(uptime % 60);

            const used = process.memoryUsage();
            const ramUsed = (used.heapUsed / 1024 / 1024).toFixed(2); // MB
            const ramTotal = (os.totalmem() / 1024).toFixed(2); // GB

            // Nairobi time
            const now = new Date();
            const time = now.toLocaleTimeString('en-KE', {
                timeZone: 'Africa/Nairobi',
                hour12: false
            });
            const date = now.toLocaleDateString('en-KE', {
                timeZone: 'Africa/Nairobi',
                day: '2-digit', month: '2-digit', year: 'numeric'
            });
            const day = now.toLocaleDateString('en-KE', {
                weekday: 'long', timeZone: 'Africa/Nairobi'
            });

            // Build menu
            menuText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            menuText += `┃ 🌟 *${botName}* 🌟\n`;
            menuText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

            menuText += `╭─❒ *BOT INFO*\n`;
            menuText += `│ 👤 *User:* ${pushName}\n`;
            menuText += `│ 👑 *Owner:* ${ownerName}\n`;
            menuText += `│ ⚡ *Prefix:* [ ${prefix} ]\n`;
            menuText += `│ 🔧 *Version:* ${version}\n`;
            menuText += `╰─────────────────❒\n\n`;

            menuText += `╭─❒ *SYSTEM*\n`;
            menuText += `│ ⏰ *Uptime:* ${h}h ${min}m ${s}s\n`;
            menuText += `│ 💾 *RAM:* ${ramUsed}MB / ${ramTotal}GB\n`;
            menuText += `│ 🖥️ *Platform:* ${os.platform()}\n`;
            menuText += `│ 📊 *Commands:* ${commands?.size || Object.keys(commands || {}).length}\n`; // Fix 3
            menuText += `╰─────────────────❒\n\n`;

            menuText += `╭─❒ *DATE & TIME*\n`;
            menuText += `│ 📅 *Date:* ${date}\n`;
            menuText += `│ 📆 *Day:* ${day}\n`;
            menuText += `│ 🕐 *Time:* ${time} EAT\n`;
            menuText += `╰─────────────────❒\n\n`;

            // Group commands by category
            const categories = {};
            const cmdList = commands?.forEach? commands : new Map(Object.entries(commands || {}));
            cmdList.forEach(cmd => {
                if (!cmd.name || cmd.name === 'menu') return;
                const cat = (cmd.category || 'misc').toUpperCase();
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(cmd.name);
            });

            const catEmojis = {
                'CORE': '⚙️', 'GAME': '🎮', 'GROUP': '👥',
                'DOWNLOAD': '📥', 'CONVERT': '🔄', 'SEARCH': '🔍',
                'FUN': '🎉', 'TOOLS': '🛠️', 'OWNER': '👑',
                'MISC': '📦', 'AI': '🤖'
            };

            const sortedCats = Object.keys(categories).sort();
            for (const cat of sortedCats) {
                const emoji = catEmojis[cat] || '📁';
                const cmds = categories[cat].sort();
                menuText += `╭─❒ ${emoji} *${cat}* [${cmds.length}]\n`;
                cmds.forEach(cmd => {
                    menuText += `│ ◦ ${prefix}${cmd}\n`;
                });
                menuText += `╰─────────────────❒\n\n`;
            }

            menuText += `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            menuText += `┃ 💡 *Type ${prefix}help <cmd>*\n`;
            menuText += `┃ for command info\n`;
            menuText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
            menuText += `_⚡ Powered by ${botName} 💀_`;

            // Download image
            const response = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 8000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const buffer = Buffer.from(response.data);

            await VoidMD.sendMessage(jid, {
                image: buffer,
                caption: menuText,
                mentions: [sender]
            }, { quoted: m });

        } catch (err) {
            console.log('[MENU ERROR]', err.message, err.stack);
            const fallbackText = menuText || `❌ Menu crashed: ${err.message}`;
            await VoidMD.sendMessage(jid, { text: fallbackText }, { quoted: m }).catch(() => {});
        }
    }
            }
