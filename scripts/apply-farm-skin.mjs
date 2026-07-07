import fs from 'fs';
import path from 'path';

const cssPath = path.resolve('index.css');
const original = fs.readFileSync(cssPath, 'utf8');
let c = original;

const rootBlock = `    :root {
      --void: #1c120c; --void-deep: #0c0805; --panel: #2b1b11;
      --wood-light: #402b1b; --wood-dark: #1f120a;
      --leaf: #7ca61e; --leaf-dark: #43610b;
      --gold: #f59e0b; --gold-dark: #b45309;
      --terracotta: #ea580c; --terracotta-dark: #9a3412;
      --neon-purple: #402b1b; --neon-glow: #7ca61e; --green: #7ca61e;
      --pink: #ea580c; --cyan: #b45309; --muted: #a68b6b; --text: #f5e6d3;
      --ink: #0c0805;
      --glass-skin: linear-gradient(165deg, #402b1b 0%, #2b1b11 48%, #1f120a 100%);
      --glass-blur: none;
      --glass-border: 4px solid #0c0805;
      --farm-shadow: 0 8px 0 #0c0805, inset 0 -6px 0 rgba(0, 0, 0, 0.5);
      --farm-shadow-sm: 0 4px 0 #0c0805, inset 0 -3px 0 rgba(0, 0, 0, 0.45);
      --ease-os: cubic-bezier(0.16, 1, 0.3, 1);
      --font-display: "Fredoka", "Audiowide", system-ui, sans-serif;
      --font-body: "Exo 2", system-ui, sans-serif;
      --font-mono: "Share Tech Mono", monospace;
    }`;

c = c.replace(/    :root \{[\s\S]*?    \}/, rootBlock);

