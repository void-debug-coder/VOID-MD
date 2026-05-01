const fs=require('fs');try{fs.rmSync('./session',{recursive:true,force:true})}catch(e){}
console.log('SESSION NUKED ON BOOT 💀')

const {default:makeWASocket,useMultiFileAuthState,Browsers,fetchLatestBaileysVersion}=require('@whiskeysockets/baileys')
const qrcode=require('qrcode')
const express=require('express')
const app=express()
let qrCodeData=null,botConnected=false

app.get('/',(req,res)=>{
    res.send(botConnected?`<h1 style="color:green">💀 CONNECTED 💀</h1>`:
    qrCodeData?`<h1>VOID-MD QR</h1><img src="${qrCodeData}" width="300"><script>setTimeout(()=>location.reload(),5000)</script>`:
    '<h1>Generating QR...</h1><script>setTimeout(()=>location.reload(),3000)</script>')
})
app.listen(process.env.PORT||3000,()=>console.log('Server started'))

async function start(){
    try {
        const {state,saveCreds}=await useMultiFileAuthState('./session')
        const {version}=await fetchLatestBaileysVersion()
        console.log('Using WA version:', version)
        
        const sock=makeWASocket({
            version,
            auth:state,
            browser:Browsers.macOS('Chrome'),
            printQRInTerminal: false,
            syncFullHistory: false,
            markOnlineOnConnect: false
        })
        
        sock.ev.on('creds.update',saveCreds)
        sock.ev.on('connection.update',async(u)=>{
            if(u.qr){
                qrCodeData=await qrcode.toDataURL(u.qr)
                console.log('QR GENERATED 💀')
            }
            if(u.connection==='close'){
                const code=u.lastDisconnect?.error?.output?.statusCode
                console.log('Closed:',code)
                qrCodeData=null;botConnected=false
                if(code!=401) setTimeout(start,3000)
            }
            if(u.connection==='open'){
                console.log('CONNECTED 💀')
                botConnected=true;qrCodeData=null
            }
        })
    } catch(e) {
        console.log('Start error:', e)
        setTimeout(start, 3000)
    }
}
start()
