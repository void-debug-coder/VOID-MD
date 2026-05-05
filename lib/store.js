const fs = require('fs')
const path = require('path')

const STORE_FILE = path.join(__dirname, '../data/store.json')

class Store {
    constructor() {
        this.contacts = {}
        this.messages = {}
        this.readFromFile()
    }

    readFromFile() {
        try {
            if (fs.existsSync(STORE_FILE)) {
                const data = JSON.parse(fs.readFileSync(STORE_FILE))
                this.contacts = data.contacts || {}
                this.messages = data.messages || {}
            }
        } catch (e) {
            console.log('[STORE] Read error:', e.message)
        }
    }

    writeToFile() {
        try {
            fs.writeFileSync(STORE_FILE, JSON.stringify({
                contacts: this.contacts,
                messages: this.messages
            }, null, 2))
        } catch (e) {
            console.log('[STORE] Write error:', e.message)
        }
    }

    bind(ev) {
        ev.on('contacts.update', (update) => {
            for (let contact of update) {
                this.contacts[contact.id] = contact
            }
        })
    }

    loadMessage(jid, id) {
        return this.messages[jid]?.[id] || null
    }

    saveMessage(jid, id, msg) {
        if (!this.messages[jid]) this.messages[jid] = {}
        this.messages[jid][id] = msg
        const keys = Object.keys(this.messages[jid])
        if (keys.length > 100) delete this.messages[jid][keys[0]]
    }
}

module.exports = new Store()
