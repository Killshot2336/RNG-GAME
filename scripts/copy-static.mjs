import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');

function cp(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function cpDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    const s = path.join(srcDir, name);
    const d = path.join(destDir, name);
    if (fs.statSync(s).isDirectory()) cpDir(s, d);
    else cp(s, d);
  }
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const f of ['index.html', 'chronos.css', 'chronos.js', 'cloud-auth.js', 'player-core.js']) {
  const src = path.join(root, f);
  if (fs.existsSync(src)) cp(src, path.join(dist, f));
}

cpDir(path.join(root, 'public'), path.join(dist, 'public'));
cpDir(path.join(root, 'api'), path.join(dist, 'api'));
cpDir(path.join(root, 'docs'), path.join(dist, 'docs'));
cpDir(path.join(root, 'legacy'), path.join(dist, 'legacy'));

console.log('Chronos warband copied to dist/');
