// Neko Server - API de presença + capas do Neko Client.
// POST /ping?name=Nick[&cape=neko-gato]  -> retorna os nicks ativos (um por linha). Compatível com clientes antigos.
// GET  /capes                            -> "nick=capeId" (um por linha) para quem está ativo e tem capa.
const http = require('http');
const seen = new Map();          // nick(lowercase) -> { t: timestamp, cape: id | null }
const TTL = 60_000;
const NAME = /^[A-Za-z0-9_]{1,16}$/;
// Só capas prontas do client (as texturas ficam dentro do mod): ninguém consegue mandar imagem para o servidor.
const CAPES = new Set(['neko-gato', 'neko-pata', 'neko-sentado']);

function active() {
  const now = Date.now();
  const out = [];
  for (const [nick, info] of seen) {
    if (now - info.t > TTL) seen.delete(nick);
    else out.push([nick, info.cape]);
  }
  return out;
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
    const cape = (url.searchParams.get('cape') || '').trim().toLowerCase();
    seen.set(name.toLowerCase(), { t: Date.now(), cape: CAPES.has(cape) ? cape : null });
    return reply(res, 200, active().map(([n]) => n).join('\n'));
  }
  if (url.pathname === '/capes') {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return reply(res, 405, 'method not allowed');
    }
    return reply(res, 200, active().filter(([, c]) => c).map(([n, c]) => `${n}=${c}`).join('\n'));
  }
  return reply(res, 404, 'not found');
});
server.listen(Number(process.env.PORT) || 3000, '0.0.0.0', () => {
  console.log('Neko server rodando na porta ' + (process.env.PORT || 3000));
});