const pairs = [
  ['backdrop-filter: var(--glass-blur);\n      -webkit-backdrop-filter: var(--glass-blur);\n      ', ''],
  ['.backdrop-gradient { position: fixed; inset: 0; pointer-events: none; background: radial-gradient(ellipse at 50% 30%, rgba(56, 189, 248, 0.1) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(168, 85, 247, 0.08) 0%, var(--void-deep) 72%); }',
   '.backdrop-gradient { position: fixed; inset: 0; pointer-events: none; background: radial-gradient(ellipse at 50% 20%, rgba(124, 166, 30, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 85% 90%, rgba(245, 158, 11, 0.06) 0%, var(--void-deep) 70%); }'],
  ['border-left: var(--glass-border);\n      border-right: var(--glass-border);\n      box-shadow: 0 0 60px rgba(3, 7, 18, 0.85), 0 0 120px rgba(56, 189, 248, 0.08);',
   'border-left: 3px solid var(--ink);\n      border-right: 3px solid var(--ink);\n      box-shadow: 0 0 40px rgba(12, 8, 5, 0.65), inset 0 0 80px rgba(0, 0, 0, 0.25);'],
  ['.void-bg { background-color: var(--void); background-image: radial-gradient(ellipse 120% 80% at 50% -20%, rgba(56, 189, 248, 0.14) 0%, transparent 55%), radial-gradient(ellipse 80% 60% at 100% 100%, rgba(250, 204, 21, 0.08) 0%, transparent 50%); }',
   '.void-bg { background-color: var(--void); background-image: radial-gradient(ellipse 120% 70% at 50% -10%, rgba(124, 166, 30, 0.12) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 100% 100%, rgba(245, 158, 11, 0.07) 0%, transparent 48%), repeating-linear-gradient(0deg, transparent 0 23px, rgba(0,0,0,0.04) 23px 24px); }'],
  ['.void-bg::before { content: ""; position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.7) 0%, transparent 100%), radial-gradient(1px 1px at 72% 42%, rgba(255,255,255,0.6) 0%, transparent 100%), radial-gradient(1.5px 1.5px at 55% 15%, rgba(250,204,21,0.7) 0%, transparent 100%); animation: star-twinkle 4s ease-in-out infinite alternate; }',
   '.void-bg::before { content: ""; position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(2px 2px at 12% 25%, rgba(124,166,30,0.25) 0%, transparent 100%), radial-gradient(1.5px 1.5px at 68% 38%, rgba(245,158,11,0.2) 0%, transparent 100%), radial-gradient(2px 2px at 48% 72%, rgba(67,97,11,0.18) 0%, transparent 100%); animation: star-twinkle 5s ease-in-out infinite alternate; }'],
  ['@keyframes neon-pulse { 0%,100%{box-shadow:0 0 15px rgba(168,85,247,0.35), inset 0 1px 0 rgba(255,255,255,0.08)} 50%{box-shadow:0 0 22px rgba(168,85,247,0.55), 0 0 45px rgba(57,255,20,0.12)} }',
   '@keyframes neon-pulse { 0%,100%{box-shadow:var(--farm-shadow), 0 0 12px rgba(245,158,11,0.2)} 50%{box-shadow:var(--farm-shadow), 0 0 20px rgba(245,158,11,0.35)} }'],
  ['@keyframes neon-pulse-green { 0%,100%{box-shadow:0 0 15px rgba(57,255,20,0.35)} 50%{box-shadow:0 0 24px rgba(57,255,20,0.55)} }',
   '@keyframes neon-pulse-green { 0%,100%{box-shadow:var(--farm-shadow), 0 0 12px rgba(124,166,30,0.25)} 50%{box-shadow:var(--farm-shadow), 0 0 22px rgba(124,166,30,0.45)} }'],
  ['@keyframes chromatic-shift { 0%,100%{text-shadow:-1px 0 rgba(255,0,80,0.35), 1px 0 rgba(0,240,255,0.35)} 50%{text-shadow:-2px 0 rgba(255,0,80,0.5), 2px 0 rgba(0,240,255,0.5)} }',
   '@keyframes chromatic-shift { 0%,100%{text-shadow:0 2px 0 var(--ink), 0 0 8px rgba(245,158,11,0.25)} 50%{text-shadow:0 2px 0 var(--ink), 0 0 14px rgba(124,166,30,0.35)} }'],
  ['.brand-sub { font-family: var(--font-mono); font-size: 0.55rem; letter-spacing: 0.35em; color: rgba(167,139,250,0.7); text-transform: uppercase; }',
   '.brand-sub { font-family: var(--font-mono); font-size: 0.55rem; letter-spacing: 0.35em; color: rgba(245,158,11,0.75); text-transform: uppercase; }'],
  ['#bottom-dock,\n    #hud-xp-strip,', '#hud-xp-strip,'],
  ['box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06);', 'box-shadow: var(--farm-shadow);'],
  ['.glass-panel { background: var(--glass-skin) !important; border: var(--glass-border) !important; }',
   '.glass-panel { background: var(--glass-skin) !important; border: var(--glass-border) !important; box-shadow: var(--farm-shadow) !important; }'],
  ['.game-btn { border-radius: 10px; }', `.game-btn {
      border-radius: 10px;
      background: linear-gradient(180deg, #5a3d28 0%, #402b1b 40%, #2b1b11 100%);
      box-shadow: 0 6px 0 var(--ink), inset 0 2px 0 rgba(255,255,255,0.1), inset 0 -4px 0 rgba(0,0,0,0.35);
    }
    .game-btn-green {
      background: linear-gradient(180deg, #9bc424 0%, #7ca61e 45%, #43610b 100%);
      box-shadow: 0 6px 0 var(--ink), inset 0 2px 0 rgba(255,255,255,0.15), inset 0 -4px 0 rgba(0,0,0,0.3);
    }`],
  ['.game-btn-green { box-shadow: 0 0 18px rgba(57,255,20,0.2), inset 0 1px 0 rgba(255,255,255,0.08); }', ''],
  ['.overlay-panel { border-radius: 1.5rem; box-shadow: 0 0 60px rgba(3, 7, 18, 0.65); }',
   '.overlay-panel { border-radius: 1.25rem; box-shadow: var(--farm-shadow), 0 16px 48px rgba(0,0,0,0.55); }'],
  ['#bottom-dock { border-top: var(--glass-border); border-radius: 0; box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.4); }', ''],
  ['#hud-xp-strip { border-bottom: var(--glass-border); }', '#hud-xp-strip { border-bottom: 3px solid var(--ink); box-shadow: 0 4px 0 var(--ink); }'],
];

for (const [from, to] of pairs) {
  if (!c.includes(from) && from) continue;
  c = c.split(from).join(to);
}

// bottom dock block replacement
c = c.replace(
  /    #bottom-dock \{\n      position: relative; z-index: 30; flex-shrink: 0;\n      display: flex; justify-content: space-around;\n      padding: 0\.5rem 0\.5rem calc\(0\.65rem \+ env\(safe-area-inset-bottom, 0\)\);\n    \}/,
  `    #bottom-dock {
      position: relative; z-index: 30; flex-shrink: 0;
      display: flex; justify-content: space-around; align-items: flex-end;
      padding: 0.55rem 0.5rem calc(0.5rem + env(safe-area-inset-bottom, 0));
      background: linear-gradient(180deg, #5a3d28 0%, #402b1b 35%, #2b1b11 70%, #1f120a 100%);
      border-top: 4px solid var(--ink);
      border-radius: 1.1rem 1.1rem 0 0;
      box-shadow: 0 -6px 0 var(--ink), inset 0 3px 0 rgba(255,255,255,0.08), inset 0 -4px 0 rgba(0,0,0,0.4);
    }`
);

