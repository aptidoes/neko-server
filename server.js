// Servidor Neko: guarda quem está usando o Neko Client (em memória, sem dependências).
// Rodar: node server.js   (porta via variável PORT, padrão 3000)
const http = require('http');
const seen = new Map();           // nick (minúsculo) -> último aviso
const TTL = 60 * 1000;            // some da lista se ficar 60s sem avisar
const NAME = /^[A-Za-z0-9_]{1,16}$/;

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/ping' && req.method === 'POST') {
    const name = url.searchParams.get('name') || '';
    if (!NAME.test(name)) { res.writeHead(400); return res.end('bad name'); }
    seen.set(name.toLowerCase(), Date.now());
    const now = Date.now();
    const list = [];
    for (const [n, t] of seen) { if (now - t > TTL) seen.delete(n); else list.push(n); }
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end(list.join('\n'));
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Neko server ok');
}).listen(process.env.PORT || 3000, () => console.log('Neko server rodando'));
