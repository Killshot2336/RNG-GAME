import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const game = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const actions = new Set();
for (const m of game.matchAll(/data-action="([^"]+)"/g)) actions.add(m[1]);
for (const m of html.matchAll(/data-action="([^"]+)"/g)) actions.add(m[1]);

const handled = new Set();
for (const m of game.matchAll(/act==='([^']+)'/g)) handled.add(m[1]);
for (const m of game.matchAll(/if\(act==='([^']+)'\)/g)) handled.add(m[1]);
handled.add('pick-player');
handled.add('equip-floor');
handled.add('set-badge');
handled.add('sf-strain');
handled.add('sf-price');
handled.add('set-avatar');
handled.add('set-bet');

const special = new Set(['counter-input', 'planet-rename-pending', 'planet-rename']);
const missing = [...actions].filter((a) => !handled.has(a) && !special.has(a));

console.log('Actions in UI:', [...actions].sort().join(', '));
console.log('Handled in runAction:', [...handled].sort().join(', '));
if (missing.length) {
  console.error('MISSING handlers:', missing.join(', '));
  process.exit(1);
}
console.log('All actions accounted for.');

if (game.includes('data-action="farm-tab" data-tab="')) {
  console.error('Farm tabs still use conflicting data-tab attribute');
  process.exit(1);
}
if (!html.includes('data-action="open-profile"')) {
  console.error('Profile button missing data-action="open-profile"');
  process.exit(1);
}
console.log('Structural checks passed.');
