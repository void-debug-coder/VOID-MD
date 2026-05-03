let callListener = null;

module.exports = {
    name: 'anticall',
    alias: ['nocall', 'rejectcall'],
    desc: 'Auto reject calls and optionally block',
    react: '📵',
    category: 'owner',
    ownerOnly: true,
    async execute(m, { VoidMD, text }) {
        const arg = text.toLowerCase().trim();

        if (arg === 'on') {
            if (callListener) return m.reply('Anticall already ON 📵');

            await m.reply('Anticall enabled ✅\nBot will auto-reject all calls');

            callListener = async (json) => {
                for (const { content, id } of json) {
                    if (content?.tag === 'call') {
                        const callerId = content.attrs.from;
                        const isVideo = content.attrs.type === 'video';

                        try {
                            // Reject the call
                            await VoidMD.rejectCall(id, callerId);

                            // Send warning to caller
                            await VoidMD.sendMessage(callerId, {
                                text: `📵 *Anticall*\n\nCalls to this bot are blocked\nMessage instead`
                            });

                            // Log to owner
                            await VoidMD.sendMessage(m.sender, {
                                text: `📵 *Call Rejected*\n\nFrom: @${callerId.split('@')[0]}\nType: ${isVideo? 'Video' : 'Voice'} call`,
                                mentions: [callerId]
                            });

                        } catch (e) {
                            console.log('[ANTICALL ERROR]', e);
                        }
                    }
                }
            };

            VoidMD.ws.on('CB:call', callListener);

        } else if (arg === 'block') {
            if (callListener) return m.reply('Disable anticall first, then use block mode 💀');

            await m.reply('Anticall BLOCK mode enabled ✅\nCallers will be blocked');

            callListener = async (json) => {
                for (const { content, id } of json) {
                    if (content?.tag === 'call') {
                        const callerId = content.attrs.from;

                        try {
                            // Reject call
                            await VoidMD.rejectCall(id, callerId);

                            // Block caller
                            await VoidMD.updateBlockStatus(callerId, 'block');

                            // Log to owner
                            await VoidMD.sendMessage(m.sender, {
                                text: `📵 *Call Blocked*\n\nBlocked: @${callerId.split('@')[0]}\nReason: Called bot`,
                                mentions: [callerId]
                            });

                        } catch (e) {
                            console.log('[ANTICALL BLOCK ERROR]', e);
                        }
                    }
                }
            };

            VoidMD.ws.on('CB:call', callListener);

        } else if (arg === 'off') {
            if (!callListener) return m.reply('Anticall already OFF 💀');
            VoidMD.ws.off('CB:call', callListener);
            callListener = null;
            await m.reply('Anticall disabled ❌');

        } else {
            await m.reply(`*Anticall:* ${callListener? 'ON ✅' : 'OFF ❌'}\n\nUsage:\n.anticall on - Reject calls\n.anticall block - Reject + block caller\n.anticall off - Disable`);
        }
    }
}
