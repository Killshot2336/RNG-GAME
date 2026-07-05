import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

const port = Number(process.env.PORT || 3458);
http.createServer((req, res) => {
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  const file = path.join(root, decodeURIComponent(url));
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'text/plain' });
  res.end(fs.readFileSync(file));
}).listen(port, '127.0.0.1', () => {
  console.log('Test server http://127.0.0.1:' + port);
});
