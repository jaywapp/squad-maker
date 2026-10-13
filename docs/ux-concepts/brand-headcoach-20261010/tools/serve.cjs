const http = require('http'), fs = require('fs'), path = require('path');
const root = process.argv[2], port = +process.argv[3];
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' };
http.createServer((q, r) => {
  let f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  if (!f.startsWith(path.resolve(root))) { r.writeHead(403); return r.end(); }
  fs.stat(f, (e, st) => {
    if (!e && st.isDirectory()) f = path.join(f, 'index.html');
    fs.readFile(f, (e2, d) => { if (e2) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
  });
}).listen(port, '127.0.0.1');
