/* VOIDLINE: CHRONOS — private 3-seat co-op warband */
(function () {
  'use strict';

  var SAVE_PREFIX = 'voidline_chronos_v1_';
  var WORLD_KEY = 'voidline_chronos_world_v1';
  var SAVE_VERSION = 1;

  var WARBAND = [
    { id: 'aden', name: 'Aden', accent: '#3de0c5', portrait: '/public/art/portraits/aden.svg', blurb: 'Rift lead' },
    { id: 'jamie', name: 'Jamie', accent: '#ff3d5a', portrait: '/public/art/portraits/jamie.svg', blurb: 'Bulwark steel' },
    { id: 'edward', name: 'Edward', accent: '#e8c56a', portrait: '/public/art/portraits/edward.svg', blurb: 'Warden craft' }
  ];

  var ERAS = [
    { id: 'stone', name: 'STONE AGE', blurb: 'Bone spears. Fire rings. Survive the first night.', accent: '#c4a574', need: 0 },
    { id: 'bronze', name: 'BRONZE AGE', blurb: 'Cast shields. Rally tribes against the swarm.', accent: '#cd7f32', need: 1 },
    { id: 'iron', name: 'IRON AGE', blurb: 'Forged walls. Discipline under blood moons.', accent: '#9aa0a6', need: 2 },
    { id: 'powder', name: 'GUNPOWDER', blurb: 'Thunder sticks. Smoke and siege.', accent: '#ff6a3d', need: 3 },
    { id: 'neon', name: 'NEON AGE', blurb: 'Circuits wake. Chronolith sings.', accent: '#7cf0ff', need: 4 },
    { id: 'void', name: 'VOID ERA', blurb: 'Time bends. The Anchor cracks open.', accent: '#e8c56a', need: 5 }
  ];

  var PLANETS = [
    { id: 'cinder', name: 'CINDER REACH', exotic: 'ember_root', exoticName: 'Ember Root', blurb: 'Volcanic veins. Burn fuel for the forge.', accent: '#ff6a3d', eraNeed: 1 },
    { id: 'glacier', name: 'GLACIER NYX', exotic: 'frost_bloom', exoticName: 'Frost Bloom', blurb: 'Still air. Freeze the timeline.', accent: '#7cf0ff', eraNeed: 2 },
    { id: 'verdant', name: 'VERDANT HUSK', exotic: 'life_spine', exoticName: 'Life Spine', blurb: 'Living metal. Mend what breaks.', accent: '#9dffb0', eraNeed: 3 },
    { id: 'oblivion', name: 'OBLIVION KEY', exotic: 'void_shard', exoticName: 'Void Shard', blurb: 'No sky. Only hunger.', accent: '#c084fc', eraNeed: 5 }
  ];

  var SHARD_DEFS = [
    { id: 'bone', name: 'Bone', icon: '◆', rarity: 'common' },
    { id: 'ore', name: 'Ore', icon: '◇', rarity: 'common' },
    { id: 'spark', name: 'Spark', icon: '✦', rarity: 'rare' },
    { id: 'ash', name: 'Ash', icon: '✧', rarity: 'rare' },
    { id: 'core', name: 'Core', icon: '◎', rarity: 'epic' },
    { id: 'echo', name: 'Echo', icon: '◈', rarity: 'myth' }
  ];

  var MERGE_RECIPES = [
    { a: 'bone', b: 'ore', out: 'spark', name: 'Spark Fuse' },
    { a: 'spark', b: 'ash', out: 'core', name: 'Core Bind' },
    { a: 'core', b: 'echo', out: 'relic_rift', name: 'Rift Relic', relic: true },
    { a: 'ember_root', b: 'core', out: 'relic_ember', name: 'Ember Plate', relic: true },
    { a: 'frost_bloom', b: 'spark', out: 'relic_frost', name: 'Frost Lens', relic: true },
    { a: 'life_spine', b: 'ash', out: 'relic_life', name: 'Life Loom', relic: true },
    { a: 'void_shard', b: 'echo', out: 'relic_void', name: 'Void Crown', relic: true }
  ];

  var RELIC_BONUS = {
    relic_rift: { dmg: 0.25, label: '+25% Rift damage' },
    relic_ember: { burn: 0.15, label: 'Burn aura +15%' },
    relic_frost: { slow: 0.2, label: 'Slow field +20%' },
    relic_life: { heal: 0.12, label: 'Core mend +12%' },
    relic_void: { dmg: 0.4, label: '+40% void damage' }
  };

  /* Constellation — Bulwark / Rift / Warden + keystones */
  var TREE = [
    { id: 'root', name: 'ANCHOR', desc: 'Awaken in deep time.', x: 180, y: 40, cost: 0, req: [], role: 'any', stats: {} },
    { id: 'b1', name: 'IRON SKIN', desc: 'Core takes 12% less hit.', x: 70, y: 120, cost: 1, req: ['root'], role: 'bulwark', stats: { armor: 0.12 } },
    { id: 'b2', name: 'TAUNT PULSE', desc: 'Pull swarm for 2s.', x: 40, y: 210, cost: 1, req: ['b1'], role: 'bulwark', stats: { taunt: 1 } },
    { id: 'b3', name: 'BASTION', desc: 'Shield wall — absorb next spike.', x: 70, y: 300, cost: 2, req: ['b2'], role: 'bulwark', stats: { shield: 80 } },
    { id: 'b4', name: 'EARTHQUAKE', desc: 'KEYSTONE: Stomp stuns all near core.', x: 40, y: 400, cost: 3, req: ['b3'], role: 'bulwark', stats: { quake: 1 }, keystone: true },
    { id: 'r1', name: 'ARC BOLT', desc: '+18% ability damage.', x: 180, y: 120, cost: 1, req: ['root'], role: 'rift', stats: { dmg: 0.18 } },
    { id: 'r2', name: 'CHAIN', desc: 'Bolts jump to 2 more targets.', x: 180, y: 210, cost: 1, req: ['r1'], role: 'rift', stats: { chain: 2 } },
    { id: 'r3', name: 'OVERCHARGE', desc: 'Crit chance +20%.', x: 180, y: 300, cost: 2, req: ['r2'], role: 'rift', stats: { crit: 0.2 } },
    { id: 'r4', name: 'TIMELINE CUT', desc: 'KEYSTONE: Freeze wave 1.5s.', x: 180, y: 400, cost: 3, req: ['r3'], role: 'rift', stats: { freeze: 1.5 }, keystone: true },
    { id: 'w1', name: 'MEND', desc: 'Pulse heals core 8/s while held.', x: 290, y: 120, cost: 1, req: ['root'], role: 'warden', stats: { regen: 8 } },
    { id: 'w2', name: 'CLEANSE', desc: 'Purge burn from the Chronolith.', x: 320, y: 210, cost: 1, req: ['w1'], role: 'warden', stats: { cleanse: 1 } },
    { id: 'w3', name: 'AURA', desc: 'Allies deal +10% near core.', x: 290, y: 300, cost: 2, req: ['w2'], role: 'warden', stats: { aura: 0.1 } },
    { id: 'w4', name: 'PHOENIX LINK', desc: 'KEYSTONE: Once per run, core refuses death.', x: 320, y: 400, cost: 3, req: ['w3'], role: 'warden', stats: { phoenix: 1 }, keystone: true },
    { id: 'x1', name: 'FUSION SIGHT', desc: 'Merge costs −1 shard luck.', x: 110, y: 470, cost: 2, req: ['b3', 'r3'], role: 'any', stats: { mergeLuck: 1 } },
    { id: 'x2', name: 'GATE WALKER', desc: 'Planet extract +25% yield.', x: 250, y: 470, cost: 2, req: ['r3', 'w3'], role: 'any', stats: { extract: 0.25 } }
  ];

  var TOWER_UPS = [
    { id: 'damage', name: 'STRIKE', base: 25 },
    { id: 'rate', name: 'CADENCE', base: 40 },
    { id: 'core', name: 'CORE HP', base: 35 },
    { id: 'range', name: 'REACH', base: 45 }
  ];

  var UI = {
    mode: 'who', // who | hub | tree | forge | tower | gate | era
    selectedNode: null,
    forgeSlots: [null, null],
    tower: null,
    toastTimer: null
  };

  var P = null; // active player save
  var activeId = null;
  var WORLD = null;
  var raf = null;
  var lastTs = 0;

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
    setTimeout(function () { el.remove(); }, 2200);
  }

  function freshPlayer(id) {
    var shards = {};
    SHARD_DEFS.forEach(function (s) { shards[s.id] = 0; });
    shards.bone = 6;
    shards.ore = 4;
    return {
      v: SAVE_VERSION,
      id: id,
      chrono: 120,
      essence: 0,
      skillPoints: 3,
      unlocked: ['root'],
      loadout: 'rift',
      loadouts: { bulwark: [], rift: ['root', 'r1'], warden: [] },
      relics: [],
      shards: shards,
      exotics: {},
      towerUp: { damage: 0, rate: 0, core: 0, range: 0 },
      wavesBest: 0,
      bossesKilled: 0,
      totalMerged: 0,
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
      bossBeaten: {},
      updatedAt: Date.now()
    };
  }

  function loadWorld() {
    try {
      var raw = localStorage.getItem(WORLD_KEY);
      if (raw) {
        WORLD = Object.assign(freshWorld(), JSON.parse(raw));
        return;
      }
    } catch (e) {}
    WORLD = freshWorld();
  }

  function saveWorld() {
    if (!WORLD) return;
    WORLD.updatedAt = Date.now();
    if (activeId) {
      WORLD.presence[activeId] = Date.now();
    }
    try { localStorage.setItem(WORLD_KEY, JSON.stringify(WORLD)); } catch (e) {}
  }

  function loadPlayer(id) {
    try {
      var raw = localStorage.getItem(SAVE_PREFIX + id);
      if (raw) {
        var data = JSON.parse(raw);
        var base = freshPlayer(id);
        P = Object.assign(base, data);
        P.shards = Object.assign(base.shards, data.shards || {});
        P.towerUp = Object.assign(base.towerUp, data.towerUp || {});
        P.exotics = Object.assign({}, data.exotics || {});
        return;
      }
    } catch (e) {}
    P = freshPlayer(id);
  }

  function savePlayer() {
    if (!P || !activeId) return;
    P.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_PREFIX + activeId, JSON.stringify(P)); } catch (e) {}
    saveWorld();
    // Optional cloud flush
    if (window.VoidlineCloud && window.VoidlineCloud.flushSave) {
      try {
        window.VoidlineCloud.flushSave(activeId, { chronos: P, chronosWorld: WORLD });
      } catch (e) {}
    }
  }

  function selectPlayer(id) {
    activeId = id;
    loadPlayer(id);
    loadWorld();
    WORLD.presence[id] = Date.now();
    saveWorld();
    UI.mode = 'hub';
    toast(warband(id).name.toUpperCase() + ' ONLINE', 'good');
    render();
  }

  function nodeById(id) {
    return TREE.find(function (n) { return n.id === id; });
  }

  function hasNode(id) {
    return P && P.unlocked.indexOf(id) >= 0;
  }

  function canUnlock(node) {
    if (!P || !node) return false;
    if (hasNode(node.id)) return false;
    if (P.skillPoints < node.cost) return false;
    return node.req.every(function (r) { return hasNode(r); });
  }

  function unlockNode(id) {
    var node = nodeById(id);
    if (!canUnlock(node)) {
      toast('LOCKED', 'bad');
      return;
    }
    P.skillPoints -= node.cost;
    P.unlocked.push(id);
    if (node.role && node.role !== 'any') {
      if (!P.loadouts[node.role]) P.loadouts[node.role] = [];
      if (P.loadouts[node.role].indexOf(id) < 0) P.loadouts[node.role].push(id);
    }
    savePlayer();
    toast(node.name + ' UNLOCKED', 'good');
    render();
  }

  function aggregateStats() {
    var stats = { armor: 0, dmg: 0, crit: 0, regen: 0, chain: 0, taunt: 0, shield: 0, quake: 0, freeze: 0, phoenix: 0, aura: 0, cleanse: 0, burn: 0, slow: 0, mergeLuck: 0, extract: 0 };
    if (!P) return stats;
    P.unlocked.forEach(function (id) {
      var n = nodeById(id);
      if (!n || !n.stats) return;
      Object.keys(n.stats).forEach(function (k) {
        stats[k] = (stats[k] || 0) + n.stats[k];
      });
    });
    (P.relics || []).forEach(function (rid) {
      var b = RELIC_BONUS[rid];
      if (!b) return;
      Object.keys(b).forEach(function (k) {
        if (k === 'label') return;
        stats[k] = (stats[k] || 0) + b[k];
      });
    });
    return stats;
  }

  function addShard(id, n) {
    if (!P.shards[id]) P.shards[id] = 0;
    P.shards[id] += n;
  }

  function tryMerge() {
    var a = UI.forgeSlots[0];
    var b = UI.forgeSlots[1];
    if (!a || !b) { toast('NEED TWO SHARDS', 'bad'); return; }
    var recipe = MERGE_RECIPES.find(function (r) {
      return (r.a === a && r.b === b) || (r.a === b && r.b === a);
    });
    if (!recipe) {
      // salvage
      UI.forgeSlots = [null, null];
      P.chrono += 8;
      toast('SCRAP · +8 CHRONO');
      savePlayer();
      render();
      return;
    }
    function hasMat(id) {
      return (P.shards[id] || 0) >= 1 || (P.exotics[id] || 0) >= 1;
    }
    function takeMat(id) {
      if ((P.shards[id] || 0) >= 1) { P.shards[id]--; return; }
      if ((P.exotics[id] || 0) >= 1) { P.exotics[id]--; }
    }
    if (!hasMat(a) || !hasMat(b)) {
      toast('MISSING SHARDS', 'bad');
      return;
    }
    takeMat(a);
    takeMat(b);
    if (recipe.relic) {
      if (P.relics.indexOf(recipe.out) < 0) P.relics.push(recipe.out);
      toast(recipe.name.toUpperCase(), 'good');
    } else {
      addShard(recipe.out, 1);
      toast('FORGED ' + recipe.name.toUpperCase(), 'good');
    }
    P.totalMerged++;
    P.essence += 1;
    if (P.totalMerged % 3 === 0) P.skillPoints += 1;
    UI.forgeSlots = [null, null];
    savePlayer();
    render();
  }

  function putForgeShard(id) {
    if ((P.shards[id] || 0) < 1 && id.indexOf('relic_') !== 0) {
      // allow exotic keys stored in exotics
      if (!(P.exotics[id] > 0)) { toast('NONE LEFT', 'bad'); return; }
    }
    var slot = UI.forgeSlots[0] ? (UI.forgeSlots[1] ? -1 : 1) : 0;
    if (slot < 0) { toast('SLOTS FULL', 'bad'); return; }
    // spend from exotics bag if needed
    if (SHARD_DEFS.some(function (s) { return s.id === id; })) {
      if ((P.shards[id] || 0) < 1) { toast('NONE LEFT', 'bad'); return; }
    } else if (P.exotics[id] > 0) {
      // exotic used as fuse material — don't decrement until merge
    } else if (['ember_root', 'frost_bloom', 'life_spine', 'void_shard'].indexOf(id) >= 0) {
      if (!(P.exotics[id] > 0)) { toast('NONE LEFT', 'bad'); return; }
    }
    UI.forgeSlots[slot] = id;
    render();
  }

  /* ── Tower combat ── */
  function towerDps() {
    var s = aggregateStats();
    var up = P.towerUp.damage || 0;
    var base = 14 + up * 4;
    return base * (1 + s.dmg) * (P.loadout === 'rift' ? 1.15 : 1);
  }

  function towerFireRate() {
    var up = P.towerUp.rate || 0;
    return Math.max(0.18, 0.55 - up * 0.03);
  }

  function towerRange() {
    return 120 + (P.towerUp.range || 0) * 12;
  }

  function towerMaxHp() {
    var s = aggregateStats();
    return Math.floor((220 + (P.towerUp.core || 0) * 40) * (1 + s.armor));
  }

  function startTower() {
    var s = aggregateStats();
    UI.tower = {
      running: true,
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
      shield: s.shield || 0
    };
    UI.mode = 'tower';
    lastTs = performance.now();
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(towerLoop);
    render();
  }

  function endTower(won) {
    if (!UI.tower) return;
    var t = UI.tower;
    t.running = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    P.chrono += t.chronoEarned;
    P.essence += Math.floor(t.wave / 2);
    if (t.wave > P.wavesBest) P.wavesBest = t.wave;
    if (t.wave >= 5) {
      var era = ERAS[WORLD.eraIndex];
      if (era && WORLD.erasCleared.indexOf(era.id) < 0 && t.wave >= 6) {
        WORLD.erasCleared.push(era.id);
        if (WORLD.eraIndex < ERAS.length - 1) WORLD.eraIndex++;
        P.skillPoints += 2;
        toast('ERA STABILIZED', 'good');
        // unlock planet
        PLANETS.forEach(function (pl) {
          if (pl.eraNeed <= WORLD.eraIndex && WORLD.planetsUnlocked.indexOf(pl.id) < 0) {
            WORLD.planetsUnlocked.push(pl.id);
          }
        });
      }
    }
    if (won) toast('WAVE HOLD · +' + t.chronoEarned + ' CHRONO', 'good');
    else toast('CORE BREACHED · +' + t.chronoEarned + ' CHRONO', 'bad');
    // loot shards
    addShard('bone', 2 + Math.floor(t.wave / 2));
    if (t.wave >= 3) addShard('spark', 1);
    if (t.kills >= 20) addShard('ash', 1);
    UI.tower = null;
    savePlayer();
    UI.mode = 'hub';
    render();
  }

  function spawnEnemy(wave) {
    var roll = Math.random();
    var type = 'swarm';
    if (wave >= 4 && roll > 0.82) type = 'brute';
    else if (wave >= 3 && roll > 0.65) type = 'flyer';
    if (wave % 5 === 0 && UI.tower.enemies.filter(function (e) { return e.type === 'boss'; }).length === 0) {
      type = 'boss';
    }
    var side = Math.floor(Math.random() * 4);
    var x = 50, y = 50;
    if (side === 0) { x = Math.random() * 100; y = -5; }
    if (side === 1) { x = 105; y = Math.random() * 100; }
    if (side === 2) { x = Math.random() * 100; y = 105; }
    if (side === 3) { x = -5; y = Math.random() * 100; }
    var hp = type === 'boss' ? 180 + wave * 40 : type === 'brute' ? 55 + wave * 10 : type === 'flyer' ? 22 + wave * 4 : 16 + wave * 5;
    var spd = type === 'flyer' ? 18 + wave : type === 'brute' ? 8 + wave * 0.3 : type === 'boss' ? 6 : 12 + wave * 0.5;
    UI.tower.enemies.push({ id: Math.random().toString(36).slice(2), type: type, x: x, y: y, hp: hp, max: hp, spd: spd });
  }

  function damageEnemy(e, amt) {
    var s = aggregateStats();
    var dmg = amt;
    if (Math.random() < (s.crit || 0)) dmg *= 2;
    e.hp -= dmg;
    UI.tower.fx.push({ x: e.x, y: e.y, life: 0.35 });
    if (e.hp <= 0) {
      UI.tower.kills++;
      UI.tower.chronoEarned += e.type === 'boss' ? 40 : e.type === 'brute' ? 8 : 3;
      if (e.type === 'boss') {
        P.bossesKilled++;
        P.skillPoints += 1;
      }
      return true;
    }
    return false;
  }

  function fireAtNearest() {
    var t = UI.tower;
    if (!t || !t.enemies.length) return;
    var cx = 50, cy = 78;
    var rangePct = towerRange() / 3.2;
    var best = null;
    var bestD = 1e9;
    t.enemies.forEach(function (e) {
      var d = Math.hypot(e.x - cx, e.y - cy);
      if (d < bestD && d <= rangePct) { bestD = d; best = e; }
    });
    if (!best) return;
    var dmg = towerDps() * 0.35;
    var dead = damageEnemy(best, dmg);
    var s = aggregateStats();
    if (s.chain > 0) {
      var chained = 0;
      t.enemies.forEach(function (e) {
        if (e === best || chained >= s.chain) return;
        if (Math.hypot(e.x - best.x, e.y - best.y) < 22) {
          if (damageEnemy(e, dmg * 0.6)) { /* marked dead below */ }
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
      t.cds.primary = 2.2;
      // role primary
      if (P.loadout === 'bulwark' || s.taunt) {
        t.enemies.forEach(function (e) {
          e.x += (50 - e.x) * 0.35;
          e.y += (78 - e.y) * 0.35;
        });
        toast('TAUNT', 'good');
      } else if (P.loadout === 'warden') {
        t.coreHp = Math.min(t.coreMax, t.coreHp + 35 + s.regen);
        toast('MEND', 'good');
      } else {
        t.enemies.forEach(function (e) { damageEnemy(e, towerDps() * 0.9); });
        t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
        toast('ARC', 'good');
      }
    } else if (slot === 'secondary') {
      if (t.cds.secondary > 0) return;
      t.cds.secondary = 5;
      if (s.quake) {
        t.enemies.forEach(function (e) {
          if (Math.hypot(e.x - 50, e.y - 78) < 40) {
            e.spd *= 0.2;
            damageEnemy(e, 40);
          }
        });
        t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
        toast('QUAKE');
      } else if (s.freeze) {
        t.frozen = s.freeze;
        toast('TIMELINE CUT');
      } else {
        t.shield += 40;
        toast('WARD');
      }
    } else if (slot === 'ultimate') {
      if (t.cds.ultimate > 0) return;
      t.cds.ultimate = 14;
      if (s.phoenix && !t.phoenixUsed) {
        t.phoenixReady = true;
        toast('PHOENIX ARMED', 'good');
      }
      t.enemies.forEach(function (e) { damageEnemy(e, towerDps() * 2.2); });
      t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
      toast('OVERLOAD');
    }
    syncTowerDom();
  }

  function towerLoop(ts) {
    if (!UI.tower || !UI.tower.running) return;
    var dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    var t = UI.tower;
    t.t += dt;
    if (t.frozen > 0) t.frozen -= dt;

    Object.keys(t.cds).forEach(function (k) {
      if (t.cds[k] > 0) t.cds[k] = Math.max(0, t.cds[k] - dt);
    });

    // wave pacing
    t.spawnAcc += dt;
    var interval = Math.max(0.45, 1.4 - t.wave * 0.06);
    if (t.spawnAcc >= interval) {
      t.spawnAcc = 0;
      spawnEnemy(t.wave);
    }
    if (t.t > t.wave * 12) {
      t.wave++;
      t.t = 0;
      P.chrono += 5;
      t.chronoEarned += 5;
      toast('WAVE ' + t.wave);
      if (t.wave > 12) {
        endTower(true);
        return;
      }
    }

    var s = aggregateStats();
    if (s.regen > 0) t.coreHp = Math.min(t.coreMax, t.coreHp + s.regen * dt * 0.25);

    t.fireAcc += dt;
    if (t.fireAcc >= towerFireRate()) {
      t.fireAcc = 0;
      fireAtNearest();
    }

    var slow = 1 - Math.min(0.5, s.slow || 0);
    if (t.frozen > 0) slow *= 0.15;

    var cx = 50, cy = 78;
    t.enemies.forEach(function (e) {
      var dx = cx - e.x;
      var dy = cy - e.y;
      var len = Math.hypot(dx, dy) || 1;
      e.x += (dx / len) * e.spd * slow * dt;
      e.y += (dy / len) * e.spd * slow * dt;
      if (Math.hypot(e.x - cx, e.y - cy) < 4) {
        var hit = e.type === 'boss' ? 28 : e.type === 'brute' ? 14 : 7;
        hit *= (1 - Math.min(0.5, s.armor || 0));
        if (t.shield > 0) {
          t.shield -= hit;
          if (t.shield < 0) { t.coreHp += t.shield; t.shield = 0; }
        } else {
          t.coreHp -= hit;
        }
        e.hp = 0;
        if (s.burn) { /* flavor */ }
      }
    });
    t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });

    t.fx = t.fx.map(function (f) { f.life -= dt; return f; }).filter(function (f) { return f.life > 0; });

    if (t.coreHp <= 0) {
      if (s.phoenix && !t.phoenixUsed) {
        t.phoenixUsed = true;
        t.coreHp = t.coreMax * 0.4;
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
    if (waveEl) waveEl.textContent = 'WAVE ' + t.wave;
    var hpTxt = root.querySelector('[data-hp]');
    if (hpTxt) hpTxt.textContent = Math.ceil(t.coreHp) + ' / ' + t.coreMax;
    var layer = root.querySelector('.enemy-layer');
    if (layer) {
      layer.innerHTML = t.enemies.map(function (e) {
        return '<div class="enemy ' + e.type + '" style="left:' + e.x + '%;top:' + e.y + '%"></div>';
      }).join('') + t.fx.map(function (f) {
        return '<div class="fx-hit" style="left:' + f.x + '%;top:' + f.y + '%"></div>';
      }).join('');
    }
    ['primary', 'secondary', 'ultimate'].forEach(function (k) {
      var btn = root.querySelector('[data-ability="' + k + '"]');
      if (!btn) return;
      var cd = t.cds[k];
      btn.disabled = cd > 0;
      var cdEl = btn.querySelector('.cd');
      if (cdEl) cdEl.textContent = cd > 0 ? cd.toFixed(1) : 'READY';
    });
  }

  function buyTowerUp(id) {
    var def = TOWER_UPS.find(function (u) { return u.id === id; });
    if (!def) return;
    var lv = P.towerUp[id] || 0;
    var cost = Math.floor(def.base * Math.pow(1.35, lv));
    if (P.chrono < cost) { toast('NEED CHRONO', 'bad'); return; }
    P.chrono -= cost;
    P.towerUp[id] = lv + 1;
    savePlayer();
    toast(def.name + ' → ' + (lv + 1), 'good');
    render();
  }

  function extractPlanet(pid) {
    var pl = PLANETS.find(function (p) { return p.id === pid; });
    if (!pl) return;
    if (WORLD.planetsUnlocked.indexOf(pid) < 0) { toast('LOCKED', 'bad'); return; }
    var cost = 40;
    if (P.chrono < cost) { toast('NEED 40 CHRONO', 'bad'); return; }
    P.chrono -= cost;
    var s = aggregateStats();
    var n = 1 + (Math.random() < (0.25 + s.extract) ? 1 : 0);
    P.exotics[pl.exotic] = (P.exotics[pl.exotic] || 0) + n;
    WORLD.sharedBank[pl.exotic] = (WORLD.sharedBank[pl.exotic] || 0) + 0; // personal keep
    addShard('echo', Math.random() < 0.3 ? 1 : 0);
    savePlayer();
    toast(pl.exoticName.toUpperCase() + ' x' + n, 'good');
    render();
  }

  function presenceCount() {
    var now = Date.now();
    var n = 0;
    Object.keys(WORLD.presence || {}).forEach(function (id) {
      if (now - WORLD.presence[id] < 5 * 60 * 1000) n++;
    });
    return n;
  }

  /* ── Render ── */
  function renderWho() {
    var h = '<div class="who-screen">';
    h += '<div class="who-brand"><div class="mark">VOIDLINE</div><h1>CHRONOS</h1>';
    h += '<p>Three seats. One timeline. Pick your warband.</p></div>';
    h += '<div class="who-seats">';
    WARBAND.forEach(function (w) {
      var raw = null;
      try { raw = localStorage.getItem(SAVE_PREFIX + w.id); } catch (e) {}
      var meta = 'NEW';
      if (raw) {
        try {
          var d = JSON.parse(raw);
          meta = 'W' + (d.wavesBest || 0) + ' · ' + (d.unlocked ? d.unlocked.length : 0) + ' NODES';
        } catch (e) { meta = 'SAVED'; }
      }
      h += '<button type="button" class="seat" data-action="pick" data-id="' + w.id + '" style="--seat-accent:' + w.accent + '">';
      h += '<div class="seat-frame"><img class="seat-portrait" src="' + w.portrait + '" alt="">';
      h += '<div><div class="seat-name">' + esc(w.name.toUpperCase()) + '</div>';
      h += '<div class="seat-role">' + esc(w.blurb) + '</div></div>';
      h += '<div class="seat-meta">' + esc(meta) + '</div></div></button>';
    });
    h += '</div><div class="who-foot">CLOUD SYNC · PHONE ↔ PC</div></div>';
    return h;
  }

  function renderHub() {
    var w = warband(activeId);
    var era = ERAS[WORLD.eraIndex] || ERAS[0];
    var h = '<div class="hub-screen">';
    h += '<div class="hub-top">';
    h += '<button type="button" class="hub-pilot" data-action="who" style="--seat-accent:' + w.accent + '">';
    h += '<img src="' + w.portrait + '" alt=""><div><div class="hub-pilot-name">' + esc(w.name.toUpperCase()) + '</div>';
    h += '<div class="hub-pilot-sub">' + esc(P.loadout.toUpperCase()) + ' · SP ' + P.skillPoints + '</div></div></button>';
    h += '<div class="hub-wallet">' + P.chrono + ' CHRONO<span>' + P.essence + ' ESSENCE</span></div></div>';
    h += '<div class="hub-stage">';
    h += '<div class="hub-party">';
    WARBAND.forEach(function (p) {
      var on = WORLD.presence[p.id] && (Date.now() - WORLD.presence[p.id] < 5 * 60 * 1000);
      h += '<div class="party-pip' + (on ? ' on' : '') + '" title="' + p.name + '"></div>';
    });
    h += '</div>';
    h += '<div class="hub-era-tag">' + esc(era.name) + '</div>';
    h += '<div class="hub-ground"></div><div class="hub-chronolith"></div>';
    h += hotspot('hs-forge', 'forge', '⚒', 'FORGE');
    h += hotspot('hs-tower', 'tower', '▲', 'TOWER');
    h += hotspot('hs-tree', 'tree', '✦', 'TREE');
    h += hotspot('hs-gate', 'gate', '◎', 'GATE');
    h += hotspot('hs-era', 'era', '▣', 'ERAS');
    h += '</div></div>';
    return h;
  }

  function hotspot(cls, action, glyph, label) {
    return '<button type="button" class="hotspot ' + cls + '" data-action="mode" data-id="' + action + '">' +
      '<span class="hotspot-glyph">' + glyph + '</span><span class="hotspot-label">' + label + '</span></button>';
  }

  function renderTree() {
    var sel = UI.selectedNode ? nodeById(UI.selectedNode) : nodeById('root');
    var h = '<div class="mode-screen"><div class="mode-head"><div>';
    h += '<h2 class="mode-title">CONSTELLATION</h2><p class="mode-sub">SP ' + P.skillPoints + ' · BUILD ' + P.loadout.toUpperCase() + '</p></div>';
    h += '<button type="button" class="back-stone" data-action="mode" data-id="hub">✕</button></div>';
    h += '<div class="role-banner">';
    ['bulwark', 'rift', 'warden'].forEach(function (r) {
      h += '<button type="button" class="loadout-chip' + (P.loadout === r ? ' active' : '') + ' role-tag ' + r + '" data-action="loadout" data-id="' + r + '">' + r.toUpperCase() + '</button>';
    });
    h += '</div>';
    h += '<div class="panel-scroll"><div class="tree-canvas-wrap"><svg class="tree-svg" viewBox="0 0 360 520">';
    // edges
    TREE.forEach(function (n) {
      n.req.forEach(function (r) {
        var p = nodeById(r);
        if (!p) return;
        h += '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + n.x + '" y2="' + n.y + '" stroke="rgba(232,197,106,0.25)" stroke-width="2"/>';
      });
    });
    TREE.forEach(function (n) {
      var owned = hasNode(n.id);
      var can = canUnlock(n);
      var cls = 'tree-node' + (owned ? ' owned' : '') + (can ? ' can' : (!owned ? ' locked' : ''));
      var fill = n.keystone ? 'rgba(255,106,61,0.35)' : 'rgba(20,16,28,0.9)';
      h += '<g class="' + cls + '" data-action="select-node" data-id="' + n.id + '">';
      h += '<circle cx="' + n.x + '" cy="' + n.y + '" r="' + (n.keystone ? 18 : 14) + '" fill="' + fill + '" stroke="rgba(244,239,230,0.35)" stroke-width="2"/>';
      h += '<text x="' + n.x + '" y="' + (n.y + 32) + '" text-anchor="middle" fill="#f4efe6" font-size="7" font-family="Share Tech Mono">' + esc(n.name) + '</text></g>';
    });
    h += '</svg></div>';
    if (sel) {
      h += '<div class="tree-detail"><h3>' + esc(sel.name) + (sel.keystone ? ' · KEYSTONE' : '') + '</h3>';
      h += '<p>' + esc(sel.desc) + '</p>';
      h += '<div class="tree-actions">';
      if (hasNode(sel.id)) h += '<span class="badge">OWNED</span>';
      else h += '<button type="button" class="stone-btn" data-action="unlock" data-id="' + sel.id + '"' + (canUnlock(sel) ? '' : ' disabled') + '>UNLOCK · ' + sel.cost + ' SP</button>';
      h += '</div></div>';
    }
    h += '</div></div>';
    return h;
  }

  function renderForge() {
    var h = '<div class="mode-screen"><div class="mode-head"><div>';
    h += '<h2 class="mode-title">FORGE</h2><p class="mode-sub">MERGE · RELICS · EXOTICS</p></div>';
    h += '<button type="button" class="back-stone" data-action="mode" data-id="hub">✕</button></div>';
    h += '<div class="panel-scroll"><div class="forge-stage"><div class="forge-slots">';
    for (var i = 0; i < 2; i++) {
      var s = UI.forgeSlots[i];
      h += '<button type="button" class="forge-slot' + (s ? ' filled' : '') + '" data-action="clear-forge" data-id="' + i + '">' + (s ? esc(s) : 'SLOT') + '</button>';
    }
    h += '</div><button type="button" class="stone-btn" style="width:100%" data-action="merge">FUSE</button></div>';
    h += '<div class="shard-grid">';
    SHARD_DEFS.forEach(function (sh) {
      var q = P.shards[sh.id] || 0;
      if (!q) return;
      h += '<button type="button" class="shard-tile r-' + sh.rarity + '" data-action="forge-add" data-id="' + sh.id + '" title="' + esc(sh.name) + '">' + sh.icon + '<span class="qty">' + q + '</span></button>';
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
    h += '<p class="empty-note" style="padding:0.75rem 0 0;font-size:0.8rem">Bone+Ore → Spark · Spark+Ash → Core · Core+Echo → Rift Relic. Planet exotics unlock myth plates.</p>';
    h += '</div></div>';
    return h;
  }

  function renderTower() {
    var t = UI.tower;
    if (!t) {
      var h0 = '<div class="mode-screen"><div class="mode-head"><div>';
      h0 += '<h2 class="mode-title">CHRONOLITH</h2><p class="mode-sub">HOLD THE CORE · INFINITE UPGRADES</p></div>';
      h0 += '<button type="button" class="back-stone" data-action="mode" data-id="hub">✕</button></div>';
      h0 += '<div class="role-banner"><span class="role-tag ' + P.loadout + '">' + P.loadout.toUpperCase() + '</span>';
      h0 += '<span class="badge">BEST WAVE ' + P.wavesBest + '</span></div>';
      h0 += '<div class="upgrade-row">';
      TOWER_UPS.forEach(function (u) {
        var lv = P.towerUp[u.id] || 0;
        var cost = Math.floor(u.base * Math.pow(1.35, lv));
        h0 += '<button type="button" class="up-chip" data-action="tower-up" data-id="' + u.id + '">' + u.name + ' ' + lv + ' · ' + cost + '</button>';
      });
      h0 += '</div>';
      h0 += '<div style="flex:1;display:flex;align-items:center;justify-content:center;margin-top:1.5rem">';
      h0 += '<button type="button" class="stone-btn" style="min-width:12rem;font-size:0.72rem;padding:1rem 1.4rem" data-action="start-tower">DEPLOY</button></div>';
      h0 += '<p class="empty-note">Bulwark holds. Rift deletes. Warden mends. Bring roles.</p></div>';
      return h0;
    }
    var h = '<div class="mode-screen" id="tower-live"><div class="mode-head"><div>';
    h += '<h2 class="mode-title">CHRONOLITH</h2><p class="mode-sub" data-wave>WAVE ' + t.wave + '</p></div>';
    h += '<button type="button" class="back-stone" data-action="flee-tower">✕</button></div>';
    h += '<div class="tower-arena"><div class="tower-hud"><span data-hp>' + Math.ceil(t.coreHp) + ' / ' + t.coreMax + '</span>';
    h += '<span>' + t.kills + ' KILLS</span></div>';
    h += '<div class="enemy-layer"></div><div class="tower-core"></div>';
    h += '<div class="tower-core-hp"><i style="width:' + (t.coreHp / t.coreMax * 100) + '%"></i></div></div>';
    h += '<div class="ability-bar">';
    h += '<button type="button" class="ability" data-action="ability" data-id="primary" data-ability="primary">PRIMARY<span class="cd">READY</span></button>';
    h += '<button type="button" class="ability" data-action="ability" data-id="secondary" data-ability="secondary">SIGIL<span class="cd">READY</span></button>';
    h += '<button type="button" class="ability" data-action="ability" data-id="ultimate" data-ability="ultimate">ULT<span class="cd">READY</span></button>';
    h += '</div></div>';
    return h;
  }

  function renderGate() {
    var h = '<div class="mode-screen"><div class="mode-head"><div>';
    h += '<h2 class="mode-title">STARGATE</h2><p class="mode-sub">EXTRACT EXOTICS · BRING THEM HOME</p></div>';
    h += '<button type="button" class="back-stone" data-action="mode" data-id="hub">✕</button></div>';
    h += '<div class="panel-scroll planet-grid">';
    PLANETS.forEach(function (pl) {
      var open = WORLD.planetsUnlocked.indexOf(pl.id) >= 0;
      h += '<button type="button" class="planet-card' + (open ? ' unlocked' : ' locked') + '" style="--accent:' + pl.accent + '" data-action="extract" data-id="' + pl.id + '"' + (open ? '' : ' disabled') + '>';
      h += '<h3>' + esc(pl.name) + '</h3><p>' + esc(pl.blurb) + '</p>';
      h += '<div class="badge">' + (open ? ('EXTRACT · ' + pl.exoticName) : ('ERA ' + pl.eraNeed)) + '</div>';
      if (P.exotics[pl.exotic]) h += '<div class="badge">OWNED x' + P.exotics[pl.exotic] + '</div>';
      h += '</button>';
    });
    h += '</div></div>';
    return h;
  }

  function renderEra() {
    var h = '<div class="mode-screen"><div class="mode-head"><div>';
    h += '<h2 class="mode-title">TIMELINE</h2><p class="mode-sub">STONE → VOID · STABILIZE ERAS IN TOWER</p></div>';
    h += '<button type="button" class="back-stone" data-action="mode" data-id="hub">✕</button></div>';
    h += '<div class="panel-scroll era-track">';
    ERAS.forEach(function (era, i) {
      var cleared = WORLD.erasCleared.indexOf(era.id) >= 0;
      var current = WORLD.eraIndex === i;
      var locked = i > WORLD.eraIndex;
      h += '<div class="era-card' + (current ? ' current' : '') + (locked ? ' locked' : '') + '" style="--accent:' + era.accent + '">';
      h += '<h3>' + esc(era.name) + '</h3><p>' + esc(era.blurb) + '</p>';
      h += '<div class="badge">' + (cleared ? 'STABILIZED' : current ? 'ACTIVE' : 'SEALED') + '</div></div>';
    });
    h += '<p class="empty-note">Clear wave 6+ in Chronolith to push the timeline. Planets unlock with eras.</p>';
    h += '</div></div>';
    return h;
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
    else if (UI.mode === 'era') html = renderEra();
    else html = renderHub();
    root.innerHTML = html;
  }

  function onAction(act, id, el) {
    if (act === 'pick') { selectPlayer(id); return; }
    if (act === 'who') {
      savePlayer();
      UI.mode = 'who';
      P = null;
      activeId = null;
      render();
      return;
    }
    if (act === 'mode') {
      if (id === 'tower' && !UI.tower) { UI.mode = 'tower'; render(); return; }
      UI.mode = id;
      render();
      return;
    }
    if (act === 'select-node') { UI.selectedNode = id; render(); return; }
    if (act === 'unlock') { unlockNode(id); return; }
    if (act === 'loadout') { P.loadout = id; savePlayer(); toast(id.toUpperCase() + ' LOADOUT'); render(); return; }
    if (act === 'forge-add') { putForgeShard(id); return; }
    if (act === 'clear-forge') { UI.forgeSlots[+id] = null; render(); return; }
    if (act === 'merge') { tryMerge(); return; }
    if (act === 'start-tower') { startTower(); return; }
    if (act === 'flee-tower') { endTower(false); return; }
    if (act === 'ability') { useAbility(id); return; }
    if (act === 'tower-up') { buyTowerUp(id); return; }
    if (act === 'extract') { extractPlanet(id); return; }
  }

  function bind() {
    var app = document.getElementById('chronos-app');
    if (!app || app._bound) return;
    app._bound = true;
    app.addEventListener('click', function (e) {
      var t = e.target.closest('[data-action]');
      if (!t) return;
      onAction(t.getAttribute('data-action'), t.getAttribute('data-id'), t);
    });
  }

  function boot() {
    loadWorld();
    bind();
    // heartbeat presence
    setInterval(function () {
      if (activeId && WORLD) {
        WORLD.presence[activeId] = Date.now();
        saveWorld();
      }
    }, 20000);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.VoidlineChronos = {
    getPlayer: function () { return P; },
    getWorld: function () { return WORLD; },
    render: render
  };
})();
