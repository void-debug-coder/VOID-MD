const os = require('os');

module.exports = {
    name: 'menu',
    alias: ['help', 'list'],
    desc: 'Show bot menu',
    react: '🌟',
    category: 'core',
    async execute(m, { VoidMD, commands }) {
        try {
            const botName = 'VOID-MD';
            const ownerName = 'Void Dev';
            const prefix = '.';
            const version = '1.0.0';

            const uptime = process.uptime();
            const h = Math.floor(uptime / 3600);
            const min = Math.floor((uptime % 3600) / 60);
            const s = Math.floor(uptime % 60);

            const used = process.memoryUsage();
            const ramUsed = (used.heapUsed / 1024 / 1024).toFixed(2);
            const ramTotal = (os.totalmem() / 1024 / 1024).toFixed(2);

            const now = new Date();
            const time = now.toLocaleTimeString('en-KE', { timeZone: 'Africa/Nairobi', hour12: false });
            const date = now.toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' });
            const day = now.toLocaleDateString('en-KE', { weekday: 'long', timeZone: 'Africa/Nairobi' });

            let menuText = `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            menuText += `┃ 🌟 *${botName}* 🌟\n`;
            menuText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

            menuText += `╭─❒ *BOT INFO*\n`;
            menuText += `│ 👤 *User:* @${m.sender.split('@')[0]}\n`;
            menuText += `│ 👑 *Owner:* ${ownerName}\n`;
            menuText += `│ ⚡ *Prefix:* [ ${prefix} ]\n`;
            menuText += `│ 🔧 *Version:* ${version}\n`;
            menuText += `╰─────────────────❒\n\n`;

            menuText += `╭─❒ *SYSTEM*\n`;
            menuText += `│ ⏰ *Uptime:* ${h}h ${min}m ${s}s\n`;
            menuText += `│ 💾 *RAM:* ${ramUsed}MB / ${ramTotal}GB\n`;
            menuText += `│ 🖥️ *Platform:* ${os.platform()}\n`;
            menuText += `│ 📊 *Commands:* ${commands.size}\n`;
            menuText += `╰─────────────────❒\n\n`;

            menuText += `╭─❒ *DATE & TIME*\n`;
            menuText += `│ 📅 *Date:* ${date}\n`;
            menuText += `│ 📆 *Day:* ${day}\n`;
            menuText += `│ 🕐 *Time:* ${time} EAT\n`;
            menuText += `╰─────────────────❒\n\n`;

            const categories = {};
            commands.forEach(cmd => {
                if (cmd.name === 'menu') return;
                const cat = (cmd.category || 'misc').toUpperCase();
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(cmd.name);
            });

            const catEmojis = {
                'CORE': '⚙️', 'GAME': '🎮', 'GROUP': '👥',
                'DOWNLOAD': '📥', 'CONVERT': '🔄', 'SEARCH': '🔍',
                'FUN': '🎉', 'TOOLS': '🛠️', 'OWNER': '👑', 'MISC': '📦'
            };

            for (const cat in categories) {
                const emoji = catEmojis[cat] || '📁';
                menuText += `╭─❒ ${emoji} *${cat}* [${categories[cat].length}]\n`;
                categories[cat].sort().forEach(cmd => {
                    menuText += `│ ◦ ${prefix}${cmd}\n`;
                });
                menuText += `╰─────────────────❒\n\n`;
            }

            menuText += `┏━━━━━━━━━━━━━━━━━━━━━━┓\n`;
            menuText += `┃ 💡 *Type ${prefix}help <cmd>*\n`;
            menuText += `┃ for command info\n`;
            menuText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;
            menuText += `_⚡ Powered by ${botName} 💀_`;

            await VoidMD.sendMessage(m.chat, {
                text: menuText,
                mentions: [m.sender]
            }, { quoted: m });

        } catch (err) {
            console.log('[MENU CRASH]', err);
            await m.reply(`Menu error: ${err.message}`);
        }
    }
                    }
