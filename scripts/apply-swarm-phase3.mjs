import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const gamePath = path.join(root, 'game.js');
let src = fs.readFileSync(gamePath, 'utf8');

// Remove duplicate tail corruption after first IIFE close
const corrupt = '\n})();\netPlayerId:';
const corruptIdx = src.indexOf(corrupt);
if (corruptIdx !== -1) {
  src = src.slice(0, corruptIdx + '\n})();'.length) + '\n';
}

const swarmStart = '  var VoidlineSwarm = (function () {';
const swarmEnd = '  })();\n\n  window.SwarmBugCrusher = SwarmBugCrusher;';
const s0 = src.indexOf(swarmStart);
const s1 = src.indexOf(swarmEnd);
if (s0 === -1 || s1 === -1) {
  console.error('VoidlineSwarm markers not found', s0, s1);
  process.exit(1);
}

const newSwarm = fs.readFileSync(path.join(root, 'scripts', 'voidline-swarm-phase3.fragment.js'), 'utf8');
src = src.slice(0, s0) + newSwarm + src.slice(s1 + swarmEnd.length);
fs.writeFileSync(gamePath, src, 'utf8');
console.log('Patched game.js VoidlineSwarm, bytes:', src.length);
