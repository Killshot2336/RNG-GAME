/**
 * Generates VOIDLINE_PROJECT_GUIDE.md — full repo snapshot + screenshot embeds.
 * Run: node scripts/capture-screenshots.mjs && node scripts/generate-project-guide.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, 'docs');
const shotDir = path.join(outDir, 'screenshots');
const outFile = path.join(outDir, 'VOIDLINE_PROJECT_GUIDE.md');

const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'docs']);
const TEXT_EXTS = new Set([
  '.html', '.css', '.js', '.mjs', '.ts', '.tsx', '.json', '.sql', '.md', '.svg', '.ps1',
]);
const LANG = {
  '.html': 'html', '.css': 'css', '.js': 'javascript', '.mjs': 'javascript',
  '.ts': 'typescript', '.tsx': 'tsx', '.json': 'json', '.sql': 'sql', '.md': 'markdown', '.svg': 'xml',
};

function walk(dir, base = '') {
  const entries = [];
  let names;
  try { names = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return entries; }
  names.sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const ent of names) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const rel = base ? base + '/' + ent.name : ent.name;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      entries.push({ type: 'dir', rel });
      entries.push(...walk(full, rel));
    } else {
      entries.push({ type: 'file', rel, full, ext: path.extname(ent.name).toLowerCase() });
    }
  }
  return entries;
}

function treeLines(entries) {
  const lines = [];
  for (const e of entries) {
    if (e.type === 'dir') lines.push(e.rel + '/');
  }
  return lines;
}

function readText(full) {
  try {
    const buf = fs.readFileSync(full);
    if (buf.length > 2_500_000) return '/* File too large to embed (' + buf.length + ' bytes) — see repository. */';
    return buf.toString('utf8');
  } catch (e) {
    return '/* Could not read file: ' + e.message + ' */';
  }
}

function screenshotSection() {
  const shots = [
    ['01-auth-gate.png', 'Auth gate — guest or Gmail sign-in'],
    ['02-home.png', 'HOME — island hub, START, PARTY, idle & rocket bubbles'],
    ['03-shop.png', 'SHOP — Nebula Revenue Grid, packs & blitz'],
    ['04-index-strains.png', 'INDEX — strain collection binder'],
    ['05-index-mutations.png', 'INDEX — mutations / fuse lab'],
    ['06-group.png', 'GROUP — family market & roadside shops'],
    ['07-map-locked.png', 'MAP — locked until rocket unlock'],
    ['08-idle-empire.png', 'Idle Empire — Adventure Capitalist buildings'],
    ['09-party-popup.png', 'PARTY — Dungeon / Campaign / Battle modes'],
    ['10-profile.png', 'Profile — modifiers, stats, badges'],
    ['11-settings.png', 'Settings — cloud account & help'],
    ['12-battle-pass.png', 'Battle Pass — season tiers & challenges'],
    ['13-campaign-trail.png', 'Campaign trail — node progression'],
    ['14-map-scan.png', 'MAP Scan — galaxy grid & mining'],
    ['15-map-farm.png', 'MAP Farm — portal conveyor upgrades'],
    ['16-map-index.png', 'MAP Index — planet book & sell'],
    ['17-co-op-battle.png', 'Co-op dungeon battle arena'],
  ];
  let h = '## Screen Gallery\n\n';
  h += 'Screenshots captured from the live game shell (mobile viewport).\n\n';
  for (const [file, caption] of shots) {
    const exists = fs.existsSync(path.join(shotDir, file));
    if (!exists) {
      h += '### ' + caption + '\n\n*Screenshot pending — run `node scripts/capture-screenshots.mjs`*\n\n';
      continue;
    }
    h += '### ' + caption + '\n\n';
    h += '<p align="center"><img src="screenshots/' + file + '" alt="' + caption + '" width="320" /></p>\n\n';
  }
  return h;
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const entries = walk(root);
  const files = entries.filter((e) => e.type === 'file' && TEXT_EXTS.has(e.ext));

  const byDir = {};
  for (const f of files) {
    const dir = path.dirname(f.rel) || '.';
    if (!byDir[dir]) byDir[dir] = [];
    byDir[dir].push(f);
  }

  let md = '';
  md += '<div align="center">\n\n';
  md += '# 🌌 Voidline Galaxy Farm\n';
  md += '### Complete Project Guide\n\n';
  md += '*Exact filesystem layout · full source code · UI screenshots*\n\n';
  md += '</div>\n\n';
  md += '| | |\n|---|---|\n';
  md += '| **Generated** | `' + new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC` |\n';
  md += '| **Source files** | `' + files.length + '` |\n';
  md += '| **Screenshots** | `docs/screenshots/` (17 screens) |\n\n';
  md += '---\n\n';
  md += '## Table of Contents\n\n';
  md += '- [Screen Gallery](#screen-gallery)\n';
  md += '- [Project Structure](#project-structure)\n';
  md += '- [File Index](#file-index)\n';
  md += '- [Source Files by Folder](#source-files-by-folder)\n';
  md += '- [Full Source Files](#source-files)\n\n';
  md += '---\n\n';
  md += screenshotSection();
  md += '---\n\n';
  md += '## Project Structure\n\n';
  md += '```\n';
  md += 'workspace/\n';
  for (const line of treeLines(entries)) {
    md += '  ' + line + '\n';
  }
  md += '```\n\n';
  md += '---\n\n';
  md += '## File Index\n\n';
  md += '| Path | Type | Size |\n|------|------|------|\n';
  for (const f of files) {
    const anchor = f.rel.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const bytes = fs.statSync(f.full).size;
    const size = bytes < 1024 ? bytes + ' B' : bytes < 1048576 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / 1048576).toFixed(2) + ' MB';
    md += '| [`' + f.rel + '`](#file-' + anchor + ') | `' + f.ext + '` | ' + size + ' |\n';
  }
  md += '\n---\n\n';
  md += '## Source Files by Folder\n\n';
  for (const dir of Object.keys(byDir).sort()) {
    md += '### `' + dir + '/`\n\n';
    for (const f of byDir[dir]) {
      const anchor = f.rel.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      md += '- [`' + path.basename(f.rel) + '`](#file-' + anchor + ')\n';
    }
    md += '\n';
  }
  md += '---\n\n';
  md += '## Source Files\n\n';

  for (const f of files) {
    const anchor = 'file-' + f.rel.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const lang = LANG[f.ext] || 'text';
    const content = readText(f.full);
    md += '### `' + f.rel + '` {#' + anchor + '}\n\n';
    md += '```' + lang + '\n';
    md += content;
    if (!content.endsWith('\n')) md += '\n';
    md += '```\n\n';
    md += '---\n\n';
  }

  fs.writeFileSync(outFile, md);
  const sizeMb = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2);
  console.log('Wrote', outFile, '(' + sizeMb + ' MB,', files.length, 'files)');
}

main();
