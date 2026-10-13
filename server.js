// Neko Server - API de presença do Neko Client.
// Compatível com o cliente: POST /ping?name=Nick retorna os nicks ativos separados por linha.
const http = require('http');
const seen = new Map();
const TTL = 60_000;
const NAME = /^[A-Za-z0-9_]{1,16}$/;

function activeNames() {
  const now = Date.now();
  const active = [];
  for (const [nick, lastSeen] of seen) {
    if (now - lastSeen > TTL) seen.delete(nick);
    else active.push(nick);
  }
  return active;
}
function reply(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
    return reply(res, 200, 'Neko server ok');
  }
  if (url.pathname === '/ping') {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return reply(res, 405, 'method not allowed');
    }
    const name = (url.searchParams.get('name') || '').trim();
    if (!NAME.test(name)) return reply(res, 400, 'bad name');
    seen.set(name.toLowerCase(), Date.now());
    return reply(res, 200, activeNames().join('\n'));
  }
  return reply(res, 404, 'not found');
});
server.listen(Number(process.env.PORT) || 3000, '0.0.0.0', () => {
  console.log('Neko server rodando na porta ' + (process.env.PORT || 3000));
});
