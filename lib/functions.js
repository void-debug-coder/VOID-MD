const { proto, getContentType } = require('@whiskeysockets/baileys')

exports.smsg = (VoidMD, m) => {
    if (!m) return m
    if (m.key) {
        m.id = m.key.id
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = VoidMD.decodeJid(m.fromMe && VoidMD.user.id || m.participant || m.key.participant || m.chat || '')
        if (m.isGroup) m.participant = VoidMD.decodeJid(m.key.participant) || ''
    }
    if (m.message) {
        m.mtype = getContentType(m.message)
        m.msg = m.mtype == 'viewOnceMessage'? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)] : m.message[m.mtype]
        m.body = m.message.conversation || m.msg.caption || m.msg.text || ''
    }
    return m
}

exports.sleep = (ms) => new Promise(r => setTimeout(r, ms))
exports.delay = (ms) => new Promise(r => setTimeout(r, ms))
