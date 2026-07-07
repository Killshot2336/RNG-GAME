import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const file = path.join(root, 'game.js');
let s = fs.readFileSync(file, 'utf8');
const emojiRe = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
const before = (s.match(emojiRe) || []).length;

function rep(from, to) {
  if (!s.includes(from)) {
    console.warn('MISSING:', from.slice(0, 90));
    return;
  }
  s = s.split(from).join(to);
}

rep("var BUD_ART = '/public/art/strains/leaf-bud.svg';", "var BUD_ART = '/public/art/strains/leaf-bud.png';");
rep("var BOSS_ART = '/public/art/characters/boss-avatar.svg';", "var BOSS_ART = '/public/art/characters/boss-avatar.png';");
rep('name: p.defaultName, avatar: p.avatar, badgeIds', 'name: p.defaultName, avatar: p.portrait, badgeIds');
rep(
  "if (G.name === 'VoidPilot_Aden' || G.name === 'VoidPilot') G.name = p.defaultName;",
  "if (G.name === 'VoidPilot_Aden' || G.name === 'VoidPilot') G.name = p.defaultName;\n    G.avatar = migrateAvatar(G.avatar);"
);
rep(
  `    var imgStyle = 'filter:hue-rotate(' + vis.hue + 'deg) saturate(' + vis.sat + ') drop-shadow(0 6px 8px rgba(0,0,0,0.45))';
    return '<span class="cr-art-wrap cr-art-v' + (artIdx % 6) + '" style="' + wrapStyle + '"><img src="' + strainCardArt(s) + '" alt="" draggable="false" class="voidline-art" data-art-kind="strain" data-strain-id="' + esc(s.id) + '" style="' + imgStyle + '"></span>';`,
  `    var imgStyle = 'filter:saturate(' + vis.sat + ') drop-shadow(0 6px 8px rgba(0,0,0,0.45))';
    return '<div class="cr-art-layered cr-art-v' + (artIdx % 6) + '"><span class="cr-art-terrain cr-arena-' + vis.arenaIdx + '"></span><span class="cr-art-wrap" style="' + wrapStyle + '"><img src="' + strainCardArt(s) + '" alt="" draggable="false" class="voidline-art" data-art-kind="strain" data-strain-id="' + esc(s.id) + '" style="' + imgStyle + '"></span></div>';`
);
rep("var tag = s.planetExclusive ? '🌍' : ((s.parentIds && s.parentIds.length) ? '🧬' : '');", "var tag = s.planetExclusive ? farmIcon('planet') : ((s.parentIds && s.parentIds.length) ? farmIcon('hybrid') : '');");
rep("else { mascot.textContent = '🌱'; mascot.style.filter = 'none'; }", "else { mascot.innerHTML = farmIcon('bud', { img: true, size: '1.5rem' }); }");
rep("var dpsStr = '⚔ ' + dpsVal.toFixed(1) + ' DPS';", "var dpsStr = 'DPS ' + dpsVal.toFixed(1);");
rep(
  `var bossSvgSz = mega ? { w: 140, h: 154 } : { w: 120, h: 132 };
    var bossSvg = generateBossSvgMarkup({ seed: G.bossSeed, hue: bossHue, width: bossSvgSz.w, height: bossSvgSz.h });
    bossSvg = bossSvg.replace('class="cr-art-fallback boss-svg-fallback"', 'class="boss-sprite boss-svg-fallback campaign-boss-hue-' + (bossHue % 12) + '"');
    h += bossSvg;`,
  `h += '<img src="' + BOSS_ART + '" alt="" class="boss-sprite voidline-art campaign-boss-hue-' + (bossHue % 12) + '" data-art-kind="boss" onerror="this.onerror=null;this.src=\\'' + BOSS_ART_FALLBACK + '\\'">';`
);
rep(`if (mega) h += '<div class="boss-mega-tag">⚡ MEGA BOSS · RIFT TWIN PACK</div>';`, `if (mega) h += '<div class="boss-mega-tag">' + farmIcon('mega') + ' MEGA BOSS · RIFT TWIN PACK</div>';`);
rep(`h += '<div class="boss-stage-dps">⚔ ' + dps.toFixed(1) + ' DPS · ' + def.maxSlots + ' slots</div>';`, `h += '<div class="boss-stage-dps">DPS ' + dps.toFixed(1) + ' · ' + def.maxSlots + ' slots</div>';`);
rep(`h += '<div class="home-chest-icon">📦</div><div class="home-chest-label">`, `h += '<div class="home-chest-icon">' + farmIcon('pack') + '</div><div class="home-chest-label">`);
rep(`<div class="home-chest-icon opacity-60">▫</div>`, `<div class="home-chest-icon opacity-60">` + `' + farmIcon('empty') + '` + `</div>`);
rep(
  `function hubOrbBtn(label, actionName, emoji) {
    var actAttr = 'data-action';
    return '<button type="button" class="hub-orb-btn halftone-panel" ' + actAttr + '="' + esc(actionName) + '" title="' + esc(label) + '"><span class="hub-orb-glow"></span><span class="hub-orb-emoji">' + emoji + '</span><span class="hub-orb-label">' + esc(label) + '</span></button>';
  }`,
  `function hubOrbBtn(label, actionName, iconKind) {
    var actAttr = 'data-action';
    return '<button type="button" class="hub-orb-btn halftone-panel" ' + actAttr + '="' + esc(actionName) + '" title="' + esc(label) + '"><span class="hub-orb-glow"></span><span class="hub-orb-icon">' + farmIcon(iconKind, { lg: true }) + '</span><span class="hub-orb-label">' + esc(label) + '</span></button>';
  }`
);
rep(`data-action="toggle-farm">✕ CLOSE</button>`, `data-action="toggle-farm">` + `' + farmIcon('close') + '` + ` CLOSE</button>`);
rep(`if (cleared) h += '<span class="campaign-node-check">✓</span>';`, `if (cleared) h += '<span class="campaign-node-check">' + farmIcon('check') + '</span>';`);
rep(`if (def.isMega) h += '<span class="campaign-node-mega">⚡</span>';`, `if (def.isMega) h += '<span class="campaign-node-mega">' + farmIcon('mega') + '</span>';`);
rep(`hubOrbBtn('TOWER', 'toggle-farm', '🗼') + hubOrbBtn('RAID', 'hub-raid', '⚔') + hubOrbBtn('MUTATION LAB', 'hub-mutation-lab', '🧬')`, `hubOrbBtn('TOWER', 'toggle-farm', 'tower') + hubOrbBtn('RAID', 'hub-raid', 'raid') + hubOrbBtn('MUTATION LAB', 'hub-mutation-lab', 'mutation')`);
rep(`<div style="font-size:2.5rem;margin-bottom:0.5rem">🌀</div>`, `<div style="margin-bottom:0.5rem">` + `' + farmIcon('portal', { xl: true }) + '` + `</div>`);
rep(`: budImg(cs, '2.5rem') : '🧬')`, `: budImg(cs, '2.5rem') : farmIcon('clone', { xl: true }))`);
rep(`[['mutations', 'MUTATIONS', '🧬'], ['strains', 'STRAINS', '📇'], ['decks', 'DECKS', '⚔']]`, `[['mutations', 'MUTATIONS', 'mutation'], ['strains', 'STRAINS', 'strains'], ['decks', 'DECKS', 'decks']]`);
rep(`h += '<span class="index-nav-emoji">' + nav[2] + '</span>`, `h += '<span class="index-nav-icon">' + farmIcon(nav[2], { lg: true }) + '</span>`);
rep(`data-action="map-billings">📁 BILLINGS</button>`, `data-action="map-billings">` + `' + farmIcon('bill') + '` + ` BILLINGS</button>`);
rep(`<div class="roadside-slot-glass">🔒</div><div class="roadside-slot-label">LOCKED</div>`, `<div class="roadside-slot-glass">` + `' + farmIcon('lock') + '` + `</div><div class="roadside-slot-label">LOCKED</div>`);
rep(`<div class="roadside-slot-glass">🔒</div></div>`, `<div class="roadside-slot-glass">` + `' + farmIcon('lock') + '` + `</div></div>`);
rep(`data-action="sf-remove-ask" data-id="' + slotIdx + '">✕</button>`, `data-action="sf-remove-ask" data-id="' + slotIdx + '">` + `' + farmIcon('close') + '` + `</button>`);
rep(`data-action="coop-myshop">🏪 MY ROADSIDE SHOP</button>`, `data-action="coop-myshop">` + `' + farmIcon('shop') + '` + ` MY ROADSIDE SHOP</button>`);
rep(`'<div style="font-size:1.5rem">' + (save.avatar || pl.avatar) + '</div>`, `'<div>' + avatarHtml(migrateAvatar(save.avatar || pl.portrait), '2.5rem') + '</div>`);
rep(`return b ? b.emoji : '';`, `return b ? farmIcon(b.icon) : '';`);
rep(`'<div class="coop-player-av">' + (save.avatar || pl.avatar) + '</div>`, `'<div class="coop-player-av">' + avatarHtml(migrateAvatar(save.avatar || pl.portrait), '2.5rem') + '</div>`);
rep(`'<div class="font-mono text-xs text-green">⚔ ' + dps + ' DPS · ' + rev + '</div>';`, `'<div class="font-mono text-xs text-green">DPS ' + dps + ' · ' + rev + '</div>';`);
rep(`data-close="strain-picker" style="position:static;width:2rem;height:2rem">✕</button>`, `data-close="strain-picker" style="position:static;width:2rem;height:2rem">` + `' + farmIcon('close') + '` + `</button>`);
rep(`data-action="close-merge-lab" style="position:static;width:2rem;height:2rem">✕</button>`, `data-action="close-merge-lab" style="position:static;width:2rem;height:2rem">` + `' + farmIcon('close') + '` + `</button>`);
rep(
  `data-close="profile">✕</button><div class="profile-avatar-lg"><div class="avatar-ring"></div><div class="avatar-inner" style="inset:4px;font-size:1.5rem;border-width:3px">' + G.avatar + '</div>`,
  `data-close="profile">` + `' + farmIcon('close') + '` + `</button><div class="profile-avatar-lg"><div class="avatar-ring"></div><div class="avatar-inner" style="inset:4px;border-width:3px">' + avatarHtml(migrateAvatar(G.avatar), '100%') + '</div>`
);
rep(
  `AVATARS.forEach(function (a) { h += '<button type="button" class="avatar-opt' + (G.avatar === a ? ' selected' : '') + '" data-action="set-avatar" data-av="' + a + '">' + a + '</button>'; });`,
  `AVATARS.forEach(function (a) { h += '<button type="button" class="avatar-opt' + (G.avatar === a ? ' selected' : '') + '" data-action="set-avatar" data-av="' + esc(a) + '">' + avatarHtml(a, '2rem') + '</button>'; });`
);
rep(`'>' + b.emoji + ' ' + b.label + '</option>';`, `'>' + b.label + '</option>';`);
rep(`data-action="switch-player">⇄ SWITCH PLAYER</button>`, `data-action="switch-player">` + `' + farmIcon('swap') + '` + ` SWITCH PLAYER</button>`);
rep(`data-action="open-settings">⚙ SETTINGS</button>`, `data-action="open-settings">` + `' + farmIcon('settings') + '` + ` SETTINGS</button>`);
rep(`data-close="settings" style="background:none;border:none;color:var(--muted);font-size:1.125rem;cursor:pointer">✕</button>`, `data-close="settings" style="background:none;border:none;color:var(--muted);font-size:1.125rem;cursor:pointer">` + `' + farmIcon('close') + '` + `</button>`);
rep(`(helpOpen ? '✕ CLOSE HELP' : '📖 GAME ENCYCLOPEDIA')`, `(helpOpen ? farmIcon('close') + ' CLOSE HELP' : farmIcon('help') + ' GAME ENCYCLOPEDIA')`);
rep(`'? · 🌍 Planet' : '') + ((s.parentIds && s.parentIds.length) ? ' · 🧬 Hybrid' : '');`, `'? · Planet' : '') + ((s.parentIds && s.parentIds.length) ? ' · Hybrid' : '');`);
rep(`data-action="equip-battle" data-id="' + esc(sid) + '">⚔ EQUIP</button>`, `data-action="equip-battle" data-id="' + esc(sid) + '">` + `' + farmIcon('equip') + '` + ` EQUIP</button>`);
rep(`data-action="equip-raid" data-id="' + esc(rsid) + '">⚔ RAID EQUIP</button>`, `data-action="equip-raid" data-id="' + esc(rsid) + '">` + `' + farmIcon('equip') + '` + ` RAID EQUIP</button>`);
rep(`'>⚔ EQUIP</button>';`, `'>` + `' + farmIcon('equip') + '` + ` EQUIP</button>';`);
rep(`data-action="lift-upgrade">🔋 UPGRADE</button>`, `data-action="lift-upgrade">` + `' + farmIcon('upgrade') + '` + ` UPGRADE</button>`);
rep(`'<span class="shop-chest-emoji">' + tier.emoji + '</span>'`, `'<span class="shop-chest-icon">' + farmIcon(tier.icon, { lg: true }) + '</span>'`);
rep(`'<div style="font-size:1.5rem">' + it.emoji + '</div>`, `'<div>' + farmIcon((def.icon || it.icon || 'pack'), { lg: true }) + '</div>`);
rep(`'<div style="font-size:1.875rem">' + p.emoji + '</div>`, `'<div>' + farmIcon(p.icon || 'pack', { lg: true }) + '</div>`);
rep(
  `var av = pl.portrait ? '<img src="' + pl.portrait + '" alt="" style="width:2.5rem;height:2.5rem;object-fit:contain">' : '<div style="font-size:2rem">' + pl.avatar + '</div>';`,
  `var av = avatarHtml(pl.portrait, '2.5rem');`
);
rep(
  `if (pl.portrait) av.innerHTML = '<img src="' + pl.portrait + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
      else av.textContent = G.avatar;`,
  `av.innerHTML = avatarHtml(migrateAvatar(G.avatar), '100%');`
);
rep(`return { TEST: r.name, STATUS: r.ok ? '✓ PASS' : '✗ FAIL', DETAIL: r.detail || '' };`, `return { TEST: r.name, STATUS: r.ok ? 'PASS' : 'FAIL', DETAIL: r.detail || '' };`);

const after = (s.match(emojiRe) || []).length;
fs.writeFileSync(file, s);
console.log('emoji before:', before, 'after:', after, 'removed:', before - after);