c = c.replace(
  /    \.nav-btn\.active \{ color: #FACC15; filter: drop-shadow\(0 0 10px rgba\(250,204,21,0\.65\)\); transform: translateY\(-2px\); \}/,
  `    .nav-btn.active {
      color: var(--gold);
      filter: drop-shadow(0 2px 0 var(--ink)) drop-shadow(0 0 8px rgba(245,158,11,0.45));
      transform: translateY(-5px) scale(1.15) rotate(-1.5deg);
    }`
);

c = c.replace(
  /\.game-btn:active \{ transform: translateY\(0\) scale\(0\.97\); \}/,
  '.game-btn:active { transform: translateY(4px) scale(0.96); box-shadow: 0 2px 0 var(--ink), inset 0 2px 0 rgba(0,0,0,0.2) !important; }'
);

c = c.replace(
  /\.game-btn:disabled \{ opacity: 0\.4; cursor: not-allowed; transform: none; \}/,
  '.game-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: 0 4px 0 var(--ink) !important; }'
);

// halftone panel block
c = c.replace(
  /    \/\* —— AAA tab overhaul: halftone glass OS skin —— \*\/[\s\S]*?    \.glass-inset \{[\s\S]*?    \}/,
  `    /* —— Backyard farm panel skin (wood planks) —— */
    .halftone-panel {
      position: relative; overflow: hidden;
      background: linear-gradient(165deg, #402b1b 0%, #2b1b11 50%, #1f120a 100%) !important;
      border: 4px solid var(--ink) !important;
      box-shadow: var(--farm-shadow) !important;
    }
    .halftone-panel::before {
      content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 0; opacity: 0.12;
      background: repeating-linear-gradient(90deg, transparent 0 18px, rgba(0,0,0,0.35) 18px 19px);
    }
    .halftone-panel::after {
      content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 1; opacity: 0.08;
      background-image: radial-gradient(circle, rgba(0, 0, 0, 0.8) 1px, transparent 1px);
      background-size: 5px 5px; mix-blend-mode: multiply;
    }
    .halftone-panel > * { position: relative; z-index: 2; }
    .ink-border { border: 4px solid var(--ink) !important; box-shadow: var(--farm-shadow) !important; }
    .farm-screen .ink-border { margin-bottom: 0.65rem; }
    .glass-inset {
      background: linear-gradient(165deg, #3a2818 0%, #2b1b11 55%, #1c120c 100%);
      border: 4px solid var(--ink); border-radius: 1rem;
      box-shadow: inset 0 4px 8px rgba(0,0,0,0.35), 0 4px 0 var(--ink);
    }`
);

// append shell hooks before farm-icon section if missing
if (!c.includes('.farm-backyard')) {
  c = c.replace(
    '    /* Art pipeline — icon labels + layered card composites (no emoji glyphs) */',
    `    .farm-backyard { background-color: var(--void); }
    .hud-level-badge {
      font-size: 0.55rem; font-weight: 700; padding: 2px 6px; border-radius: 6px;
      background: linear-gradient(135deg, #7ca61e, #43610b); color: #f5f0e0;
      border: 2px solid var(--ink); box-shadow: 0 2px 0 var(--ink);
    }
    #plant-mascot { display: flex; align-items: center; justify-content: center; }
    #plant-mascot .farm-icon-img { width: 1.75rem; height: 1.75rem; }

    /* Art pipeline — icon labels + layered card composites (no emoji glyphs) */`
  );
}

// global color swaps (safe)
const swaps = [
  ['backdrop-filter: blur(10px); ', ''],
  ['backdrop-filter: blur(12px); ', ''],
  ['backdrop-filter: blur(6px); ', ''],
  ['rgba(10, 15, 30, 0.88), rgba(3, 7, 18, 0.95)', '#5a3d28, #2b1b11'],
  ['rgba(10, 15, 30, 0.9), rgba(3, 7, 18, 0.96)', '#3a2818, #1c120c'],
  ['rgba(10, 15, 30, 0.92), rgba(3, 7, 18, 0.98)', '#5a3d28, #2b1b11'],
  ['rgba(10, 15, 30, 0.9), rgba(3, 7, 18, 0.95)', '#402b1b, #2b1b11'],
  ['#39FF14', 'var(--leaf)'],
  ['#4ADE80', 'var(--leaf)'],
  ['#FACC15', 'var(--gold)'],
  ['#A855F7', 'var(--terracotta)'],
  ['#38BDF8', 'var(--gold-dark)'],
  ['#030712', 'var(--ink)'],
  ['#0B001A', 'var(--ink)'],
  ['color: #4ADE80;', 'color: var(--leaf);'],
  ['color: #38BDF8;', 'color: var(--gold-dark);'],
  ['color: #A855F7;', 'color: var(--terracotta);'],
  ['color: #22D3EE;', 'color: var(--gold-dark);'],
  ['color: #F472B6;', 'color: var(--terracotta);'],
  ['color: #C084FC;', 'color: var(--gold);'],
];
for (const [a, b] of swaps) c = c.split(a).join(b);

if (c.length < original.length * 0.85) {
  console.error('ABORT: CSS shrank too much', original.length, '->', c.length);
  process.exit(1);
}

fs.writeFileSync(cssPath, c);
console.log('Applied farm skin. Lines:', c.split('\n').length);
