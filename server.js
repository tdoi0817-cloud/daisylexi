const http = require('http')
const https = require('https')
const fs = require('fs')
const PORT = 3001

let CLAUDE_KEY = process.env.CLAUDE_API_KEY || ''
if (!CLAUDE_KEY && fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local','utf8').split('\n').forEach(line => {
    const eq = line.indexOf('=')
    if (eq > 0) {
      const k = line.slice(0,eq).trim()
      const v = line.slice(eq+1).trim()
      if (k === 'CLAUDE_API_KEY') CLAUDE_KEY = v
    }
  })
}

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*')
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers','Content-Type')
  if (req.method==='OPTIONS'){res.writeHead(204);res.end();return}
  if (req.method==='POST' && req.url.includes('claude-proxy')) {
    if (!CLAUDE_KEY) {
      res.writeHead(500,{'Content-Type':'application/json'})
      res.end(JSON.stringify({error:{message:'CLAUDE_API_KEY not set in .env.local'}}))
      return
    }
    let body = ''
    req.on('data', c => body += c)
    req.on('end', () => {
      const payload = body
      const opt = {
        hostname:'api.anthropic.com',path:'/v1/messages',method:'POST',
        headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload),'x-api-key':CLAUDE_KEY,'anthropic-version':'2023-06-01'}
      }
      const pr = https.request(opt, r => {
        let d=''
        r.on('data',c=>d+=c)
        r.on('end',()=>{res.writeHead(r.statusCode,{'Content-Type':'application/json'});res.end(d)})
      })
      pr.on('error',e=>{res.writeHead(500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{message:e.message}}))})
      pr.write(payload);pr.end()
    })
    return
  }
  res.writeHead(404);res.end('Not found')
}).listen(PORT,()=>{
  console.log('✅ Proxy: http://localhost:'+PORT)
  console.log('🔑 Claude key: '+(CLAUDE_KEY?'✅ loaded':'❌ missing — check .env.local'))
})
