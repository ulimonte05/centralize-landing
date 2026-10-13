// Sirve una variante de la home en su propio puerto, proxyando al dev server de Astro (4321).
// Uso: node scripts/variant-proxy.mjs un-dia 4322
import http from 'node:http';
const [variant, port] = process.argv.slice(2);
http.createServer((req, res) => {
  const path = req.url === '/' || req.url.startsWith('/?') ? `/v/${variant}${req.url.slice(1)}` : req.url;
  const p = http.request({ host: '127.0.0.1', port: 4321, path, method: req.method, headers: { ...req.headers, host: 'localhost:4321' } }, r => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
  p.on('error', () => { res.writeHead(502); res.end('dev server 4321 apagado'); });
  req.pipe(p);
}).listen(+port, () => console.log(`variante ${variant} en http://localhost:${port}`));
