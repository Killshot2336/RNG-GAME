/* VOIDLINE CHRONOS — canvas game client */
(function () {
  'use strict';

  var D = window.ChronosData;
  if (!D) {
    console.error('ChronosData missing');
    return;
  }

  var SAVE_PREFIX = 'voidline_chronos_v2_';
  var WORLD_KEY = 'voidline_chronos_world_v2';
  var ROOM = D.ROOM_ID || 'voidline-chronos';
  var SAVE_VERSION = 2;

  var WARBAND = D.WARBAND;
  var ERAS = D.ERAS;
  var PLANETS = D.PLANETS;
  var SHARDS = D.SHARDS;
  var RECIPES = D.RECIPES;
  var RELICS = D.RELICS;
  var TREE = D.TREE;
  var TOWER_UPS = D.TOWER_UPS;
  var STORY = D.STORY;
  var FISH = D.FISH;
  var ART = D.ART || {};

  /* ── Game state ── */
  var G = {
    scene: 'boot',
    activeId: null,
    P: null,
    WORLD: null,
    toast: '',
    toastT: 0,
    shake: 0,
    syncLabel: 'LOCAL',
    hits: [],
    particles: [],
    flash: 0,
    storyOpen: null,
    forge: [null, null],
    selNode: 'root',
    tower: null,
    extract: null,
    fishCast: false,
    time: 0,
    pointer: { x: 0, y: 0, down: false },
    remoteVersion: 0
  };

  var canvas, ctx, W = 390, H = 844, dpr = 1;
  var images = {};
  var lastTs = 0;
  var bc = null;
  var audioCtx = null;

  /* Chronolith studio palette — warm ash, copper, cyan core */
  var INK = '#060508';
  var PANEL = 'rgba(12,10,14,0.78)';
  var COPPER = '#d4a05a';
  var COPPER_DIM = 'rgba(212,160,90,0.45)';
  var CORE = '#5ee0d0';
  var CORE_DIM = 'rgba(94,224,208,0.4)';
  var TEXT = '#f2ebe0';
  var TEXT_DIM = '#9a9080';
  var FONT_UI = 'Trebuchet MS, "Segoe UI", sans-serif';
  var FONT_DISPLAY = 'Georgia, "Palatino Linotype", "Book Antiqua", serif';

  /* ── Utils ── */
  function daySeed() { return Math.floor(Date.now() / 86400000); }

  function warband(id) {
    return WARBAND.find(function (w) { return w.id === id; }) || WARBAND[0];
  }

  function toast(msg) {
    G.toast = String(msg || '');
    G.toastT = 1.4;
  }

  function buzz(p) {
    try { if (navigator.vibrate) navigator.vibrate(p == null ? 16 : p); } catch (e) {}
  }

  function beep(freq, dur, type) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      g.gain.value = 0.04;
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (dur || 0.08));
      o.stop(audioCtx.currentTime + (dur || 0.08));
    } catch (e) {}
  }

  function shake(ms) { G.shake = Math.max(G.shake, (ms || 200) / 1000); }

  function spawnParts(x, y, n, color) {
    for (var i = 0; i < n; i++) {
      G.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 220,
        vy: (Math.random() - 0.5) * 220 - 40,
        life: 0.35 + Math.random() * 0.35,
        max: 0.7,
        color: color || '#ffd36a',
        r: 2 + Math.random() * 3
      });
    }
  }

  function hit(id, x, y, w, h, data) {
    G.hits.push({ id: id, x: x, y: y, w: w, h: h, data: data || null });
  }

  function hitAt(x, y) {
    for (var i = G.hits.length - 1; i >= 0; i--) {
      var h = G.hits[i];
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h;
    }
    return null;
  }

  function img(key) { return images[key] || null; }

  function drawImg(key, x, y, w, h, alpha) {
    var im = img(key);
    if (!im || !im.complete || !im.naturalWidth) {
      ctx.fillStyle = 'rgba(20,16,14,0.9)';
      ctx.fillRect(x, y, w, h);
      return;
    }
    ctx.save();
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.drawImage(im, x, y, w, h);
    ctx.restore();
  }

  function coverImg(key, x, y, w, h, ox, oy) {
    var im = img(key);
    if (!im || !im.complete || !im.naturalWidth) {
      ctx.fillStyle = '#08060a';
      ctx.fillRect(x, y, w, h);
      return;
    }
    ox = ox == null ? 0.5 : ox;
    oy = oy == null ? 0.4 : oy;
    var ir = im.naturalWidth / im.naturalHeight;
    var rr = w / h;
    var dw, dh, dx, dy;
    if (ir > rr) { dh = h; dw = h * ir; } else { dw = w; dh = w / ir; }
    dx = x + (w - dw) * ox;
    dy = y + (h - dh) * oy;
    ctx.drawImage(im, dx, dy, dw, dh);
  }

  function text(str, x, y, opts) {
    opts = opts || {};
    ctx.save();
    var face = opts.display ? FONT_DISPLAY : FONT_UI;
    ctx.font = (opts.weight || '700') + ' ' + (opts.size || 18) + 'px ' + face;
    ctx.fillStyle = opts.color || TEXT;
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = opts.base || 'alphabetic';
    if (opts.shadow !== false) {
      ctx.shadowColor = opts.glow ? (opts.glowColor || CORE_DIM) : 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = opts.blur != null ? opts.blur : (opts.glow ? 14 : 8);
      ctx.shadowOffsetY = opts.glow ? 0 : 2;
    }
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r || 8, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function softPlate(x, y, w, h, r) {
    r = r == null ? 10 : r;
    roundRect(x, y, w, h, r);
    ctx.fillStyle = PANEL;
    ctx.fill();
    ctx.strokeStyle = 'rgba(212,160,90,0.28)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawBattleCta(x, y, w, h, label) {
    var im = img('uiBtn');
    if (im && im.complete && im.naturalWidth) {
      ctx.drawImage(im, x, y, w, h);
    } else {
      var g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, '#ffe2a8');
      g.addColorStop(0.45, '#d4a05a');
      g.addColorStop(1, '#8a5a28');
      roundRect(x, y, w, h, 8);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,230,180,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    text(label, x + w / 2, y + h * 0.58, {
      align: 'center', size: Math.min(26, Math.floor(h * 0.38)), color: '#1a1008',
      shadow: false, weight: '800', display: true
    });
  }

  function drawPlateBtn(x, y, w, h, label, opts) {
    opts = opts || {};
    softPlate(x, y, w, h, opts.r == null ? 8 : opts.r);
    text(label, x + w / 2, y + h * 0.62, {
      align: 'center',
      size: opts.size || 14,
      color: opts.color || COPPER,
      glow: !!opts.glow,
      glowColor: COPPER_DIM,
      weight: '700'
    });
  }

  /* aliases kept for older call sites */
  function fillPanel(x, y, w, h) { softPlate(x, y, w, h, 10); }
  function drawTacticalBtn(x, y, w, h, label, opts) {
    opts = opts || {};
    if (opts.hot) drawBattleCta(x, y, w, h, label);
    else drawPlateBtn(x, y, w, h, label, { size: opts.size || 14, glow: true });
  }

  /* ── Save / player ── */
  function freshPlayer(id) {
    var shards = {};
    SHARDS.forEach(function (s) { shards[s.id] = 0; });
    shards.bone = 8; shards.ore = 6;
    return {
      v: SAVE_VERSION, id: id, chrono: 160, essence: 0, skillPoints: 4,
      unlocked: ['root'],
      loadout: id === 'jamie' ? 'bulwark' : id === 'edward' ? 'warden' : 'rift',
      relics: [], shards: shards, exotics: {},
      towerUp: { damage: 0, rate: 0, core: 0, range: 0, luck: 0 },
      wavesBest: 0, bossesKilled: 0, totalMerged: 0, fishCaught: 0,
      garden: [0, 0, 0, 0], gardenPlanted: [0, 0, 0, 0],
      dailyClaimed: 0, streak: 0, lastSeen: Date.now(), _introSeen: false
    };
  }

  function freshWorld() {
    return {
      v: SAVE_VERSION, eraIndex: 0, erasCleared: [], planetsUnlocked: ['cinder'],
      sharedBank: {}, presence: {}, storyChapter: 0, dailySeed: daySeed(),
      coop: null,
      quest: { id: 'hold5', name: 'Hold wave 5', prog: 0, target: 5, reward: 40 },
      updatedAt: Date.now()
    };
  }

  function migratePlayer(data, id) {
    var base = freshPlayer(id);
    var p = Object.assign(base, data || {});
    p.shards = Object.assign(base.shards, (data && data.shards) || {});
    p.towerUp = Object.assign(base.towerUp, (data && data.towerUp) || {});
    p.exotics = Object.assign({}, (data && data.exotics) || {});
    return p;
  }

  function loadWorld() {
    try {
      var raw = localStorage.getItem(WORLD_KEY);
      if (raw) return Object.assign(freshWorld(), JSON.parse(raw));
    } catch (e) {}
    return freshWorld();
  }

  function saveWorld() {
    if (!G.WORLD) return;
    G.WORLD.updatedAt = Date.now();
    try { localStorage.setItem(WORLD_KEY, JSON.stringify(G.WORLD)); } catch (e) {}
    if (bc) {
      try { bc.postMessage({ type: 'world', world: G.WORLD }); } catch (e) {}
    }
  }

  function loadPlayer(id) {
    try {
      var raw = localStorage.getItem(SAVE_PREFIX + id) || localStorage.getItem('voidline_chronos_v1_' + id);
      if (raw) { G.P = migratePlayer(JSON.parse(raw), id); return; }
    } catch (e) {}
    G.P = freshPlayer(id);
  }

  function savePlayer() {
    if (!G.P || !G.activeId) return;
    G.P.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_PREFIX + G.activeId, JSON.stringify(G.P)); } catch (e) {}
    if (G.WORLD) {
      G.WORLD.presence[G.activeId] = Date.now();
      saveWorld();
    }
  }

  function claimDaily() {
    var d = daySeed();
    if (G.P.dailyClaimed === d) return;
    if (G.P.dailyClaimed === d - 1) G.P.streak = (G.P.streak || 0) + 1;
    else G.P.streak = 1;
    G.P.dailyClaimed = d;
    G.P.chrono += 40 + G.P.streak * 8;
    G.P.skillPoints += 1;
  }

  function hasNode(id) { return G.P && G.P.unlocked.indexOf(id) >= 0; }
  function nodeById(id) { return TREE.find(function (n) { return n.id === id; }); }
  function canUnlock(node) {
    if (!G.P || !node || hasNode(node.id)) return false;
    if (G.P.skillPoints < node.cost) return false;
    return node.req.every(function (r) { return hasNode(r); });
  }

  function aggregateStats() {
    var stats = { dmg: 0, armor: 0, crit: 0, chain: 0, regen: 0, shield: 0, slow: 0, heal: 0, bossDmg: 0, mergeLuck: 0, extract: 0, chronoGain: 0, lifeYield: 0, aura: 0, coopPower: 0, coreMult: 0, phoenix: 0, quake: 0, freeze: 0, nova: 0, gateBreak: 0 };
    (G.P.unlocked || []).forEach(function (id) {
      var n = nodeById(id);
      if (!n || !n.stats) return;
      Object.keys(n.stats).forEach(function (k) { stats[k] = (stats[k] || 0) + n.stats[k]; });
    });
    (G.P.relics || []).forEach(function (rid) {
      var b = RELICS[rid];
      if (!b) return;
      Object.keys(b).forEach(function (k) {
        if (k === 'label') return;
        stats[k] = (stats[k] || 0) + b[k];
      });
    });
    return stats;
  }

  /* ── Tower combat (canvas) ── */
  function towerDps() {
    var s = aggregateStats();
    var up = G.P.towerUp.damage || 0;
    var base = 16 + up * 5;
    var role = G.P.loadout === 'rift' ? 1.2 : G.P.loadout === 'bulwark' ? 0.85 : 0.9;
    return base * (1 + s.dmg) * role * (1 + (s.coopPower || 0));
  }
  function towerFireRate() { return Math.max(0.16, 0.52 - (G.P.towerUp.rate || 0) * 0.028); }
  function towerMaxHp() {
    var s = aggregateStats();
    return Math.floor((260 + (G.P.towerUp.core || 0) * 45) * (1 + s.armor) * (1 + (s.coreMult || 0)));
  }

  function startTower(coop) {
    var s = aggregateStats();
    G.tower = {
      running: true, coop: !!coop, t: 0, wave: 1, spawnAcc: 0, fireAcc: 0,
      coreHp: towerMaxHp(), coreMax: towerMaxHp(),
      enemies: [], fx: [],
      cds: { primary: 0, secondary: 0, ultimate: 0 },
      frozen: 0, phoenixUsed: false, kills: 0, chronoEarned: 0,
      shield: s.shield || 0,
      gates: { bulwark: 0, rift: 0, warden: 0 },
      combo: 0
    };
    G.scene = 'tower';
    beep(220, 0.1);
    buzz(20);
  }

  function endTower(won) {
    if (!G.tower) return;
    var t = G.tower;
    var s = aggregateStats();
    var gain = Math.floor(t.chronoEarned * (1 + (s.chronoGain || 0)));
    G.P.chrono += gain;
    G.P.essence += Math.floor(t.wave / 2);
    if (t.wave > G.P.wavesBest) G.P.wavesBest = t.wave;
    if (G.WORLD.quest && G.WORLD.quest.id === 'hold5') {
      G.WORLD.quest.prog = Math.max(G.WORLD.quest.prog || 0, t.wave);
      if (G.WORLD.quest.prog >= G.WORLD.quest.target && !G.WORLD.quest.done) {
        G.WORLD.quest.done = true;
        G.P.chrono += G.WORLD.quest.reward;
        toast('QUEST CLEAR');
      }
    }
    if (t.wave >= 6) {
      var era = ERAS[G.WORLD.eraIndex];
      if (era && G.WORLD.erasCleared.indexOf(era.id) < 0) {
        G.WORLD.erasCleared.push(era.id);
        if (G.WORLD.eraIndex < ERAS.length - 1) {
          G.WORLD.eraIndex++;
          G.WORLD.storyChapter = Math.min(STORY.length - 1, G.WORLD.eraIndex + 1);
          G.storyOpen = G.WORLD.storyChapter;
        }
        G.P.skillPoints += 2;
        toast('ERA STABILIZED');
        PLANETS.forEach(function (pl) {
          if (pl.eraNeed <= G.WORLD.eraIndex && G.WORLD.planetsUnlocked.indexOf(pl.id) < 0) {
            G.WORLD.planetsUnlocked.push(pl.id);
          }
        });
      }
    }
    toast((won ? 'HOLD' : 'BREACH') + ' +' + gain);
    beep(won ? 520 : 120, 0.15);
    G.tower = null;
    G.scene = 'hub';
    savePlayer();
  }

  function spawnEnemy(wave) {
    var roll = Math.random();
    var type = 'swarm';
    if (wave % 5 === 0) type = 'boss';
    else if (wave >= 4 && roll > 0.8) type = 'brute';
    else if (wave >= 3 && roll > 0.62) type = 'flyer';
    var side = Math.floor(Math.random() * 4);
    var x = W * 0.5, y = H * 0.35;
    if (side === 0) { x = Math.random() * W; y = -20; }
    if (side === 1) { x = W + 20; y = Math.random() * H * 0.7; }
    if (side === 2) { x = Math.random() * W; y = H * 0.75; }
    if (side === 3) { x = -20; y = Math.random() * H * 0.7; }
    var hp = type === 'boss' ? 220 + wave * 55 : type === 'brute' ? 60 + wave * 12 : type === 'flyer' ? 24 + wave * 5 : 18 + wave * 6;
    var spd = type === 'flyer' ? 90 + wave * 4 : type === 'brute' ? 36 + wave : type === 'boss' ? 28 : 55 + wave * 2;
    var accent = (ERAS[G.WORLD.eraIndex] && ERAS[G.WORLD.eraIndex].accent) || '#ff6a3d';
    G.tower.enemies.push({
      id: Math.random().toString(36).slice(2, 7),
      type: type, x: x, y: y, hp: hp, max: hp, spd: spd, tint: accent, hit: 0
    });
  }

  function damageEnemy(e, amt, tag) {
    var s = aggregateStats();
    var dmg = amt;
    if (e.type === 'boss') dmg *= 1 + (s.bossDmg || 0);
    var crit = Math.random() < (0.08 + (s.crit || 0));
    if (crit) dmg *= 2;
    dmg = Math.max(1, Math.floor(dmg));
    e.hp -= dmg;
    e.hit = 0.12;
    G.tower.fx.push({ kind: 'dmg', x: e.x, y: e.y - 16, life: 0.7, text: String(dmg), crit: crit });
    G.tower.fx.push({ kind: 'spark', x: e.x, y: e.y, life: 0.25 });
    G.tower.combo++;
    if (tag) G.tower.gates[tag] = (G.tower.gates[tag] || 0) + 1;
    if (e.hp <= 0) {
      G.tower.kills++;
      G.tower.chronoEarned += e.type === 'boss' ? 50 : e.type === 'brute' ? 9 : 3;
      spawnParts(e.x, e.y, e.type === 'boss' ? 18 : 8, e.tint);
      if (e.type === 'boss') { G.P.bossesKilled++; G.P.skillPoints += 1; shake(320); beep(180, 0.2, 'sawtooth'); }
      return true;
    }
    return false;
  }

  function fireAtNearest() {
    var t = G.tower;
    if (!t.enemies.length) return;
    var cx = W * 0.5, cy = H * 0.52;
    var range = 120 + (G.P.towerUp.range || 0) * 14;
    var best = null, bestD = 1e9;
    t.enemies.forEach(function (e) {
      var d = Math.hypot(e.x - cx, e.y - cy);
      if (d < bestD && d <= range) { bestD = d; best = e; }
    });
    if (!best) return;
    var dmg = towerDps() * 0.38;
    t.fx.push({ kind: 'beam', x1: cx, y1: cy, x2: best.x, y2: best.y, life: 0.1 });
    damageEnemy(best, dmg, G.P.loadout === 'rift' ? 'rift' : null);
    var s = aggregateStats();
    if (s.chain > 0) {
      var chained = 0;
      t.enemies.forEach(function (e) {
        if (e === best || chained >= s.chain) return;
        if (Math.hypot(e.x - best.x, e.y - best.y) < 90) {
          damageEnemy(e, dmg * 0.55, 'rift');
          chained++;
        }
      });
    }
    t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
  }

  function useAbility(slot) {
    var t = G.tower;
    if (!t || !t.running) return;
    var s = aggregateStats();
    if (slot === 'primary') {
      if (t.cds.primary > 0) return;
      t.cds.primary = 2;
      if (G.P.loadout === 'bulwark') {
        t.enemies.forEach(function (e) {
          e.x += (W * 0.5 - e.x) * 0.4;
          e.y += (H * 0.52 - e.y) * 0.4;
        });
        t.gates.bulwark++;
        toast('TAUNT');
      } else if (G.P.loadout === 'warden') {
        t.coreHp = Math.min(t.coreMax, t.coreHp + 40 + (s.heal || 0) * 80);
        t.gates.warden++;
        toast('MEND');
      } else {
        t.enemies.forEach(function (e) { damageEnemy(e, towerDps(), 'rift'); });
        t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
        toast('ARC');
      }
      beep(440, 0.08); buzz(12);
    } else if (slot === 'secondary') {
      if (t.cds.secondary > 0) return;
      t.cds.secondary = 5;
      if (s.quake || G.P.loadout === 'bulwark') {
        t.enemies.forEach(function (e) {
          if (Math.hypot(e.x - W * 0.5, e.y - H * 0.52) < 160) {
            e.spd *= 0.15;
            damageEnemy(e, 50, 'bulwark');
          }
        });
        t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
        shake(200); toast('QUAKE');
      } else if (s.freeze || G.P.loadout === 'rift') {
        t.frozen = s.freeze || 1.2;
        t.gates.rift++;
        toast('TIMELINE');
      } else {
        t.shield += 55;
        t.gates.warden++;
        toast('WARD');
      }
      beep(320, 0.1); buzz(18);
    } else if (slot === 'ultimate') {
      if (t.cds.ultimate > 0) return;
      t.cds.ultimate = 12;
      var ult = towerDps() * 2.4;
      if (s.nova) t.enemies.forEach(function (e) { damageEnemy(e, ult, 'rift'); });
      else t.enemies.slice(0, 6).forEach(function (e) { damageEnemy(e, ult, G.P.loadout); });
      t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
      G.flash = 0.35;
      shake(280);
      toast('OVERLOAD');
      beep(160, 0.18, 'sawtooth');
      buzz([30, 40, 30]);
    }
  }

  function updateTower(dt) {
    var t = G.tower;
    if (!t || !t.running) return;
    var s = aggregateStats();
    t.t += dt;
    if (t.frozen > 0) t.frozen -= dt;
    Object.keys(t.cds).forEach(function (k) {
      if (t.cds[k] > 0) t.cds[k] = Math.max(0, t.cds[k] - dt);
    });
    t.spawnAcc += dt;
    if (t.spawnAcc >= Math.max(0.4, 1.35 - t.wave * 0.055)) {
      t.spawnAcc = 0;
      spawnEnemy(t.wave);
    }
    if (t.t > t.wave * 11.5) {
      t.wave++; t.t = 0; t.chronoEarned += 6;
      toast('WAVE ' + t.wave);
      beep(500, 0.1);
      if (t.wave > 14) { endTower(true); return; }
    }
    if (s.regen > 0) t.coreHp = Math.min(t.coreMax, t.coreHp + s.regen * dt * 0.3);
    t.fireAcc += dt;
    if (t.fireAcc >= towerFireRate()) { t.fireAcc = 0; fireAtNearest(); }
    var slow = 1 - Math.min(0.55, s.slow || 0);
    if (t.frozen > 0) slow *= 0.12;
    var cx = W * 0.5, cy = H * 0.52;
    t.enemies.forEach(function (e) {
      if (e.hit > 0) e.hit -= dt;
      var dx = cx - e.x, dy = cy - e.y;
      var len = Math.hypot(dx, dy) || 1;
      e.x += (dx / len) * e.spd * slow * dt;
      e.y += (dy / len) * e.spd * slow * dt;
      if (Math.hypot(e.x - cx, e.y - cy) < 28) {
        var hitAmt = e.type === 'boss' ? 32 : e.type === 'brute' ? 15 : 8;
        hitAmt *= (1 - Math.min(0.55, s.armor || 0));
        if (t.shield > 0) {
          t.shield -= hitAmt;
          if (t.shield < 0) { t.coreHp += t.shield; t.shield = 0; }
        } else t.coreHp -= hitAmt;
        e.hp = 0;
        shake(120); buzz(25);
      }
    });
    t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
    t.fx = t.fx.map(function (f) { f.life -= dt; return f; }).filter(function (f) { return f.life > 0; });
    if (t.coreHp <= 0) {
      if ((s.phoenix || 0) && !t.phoenixUsed) {
        t.phoenixUsed = true;
        t.coreHp = t.coreMax * 0.45;
        toast('PHOENIX');
      } else endTower(false);
    }
  }

  /* ── Scene actions ── */
  function pickPlayer(id) {
    G.activeId = id;
    loadPlayer(id);
    G.WORLD = loadWorld();
    claimDaily();
    G.WORLD.presence[id] = Date.now();
    saveWorld();
    if (G.WORLD.storyChapter === 0 && !G.P._introSeen) {
      G.storyOpen = 0;
      G.P._introSeen = true;
    }
    G.scene = 'hub';
    beep(360, 0.1);
    buzz([16, 24, 16]);
    spawnParts(W * 0.5, H * 0.5, 16, warband(id).accent);
    savePlayer();
  }

  function go(scene) {
    if (scene === 'hub' && G.tower) endTower(false);
    G.scene = scene;
    G.forge = [null, null];
    beep(280, 0.05);
  }

  function tryMerge() {
    var a = G.forge[0], b = G.forge[1];
    if (!a || !b) { toast('NEED TWO'); return; }
    function hasMat(id) { return (G.P.shards[id] || 0) >= 1 || (G.P.exotics[id] || 0) >= 1; }
    function take(id) {
      if ((G.P.shards[id] || 0) >= 1) G.P.shards[id]--;
      else if ((G.P.exotics[id] || 0) >= 1) G.P.exotics[id]--;
    }
    if (!hasMat(a) || !hasMat(b)) { toast('MISSING'); return; }
    take(a); take(b);
    var recipe = RECIPES.find(function (r) {
      return (r.a === a && r.b === b) || (r.a === b && r.b === a);
    });
    if (!recipe) {
      G.P.chrono += 10;
      toast('SCRAP +10');
    } else if (recipe.relic) {
      if (G.P.relics.indexOf(recipe.out) < 0) G.P.relics.push(recipe.out);
      toast(recipe.name.toUpperCase());
      shake(220);
    } else {
      G.P.shards[recipe.out] = (G.P.shards[recipe.out] || 0) + 1;
      toast('FORGED ' + recipe.name);
    }
    G.P.totalMerged++;
    G.P.essence += 1;
    if (G.P.totalMerged % 3 === 0) G.P.skillPoints += 1;
    G.forge = [null, null];
    G.flash = 0.4;
    beep(200, 0.12, 'triangle');
    savePlayer();
  }

  /* ── Draw scenes ── */
  function drawBoot() {
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H);
    coverImg('hub', 0, 0, W, H, 0.5, 0.4);
    ctx.fillStyle = 'rgba(6,5,8,0.55)';
    ctx.fillRect(0, 0, W, H);
    text('VOIDLINE', W / 2, H * 0.42, {
      align: 'center', size: 15, color: COPPER, display: true, glow: true, glowColor: COPPER_DIM
    });
    text('CHRONOS', W / 2, H * 0.5, {
      align: 'center', size: 52, color: TEXT, display: true, glow: true, glowColor: CORE_DIM, blur: 18
    });
    text('Waking the Chronolith…', W / 2, H * 0.58, {
      align: 'center', size: 14, color: TEXT_DIM, shadow: false
    });
  }

  function drawWho() {
    var t = G.time;
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H);
    // parallax stage
    coverImg('who', 0, 0, W, H, 0.5, 0.32 + Math.sin(t * 0.18) * 0.02);

    var topVeil = ctx.createLinearGradient(0, 0, 0, H * 0.28);
    topVeil.addColorStop(0, 'rgba(6,5,8,0.75)');
    topVeil.addColorStop(1, 'rgba(6,5,8,0)');
    ctx.fillStyle = topVeil;
    ctx.fillRect(0, 0, W, H * 0.28);

    text('VOIDLINE', W / 2, 42, {
      align: 'center', size: 13, color: COPPER, display: true, glow: true, glowColor: COPPER_DIM
    });
    text('CHRONOS', W / 2, 82, {
      align: 'center', size: 44, color: TEXT, display: true, glow: true, glowColor: 'rgba(0,0,0,0.6)', blur: 10
    });

    var colW = W / 3;
    WARBAND.forEach(function (w, i) {
      var x = i * colW;
      var key = 'portrait-' + w.id;
      coverImg(key, x, H * 0.14, colW, H * 0.86, 0.5, 0.18);
      var g = ctx.createLinearGradient(0, H * 0.5, 0, H);
      g.addColorStop(0, 'rgba(6,5,8,0)');
      g.addColorStop(0.55, 'rgba(6,5,8,0.35)');
      g.addColorStop(1, 'rgba(6,5,8,0.92)');
      ctx.fillStyle = g;
      ctx.fillRect(x, H * 0.5, colW, H * 0.5);
      if (i > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(x, H * 0.14, 1, H * 0.86);
      }
      text(w.name.toUpperCase(), x + colW / 2, H - 56, {
        align: 'center', size: 20, color: TEXT, display: true
      });
      ctx.fillStyle = w.accent || COPPER;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(x + colW * 0.3, H - 44, colW * 0.4, 3);
      ctx.globalAlpha = 1;
      text(w.blurb, x + colW / 2, H - 24, {
        align: 'center', size: 11, color: TEXT_DIM, shadow: false
      });
      hit('pick', x, H * 0.14, colW, H * 0.86, w.id);
    });

    // floating dust
    for (var d = 0; d < 8; d++) {
      var dx = ((t * 12 + d * 97) % W);
      var dy = H * 0.2 + ((t * 18 + d * 53) % (H * 0.5));
      ctx.globalAlpha = 0.15 + (d % 3) * 0.05;
      ctx.fillStyle = CORE;
      ctx.beginPath();
      ctx.arc(dx, dy, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  function safeTop() { return 0; }
  function safeBottom() { return 0; }

  function drawHub() {
    var era = ERAS[G.WORLD.eraIndex] || ERAS[0];
    var w = warband(G.activeId);
    var breathe = 1 + Math.sin(G.time * 0.32) * 0.014;
    var drift = Math.sin(G.time * 0.15) * 0.012;

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(breathe, breathe);
    ctx.translate(-W / 2 + drift * 20, -H / 2);
    coverImg('hub', 0, 0, W, H, 0.5 + drift, 0.36);
    ctx.restore();

    // light atmospheric veil — keep art dominant
    var veil = ctx.createLinearGradient(0, 0, 0, H);
    veil.addColorStop(0, 'rgba(6,5,8,0.55)');
    veil.addColorStop(0.35, 'rgba(6,5,8,0.05)');
    veil.addColorStop(0.62, 'rgba(6,5,8,0.15)');
    veil.addColorStop(1, 'rgba(6,5,8,0.82)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, W, H);

    // pilot medallion
    var px = 16, py = 16, pr = 28;
    ctx.save();
    ctx.beginPath();
    ctx.arc(px + pr, py + pr, pr, 0, Math.PI * 2);
    ctx.clip();
    coverImg('portrait-' + w.id, px, py, pr * 2, pr * 2, 0.5, 0.15);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(px + pr, py + pr, pr + 2, 0, Math.PI * 2);
    ctx.strokeStyle = w.accent || CORE;
    ctx.lineWidth = 3;
    ctx.shadowColor = CORE_DIM;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
    hit('who', px, py, pr * 2, pr * 2);

    text(String(G.P.chrono), W - 18, 48, {
      align: 'right', size: 34, color: COPPER, display: true, glow: true, glowColor: COPPER_DIM
    });

    // era title floats over the vista — not a card
    text(era.name, W / 2, H * 0.58, {
      align: 'center', size: 40, color: TEXT, display: true, glow: true, glowColor: 'rgba(0,0,0,0.7)', blur: 12
    });
    text(era.blurb || '', W / 2, H * 0.58 + 28, {
      align: 'center', size: 13, color: TEXT_DIM, shadow: false
    });

    // one physical battle CTA
    var bw = Math.min(W * 0.84, 340), bh = 72;
    var bx = (W - bw) / 2, by = H * 0.66;
    var pulse = 1 + Math.sin(G.time * 2.4) * 0.012;
    ctx.save();
    ctx.translate(W / 2, by + bh / 2);
    ctx.scale(pulse, pulse);
    ctx.translate(-W / 2, -(by + bh / 2));
    drawBattleCta(bx, by, bw, bh, 'ENTER');
    ctx.restore();
    hit('enter', bx, by, bw, bh);

    // diegetic world hotspots — medallions in the place, not a website nav
    var spots = [
      { id: 'forge', med: 'forge', label: 'Forge', x: 0.14, y: 0.86 },
      { id: 'tree', med: 'tree', label: 'Tree', x: 0.32, y: 0.9 },
      { id: 'tower', med: 'tower', label: 'Tower', x: 0.5, y: 0.88 },
      { id: 'gate', med: 'gate', label: 'Gate', x: 0.68, y: 0.9 },
      { id: 'era', med: 'era', label: 'Era', x: 0.86, y: 0.86 }
    ];
    spots.forEach(function (s) {
      var bob = Math.sin(G.time * 1.6 + s.x * 8) * 3;
      var size = s.id === 'tower' ? 56 : 46;
      var cx = W * s.x;
      var cy = H * s.y + bob;
      drawMedallion(s.med, cx - size / 2, cy - size / 2, size);
      text(s.label, cx, cy + size * 0.55 + 10, {
        align: 'center', size: 11, color: TEXT, shadow: true, blur: 6
      });
      hit('mode', cx - size / 2, cy - size / 2, size, size + 18, s.id);
    });

    // secondary lore / life tucked as small stones
    drawMedallion('life', 18, H - 52, 34);
    hit('mode', 18, H - 52, 34, 34, 'life');
    drawMedallion('story', W - 52, H - 52, 34);
    hit('mode', W - 52, H - 52, 34, 34, 'story');

    if (G.storyOpen != null) drawStoryModal();
  }

  function drawMedallion(med, x, y, s) {
    var im = img('dock');
    if (!im || !im.complete) {
      ctx.fillStyle = '#2a2218';
      ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s / 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = COPPER;
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    }
    var map = { forge: [0, 0], tree: [1, 0], tower: [2, 0], era: [0, 1], life: [1, 1], story: [2, 1], gate: [2, 0] };
    var p = map[med] || [0, 0];
    var sw = im.naturalWidth / 3, sh = im.naturalHeight / 2;
    ctx.save();
    if (med === 'gate') ctx.filter = 'hue-rotate(95deg) saturate(1.15)';
    ctx.drawImage(im, p[0] * sw, p[1] * sh, sw, sh, x, y, s, s);
    ctx.restore();
  }

  function drawStoryModal() {
    var ch = STORY[G.storyOpen] || STORY[0];
    ctx.fillStyle = 'rgba(6,5,8,0.82)';
    ctx.fillRect(0, 0, W, H);
    var pw = W * 0.88, ph = 280;
    var px = (W - pw) / 2, py = (H - ph) / 2;
    softPlate(px, py, pw, ph, 14);
    text('TRANSMISSION', W / 2, py + 40, {
      align: 'center', size: 12, color: COPPER, display: true, glow: true, glowColor: COPPER_DIM
    });
    text(ch.title, W / 2, py + 78, {
      align: 'center', size: 26, color: TEXT, display: true
    });
    wrapText(ch.body, W / 2, py + 118, pw - 44, 14, TEXT_DIM);
    var bx = W / 2 - 90, by = py + ph - 64;
    drawBattleCta(bx, by, 180, 48, 'CONTINUE');
    hit('dismiss-story', bx, by, 180, 48);
  }

  function wrapText(str, cx, y, maxW, size, color) {
    ctx.save();
    ctx.font = '600 ' + size + 'px ' + FONT_UI;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    var words = String(str).split(' ');
    var line = '';
    var yy = y;
    words.forEach(function (word) {
      var test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW) {
        ctx.fillText(line, cx, yy);
        line = word;
        yy += size + 6;
      } else line = test;
    });
    if (line) ctx.fillText(line, cx, yy);
    ctx.restore();
  }

  function drawBtn(x, y, w, h, label) {
    if (w >= 140 && h >= 44) drawBattleCta(x, y, w, h, label);
    else drawPlateBtn(x, y, w, h, label, { size: Math.min(15, Math.floor(h * 0.4)) });
  }

  function drawTower() {
    coverImg('tower', 0, 0, W, H, 0.5, 0.45);
    ctx.fillStyle = 'rgba(7,7,9,0.45)';
    ctx.fillRect(0, 0, W, H);

    var t = G.tower;
    if (!t) {
      text('CHRONOLITH', W / 2, 56, {
        align: 'center', size: 30, color: TEXT, display: true, glow: true, glowColor: CORE_DIM
      });
      text('Best wave ' + G.P.wavesBest, W / 2, 84, { align: 'center', size: 13, color: TEXT_DIM, shadow: false });
      var y = 120;
      TOWER_UPS.forEach(function (u, i) {
        var lv = G.P.towerUp[u.id] || 0;
        var cost = Math.floor(u.base * Math.pow(1.38, lv));
        var bx = 20 + (i % 2) * (W / 2 - 20), by = y + Math.floor(i / 2) * 54;
        softPlate(bx, by, W / 2 - 30, 44, 8);
        text(u.name + ' ' + lv, bx + 12, by + 28, { size: 13, color: TEXT, shadow: false });
        text(String(cost), bx + (W / 2 - 42), by + 28, {
          align: 'right', size: 13, color: COPPER, glow: true, glowColor: COPPER_DIM
        });
        hit('tower-up', bx, by, W / 2 - 30, 44, u.id);
      });
      var bw = Math.min(W * 0.82, 320), bh = 64;
      var bx = (W - bw) / 2, by = H - 200;
      drawBattleCta(bx, by, bw, bh, 'SOLO DEPLOY');
      hit('start-tower', bx, by, bw, bh);
      drawPlateBtn((W - 200) / 2, by + 78, 200, 42, 'CO-OP BOSS', { size: 14, color: CORE, glow: true });
      hit('start-coop', (W - 200) / 2, by + 78, 200, 42);
      drawPlateBtn(W - 52, 18, 36, 36, '✕', { size: 16, color: TEXT_DIM });
      hit('hub', W - 52, 18, 36, 36);
      return;
    }

    // live combat
    text('WAVE ' + t.wave, 18, 40, { size: 16, color: TEXT, display: true });
    text(Math.ceil(t.coreHp) + ' / ' + t.coreMax, W / 2, 40, {
      align: 'center', size: 20, color: COPPER, glow: true, glowColor: COPPER_DIM
    });
    if (t.combo > 4) text(t.combo + ' COMBO', W - 18, 40, { align: 'right', size: 14, color: CORE, glow: true });
    drawPlateBtn(W - 52, 14, 36, 32, '✕', { size: 14, color: TEXT_DIM });
    hit('flee', W - 52, 14, 36, 32);

    // core
    var cx = W * 0.5, cy = H * 0.52;
    var pulse = 1 + Math.sin(G.time * 3) * 0.06;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    var grd = ctx.createRadialGradient(0, 0, 4, 0, 0, 34);
    grd.addColorStop(0, '#b6ff9a');
    grd.addColorStop(0.45, CORE);
    grd.addColorStop(1, 'rgba(7,7,9,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // hp bar
    var barW = W * 0.55, barH = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    roundRect(cx - barW / 2, cy + 48, barW, barH, 3); ctx.fill();
    ctx.fillStyle = '#e85a2a';
    roundRect(cx - barW / 2, cy + 48, barW * Math.max(0, t.coreHp / t.coreMax), barH, 3); ctx.fill();

    // enemies
    t.enemies.forEach(function (e) {
      var sz = e.type === 'boss' ? 36 : e.type === 'brute' ? 26 : e.type === 'flyer' ? 18 : 16;
      ctx.save();
      ctx.translate(e.x, e.y);
      if (e.hit > 0) { ctx.scale(0.88, 0.88); ctx.filter = 'brightness(2)'; }
      ctx.fillStyle = e.tint || '#ff6a3d';
      if (e.type === 'flyer') { ctx.beginPath(); ctx.arc(0, 0, sz / 2, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.fillRect(-sz / 2, -sz / 2, sz, sz); }
      ctx.filter = 'none';
      // hp
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(-sz / 2, sz / 2 + 3, sz, 3);
      ctx.fillStyle = '#f0d078';
      ctx.fillRect(-sz / 2, sz / 2 + 3, sz * (e.hp / e.max), 3);
      ctx.restore();
    });

    // fx
    t.fx.forEach(function (f) {
      if (f.kind === 'beam') {
        ctx.strokeStyle = 'rgba(124,240,255,' + Math.min(1, f.life * 8) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke();
      } else if (f.kind === 'dmg') {
        text((f.crit ? f.text + '!' : f.text), f.x, f.y - (0.7 - f.life) * 40, {
          align: 'center', size: f.crit ? 22 : 16, color: f.crit ? '#ffd36a' : '#fff'
        });
      } else if (f.kind === 'spark') {
        ctx.fillStyle = 'rgba(255,255,255,' + (f.life * 3) + ')';
        ctx.beginPath(); ctx.arc(f.x, f.y, 4 + (0.25 - f.life) * 20, 0, Math.PI * 2); ctx.fill();
      }
    });

    // abilities
    var abl = G.P.loadout === 'bulwark'
      ? ['TAUNT', 'QUAKE', 'OVERLOAD']
      : G.P.loadout === 'warden'
        ? ['MEND', 'WARD', 'OVERLOAD']
        : ['ARC', 'TIMELINE', 'OVERLOAD'];
    var keys = ['primary', 'secondary', 'ultimate'];
    var aw = 72, gap = 18;
    var total = aw * 3 + gap * 2;
    var ax0 = (W - total) / 2;
    var ay = H - 110;
    keys.forEach(function (k, i) {
      var ax = ax0 + i * (aw + gap);
      drawAbilityIcon(i, ax, ay, aw);
      var cd = t.cds[k];
      text(abl[i], ax + aw / 2, ay + aw + 16, { align: 'center', size: 12 });
      text(cd > 0 ? cd.toFixed(1) : 'READY', ax + aw / 2, ay + aw + 32, {
        align: 'center', size: 12, color: cd > 0 ? TEXT_DIM : CORE, glow: cd <= 0
      });
      if (cd > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath(); ctx.arc(ax + aw / 2, ay + aw / 2, aw / 2, 0, Math.PI * 2); ctx.fill();
      }
      hit('ability', ax, ay, aw, aw + 36, k);
    });
  }

  function drawAbilityIcon(index, x, y, s) {
    var im = img('abilities');
    if (!im || !im.complete) {
      ctx.fillStyle = '#2a2218';
      roundRect(x, y, s, s, 8); ctx.fill();
      return;
    }
    var sw = im.naturalWidth / 3;
    ctx.drawImage(im, index * sw, 0, sw, im.naturalHeight, x, y, s, s);
  }

  function drawMenuShell(title, sub) {
    coverImg(G.scene === 'forge' ? 'forge' : G.scene === 'tree' ? 'tree' : G.scene === 'gate' || G.scene === 'extract' ? 'gate' : G.scene === 'life' ? 'life' : 'hub', 0, 0, W, H, 0.5, 0.4);
    var veil = ctx.createLinearGradient(0, 0, 0, H);
    veil.addColorStop(0, 'rgba(6,5,8,0.7)');
    veil.addColorStop(0.35, 'rgba(6,5,8,0.35)');
    veil.addColorStop(1, 'rgba(6,5,8,0.78)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, W, H);
    text(title, 22, 52, { size: 28, color: TEXT, display: true, glow: true, glowColor: 'rgba(0,0,0,0.7)' });
    if (sub) text(sub, 22, 76, { size: 13, color: COPPER, shadow: false });
    drawPlateBtn(W - 52, 20, 36, 36, '✕', { size: 16, color: TEXT_DIM });
    hit('hub', W - 52, 20, 36, 36);
  }

  function drawForge() {
    drawMenuShell('FORGE', 'MERGE · RELICS');
    var slotY = 140;
    for (var i = 0; i < 2; i++) {
      var sx = W / 2 - 100 + i * 120, sy = slotY;
      fillPanel(sx, sy, 80, 80, 10);
      text(G.forge[i] ? G.forge[i] : 'SLOT', sx + 40, sy + 48, {
        align: 'center', size: 12, color: G.forge[i] ? CORE : TEXT_DIM, glow: !!G.forge[i]
      });
      hit('clear-forge', sx, sy, 80, 80, String(i));
    }
    drawBattleCta((W - 180) / 2, 250, 180, 48, 'FUSE');
    hit('merge', (W - 180) / 2, 250, 180, 48);
    var y = 330;
    SHARDS.forEach(function (sh) {
      var q = G.P.shards[sh.id] || 0;
      if (!q) return;
      fillPanel(24, y, W - 48, 40, 8);
      text(sh.icon + ' ' + sh.name.toUpperCase() + '  x' + q, 40, y + 26, { size: 13, color: TEXT, shadow: false });
      hit('forge-add', 24, y, W - 48, 40, sh.id);
      y += 48;
    });
  }

  function drawTree() {
    drawMenuShell('CONSTELLATION', 'SP ' + G.P.skillPoints);
    ['bulwark', 'rift', 'warden'].forEach(function (r, i) {
      var bx = 20 + i * 110;
      if (G.P.loadout === r) drawTacticalBtn(bx, 110, 100, 32, r.toUpperCase(), { size: 11, cut: 8, hot: true });
      else {
        fillPanel(bx, 110, 100, 32, 8);
        text(r.toUpperCase(), bx + 50, 132, { align: 'center', size: 11, color: TEXT_DIM, shadow: false });
      }
      hit('loadout', bx, 110, 100, 32, r);
    });
    ctx.save();
    ctx.translate(20, 160);
    ctx.scale(0.55, 0.55);
    TREE.forEach(function (n) {
      n.req.forEach(function (r) {
        var p = nodeById(r);
        if (!p) return;
        ctx.strokeStyle = CORE_DIM;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(n.x, n.y); ctx.stroke();
      });
    });
    TREE.forEach(function (n) {
      var owned = hasNode(n.id);
      var can = canUnlock(n);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.keystone ? 17 : 13, 0, Math.PI * 2);
      ctx.fillStyle = owned ? 'rgba(94,224,208,0.35)' : can ? 'rgba(94,224,208,0.16)' : 'rgba(12,12,16,0.95)';
      ctx.fill();
      ctx.strokeStyle = owned ? CORE : can ? '#8ad4c8' : 'rgba(111,133,114,0.45)';
      ctx.lineWidth = 2; ctx.stroke();
      hit('select-node', 20 + n.x * 0.55 - 16, 160 + n.y * 0.55 - 16, 32, 32, n.id);
    });
    ctx.restore();
    var sel = nodeById(G.selNode) || nodeById('root');
    if (sel) {
      text(sel.name, 24, H - 120, { size: 18, color: CORE, glow: true });
      wrapText(sel.desc, W / 2, H - 95, W - 48, 12, TEXT_DIM);
      if (!hasNode(sel.id)) {
        drawTacticalBtn((W - 160) / 2, H - 60, 160, 40, 'UNLOCK ' + sel.cost, { size: 13 });
        hit('unlock', (W - 160) / 2, H - 60, 160, 40, sel.id);
      }
    }
  }

  function drawGate() {
    drawMenuShell('STARGATE', 'EXTRACT EXOTICS');
    var y = 120;
    PLANETS.forEach(function (pl) {
      var open = G.WORLD.planetsUnlocked.indexOf(pl.id) >= 0;
      fillPanel(20, y, W - 40, 72, 10);
      text(pl.name, 36, y + 30, { size: 15, color: open ? CORE : TEXT_DIM, glow: open });
      text(open ? pl.verb.toUpperCase() + ' · 35' : 'ERA ' + pl.eraNeed, 36, y + 52, {
        size: 11, color: TEXT_DIM, shadow: false
      });
      if (open) hit('extract', 20, y, W - 40, 72, pl.id);
      y += 84;
    });
  }

  function drawExtract() {
    var pl = G.extract.planet;
    coverImg('gate', 0, 0, W, H);
    ctx.fillStyle = 'rgba(7,7,9,0.7)';
    ctx.fillRect(0, 0, W, H);
    fillPanel(W * 0.1, H * 0.32, W * 0.8, 160, 14);
    text(pl.name, W / 2, H * 0.38, { align: 'center', size: 24, color: CORE, glow: true });
    text(pl.verb, W / 2, H * 0.43, { align: 'center', size: 12, color: TEXT_DIM, shadow: false });
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    roundRect(40, H * 0.5, W - 80, 14, 6); ctx.fill();
    ctx.fillStyle = CORE;
    roundRect(40, H * 0.5, Math.max(4, (W - 80) * (G.extract.progress / 100)), 14, 6); ctx.fill();
    text('HAZARDS ' + G.extract.hazards + '/4', W / 2, H * 0.58, { align: 'center', size: 13, color: TEXT });
  }

  function drawEra() {
    drawMenuShell('TIMELINE', 'STABILIZE IN TOWER');
    var y = 120;
    ERAS.forEach(function (era, i) {
      var current = G.WORLD.eraIndex === i;
      var cleared = G.WORLD.erasCleared.indexOf(era.id) >= 0;
      fillPanel(20, y, W - 40, 78, 10);
      text(era.name, 36, y + 28, { size: 15, color: current ? CORE : TEXT, glow: current });
      text(cleared ? 'STABILIZED' : current ? 'ACTIVE' : 'SEALED', 36, y + 52, {
        size: 11, color: TEXT_DIM, shadow: false
      });
      y += 90;
    });
  }

  function drawLife() {
    drawMenuShell('SLOW LIFE', 'FISH · GARDEN');
    drawTacticalBtn(40, 130, W - 80, 56, G.fishCast ? 'WAITING…' : 'CAST LINE', { size: 16 });
    if (!G.fishCast) hit('fish', 40, 130, W - 80, 56);
    text('CAUGHT ' + G.P.fishCaught, W / 2, 210, { align: 'center', size: 12, color: TEXT_DIM, shadow: false });
    for (var i = 0; i < 4; i++) {
      var px = 30 + i * ((W - 60) / 4);
      var planted = G.P.gardenPlanted[i];
      var ready = planted && (Date.now() - planted >= 45000);
      fillPanel(px, 250, (W - 80) / 4, 70, 8);
      text(!planted ? 'PLANT' : ready ? 'HARVEST' : '…', px + ((W - 80) / 8), 292, {
        align: 'center', size: 11, color: ready ? CORE : TEXT_DIM, glow: ready
      });
      hit('garden', px, 250, (W - 80) / 4, 70, String(i));
    }
  }

  function drawStory() {
    drawMenuShell('LORE', 'CHAPTER ' + G.WORLD.storyChapter);
    var y = 120;
    STORY.forEach(function (ch) {
      var locked = ch.id > G.WORLD.storyChapter;
      fillPanel(20, y, W - 40, locked ? 64 : 110, 10);
      text(ch.title, 36, y + 28, { size: 15, color: locked ? TEXT_DIM : CORE, glow: !locked });
      if (!locked) wrapText(ch.body, W / 2, y + 55, W - 70, 12, TEXT_DIM);
      y += locked ? 76 : 122;
    });
  }

  /* ── Input ── */
  function onPointer(type, clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    var x = (clientX - rect.left) * (W / rect.width);
    var y = (clientY - rect.top) * (H / rect.height);
    G.pointer.x = x; G.pointer.y = y;
    if (type === 'down') G.pointer.down = true;
    if (type === 'up') {
      G.pointer.down = false;
      var h = hitAt(x, y);
      if (h) handleHit(h);
    }
  }

  function handleHit(h) {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    var id = h.id, d = h.data;
    if (id === 'pick') pickPlayer(d);
    else if (id === 'who') { savePlayer(); G.activeId = null; G.P = null; G.scene = 'who'; }
    else if (id === 'enter' || (id === 'mode' && d === 'tower')) go('tower');
    else if (id === 'mode') go(d);
    else if (id === 'hub') go('hub');
    else if (id === 'dismiss-story') { G.storyOpen = null; savePlayer(); }
    else if (id === 'start-tower') startTower(false);
    else if (id === 'start-coop') startTower(true);
    else if (id === 'flee') endTower(false);
    else if (id === 'ability') useAbility(d);
    else if (id === 'tower-up') {
      var def = TOWER_UPS.find(function (u) { return u.id === d; });
      if (!def) return;
      var lv = G.P.towerUp[d] || 0;
      var cost = Math.floor(def.base * Math.pow(1.38, lv));
      if (G.P.chrono < cost) { toast('NEED CHRONO'); return; }
      G.P.chrono -= cost;
      G.P.towerUp[d] = lv + 1;
      toast(def.name + ' ' + (lv + 1));
      savePlayer();
    } else if (id === 'forge-add') {
      var slot = G.forge[0] ? (G.forge[1] ? -1 : 1) : 0;
      if (slot < 0) { toast('FULL'); return; }
      if (!((G.P.shards[d] || 0) >= 1 || (G.P.exotics[d] || 0) >= 1)) { toast('NONE'); return; }
      G.forge[slot] = d;
    } else if (id === 'clear-forge') G.forge[+d] = null;
    else if (id === 'merge') tryMerge();
    else if (id === 'select-node') G.selNode = d;
    else if (id === 'unlock') {
      var node = nodeById(d);
      if (!canUnlock(node)) { toast('LOCKED'); return; }
      G.P.skillPoints -= node.cost;
      G.P.unlocked.push(node.id);
      toast(node.name);
      beep(400, 0.1);
      savePlayer();
    } else if (id === 'loadout') { G.P.loadout = d; savePlayer(); toast(d.toUpperCase()); }
    else if (id === 'extract') {
      var pl = PLANETS.find(function (p) { return p.id === d; });
      if (!pl || G.WORLD.planetsUnlocked.indexOf(d) < 0) return;
      if (G.P.chrono < 35) { toast('NEED 35'); return; }
      G.P.chrono -= 35;
      G.extract = { planet: pl, progress: 0, hazards: 0 };
      G.scene = 'extract';
      savePlayer();
    } else if (id === 'fish') {
      if (G.fishCast) return;
      G.fishCast = true;
      setTimeout(function () {
        G.fishCast = false;
        var catch_ = FISH[Math.floor(Math.random() * FISH.length)];
        if (catch_.chrono) G.P.chrono += catch_.chrono;
        if (catch_.essence) G.P.essence += catch_.essence;
        if (catch_.shard) G.P.shards[catch_.shard] = (G.P.shards[catch_.shard] || 0) + 1;
        G.P.fishCaught++;
        toast(catch_.name.toUpperCase());
        savePlayer();
      }, 900);
    } else if (id === 'garden') {
      var i = +d;
      var now = Date.now();
      if (!G.P.gardenPlanted[i]) {
        if (G.P.chrono < 15) { toast('NEED 15'); return; }
        G.P.chrono -= 15;
        G.P.gardenPlanted[i] = now;
        toast('PLANTED');
      } else if (now - G.P.gardenPlanted[i] >= 45000) {
        G.P.shards.bone = (G.P.shards.bone || 0) + 1;
        G.P.chrono += 12;
        G.P.gardenPlanted[i] = 0;
        toast('HARVEST');
      } else toast('GROWING…');
      savePlayer();
    }
  }

  /* ── Loop ── */
  function update(dt) {
    G.time += dt;
    G.hits = [];
    if (G.toastT > 0) G.toastT -= dt;
    if (G.shake > 0) G.shake -= dt;
    if (G.flash > 0) G.flash -= dt;
    G.particles = G.particles.filter(function (p) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      return p.life > 0;
    });
    if (G.scene === 'tower' && G.tower && G.tower.running) updateTower(dt);
    if (G.scene === 'extract' && G.extract) {
      G.extract.progress += (8 + (aggregateStats().extract || 0) * 10) * dt * 4;
      if (Math.random() < dt * 0.9) G.extract.hazards++;
      if (G.extract.progress >= 100) {
        var pl = G.extract.planet;
        var fail = G.extract.hazards >= 4 && Math.random() < 0.35;
        if (!fail) {
          G.P.exotics[pl.exotic] = (G.P.exotics[pl.exotic] || 0) + 1;
          toast(pl.exoticName.toUpperCase());
        } else {
          G.P.chrono += 10;
          toast('EXTRACT FAILED');
        }
        G.extract = null;
        G.scene = 'gate';
        savePlayer();
      }
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var sx = 0, sy = 0;
    if (G.shake > 0) {
      sx = (Math.random() - 0.5) * 10;
      sy = (Math.random() - 0.5) * 10;
    }
    ctx.save();
    ctx.translate(sx, sy);

    if (G.scene === 'boot') drawBoot();
    else if (G.scene === 'who') drawWho();
    else if (G.scene === 'hub') drawHub();
    else if (G.scene === 'tower') drawTower();
    else if (G.scene === 'forge') drawForge();
    else if (G.scene === 'tree') drawTree();
    else if (G.scene === 'gate') drawGate();
    else if (G.scene === 'extract') drawExtract();
    else if (G.scene === 'era') drawEra();
    else if (G.scene === 'life') drawLife();
    else if (G.scene === 'story') drawStory();
    else drawHub();

    G.particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    });

    if (G.flash > 0) {
      ctx.fillStyle = 'rgba(94,224,208,' + (G.flash * 0.3) + ')';
      ctx.fillRect(-20, -20, W + 40, H + 40);
    }

    if (G.toastT > 0 && G.toast) {
      var tw = Math.min(W * 0.84, 300);
      fillPanel((W - tw) / 2, H * 0.16, tw, 40, 10);
      text(G.toast, W / 2, H * 0.16 + 26, { align: 'center', size: 13, color: CORE, glow: true });
    }

    ctx.restore();
  }

  function frame(ts) {
    var dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function resize() {
    var parent = canvas.parentElement || document.body;
    var rw = parent.clientWidth || window.innerWidth;
    var rh = parent.clientHeight || window.innerHeight;
    W = Math.max(320, Math.floor(rw));
    H = Math.max(480, Math.floor(rh));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function loadImage(key, src) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () { images[key] = im; resolve(); };
      im.onerror = function () { resolve(); };
      im.src = src;
    });
  }

  function boot() {
    canvas = document.getElementById('game');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'game';
      document.body.appendChild(canvas);
    }
    ctx = canvas.getContext('2d', { alpha: false });
    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('pointerdown', function (e) { onPointer('down', e.clientX, e.clientY); });
    canvas.addEventListener('pointerup', function (e) { onPointer('up', e.clientX, e.clientY); });
    canvas.addEventListener('pointercancel', function () { G.pointer.down = false; });

    G.WORLD = loadWorld();
    G.scene = 'boot';

    var jobs = [
      loadImage('who', ART.who),
      loadImage('hub', ART.hub),
      loadImage('tower', ART.tower),
      loadImage('forge', ART.forge),
      loadImage('gate', ART.gate),
      loadImage('life', ART.life),
      loadImage('tree', ART.tree),
      loadImage('uiBtn', ART.uiBtn),
      loadImage('dock', '/public/art/chronos/dock-medallions.png'),
      loadImage('abilities', ART.uiAbilities)
    ];
    WARBAND.forEach(function (w) {
      jobs.push(loadImage('portrait-' + w.id, w.portrait));
    });

    Promise.all(jobs).then(function () {
      G.scene = 'who';
      lastTs = performance.now();
      requestAnimationFrame(frame);
    });

    try {
      bc = new BroadcastChannel('voidline-chronos');
    } catch (e) { bc = null; }

    // light presence ping
    setInterval(function () {
      if (!G.activeId || !G.WORLD) return;
      G.WORLD.presence[G.activeId] = Date.now();
      saveWorld();
      fetch('/api/chronos/' + encodeURIComponent(ROOM), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'presence', player: G.activeId })
      }).catch(function () {});
    }, 20000);
  }

  window.VoidlineChronos = {
    getScene: function () { return G.scene; },
    getPlayer: function () { return G.P; },
    getWorld: function () { return G.WORLD; },
    pick: function (id) { pickPlayer(id); },
    go: function (s) { go(s); },
    startTower: function (coop) { if (G.scene !== 'tower') go('tower'); startTower(!!coop); },
    towerLive: function () { return !!(G.tower && G.tower.running); },
    seats: function () { return WARBAND.length; },
    dismissStory: function () { G.storyOpen = null; if (G.P) savePlayer(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
