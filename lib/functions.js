const { jidDecode } = require("@whiskeysockets/baileys")

const smsg = (VoidMD, m) => {
    if (!m) return m
    let M = JSON.parse(JSON.stringify(m))
    if (!m.key) return

    M.key = m.key
    M.id = m.key.id
    M.isGroup = m.key.remoteJid.endsWith('@g.us')
    M.from = m.key.remoteJid
    M.sender = m.key.participant || m.key.remoteJid
    M.pushName = m.pushName || ''

    if (m.message) {
        M.type = Object.keys(m.message)[0]
        M.msg = m.message[M.type]
        M.text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ''
    }

    M.reply = (text) => VoidMD.sendMessage(M.from, { text }, { quoted: m })
    M.react = (emoji) => VoidMD.sendMessage(M.from, { react: { text: emoji, key: m.key } })

    return M
}

module.exports = { smsg }
