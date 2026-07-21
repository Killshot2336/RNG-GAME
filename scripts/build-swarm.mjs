import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outdir = path.join(root, 'assets');

fs.mkdirSync(outdir, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(root, 'src/main.ts')],
  bundle: true,
  outfile: path.join(outdir, 'swarm.js'),
  format: 'esm',
  target: ['es2020'],
  minify: true,
  sourcemap: true,
  loader: { '.css': 'css' }
});

fs.copyFileSync(path.join(root, 'src/index.css'), path.join(outdir, 'swarm.css'));
console.log('Syndicate Swarm bundled → assets/swarm.js');
