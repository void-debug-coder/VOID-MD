const os = require('os');

module.exports = {
    name: 'menu',
    alias: ['help', 'list', 'h'],
    desc: 'Display bot menu with all commands',
    react: '🌟',
    category: 'core',
    async execute(m, { VoidMD, commands }) {
        try {
            // ===== CONFIG - EDIT YOUR INFO =====
            const botName = 'VOID-MD';
            const ownerName = 'Void Dev';
            const prefix = '.';
            const version = '1.0.0';
            // ===================================

            // System stats
            const uptime = process.uptime();
            const h = Math.floor(uptime / 3600);
            const min = Math.floor((uptime % 3600) / 60);
            const s = Math.floor(uptime % 60);

            const used = process.memoryUsage();
            const ramUsed = (used.heapUsed / 1024 / 1024).toFixed(2);
            const ramTotal = (os.totalmem() / 1024 / 1024).toFixed(2);

            // Nairobi time using built-in Date
            const now = new Date();
            const time = now.toLocaleTimeString('en-KE', { 
                timeZone: 'Africa/Nairobi', 
                hour12: false 
            });
            const date = now.toLocaleDateString('en-KE', { 
                timeZone: 'Africa/Nairobi',
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric'
            });
            const day = now.toLocaleDateString('en-KE', { 
                weekday: 'long', 
                timeZone: 'Africa/Nairobi' 
            });

            // Build menu header
            let menuText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            menuText += `┃ 🌟 *${botName}* 🌟\n`;
            menuText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

            // Bot info section
            menuText += `╭─❒ *BOT INFO*\n`;
            menuText += `│ 👤 *User:* @${m.sender.split('@')[0]}\n`;
            menuText += `│ 👑 *Owner:* ${ownerName}\n`;
            menuText += `│ ⚡ *Prefix:* [ ${prefix} ]\n`;
            menuText += `│ 🔧 *Version:* ${version}\n`;
            menuText += `╰─────────────────❒\n\n`;

            // System section
            menuText += `╭─❒ *SYSTEM*\n`;
            menuText += `│ ⏰ *Uptime:* ${h}h ${min}m ${s}s\n`;
            menuText += `│ 💾 *RAM:* ${ramUsed}MB / ${ramTotal}GB\n`;
            menuText += `│ 🖥️ *Platform:* ${os.platform()}\n`;
            menuText += `│ 📊 *Commands:* ${commands.size}\n`;
            menuText += `╰─────────────────❒\n\n`;

            // Date time section
            menuText += `╭─❒ *DATE & TIME*\n`;
            menuText += `│ 📅 *Date:* ${date}\n`;
            menuText += `│ 📆 *Day:* ${day}\n`;
            menuText += `│ 🕐 *Time:* ${time} EAT\n`;
            menuText += `╰─────────────────❒\n\n`;

            // Group commands by category
            const categories = {};
            commands.forEach(cmd => {
                if (!cmd.name || cmd.name === 'menu') return;
                const cat = (cmd.category || 'misc').toUpperCase();
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(cmd.name);
            });

            // Category emojis
            const catEmojis = {
                'CORE': '⚙️', 'GAME': '🎮', 'GROUP': '👥',
                'DOWNLOAD': '📥', 'CONVERT': '🔄', 'SEARCH': '🔍',
                'FUN': '🎉', 'TOOLS': '🛠️', 'OWNER': '👑', 
                'MISC': '📦', 'AI': '🤖'
            };

            // Add each category
            const sortedCats = Object.keys(categories).sort();
            for (const cat of sortedCats) {
                const emoji = catEmojis[cat] || '📁';
                const cmdList = categories[cat].sort();
                menuText += `╭─❒ ${emoji} *${cat}* [${cmdList.length}]\n`;
                cmdList.forEach(cmd => {
                    menuText += `│ ◦ ${prefix}${cmd}\n`;
                });
                menuText += `╰─────────────────❒\n\n`;
            }

            // Footer
            menuText += `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            menuText += `┃ 💡 *Type ${prefix}help <cmd>*\n`;
            menuText += `┃ for command info\n`;
            menuText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
            menuText += `_⚡ Powered by ${botName} 💀_`;

            // Send menu
            await VoidMD.sendMessage(m.chat, {
                text: menuText,
                mentions: [m.sender]
            }, { quoted: m });

        } catch (err) {
            console.log('[MENU ERROR]', err);
            await m.reply(`❌ Menu failed: ${err.message}\n\nCheck Render logs for details.`);
        }
    }
                    }
