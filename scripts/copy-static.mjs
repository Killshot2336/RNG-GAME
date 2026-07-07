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

for (const f of ['index.html', 'catalog.js', 'game.js']) {
  cp(path.join(root, f), path.join(dist, f));
}

cpDir(path.join(root, 'public'), path.join(dist, 'public'));
cpDir(path.join(root, 'api'), path.join(dist, 'api'));

console.log('Static monolith copied to dist/');
