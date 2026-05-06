const { proto, getContentType } = require('@whiskeysockets/baileys')

exports.smsg = (VoidMD, m, store) => {
    if (!m) return m
    let M = proto.WebMessageInfo
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = m.fromMe? VoidMD.user.id.split(':')[0] + '@s.whatsapp.net' : m.key.participant || m.key.remoteJid
    }
    if (m.message) {
        m.mtype = getContentType(m.message)
        m.msg = (m.mtype == 'viewOnceMessage'? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype])
        m.body = m.message.conversation || m.msg?.caption || m.msg?.text || m.text || ''
        m.text = m.body
    }

    m.reply = (text) => VoidMD.sendMessage(m.chat, { text }, { quoted: m })
    return m
}
