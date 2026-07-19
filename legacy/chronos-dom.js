/* VOIDLINE: CHRONOS — full warband build */
(function () {
  'use strict';

  var D = window.ChronosData;
  var SAVE_PREFIX = 'voidline_chronos_v2_';
  var WORLD_KEY = 'voidline_chronos_world_v2';
  var ROOM = (D && D.ROOM_ID) || 'voidline-chronos';
  var SAVE_VERSION = 2;

  var WARBAND = D.WARBAND;
  var ERAS = D.ERAS;
  var PLANETS = D.PLANETS;
  var SHARD_DEFS = D.SHARDS;
  var MERGE_RECIPES = D.RECIPES;
  var RELIC_BONUS = D.RELICS;
  var TREE = D.TREE;
  var TOWER_UPS = D.TOWER_UPS;
  var STORY = D.STORY;
  var FISH = D.FISH;

  var UI = {
    mode: 'who',
    selectedNode: null,
    forgeSlots: [null, null],
    tower: null,
    fishCast: false,
    gardenFlash: 0,
    storyOpen: null,
    shake: 0,
    syncLabel: 'LOCAL',
    extract: null
  };

  var P = null;
  var activeId = null;
  var WORLD = null;
  var remoteVersion = 0;
  var syncTimer = null;
  var raf = null;
  var lastTs = 0;
  var bc = null;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function warband(id) {
    return WARBAND.find(function (w) { return w.id === id; }) || WARBAND[0];
  }

  function toast(msg, kind) {
    var layer = document.getElementById('toast-layer');
    if (!layer) return;
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = msg;
    layer.appendChild(el);
    setTimeout(function () { el.remove(); }, 1500);
  }

  function shake(ms) {
    UI.shake = ms || 280;
    var app = document.getElementById('chronos-app');
    if (app) {
      app.classList.add('shaking');
      setTimeout(function () { app.classList.remove('shaking'); }, UI.shake);
    }
  }

  function buzz(pattern) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern == null ? 18 : pattern);
    } catch (e) {}
  }

  function flashOverlay(cls) {
    var app = document.getElementById('chronos-app');
    if (!app) return;
    var el = document.createElement('div');
    el.className = cls || 'merge-flash';
    app.appendChild(el);
    setTimeout(function () { el.remove(); }, 650);
  }

  function markScreenEnter() {
    var root = document.getElementById('screen-root');
    if (!root) return;
    var first = root.firstElementChild;
    if (!first) return;
    first.classList.add('screen-in');
  }

  function daySeed() {
    return Math.floor(Date.now() / 86400000);
  }

  function freshPlayer(id) {
    var shards = {};
    SHARD_DEFS.forEach(function (s) { shards[s.id] = 0; });
    shards.bone = 8;
    shards.ore = 6;
    return {
      v: SAVE_VERSION,
      id: id,
      chrono: 160,
      essence: 0,
      skillPoints: 4,
      unlocked: ['root'],
      loadout: id === 'jamie' ? 'bulwark' : id === 'edward' ? 'warden' : 'rift',
      loadouts: { bulwark: [], rift: [], warden: [] },
      relics: [],
      shards: shards,
      exotics: {},
      towerUp: { damage: 0, rate: 0, core: 0, range: 0, luck: 0 },
      wavesBest: 0,
      bossesKilled: 0,
      totalMerged: 0,
      fishCaught: 0,
      garden: [0, 0, 0, 0],
      gardenPlanted: [0, 0, 0, 0],
      dailyClaimed: 0,
      streak: 0,
      lastSeen: Date.now()
    };
  }

  function freshWorld() {
    return {
      v: SAVE_VERSION,
      eraIndex: 0,
      erasCleared: [],
      planetsUnlocked: ['cinder'],
      sharedBank: {},
      presence: {},
      storyChapter: 0,
      dailySeed: daySeed(),
      coop: null,
      quest: { id: 'hold5', name: 'Hold wave 5', prog: 0, target: 5, reward: 40 },
      log: [],
      updatedAt: Date.now()
    };
  }

  function migratePlayer(data, id) {
    var base = freshPlayer(id);
    var p = Object.assign(base, data || {});
    p.shards = Object.assign(base.shards, (data && data.shards) || {});
    p.towerUp = Object.assign(base.towerUp, (data && data.towerUp) || {});
    p.exotics = Object.assign({}, (data && data.exotics) || {});
    p.garden = (data && data.garden) || base.garden;
    p.gardenPlanted = (data && data.gardenPlanted) || base.gardenPlanted;
    return p;
  }

  /* ── Persistence + sync ── */
  function loadWorldLocal() {
    try {
      var raw = localStorage.getItem(WORLD_KEY);
      if (raw) return Object.assign(freshWorld(), JSON.parse(raw));
    } catch (e) {}
    return freshWorld();
  }

  function saveWorldLocal() {
    if (!WORLD) return;
    WORLD.updatedAt = Date.now();
    try { localStorage.setItem(WORLD_KEY, JSON.stringify(WORLD)); } catch (e) {}
    if (bc) {
      try { bc.postMessage({ type: 'world', world: WORLD, version: remoteVersion }); } catch (e) {}
    }
  }

  function loadPlayer(id) {
    try {
      var raw = localStorage.getItem(SAVE_PREFIX + id);
      if (raw) { P = migratePlayer(JSON.parse(raw), id); return; }
      // migrate v1
      raw = localStorage.getItem('voidline_chronos_v1_' + id);
      if (raw) { P = migratePlayer(JSON.parse(raw), id); return; }
    } catch (e) {}
    P = freshPlayer(id);
  }

  function savePlayer() {
    if (!P || !activeId) return;
    P.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_PREFIX + activeId, JSON.stringify(P)); } catch (e) {}
    if (WORLD) {
      if (!WORLD._players) WORLD._players = {};
      WORLD._players[activeId] = {
        loadout: P.loadout,
        wavesBest: P.wavesBest,
        unlocked: P.unlocked.length,
        relics: P.relics.slice(),
        lastSeen: P.lastSeen
      };
      WORLD.presence[activeId] = Date.now();
      saveWorldLocal();
    }
    queueRemoteSync();
    if (window.VoidlineCloud && window.VoidlineCloud.flushSave) {
      try {
        window.VoidlineCloud.flushSave(activeId, { chronos: P, chronosWorld: WORLD });
      } catch (e) {}
    }
  }

  function packRemoteState() {
    return {
      kind: 'chronos',
      world: WORLD,
      players: (function () {
        var out = {};
        WARBAND.forEach(function (w) {
          try {
            var raw = localStorage.getItem(SAVE_PREFIX + w.id);
            if (raw) out[w.id] = JSON.parse(raw);
          } catch (e) {}
        });
        if (P && activeId) out[activeId] = P;
        return out;
      })()
    };
  }

  function applyRemoteState(state, version) {
    if (!state || !state.world) return;
    var incoming = state.world;
    if (!WORLD || (incoming.updatedAt || 0) >= (WORLD.updatedAt || 0)) {
      WORLD = Object.assign(freshWorld(), incoming);
    }
    if (state.players && activeId && state.players[activeId]) {
      var remoteP = state.players[activeId];
      if ((remoteP.lastSeen || 0) > (P.lastSeen || 0)) {
        P = migratePlayer(remoteP, activeId);
        try { localStorage.setItem(SAVE_PREFIX + activeId, JSON.stringify(P)); } catch (e) {}
      }
    }
    // merge other players into local cache for co-op ghosts
    if (state.players) {
      Object.keys(state.players).forEach(function (pid) {
        if (pid === activeId) return;
        try {
          var local = localStorage.getItem(SAVE_PREFIX + pid);
          var lp = local ? JSON.parse(local) : null;
          if (!lp || (state.players[pid].lastSeen || 0) > (lp.lastSeen || 0)) {
            localStorage.setItem(SAVE_PREFIX + pid, JSON.stringify(state.players[pid]));
          }
        } catch (e) {}
      });
    }
    remoteVersion = version || remoteVersion;
    UI.syncLabel = 'CLOUD';
  }

  var syncQueued = false;
  function queueRemoteSync() {
    if (syncQueued) return;
    syncQueued = true;
    setTimeout(function () {
      syncQueued = false;
      pushRemote();
    }, 600);
  }

  async function pullRemote() {
    try {
      var res = await fetch('/api/chronos/' + encodeURIComponent(ROOM));
      if (!res.ok) { UI.syncLabel = 'LOCAL'; return; }
      var data = await res.json();
      if (data.localOnly) { UI.syncLabel = 'LOCAL'; return; }
      if (!data.state) {
        await fetch('/api/chronos/' + encodeURIComponent(ROOM), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'init', state: packRemoteState() })
        });
        remoteVersion = 1;
        UI.syncLabel = 'CLOUD';
        return;
      }
      applyRemoteState(data.state, data.version);
      remoteVersion = data.version || 0;
      if (data.presence) {
        Object.keys(data.presence).forEach(function (k) {
          WORLD.presence[k.toLowerCase()] = data.presence[k];
        });
      }
    } catch (e) {
      UI.syncLabel = 'LOCAL';
    }
  }

  async function pushRemote() {
    if (!WORLD) return;
    try {
      var res = await fetch('/api/chronos/' + encodeURIComponent(ROOM), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          version: remoteVersion,
          player: activeId,
          state: packRemoteState()
        })
      });
      var data = await res.json();
      if (res.status === 409 && data.state) {
        applyRemoteState(data.state, data.version);
        remoteVersion = data.version;
        // retry once
        res = await fetch('/api/chronos/' + encodeURIComponent(ROOM), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sync',
            version: remoteVersion,
            player: activeId,
            state: packRemoteState()
          })
        });
        data = await res.json();
      }
      if (data.version) remoteVersion = data.version;
      if (!data.localOnly && res.ok) UI.syncLabel = 'CLOUD';
    } catch (e) {
      UI.syncLabel = 'LOCAL';
    }
  }

  function selectPlayer(id) {
    activeId = id;
    loadPlayer(id);
    WORLD = loadWorldLocal();
    claimDailyIfNeeded();
    WORLD.presence[id] = Date.now();
    saveWorldLocal();
    UI.mode = 'hub';
    if (WORLD.storyChapter === 0 && !(P._introSeen)) {
      UI.storyOpen = 0;
      P._introSeen = true;
    }
    buzz([16, 24, 16]);
    pullRemote().then(function () { render(); });
    savePlayer();
    render();
  }

  function claimDailyIfNeeded() {
    var d = daySeed();
    if (P.dailyClaimed === d) return;
    if (P.dailyClaimed === d - 1) P.streak = (P.streak || 0) + 1;
    else P.streak = 1;
    P.dailyClaimed = d;
    var bonus = 40 + P.streak * 8;
    P.chrono += bonus;
    P.skillPoints += 1;
    /* silent grant — avoid web-toast spam on boot */
  }

  function nodeById(id) { return TREE.find(function (n) { return n.id === id; }); }
  function hasNode(id) { return P && P.unlocked.indexOf(id) >= 0; }
  function canUnlock(node) {
    if (!P || !node || hasNode(node.id)) return false;
    if (P.skillPoints < node.cost) return false;
    return node.req.every(function (r) { return hasNode(r); });
  }

  function unlockNode(id) {
    var node = nodeById(id);
    if (!canUnlock(node)) { toast('LOCKED', 'bad'); return; }
    P.skillPoints -= node.cost;
    P.unlocked.push(id);
    if (node.role && node.role !== 'any') {
      if (!P.loadouts[node.role]) P.loadouts[node.role] = [];
      if (P.loadouts[node.role].indexOf(id) < 0) P.loadouts[node.role].push(id);
    }
    savePlayer();
    toast(node.name, 'good');
    shake(160);
    render();
  }

  function aggregateStats(player) {
    var pl = player || P;
    var stats = { armor: 0, dmg: 0, crit: 0, regen: 0, chain: 0, taunt: 0, shield: 0, quake: 0, freeze: 0, phoenix: 0, aura: 0, cleanse: 0, burn: 0, slow: 0, mergeLuck: 0, extract: 0, bossDmg: 0, nova: 0, heal: 0, chronoGain: 0, lifeYield: 0, coopPower: 0, coreMult: 0, gateBreak: 0 };
    if (!pl) return stats;
    (pl.unlocked || []).forEach(function (id) {
      var n = nodeById(id);
      if (!n || !n.stats) return;
      Object.keys(n.stats).forEach(function (k) { stats[k] = (stats[k] || 0) + n.stats[k]; });
    });
    (pl.relics || []).forEach(function (rid) {
      var b = RELIC_BONUS[rid];
      if (!b) return;
      Object.keys(b).forEach(function (k) {
        if (k === 'label') return;
        stats[k] = (stats[k] || 0) + b[k];
      });
    });
    return stats;
  }

  function partyRolesOnline() {
    var now = Date.now();
    var roles = {};
    WARBAND.forEach(function (w) {
      var on = WORLD.presence[w.id] && (now - WORLD.presence[w.id] < 5 * 60 * 1000);
      if (!on) return;
      try {
        var raw = localStorage.getItem(SAVE_PREFIX + w.id);
        var pl = raw ? JSON.parse(raw) : null;
        if (pl) roles[w.id] = pl.loadout || 'rift';
      } catch (e) { roles[w.id] = 'rift'; }
    });
    if (P) roles[activeId] = P.loadout;
    return roles;
  }

  function roleCoverage() {
    var roles = partyRolesOnline();
    var set = { bulwark: false, rift: false, warden: false };
    Object.keys(roles).forEach(function (id) { set[roles[id]] = true; });
    // solo: AI fills gaps
    var online = Object.keys(roles).length;
    if (online <= 1) {
      set.bulwark = set.rift = set.warden = true;
    }
    return set;
  }

  /* ── Forge ── */
  function addShard(id, n) {
    if (!P.shards[id]) P.shards[id] = 0;
    P.shards[id] += n;
  }

  function tryMerge() {
    var a = UI.forgeSlots[0];
    var b = UI.forgeSlots[1];
    if (!a || !b) { toast('NEED TWO', 'bad'); return; }
    var recipe = MERGE_RECIPES.find(function (r) {
      return (r.a === a && r.b === b) || (r.a === b && r.b === a);
    });
    function hasMat(id) { return (P.shards[id] || 0) >= 1 || (P.exotics[id] || 0) >= 1; }
    function takeMat(id) {
      if ((P.shards[id] || 0) >= 1) P.shards[id]--;
      else if ((P.exotics[id] || 0) >= 1) P.exotics[id]--;
    }
    if (!hasMat(a) || !hasMat(b)) { toast('MISSING', 'bad'); return; }
    takeMat(a); takeMat(b);
    if (!recipe) {
      UI.forgeSlots = [null, null];
      P.chrono += 10;
      toast('SCRAP +10');
      buzz(12);
      savePlayer(); render(); return;
    }
    var s = aggregateStats();
    if (recipe.relic) {
      if (P.relics.indexOf(recipe.out) < 0) P.relics.push(recipe.out);
      toast(recipe.name.toUpperCase(), 'good');
      shake(220);
    } else {
      var bonus = s.mergeLuck && Math.random() < 0.35 ? 1 : 0;
      addShard(recipe.out, 1 + bonus);
      toast('FORGED ' + recipe.name + (bonus ? ' x2' : ''), 'good');
    }
    P.totalMerged++;
    P.essence += 1;
    if (P.totalMerged % 3 === 0) P.skillPoints += 1;
    UI.forgeSlots = [null, null];
    buzz([22, 30, 22]);
    flashOverlay('merge-flash');
    savePlayer();
    render();
  }

  function putForgeShard(id) {
    var slot = UI.forgeSlots[0] ? (UI.forgeSlots[1] ? -1 : 1) : 0;
    if (slot < 0) { toast('FULL', 'bad'); return; }
    var ok = (P.shards[id] || 0) >= 1 || (P.exotics[id] || 0) >= 1;
    if (!ok) { toast('NONE', 'bad'); return; }
    UI.forgeSlots[slot] = id;
    render();
  }

  /* ── Tower / co-op boss ── */
  function towerDps() {
    var s = aggregateStats();
    var up = P.towerUp.damage || 0;
    var base = 16 + up * 5;
    var role = P.loadout === 'rift' ? 1.2 : P.loadout === 'bulwark' ? 0.85 : 0.9;
    var party = 1 + (s.coopPower || 0) + (s.aura || 0) * 0.5;
    return base * (1 + s.dmg) * role * party;
  }

  function towerFireRate() { return Math.max(0.16, 0.52 - (P.towerUp.rate || 0) * 0.028); }
  function towerRange() { return 120 + (P.towerUp.range || 0) * 12; }
  function towerMaxHp() {
    var s = aggregateStats();
    return Math.floor((260 + (P.towerUp.core || 0) * 45) * (1 + s.armor) * (1 + (s.coreMult || 0)));
  }

  function startTower(coopBoss) {
    var s = aggregateStats();
    var cov = roleCoverage();
    UI.tower = {
      running: true,
      coopBoss: !!coopBoss,
      t: 0,
      wave: 1,
      spawnAcc: 0,
      fireAcc: 0,
      coreHp: towerMaxHp(),
      coreMax: towerMaxHp(),
      enemies: [],
      fx: [],
      cds: { primary: 0, secondary: 0, ultimate: 0 },
      frozen: 0,
      phoenixUsed: false,
      kills: 0,
      chronoEarned: 0,
      shield: s.shield || 0,
      gates: { bulwark: 0, rift: 0, warden: 0 },
      coverage: cov,
      combo: 0
    };
    if (coopBoss) {
      WORLD.coop = {
        host: activeId,
        started: Date.now(),
        wave: 1,
        roles: partyRolesOnline()
      };
      saveWorldLocal();
      queueRemoteSync();
    }
    UI.mode = 'tower';
    lastTs = performance.now();
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(towerLoop);
    render();
  }

  function bumpQuest(wave) {
    if (!WORLD.quest) return;
    if (WORLD.quest.id === 'hold5') WORLD.quest.prog = Math.max(WORLD.quest.prog, wave);
    if (WORLD.quest.prog >= WORLD.quest.target && !WORLD.quest.done) {
      WORLD.quest.done = true;
      P.chrono += WORLD.quest.reward;
      toast('QUEST CLEAR +' + WORLD.quest.reward, 'good');
    }
  }

  function endTower(won) {
    if (!UI.tower) return;
    var t = UI.tower;
    t.running = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    var s = aggregateStats();
    var gain = Math.floor(t.chronoEarned * (1 + (s.chronoGain || 0)));
    P.chrono += gain;
    P.essence += Math.floor(t.wave / 2);
    if (t.wave > P.wavesBest) P.wavesBest = t.wave;
    bumpQuest(t.wave);
    if (t.wave >= 6) {
      var era = ERAS[WORLD.eraIndex];
      if (era && WORLD.erasCleared.indexOf(era.id) < 0) {
        // role gate for era bosses on wave 6+
        var need = Math.max(1, 2 - (s.gateBreak || 0));
        var filled = ['bulwark', 'rift', 'warden'].filter(function (r) { return t.gates[r] > 0 || t.coverage[r]; }).length;
        if (t.coopBoss || filled >= need || t.wave >= 8) {
          WORLD.erasCleared.push(era.id);
          if (WORLD.eraIndex < ERAS.length - 1) {
            WORLD.eraIndex++;
            WORLD.storyChapter = Math.min(STORY.length - 1, WORLD.eraIndex + 1);
            UI.storyOpen = WORLD.storyChapter;
          }
          P.skillPoints += 2;
          toast('ERA STABILIZED', 'good');
          PLANETS.forEach(function (pl) {
            if (pl.eraNeed <= WORLD.eraIndex && WORLD.planetsUnlocked.indexOf(pl.id) < 0) {
              WORLD.planetsUnlocked.push(pl.id);
            }
          });
        } else {
          toast('NEED ROLE GATES — taunt / arc / mend', 'bad');
        }
      }
    }
    toast((won ? 'HOLD' : 'BREACH') + ' · +' + gain + ' CHRONO', won ? 'mega' : 'bad');
    if (won) { flashOverlay('victory-burst'); buzz([20, 40, 20, 40, 35]); }
    else buzz([40, 80]);
    addShard('bone', 2 + Math.floor(t.wave / 2));
    if (t.wave >= 3) addShard('spark', 1);
    if (t.kills >= 20) addShard('ash', 1);
    if ((P.towerUp.luck || 0) > 0 && Math.random() < 0.2) addShard('echo', 1);
    WORLD.coop = null;
    UI.tower = null;
    savePlayer();
    UI.mode = 'hub';
    render();
  }

  function spawnEnemy(wave, forceBoss) {
    var roll = Math.random();
    var type = 'swarm';
    if (forceBoss || (wave % 5 === 0 && !UI.tower.enemies.some(function (e) { return e.type === 'boss'; }))) type = 'boss';
    else if (wave >= 4 && roll > 0.8) type = 'brute';
    else if (wave >= 3 && roll > 0.62) type = 'flyer';
    var side = Math.floor(Math.random() * 4);
    var x = 50, y = 50;
    if (side === 0) { x = Math.random() * 100; y = -6; }
    if (side === 1) { x = 106; y = Math.random() * 100; }
    if (side === 2) { x = Math.random() * 100; y = 106; }
    if (side === 3) { x = -6; y = Math.random() * 100; }
    var hp = type === 'boss' ? 220 + wave * 55 : type === 'brute' ? 60 + wave * 12 : type === 'flyer' ? 24 + wave * 5 : 18 + wave * 6;
    var spd = type === 'flyer' ? 20 + wave : type === 'brute' ? 8 + wave * 0.35 : type === 'boss' ? 5.5 : 13 + wave * 0.55;
    // era-colored elites
    var eraTint = ERAS[WORLD.eraIndex] ? ERAS[WORLD.eraIndex].accent : '#ff6a3d';
    UI.tower.enemies.push({ id: Math.random().toString(36).slice(2, 8), type: type, x: x, y: y, hp: hp, max: hp, spd: spd, tint: eraTint });
  }

  function damageEnemy(e, amt, tag) {
    var s = aggregateStats();
    var dmg = amt;
    if (e.type === 'boss') dmg *= 1 + (s.bossDmg || 0);
    var crit = Math.random() < (0.08 + (s.crit || 0));
    if (crit) dmg *= 2;
    dmg = Math.max(1, Math.floor(dmg));
    e.hp -= dmg;
    e.hitFlash = 0.12;
    UI.tower.fx.push({ kind: 'hit', x: e.x, y: e.y, life: 0.32 });
    UI.tower.fx.push({
      kind: 'dmg',
      x: e.x + (Math.random() * 6 - 3),
      y: e.y - 4,
      life: 0.7,
      text: String(dmg),
      crit: crit
    });
    UI.tower.combo++;
    if (tag) UI.tower.gates[tag] = (UI.tower.gates[tag] || 0) + 1;
    if (e.hp <= 0) {
      UI.tower.kills++;
      UI.tower.chronoEarned += e.type === 'boss' ? 50 : e.type === 'brute' ? 9 : 3;
      UI.tower.fx.push({ kind: 'burst', x: e.x, y: e.y, life: 0.45 });
      if (e.type === 'boss') {
        P.bossesKilled++;
        P.skillPoints += 1;
        shake(320);
        buzz([40, 60, 40]);
        flashOverlay('victory-burst');
      }
      return true;
    }
    return false;
  }

  function fireAtNearest() {
    var t = UI.tower;
    if (!t.enemies.length) return;
    var cx = 50, cy = 78;
    var rangePct = towerRange() / 3.2;
    var best = null, bestD = 1e9;
    t.enemies.forEach(function (e) {
      var d = Math.hypot(e.x - cx, e.y - cy);
      if (d < bestD && d <= rangePct) { bestD = d; best = e; }
    });
    if (!best) return;
    var dmg = towerDps() * 0.38;
    UI.tower.fx.push({ kind: 'beam', x1: cx, y1: cy, x2: best.x, y2: best.y, life: 0.12 });
    damageEnemy(best, dmg, P.loadout === 'rift' ? 'rift' : null);
    var s = aggregateStats();
    if (s.chain > 0) {
      var chained = 0;
      t.enemies.forEach(function (e) {
        if (e === best || chained >= s.chain) return;
        if (Math.hypot(e.x - best.x, e.y - best.y) < 24) {
          damageEnemy(e, dmg * 0.55, 'rift');
          chained++;
        }
      });
    }
    t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
  }

  function useAbility(slot) {
    var t = UI.tower;
    if (!t || !t.running) return;
    var s = aggregateStats();
    if (slot === 'primary') {
      if (t.cds.primary > 0) return;
      t.cds.primary = 2.0;
      if (P.loadout === 'bulwark') {
        t.enemies.forEach(function (e) {
          e.x += (50 - e.x) * 0.4;
          e.y += (78 - e.y) * 0.4;
        });
        t.gates.bulwark++;
        toast('TAUNT', 'good');
      } else if (P.loadout === 'warden') {
        var heal = 40 + (s.heal || 0) * 80 + s.regen;
        t.coreHp = Math.min(t.coreMax, t.coreHp + heal);
        t.gates.warden++;
        toast('MEND', 'good');
      } else {
        t.enemies.forEach(function (e) { damageEnemy(e, towerDps(), 'rift'); });
        t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
        toast('ARC', 'good');
      }
    } else if (slot === 'secondary') {
      if (t.cds.secondary > 0) return;
      t.cds.secondary = 5;
      if (s.quake || P.loadout === 'bulwark') {
        t.enemies.forEach(function (e) {
          if (Math.hypot(e.x - 50, e.y - 78) < 42) {
            e.spd *= 0.15;
            damageEnemy(e, 50, 'bulwark');
          }
        });
        t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
        shake(200);
        toast('QUAKE');
      } else if (s.freeze || P.loadout === 'rift') {
        t.frozen = s.freeze || 1.2;
        t.gates.rift++;
        toast('TIMELINE CUT');
      } else {
        t.shield += 55;
        t.gates.warden++;
        toast('WARD');
      }
    } else if (slot === 'ultimate') {
      if (t.cds.ultimate > 0) return;
      t.cds.ultimate = 12;
      var ult = towerDps() * 2.4;
      if (s.nova) {
        t.enemies.forEach(function (e) { damageEnemy(e, ult, 'rift'); });
      } else {
        t.enemies.slice(0, 6).forEach(function (e) { damageEnemy(e, ult, P.loadout); });
      }
      t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
      // ghost allies contribute
      var roles = partyRolesOnline();
      Object.keys(roles).forEach(function (pid) {
        if (pid === activeId) return;
        t.coreHp = Math.min(t.coreMax, t.coreHp + 12);
        t.chronoEarned += 2;
      });
      shake(260);
      buzz([30, 40, 30]);
      flashOverlay('merge-flash');
      toast('OVERLOAD', 'mega');
    }
    buzz(14);
    syncTowerDom();
  }

  function towerLoop(ts) {
    if (!UI.tower || !UI.tower.running) return;
    var dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    var t = UI.tower;
    var s = aggregateStats();
    t.t += dt;
    if (t.frozen > 0) t.frozen -= dt;
    Object.keys(t.cds).forEach(function (k) {
      if (t.cds[k] > 0) t.cds[k] = Math.max(0, t.cds[k] - dt);
    });

    t.spawnAcc += dt;
    var interval = Math.max(0.4, 1.35 - t.wave * 0.055);
    if (t.spawnAcc >= interval) {
      t.spawnAcc = 0;
      spawnEnemy(t.wave, t.coopBoss && t.wave % 5 === 0);
    }
    if (t.t > t.wave * 11.5) {
      t.wave++;
      t.t = 0;
      t.chronoEarned += 6;
      toast('WAVE ' + t.wave);
      if (t.wave > 14) { endTower(true); return; }
    }

    if (s.regen > 0) t.coreHp = Math.min(t.coreMax, t.coreHp + s.regen * dt * 0.3);
    // AI ghost heals if warden missing but solo coverage
    if (t.coverage.warden && P.loadout !== 'warden') {
      t.coreHp = Math.min(t.coreMax, t.coreHp + 3 * dt);
    }

    t.fireAcc += dt;
    if (t.fireAcc >= towerFireRate()) {
      t.fireAcc = 0;
      fireAtNearest();
    }

    var slow = 1 - Math.min(0.55, s.slow || 0);
    if (t.frozen > 0) slow *= 0.12;
    var cx = 50, cy = 78;
    t.enemies.forEach(function (e) {
      var dx = cx - e.x, dy = cy - e.y;
      var len = Math.hypot(dx, dy) || 1;
      e.x += (dx / len) * e.spd * slow * dt;
      e.y += (dy / len) * e.spd * slow * dt;
      if (Math.hypot(e.x - cx, e.y - cy) < 4.2) {
        var hit = e.type === 'boss' ? 32 : e.type === 'brute' ? 15 : 8;
        hit *= (1 - Math.min(0.55, s.armor || 0));
        if (t.shield > 0) {
          t.shield -= hit;
          if (t.shield < 0) { t.coreHp += t.shield; t.shield = 0; }
        } else t.coreHp -= hit;
        e.hp = 0;
        shake(120);
        buzz(25);
      }
    });
    t.enemies.forEach(function (e) {
      if (e.hitFlash > 0) e.hitFlash = Math.max(0, e.hitFlash - dt);
    });
    t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
    t.fx = t.fx.map(function (f) { f.life -= dt; return f; }).filter(function (f) { return f.life > 0; });

    if (t.coreHp <= 0) {
      if ((s.phoenix || 0) && !t.phoenixUsed) {
        t.phoenixUsed = true;
        t.coreHp = t.coreMax * 0.45;
        toast('PHOENIX', 'good');
      } else {
        endTower(false);
        return;
      }
    }
    syncTowerDom();
    raf = requestAnimationFrame(towerLoop);
  }

  function syncTowerDom() {
    var root = document.getElementById('tower-live');
    if (!root || !UI.tower) return;
    var t = UI.tower;
    var hpEl = root.querySelector('.tower-core-hp > i');
    if (hpEl) hpEl.style.width = Math.max(0, t.coreHp / t.coreMax * 100) + '%';
    var waveEl = root.querySelector('[data-wave]');
    if (waveEl) waveEl.textContent = (t.coopBoss ? 'CO-OP ' : '') + 'WAVE ' + t.wave;
    var hpTxt = root.querySelector('[data-hp]');
    if (hpTxt) hpTxt.textContent = Math.ceil(t.coreHp) + ' / ' + t.coreMax;
    var combo = root.querySelector('[data-combo]');
    if (combo) combo.textContent = t.combo > 4 ? t.combo + ' COMBO' : '';
    var gates = root.querySelector('[data-gates]');
    if (gates) {
      gates.textContent = 'B' + t.gates.bulwark + ' R' + t.gates.rift + ' W' + t.gates.warden;
    }
    var layer = root.querySelector('.enemy-layer');
    if (layer) {
      var bits = t.enemies.map(function (e) {
        var pct = Math.max(0, Math.min(100, (e.hp / e.max) * 100));
        var hit = e.hitFlash > 0 ? ' is-hit' : '';
        return '<div class="enemy ' + e.type + hit + '" style="left:' + e.x + '%;top:' + e.y + '%;--tint:' + (e.tint || '#ff6a3d') + '">' +
          '<i class="enemy-hp"><b style="width:' + pct + '%"></b></i></div>';
      });
      t.fx.forEach(function (f) {
        if (f.kind === 'beam') {
          var dx = f.x2 - f.x1, dy = f.y2 - f.y1;
          var len = Math.hypot(dx, dy);
          var ang = Math.atan2(dy, dx) * 180 / Math.PI;
          bits.push('<div class="fx-beam" style="left:' + f.x1 + '%;top:' + f.y1 + '%;width:' + len + '%;transform:rotate(' + ang + 'deg)"></div>');
        } else if (f.kind === 'dmg') {
          bits.push('<div class="dmg-float' + (f.crit ? ' crit' : '') + '" style="left:' + f.x + '%;top:' + f.y + '%">' + f.text + (f.crit ? '!' : '') + '</div>');
        } else if (f.kind === 'burst') {
          bits.push('<div class="fx-burst" style="left:' + f.x + '%;top:' + f.y + '%"></div>');
        } else {
          bits.push('<div class="fx-hit" style="left:' + (f.x || 0) + '%;top:' + (f.y || 0) + '%"></div>');
        }
      });
      layer.innerHTML = bits.join('');
    }
    ['primary', 'secondary', 'ultimate'].forEach(function (k) {
      var btn = root.querySelector('[data-ability="' + k + '"]');
      if (!btn) return;
      btn.disabled = t.cds[k] > 0;
      var cdEl = btn.querySelector('.cd');
      if (cdEl) cdEl.textContent = t.cds[k] > 0 ? t.cds[k].toFixed(1) : 'READY';
    });
  }

  function buyTowerUp(id) {
    var def = TOWER_UPS.find(function (u) { return u.id === id; });
    if (!def) return;
    var lv = P.towerUp[id] || 0;
    var cost = Math.floor(def.base * Math.pow(1.38, lv));
    if (P.chrono < cost) { toast('NEED CHRONO', 'bad'); return; }
    P.chrono -= cost;
    P.towerUp[id] = lv + 1;
    savePlayer();
    toast(def.name + ' ' + (lv + 1), 'good');
    render();
  }

  /* ── Planets extract mini ── */
  function startExtract(pid) {
    var pl = PLANETS.find(function (p) { return p.id === pid; });
    if (!pl || WORLD.planetsUnlocked.indexOf(pid) < 0) { toast('LOCKED', 'bad'); return; }
    if (P.chrono < 35) { toast('NEED 35 CHRONO', 'bad'); return; }
    P.chrono -= 35;
    UI.extract = { planet: pl, t: 0, progress: 0, hazards: 0 };
    UI.mode = 'extract';
    savePlayer();
    render();
    var iv = setInterval(function () {
      if (!UI.extract) { clearInterval(iv); return; }
      UI.extract.t += 0.25;
      UI.extract.progress += 8 + (aggregateStats().extract || 0) * 10;
      if (Math.random() < 0.25) UI.extract.hazards++;
      if (UI.extract.progress >= 100) {
        clearInterval(iv);
        finishExtract(true);
      } else if (UI.extract.hazards > 4) {
        clearInterval(iv);
        finishExtract(false);
      } else {
        var bar = document.querySelector('.extract-bar > i');
        if (bar) bar.style.width = UI.extract.progress + '%';
      }
    }, 250);
  }

  function finishExtract(ok) {
    var pl = UI.extract && UI.extract.planet;
    UI.extract = null;
    if (!pl) { UI.mode = 'gate'; render(); return; }
    if (ok) {
      var s = aggregateStats();
      var n = 1 + (Math.random() < 0.3 + (s.extract || 0) ? 1 : 0);
      P.exotics[pl.exotic] = (P.exotics[pl.exotic] || 0) + n;
      WORLD.sharedBank[pl.exotic] = (WORLD.sharedBank[pl.exotic] || 0) + n;
      if (Math.random() < 0.35) addShard('echo', 1);
      toast(pl.exoticName.toUpperCase() + ' x' + n, 'good');
      shake(180);
    } else {
      P.chrono += 10;
      toast('EXTRACT FAILED — scrap returned', 'bad');
    }
    savePlayer();
    UI.mode = 'gate';
    render();
  }

  /* ── Minigames ── */
  function castFish() {
    if (UI.fishCast) return;
    UI.fishCast = true;
    render();
    setTimeout(function () {
      UI.fishCast = false;
      var s = aggregateStats();
      var pool = [];
      FISH.forEach(function (f) {
        var w = f.weight * (1 + (s.lifeYield || 0));
        for (var i = 0; i < w; i++) pool.push(f);
      });
      var catch_ = pool[Math.floor(Math.random() * pool.length)];
      if (catch_.chrono) P.chrono += catch_.chrono;
      if (catch_.essence) P.essence += catch_.essence;
      if (catch_.shard) addShard(catch_.shard, 1);
      P.fishCaught++;
      toast(catch_.name.toUpperCase(), 'good');
      savePlayer();
      render();
    }, 900);
  }

  function tendGarden(i) {
    var now = Date.now();
    if (!P.gardenPlanted[i]) {
      if (P.chrono < 15) { toast('NEED 15', 'bad'); return; }
      P.chrono -= 15;
      P.gardenPlanted[i] = now;
      P.garden[i] = 0;
      toast('PLANTED');
      savePlayer(); render(); return;
    }
    var age = now - P.gardenPlanted[i];
    if (age < 45000) {
      toast('GROWING ' + Math.ceil((45000 - age) / 1000) + 's', 'bad');
      return;
    }
    var s = aggregateStats();
    var yieldN = 1 + (Math.random() < (s.lifeYield || 0) ? 1 : 0);
    addShard(Math.random() < 0.5 ? 'ore' : 'bone', yieldN);
    if (Math.random() < 0.2) addShard('spark', 1);
    P.chrono += 12;
    P.gardenPlanted[i] = 0;
    toast('HARVEST x' + yieldN, 'good');
    savePlayer();
    render();
  }

  /* ── Render ── */
  function artUrl(key) {
    return (D.ART && D.ART[key]) || '';
  }

  function renderWho() {
    var h = '<div class="who-screen skin-console">';
    h += '<div class="screen-art" style="background-image:url(\'' + artUrl('who') + '\')"></div>';
    h += '<div class="who-title"><span>VOIDLINE</span><strong>CHRONOS</strong></div>';
    h += '<div class="who-seats">';
    WARBAND.forEach(function (w) {
      h += '<button type="button" class="seat" data-action="pick" data-id="' + w.id + '" style="--seat-accent:' + w.accent + ';--seat-art:url(\'' + w.portrait + '\')">';
      h += '<span class="seat-wash"></span>';
      h += '<span class="seat-name">' + esc(w.name.toUpperCase()) + '</span>';
      h += '</button>';
    });
    h += '</div></div>';
    return h;
  }

  function dockBtn(action, med, label) {
    return '<button type="button" class="dock-btn dock-' + action + '" data-action="mode" data-id="' + action + '" aria-label="' + label + '">' +
      '<span class="dock-glyph medallion med-' + med + '"></span></button>';
  }

  function renderHub() {
    var w = warband(activeId);
    var era = ERAS[WORLD.eraIndex] || ERAS[0];
    var h = '<div class="hub-screen skin-console">';
    h += '<img class="hub-fill" src="' + artUrl('hub') + '" alt="" draggable="false">';
    h += '<button type="button" class="float-pilot" data-action="who" style="--seat-accent:' + w.accent + '" aria-label="Switch">';
    h += '<img src="' + w.portrait + '" alt=""></button>';
    h += '<div class="float-chrono"><b>' + P.chrono + '</b></div>';
    h += '<div class="float-center hub-stage">';
    h += '<div class="float-era">' + esc(era.name) + '</div>';
    h += '<button type="button" class="hub-enter" data-action="mode" data-id="tower" style="background-image:url(\'' + artUrl('uiBtn') + '\')"><span>ENTER</span></button>';
    h += '</div>';
    h += '<nav class="float-dock hub-dock" aria-label="Actions">';
    h += dockBtn('tower', 'tower', 'Tower');
    h += dockBtn('forge', 'forge', 'Forge');
    h += dockBtn('tree', 'tree', 'Tree');
    h += dockBtn('gate', 'gate', 'Gate');
    h += dockBtn('era', 'era', 'Eras');
    h += dockBtn('life', 'life', 'Life');
    h += dockBtn('story', 'story', 'Lore');
    h += '</nav></div>';
    return h;
  }

  function renderTree() {
    var sel = UI.selectedNode ? nodeById(UI.selectedNode) : nodeById('root');
    var h = '<div class="mode-screen skin-console"><div class="mode-head float-head"><div>';
    h += '<h2 class="mode-title">CONSTELLATION</h2><p class="mode-sub">SP ' + P.skillPoints + ' · ' + P.unlocked.length + ' NODES · ' + P.loadout.toUpperCase() + '</p></div>';
    h += '<button type="button" class="back-stone" data-action="mode" data-id="hub">×</button></div>';
    h += '<div class="role-banner">';
    ['bulwark', 'rift', 'warden'].forEach(function (r) {
      h += '<button type="button" class="loadout-chip' + (P.loadout === r ? ' active' : '') + ' role-tag ' + r + '" data-action="loadout" data-id="' + r + '">' + r.toUpperCase() + '</button>';
    });
    h += '</div><div class="panel-scroll"><div class="tree-canvas-wrap" style="background-image:url(\'' + artUrl('tree') + '\')"><svg class="tree-svg" viewBox="0 0 600 620">';
    TREE.forEach(function (n) {
      n.req.forEach(function (r) {
        var p = nodeById(r);
        if (!p) return;
        h += '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + n.x + '" y2="' + n.y + '" stroke="rgba(232,197,106,0.22)" stroke-width="2"/>';
      });
    });
    TREE.forEach(function (n) {
      var owned = hasNode(n.id);
      var can = canUnlock(n);
      var cls = 'tree-node' + (owned ? ' owned' : '') + (can ? ' can' : (!owned ? ' locked' : ''));
      var fill = n.keystone ? 'rgba(255,106,61,0.4)' : 'rgba(20,16,28,0.92)';
      h += '<g class="' + cls + '" data-action="select-node" data-id="' + n.id + '">';
      h += '<circle cx="' + n.x + '" cy="' + n.y + '" r="' + (n.keystone ? 17 : 13) + '" fill="' + fill + '" stroke="rgba(244,239,230,0.35)" stroke-width="2"/>';
      h += '<text x="' + n.x + '" y="' + (n.y + 28) + '" text-anchor="middle" fill="#f4efe6" font-size="7" font-family="Share Tech Mono">' + esc(n.name) + '</text></g>';
    });
    h += '</svg></div>';
    if (sel) {
      h += '<div class="tree-detail"><h3>' + esc(sel.name) + (sel.keystone ? ' · KEYSTONE' : '') + '</h3>';
      h += '<p>' + esc(sel.desc) + '</p><div class="tree-actions">';
      if (hasNode(sel.id)) h += '<span class="badge">OWNED</span>';
      else h += '<button type="button" class="stone-btn" data-action="unlock" data-id="' + sel.id + '"' + (canUnlock(sel) ? '' : ' disabled') + '>UNLOCK · ' + sel.cost + ' SP</button>';
      h += '</div></div>';
    }
    h += '</div></div>';
    return h;
  }

  function renderForge() {
    var h = '<div class="mode-screen skin-console"><div class="mode-head float-head"><div>';
    h += '<h2 class="mode-title">FORGE</h2><p class="mode-sub">MERGE · RELICS · EXOTICS</p></div>';
    h += '<button type="button" class="back-stone" data-action="mode" data-id="hub">×</button></div>';
    h += '<div class="panel-scroll"><div class="forge-stage" style="background-image:url(\'' + artUrl('forge') + '\')"><div class="forge-stage-veil"></div><div class="forge-slots">';
    for (var i = 0; i < 2; i++) {
      var s = UI.forgeSlots[i];
      h += '<button type="button" class="forge-slot' + (s ? ' filled' : '') + '" data-action="clear-forge" data-id="' + i + '">' + (s ? esc(s) : 'SLOT') + '</button>';
    }
    h += '</div><button type="button" class="stone-btn" style="width:100%" data-action="merge">FUSE</button></div>';
    h += '<div class="shard-grid">';
    SHARD_DEFS.forEach(function (sh) {
      var q = P.shards[sh.id] || 0;
      if (!q) return;
      h += '<button type="button" class="shard-tile r-' + sh.rarity + '" data-action="forge-add" data-id="' + sh.id + '">' + sh.icon + '<span class="qty">' + q + '</span></button>';
    });
    Object.keys(P.exotics || {}).forEach(function (ex) {
      if (!(P.exotics[ex] > 0)) return;
      h += '<button type="button" class="shard-tile r-myth" data-action="forge-add" data-id="' + esc(ex) + '">▣<span class="qty">' + P.exotics[ex] + '</span></button>';
    });
    h += '</div>';
    if (P.relics.length) {
      h += '<p class="mode-sub" style="margin-top:0.85rem">RELICS</p><div class="loadout-row">';
      P.relics.forEach(function (r) {
        var b = RELIC_BONUS[r];
        h += '<span class="loadout-chip active">' + esc(r.replace('relic_', '').toUpperCase()) + (b ? ' · ' + b.label : '') + '</span>';
      });
      h += '</div>';
    }
    h += '</div></div>';
    return h;
  }

  function renderTower() {
    var t = UI.tower;
    if (!t) {
      var cov = roleCoverage();
      var h0 = '<div class="mode-screen skin-console mode-has-art"><div class="screen-art" style="background-image:url(\'' + artUrl('tower') + '\')"></div>';
      h0 += '<div class="screen-art-veil heavy"></div><div class="mode-head float-head"><div>';
      h0 += '<h2 class="mode-title">CHRONOLITH</h2><p class="mode-sub">ROLES · INFINITE UPS · CO-OP BOSS</p></div>';
      h0 += '<button type="button" class="back-stone" data-action="mode" data-id="hub">×</button></div>';
      h0 += '<div class="role-banner"><span class="role-tag ' + P.loadout + '">' + P.loadout.toUpperCase() + '</span>';
      h0 += '<span class="badge">BEST ' + P.wavesBest + '</span>';
      h0 += '<span class="badge">' + (cov.bulwark ? 'B' : '·') + (cov.rift ? 'R' : '·') + (cov.warden ? 'W' : '·') + '</span></div>';
      h0 += '<div class="upgrade-row">';
      TOWER_UPS.forEach(function (u) {
        var lv = P.towerUp[u.id] || 0;
        var cost = Math.floor(u.base * Math.pow(1.38, lv));
        h0 += '<button type="button" class="up-chip" data-action="tower-up" data-id="' + u.id + '">' + u.name + ' ' + lv + ' · ' + cost + '</button>';
      });
      h0 += '</div><div class="tower-deploy">';
      h0 += '<button type="button" class="stone-btn battle-btn" data-action="start-tower" style="background-image:url(\'' + artUrl('uiBtn') + '\')">SOLO DEPLOY</button>';
      h0 += '<button type="button" class="stone-btn alt" data-action="start-coop">CO-OP BOSS</button></div>';
      h0 += '<p class="empty-note">Co-op boss checks taunt / arc / mend gates. Solo fills missing roles with ghost allies.</p></div>';
      return h0;
    }
    var abl = P.loadout === 'bulwark'
      ? { p: 'TAUNT', s: 'QUAKE', u: 'OVERLOAD' }
      : P.loadout === 'warden'
        ? { p: 'MEND', s: 'WARD', u: 'OVERLOAD' }
        : { p: 'ARC', s: 'TIMELINE', u: 'OVERLOAD' };
    var h = '<div class="tower-live" id="tower-live">';
    h += '<div class="tower-arena" style="background-image:url(\'' + artUrl('tower') + '\')"><div class="tower-arena-veil"></div>';
    h += '<button type="button" class="tower-flee" data-action="flee-tower" aria-label="Flee">×</button>';
    h += '<div class="tower-hud"><span data-wave>' + (t.coopBoss ? 'CO-OP ' : '') + 'WAVE ' + t.wave + '</span>';
    h += '<span data-hp>' + Math.ceil(t.coreHp) + ' / ' + t.coreMax + '</span>';
    h += '<span data-combo></span></div>';
    h += '<div class="enemy-layer"></div><div class="tower-core"></div>';
    h += '<div class="tower-core-hp"><i style="width:' + (t.coreHp / t.coreMax * 100) + '%"></i></div></div>';
    h += '<div class="ability-bar" style="--abil-sheet:url(\'' + artUrl('uiAbilities') + '\')">';
    h += '<button type="button" class="ability abil-0" data-action="ability" data-id="primary" data-ability="primary"><span class="abil-icon"></span><span class="abil-name">' + abl.p + '</span><span class="cd">READY</span></button>';
    h += '<button type="button" class="ability abil-1" data-action="ability" data-id="secondary" data-ability="secondary"><span class="abil-icon"></span><span class="abil-name">' + abl.s + '</span><span class="cd">READY</span></button>';
    h += '<button type="button" class="ability abil-2" data-action="ability" data-id="ultimate" data-ability="ultimate"><span class="abil-icon"></span><span class="abil-name">' + abl.u + '</span><span class="cd">READY</span></button>';
    h += '</div></div>';
    return h;
  }

  function renderGate() {
    var h = '<div class="mode-screen skin-console mode-has-art"><div class="screen-art" style="background-image:url(\'' + artUrl('gate') + '\')"></div>';
    h += '<div class="screen-art-veil heavy"></div><div class="mode-head float-head"><div>';
    h += '<h2 class="mode-title">STARGATE</h2><p class="mode-sub">RUN THE EXTRACT · BRING EXOTICS HOME</p></div>';
    h += '<button type="button" class="back-stone" data-action="mode" data-id="hub">×</button></div>';
    h += '<div class="panel-scroll planet-grid">';
    PLANETS.forEach(function (pl) {
      var open = WORLD.planetsUnlocked.indexOf(pl.id) >= 0;
      h += '<button type="button" class="planet-card' + (open ? ' unlocked' : ' locked') + '" style="--accent:' + pl.accent + '" data-action="extract" data-id="' + pl.id + '"' + (open ? '' : ' disabled') + '>';
      h += '<h3>' + esc(pl.name) + '</h3><p>' + esc(pl.blurb) + '</p>';
      h += '<div class="badge">' + (open ? pl.verb.toUpperCase() + ' · 35' : 'ERA ' + pl.eraNeed) + '</div>';
      if (P.exotics[pl.exotic]) h += '<div class="badge">OWNED x' + P.exotics[pl.exotic] + '</div>';
      var bank = WORLD.sharedBank[pl.exotic] || 0;
      if (bank) h += '<div class="badge">BANK x' + bank + '</div>';
      h += '</button>';
    });
    h += '</div></div>';
    return h;
  }

  function renderExtract() {
    var pl = UI.extract.planet;
    var h = '<div class="mode-screen skin-console extract-screen mode-has-art" style="--accent:' + pl.accent + '">';
    h += '<div class="screen-art" style="background-image:url(\'' + artUrl('gate') + '\')"></div>';
    h += '<div class="screen-art-veil heavy"></div>';
    h += '<h2 class="mode-title">' + esc(pl.name) + '</h2>';
    h += '<p class="mode-sub">' + esc(pl.verb) + ' — survive the hazard</p>';
    h += '<div class="extract-viz" style="background-image:url(\'' + artUrl('gate') + '\')"></div>';
    h += '<div class="extract-bar"><i style="width:' + UI.extract.progress + '%"></i></div>';
    h += '<p class="empty-note">Hazards ' + UI.extract.hazards + '/4</p></div>';
    return h;
  }

  function renderEra() {
    var h = '<div class="mode-screen skin-console"><div class="mode-head float-head"><div>';
    h += '<h2 class="mode-title">TIMELINE</h2><p class="mode-sub">STABILIZE IN TOWER · ROLE GATES ON BOSSES</p></div>';
    h += '<button type="button" class="back-stone" data-action="mode" data-id="hub">×</button></div>';
    h += '<div class="panel-scroll era-track">';
    ERAS.forEach(function (era, i) {
      var cleared = WORLD.erasCleared.indexOf(era.id) >= 0;
      var current = WORLD.eraIndex === i;
      var locked = i > WORLD.eraIndex;
      h += '<div class="era-card' + (current ? ' current' : '') + (locked ? ' locked' : '') + '" style="--accent:' + era.accent + '">';
      h += '<h3>' + esc(era.name) + '</h3><p>' + esc(era.blurb) + '</p>';
      if (era.story) h += '<p class="era-story">' + esc(era.story) + '</p>';
      h += '<div class="badge">' + (cleared ? 'STABILIZED' : current ? 'ACTIVE' : 'SEALED') + '</div></div>';
    });
    h += '</div></div>';
    return h;
  }

  function renderLife() {
    var h = '<div class="mode-screen skin-console mode-has-art"><div class="screen-art" style="background-image:url(\'' + artUrl('life') + '\')"></div>';
    h += '<div class="screen-art-veil heavy"></div><div class="mode-head float-head"><div>';
    h += '<h2 class="mode-title">SLOW LIFE</h2><p class="mode-sub">FISH · GARDEN · BREATHE</p></div>';
    h += '<button type="button" class="back-stone" data-action="mode" data-id="hub">×</button></div>';
    h += '<div class="panel-scroll">';
    h += '<div class="life-card fish-card"><div class="life-art fish-art' + (UI.fishCast ? ' casting' : '') + '" style="background-image:url(\'' + artUrl('life') + '\')"></div>';
    h += '<button type="button" class="stone-btn" data-action="fish"' + (UI.fishCast ? ' disabled' : '') + '>' + (UI.fishCast ? 'WAITING…' : 'CAST LINE') + '</button>';
    h += '<p class="mode-sub">Caught ' + P.fishCaught + '</p></div>';
    h += '<div class="life-card"><p class="mode-sub">GARDEN PLOTS</p><div class="garden-grid">';
    for (var i = 0; i < 4; i++) {
      var planted = P.gardenPlanted[i];
      var ready = planted && (Date.now() - planted >= 45000);
      var label = !planted ? 'PLANT 15' : ready ? 'HARVEST' : '…';
      h += '<button type="button" class="garden-plot' + (planted ? ' grown' : '') + (ready ? ' ready' : '') + '" data-action="garden" data-id="' + i + '">' + label + '</button>';
    }
    h += '</div></div></div></div>';
    return h;
  }

  function renderStory() {
    var h = '<div class="mode-screen skin-console"><div class="mode-head float-head"><div>';
    h += '<h2 class="mode-title">LORE</h2><p class="mode-sub">CHAPTER ' + WORLD.storyChapter + '</p></div>';
    h += '<button type="button" class="back-stone" data-action="mode" data-id="hub">×</button></div>';
    h += '<div class="panel-scroll">';
    STORY.forEach(function (ch) {
      var locked = ch.id > WORLD.storyChapter;
      h += '<div class="story-card' + (locked ? ' locked' : '') + '"><h3>' + esc(ch.title) + '</h3>';
      h += '<p>' + (locked ? 'Sealed until the timeline opens.' : esc(ch.body)) + '</p></div>';
    });
    h += '</div></div>';
    return h;
  }

  function renderStoryModal() {
    if (UI.storyOpen == null) return '';
    var ch = STORY[UI.storyOpen] || STORY[0];
    return '<div class="story-modal"><div class="story-panel">' +
      '<div class="mark">TRANSMISSION</div><h2>' + esc(ch.title) + '</h2><p>' + esc(ch.body) + '</p>' +
      '<button type="button" class="stone-btn" data-action="dismiss-story">CONTINUE</button></div></div>';
  }

  function render() {
    var root = document.getElementById('screen-root');
    if (!root) return;
    var html = '';
    if (UI.mode === 'who' || !P) html = renderWho();
    else if (UI.mode === 'hub') html = renderHub();
    else if (UI.mode === 'tree') html = renderTree();
    else if (UI.mode === 'forge') html = renderForge();
    else if (UI.mode === 'tower') html = renderTower();
    else if (UI.mode === 'gate') html = renderGate();
    else if (UI.mode === 'extract') html = renderExtract();
    else if (UI.mode === 'era') html = renderEra();
    else if (UI.mode === 'life') html = renderLife();
    else if (UI.mode === 'story') html = renderStory();
    else html = renderHub();
    html += renderStoryModal();
    root.innerHTML = html;
    markScreenEnter();
  }

  function onAction(act, id) {
    if (act === 'pick') { selectPlayer(id); return; }
    if (act === 'who') { savePlayer(); UI.mode = 'who'; P = null; activeId = null; render(); return; }
    if (act === 'mode') { UI.mode = id; buzz(10); render(); return; }
    if (act === 'select-node') { UI.selectedNode = id; render(); return; }
    if (act === 'unlock') { unlockNode(id); return; }
    if (act === 'loadout') { P.loadout = id; savePlayer(); toast(id.toUpperCase()); render(); return; }
    if (act === 'forge-add') { putForgeShard(id); return; }
    if (act === 'clear-forge') { UI.forgeSlots[+id] = null; render(); return; }
    if (act === 'merge') { tryMerge(); return; }
    if (act === 'start-tower') { startTower(false); return; }
    if (act === 'start-coop') { startTower(true); return; }
    if (act === 'flee-tower') { endTower(false); return; }
    if (act === 'ability') { useAbility(id); return; }
    if (act === 'tower-up') { buyTowerUp(id); return; }
    if (act === 'extract') { startExtract(id); return; }
    if (act === 'fish') { castFish(); return; }
    if (act === 'garden') { tendGarden(+id); return; }
    if (act === 'dismiss-story') { UI.storyOpen = null; savePlayer(); render(); return; }
  }

  function bind() {
    var app = document.getElementById('chronos-app');
    if (!app || app._bound) return;
    app._bound = true;
    app.addEventListener('click', function (e) {
      var t = e.target.closest('[data-action]');
      if (!t) return;
      onAction(t.getAttribute('data-action'), t.getAttribute('data-id'));
    });
  }

  function boot() {
    WORLD = loadWorldLocal();
    bind();
    try {
      bc = new BroadcastChannel('voidline-chronos');
      bc.onmessage = function (ev) {
        if (!ev.data) return;
        if (ev.data.type === 'world' && ev.data.world) {
          if ((ev.data.world.updatedAt || 0) > (WORLD.updatedAt || 0)) {
            WORLD = Object.assign(freshWorld(), ev.data.world);
            if (UI.mode !== 'who') render();
          }
        }
      };
    } catch (e) { bc = null; }
    window.addEventListener('storage', function (e) {
      if (e.key === WORLD_KEY && e.newValue) {
        try {
          var w = JSON.parse(e.newValue);
          if ((w.updatedAt || 0) > (WORLD.updatedAt || 0)) {
            WORLD = Object.assign(freshWorld(), w);
            if (UI.mode !== 'who') render();
          }
        } catch (err) {}
      }
    });
    setInterval(function () {
      if (activeId && WORLD) {
        WORLD.presence[activeId] = Date.now();
        saveWorldLocal();
        fetch('/api/chronos/' + encodeURIComponent(ROOM), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'presence', player: activeId })
        }).catch(function () {});
      }
    }, 15000);
    setInterval(function () { if (activeId) pullRemote().then(function () { if (UI.mode === 'hub') render(); }); }, 20000);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.VoidlineChronos = {
    getPlayer: function () { return P; },
    getWorld: function () { return WORLD; },
    sync: pullRemote,
    render: render
  };
})();
