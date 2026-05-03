module.exports = {
    name: 'restart',
    alias: ['reboot'],
    desc: 'Restart bot process',
    react: '🔄',
    category: 'owner',
    ownerOnly: true,
    async execute(m) {
        await m.reply('Restarting VOID-MD... 💀\nRender will redeploy in ~30sec');
        process.exit(1); // Render auto-restarts on exit
    }
}
