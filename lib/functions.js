const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const sleep = ms => delay(ms)

const smsg = (VoidMD, m) => {
    if (m.key) {
        m.id = m.key.id
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = VoidMD.decodeJid(m.fromMe && VoidMD.user.id || m.participant || m.key.participant || m.chat || '')
    }
    if (m.message) {
        m.mtype = Object.keys(m.message)[0]
        m.text = m.message.conversation || m.message[m.mtype]?.text || m.message[m.mtype]?.caption || ''
        m.body = m.text
    }
    return m
}

module.exports = { smsg, sleep, delay }
