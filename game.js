/* Voidline Galaxy Farm — monolith engine v5 */
(function () {
  'use strict';
  var BLITZ_MS = 1800000, CLONE_MS = 60000, XP_LVL = 500;
  var SAVE_PREFIX = 'voidline_galaxy_farm_v2_';
  var LEGACY_SAVE = 'voidline_galaxy_farm_v1';
  var SESSION_KEY = 'voidline_active_player';
  var POKER_KEY = 'voidline_poker_room';
  var APP_VERSION = '5';
  var VERSION_KEY = 'voidline_app_version';
  var SAVE_VERSION = 4;
  var PORTAL_BASE_COST = 25000;
  var SLOT_COST = 500;
  var BUD_ART = '/public/art/strain-bud.svg';
  var BOSS_ART = '/public/art/boss.svg';
  var ACTION_TOGGLE_FARM = 'data-action="toggle-farm"';

  var PLAYERS = [
    { id: 'aden', label: 'Aden', avatar: '🌌', portrait: '/public/art/strain-bud.svg', defaultName: 'Aden' },
    { id: 'dad', label: 'Dad', avatar: '🛸', portrait: '/public/art/rocket.svg', defaultName: 'Dad' },
    { id: 'jamie', label: 'Jamie', avatar: '👾', portrait: '/public/art/boss.svg', defaultName: 'Jamie' },
  ];

  var RARITIES = [
    { id: 'dust', name: 'Dust', color: '#6B7280', mult: 1.0, threshold: 0 },
    { id: 'haze', name: 'Haze', color: '#9CA3AF', mult: 1.05, threshold: 0.35 },
    { id: 'spark', name: 'Spark', color: '#A78BFA', mult: 1.1, threshold: 0.55 },
    { id: 'mist', name: 'Mist', color: '#818CF8', mult: 1.15, threshold: 0.68 },
    { id: 'surge', name: 'Surge', color: '#60A5FA', mult: 1.2, threshold: 0.76 },
    { id: 'pulse', name: 'Pulse', color: '#38BDF8', mult: 1.28, threshold: 0.82 },
    { id: 'rift', name: 'Rift', color: '#22D3EE', mult: 1.35, threshold: 0.87 },
    { id: 'bloom', name: 'Bloom', color: '#2DD4BF', mult: 1.42, threshold: 0.91 },
    { id: 'flux', name: 'Flux', color: '#34D399', mult: 1.5, threshold: 0.94 },
    { id: 'nova', name: 'Nova', color: '#4ADE80', mult: 1.58, threshold: 0.96 },
    { id: 'prism', name: 'Prism', color: '#A3E635', mult: 1.66, threshold: 0.975 },
    { id: 'eclipse', name: 'Eclipse', color: '#FACC15', mult: 1.75, threshold: 0.985 },
    { id: 'nebula', name: 'Nebula', color: '#FBBF24', mult: 1.85, threshold: 0.991 },
    { id: 'singularity', name: 'Singularity', color: '#FB923C', mult: 1.95, threshold: 0.995 },
    { id: 'paradox', name: 'Paradox', color: '#F87171', mult: 2.05, threshold: 0.997 },
    { id: 'anomaly', name: 'Anomaly', color: '#F472B6', mult: 2.15, threshold: 0.9985 },
    { id: 'voidlord', name: 'Voidlord', color: '#E879F9', mult: 2.28, threshold: 0.9992 },
    { id: 'cosmic', name: 'Cosmic', color: '#C084FC', mult: 2.42, threshold: 0.9996 },
    { id: 'omega', name: 'Omega', color: '#A855F7', mult: 2.58, threshold: 0.9998 },
    { id: 'legend', name: 'Legend', color: '#8B5CF6', mult: 2.75, threshold: 0.9999 },
    { id: 'phantom', name: 'Phantom', color: '#6366F1', mult: 2.95, threshold: 0.99993 },
    { id: 'mythic', name: 'Mythic', color: '#FFD700', mult: 3.2, threshold: 0.99996 },
    { id: 'ascendant', name: 'Ascendant', color: '#39FF14', mult: 3.5, threshold: 0.99998 },
    { id: 'transcendent', name: 'Transcendent', color: '#00F0FF', mult: 3.85, threshold: 0.99999 },
    { id: 'godroll', name: 'Godroll', color: '#FF00FF', mult: 4.2, threshold: 0.999995 },
    { id: 'voidgod', name: 'VoidGod', color: '#FFFFFF', mult: 5.0, threshold: 1 },
  ];

  var OLD_RARITY_MAP = { Common: 'dust', Rare: 'pulse', Epic: 'bloom', Legendary: 'legend', Mythic: 'mythic' };
  var COLOR_WORDS = ['Blue', 'Purple', 'Green', 'Golden', 'Silver', 'Crimson', 'Midnight', 'Sunset', 'Northern', 'Sour', 'Super', 'White', 'Black', 'Cherry', 'Lemon', 'Grape', 'Mango', 'Cosmic', 'Void', 'Nebula'];
  var PREFIX_WORDS = ['OG', 'Sour', 'Super', 'Ultra', 'Grand', 'Royal', 'Ancient', 'Lost', 'Holy', 'Dark', 'Crystal', 'Frozen', 'Burning', 'Electric', 'Alien'];
  var BASE_WORDS = ['Dream', 'Kush', 'Haze', 'Skunk', 'Diesel', 'Cookies', 'Punch', 'Widow', 'Cheese', 'Glue', 'Runtz', 'Zkittlez', 'Gelato', 'Mimosa', 'Sherbet', 'Cake', 'OG', 'Breath', 'Berry', 'Lemon', 'Mint', 'Fuel', 'Storm'];
  var SUFFIX_WORDS = ['', ' OG', ' XL', ' #42', ' #69', ' #420', ' Reserve', ' Classic', ' Prime'];

  var ABILITIES = [
    { id: 'crit_burst', name: 'Crit Burst', desc: '15% chance to deal 3x boss damage' },
    { id: 'yield_surge', name: 'Yield Surge', desc: '+20% passive yield' },
    { id: 'thc_overdrive', name: 'THC Overdrive', desc: '+15% battle DPS' },
    { id: 'shield_sap', name: 'Shield Sap', desc: 'Boss deals less damage over time' },
    { id: 'poison_cloud', name: 'Poison Cloud', desc: 'DoT on boss each tick' },
    { id: 'clone_echo', name: 'Clone Echo', desc: '-10% clone duration' },
    { id: 'cash_magnet', name: 'Cash Magnet', desc: '+8% cash from bosses' },
    { id: 'portal_sync', name: 'Portal Sync', desc: '+12% portal revenue' },
    { id: 'blitz_rush', name: 'Blitz Rush', desc: '+10% blitz modifier stacking' },
    { id: 'rift_luck', name: 'Rift Luck', desc: '+5% pack rarity luck' },
    { id: 'boss_slayer', name: 'Boss Slayer', desc: '+30% boss DPS' },
    { id: 'regen_mist', name: 'Regen Mist', desc: 'Slowly heals boss fight momentum' },
  ];

  var PACKS = [
    { type: 'basic', name: 'Basic Void Pack', price: 5000, emoji: '📦', desc: 'Random procedural strain' },
    { type: 'guaranteed', name: 'Guaranteed Rift Pack', price: 25000, emoji: '🎁', desc: 'Pulse+ guaranteed' },
    { type: 'omega', name: 'Omega Rift Pack', price: 100000, spCost: 50, emoji: '🌌', desc: 'Bloom+ cosmic anomaly (cash or SP)' },
  ];
  var STORE = [
    { id: 'nutrient-a', name: 'Nebula Nutrients', type: 'nutrient', price: 1200, emoji: '🧪' },
    { id: 'nutrient-b', name: 'Void Bloom Mix', type: 'nutrient', price: 3500, emoji: '💧' },
    { id: 'pipe-a', name: 'Quantum Pipe Mk.I', type: 'pipe', price: 8000, emoji: '🔧' },
    { id: 'pipe-b', name: 'Hyperflow Conduit', type: 'pipe', price: 18000, emoji: '⚙️' },
  ];
  var AVATARS = ['🌌', '🛸', '👾', '🌿', '💫', '🔮', '🪐', '⚡'];
  var BADGES = [{ id: 'harvester', emoji: '🌾', label: 'Harvester' }, { id: 'rift', emoji: '🌀', label: 'Rift Walker' }, { id: 'omega', emoji: '💎', label: 'Omega Tier' }, { id: 'cloner', emoji: '🧬', label: 'Clone Master' }, { id: 'trader', emoji: '🤝', label: 'Void Trader' }, { id: 'blitz', emoji: '⚡', label: 'Blitz King' }];
  var BLITZ = [
    { id: 'blitz-1', name: 'Hyperdrive Yield', description: '+15% passive revenue', modifier: 0.15, modifierType: 'revenue', price: 50000, purchased: false },
    { id: 'blitz-2', name: 'Rift Amplifier', description: '+20% strain yield', modifier: 0.2, modifierType: 'yield', price: 75000, purchased: false },
    { id: 'blitz-3', name: 'Scan Burst', description: '+25% sector scan rate', modifier: 0.25, modifierType: 'scan', price: 60000, purchased: false },
    { id: 'blitz-4', name: 'Clone Accelerator', description: '-30% clone time', modifier: 0.3, modifierType: 'clone', price: 90000, purchased: false },
    { id: 'blitz-5', name: 'Pack Resonance', description: '+10% pack rarity luck', modifier: 0.1, modifierType: 'packLuck', price: 120000, purchased: false },
  ];
  var SECTORS = [
    { id: 'thrusters', name: 'Frictionless Thrusters', level: 0, maxLevel: 10, baseCost: 15000, scanRateBonus: 0.08 },
    { id: 'radar', name: 'Cosmic Radar', level: 0, maxLevel: 10, baseCost: 22000, scanRateBonus: 0.12 },
    { id: 'shield', name: 'Shield Insulation', level: 0, maxLevel: 10, baseCost: 18000, scanRateBonus: 0.06 },
  ];
  var BOSS_PREFIX = ['Void', 'Nebula', 'Rift', 'Cosmic', 'Dark', 'Quantum', 'Stellar', 'Null'];
  var BOSS_SUFFIX = ['Behemoth', 'Leviathan', 'Titan', 'Warden', 'Harbinger', 'Colossus', 'Reaper', 'Overlord'];
  var SLOT_SYMBOLS = ['🍒', '💎', '7️⃣', '🌌', '⭐'];

  var PERSIST = [
    'saveVersion', 'cash', 'sp', 'empireLevel', 'empireXp', 'name', 'avatar', 'badgeIds', 'storefrontSlots',
    'strains', 'inventory', 'factoryFloors', 'sectorUpgrades', 'blitzUpgrades', 'blitzEndsAt', 'purchasedBlitzIds',
    'counterPrices', 'cloneJob', 'focusedStrainId', 'farmSubTab', 'nextPortalNum',
    'bossRound', 'bossHp', 'bossMaxHp', 'bossName', 'bossSeed', 'bossRarity', 'equippedBattleIds',
    'indexSearch', 'indexSort',
  ];

  function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function fmtCash(v) { if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + 'T'; if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B'; if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M'; if (v >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K'; return '$' + v.toFixed(2); }
  function fmtRev(v) { return fmtCash(v) + '/sec'; }
  function fmtCd(ms) { var t = Math.max(0, Math.ceil(ms / 1000)); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); }
  function fmtSp(v) { return v.toLocaleString() + ' SP'; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function playerDef(id) { return PLAYERS.find(function (p) { return p.id === id; }) || PLAYERS[0]; }
  function saveKey(pid) { return SAVE_PREFIX + pid; }

  function rngSeed(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function rarityDef(id) { return RARITIES.find(function (r) { return r.id === id; }) || RARITIES[0]; }
  function rarityIndex(id) { var i = RARITIES.findIndex(function (r) { return r.id === id; }); return i < 0 ? 0 : i; }
  function rMult(id) { return rarityDef(id).mult; }
  function rarityColor(id) { return rarityDef(id).color; }
  function rarityName(id) { return rarityDef(id).name; }

  function mapOldRarity(old) {
    if (!old) return 'dust';
    if (RARITIES.some(function (r) { return r.id === old; })) return old;
    return OLD_RARITY_MAP[old] || 'dust';
  }

  function pickRarity(rng, minR, luck) {
    luck = luck || 0;
    var roll = rng() + luck * 0.04;
    var picked = RARITIES[0];
    for (var i = RARITIES.length - 1; i >= 0; i--) {
      if (roll >= RARITIES[i].threshold) { picked = RARITIES[i]; break; }
    }
    if (minR) {
      var minIdx = rarityIndex(typeof minR === 'string' ? minR : minR.id);
      if (rarityIndex(picked.id) < minIdx) picked = RARITIES[minIdx];
    }
    return picked.id;
  }

  function genStrainName(rng) {
    var style = rng();
    if (style > 0.7) return COLOR_WORDS[Math.floor(rng() * COLOR_WORDS.length)] + ' ' + BASE_WORDS[Math.floor(rng() * BASE_WORDS.length)];
    if (style > 0.4) return PREFIX_WORDS[Math.floor(rng() * PREFIX_WORDS.length)] + ' ' + BASE_WORDS[Math.floor(rng() * BASE_WORDS.length)] + SUFFIX_WORDS[Math.floor(rng() * SUFFIX_WORDS.length)];
    return BASE_WORDS[Math.floor(rng() * BASE_WORDS.length)] + ' ' + BASE_WORDS[Math.floor(rng() * BASE_WORDS.length) % BASE_WORDS.length] + SUFFIX_WORDS[Math.floor(rng() * SUFFIX_WORDS.length)];
  }

  function assignAbilities(rng, tierIdx) {
    var count = tierIdx >= 16 ? 3 : tierIdx >= 6 ? 2 : 1;
    var pool = ABILITIES.slice();
    var out = [];
    for (var i = 0; i < count && pool.length; i++) {
      var idx = Math.floor(rng() * pool.length);
      out.push(pool[idx].id);
      pool.splice(idx, 1);
    }
    return out;
  }

  function hasAbility(s, id) { return (s.abilities || []).indexOf(id) >= 0; }

  function genStrain(seed, minR, luck) {
    var rng = rngSeed(seed);
    var rar = pickRarity(rng, minR, luck);
    var tierIdx = rarityIndex(rar);
    var m = rMult(rar);
    var ts = Date.now();
    var genomeId = seed + '_' + ts + '_' + Math.floor(rng() * 0xffffff).toString(16);
    return {
      id: 'strain_' + genomeId,
      genomeId: genomeId,
      name: genStrainName(rng),
      seed: seed,
      thcPercent: parseFloat((12 + rng() * 18 * m).toFixed(1)),
      yield: Math.round((30 + rng() * 70) * m),
      quantity: 1,
      hue: Math.floor(rng() * 360),
      rarity: rar,
      abilities: assignAbilities(rng, tierIdx),
      potency: Math.round((40 + rng() * 60) * m),
      flavor: Math.round((35 + rng() * 55) * m),
      resilience: Math.round((25 + rng() * 50) * m),
      discoveredAt: ts,
    };
  }

  function genPack(type, seed, opts) {
    opts = opts || {};
    var s = seed != null ? seed : Math.floor(Math.random() * 0xffffffff);
    var luck = (opts.packLuckBonus || 0) + (opts.scanBonus || 0) * 0.1;
    if (hasAbility({ abilities: [] }, 'rift_luck')) luck += 0;
    if (type === 'guaranteed') return genStrain(s, 'pulse', luck);
    if (type === 'omega') return genStrain(s, 'bloom', luck);
    return genStrain(s, undefined, luck);
  }

  function migrateStrain(s) {
    if (!s) return s;
    s.rarity = mapOldRarity(s.rarity);
    if (!s.genomeId) s.genomeId = (s.seed || 0) + '_' + (s.discoveredAt || Date.now()) + '_mig';
    if (!s.abilities || !s.abilities.length) s.abilities = assignAbilities(rngSeed(s.genomeId.split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0)), rarityIndex(s.rarity));
    return s;
  }

  function revSec(s) { return (s.yield * s.quantity * s.thcPercent) / 100; }
  function emptySF() { return [{ strainId: null, price: 0 }, { strainId: null, price: 0 }, { strainId: null, price: 0 }]; }
  function mergeStrains(arr, incoming) {
    var i = arr.findIndex(function (s) { return s.genomeId === incoming.genomeId; });
    if (i >= 0) {
      var u = arr.slice();
      u[i] = Object.assign({}, u[i], { quantity: u[i].quantity + 1 });
      return u;
    }
    return arr.concat([incoming]);
  }
  function upCost(s) { return Math.floor(8000 * rMult(s.rarity) * (1 + s.potency / 100)); }
  function budImg(s, px) { return '<img src="' + BUD_ART + '" alt="" class="strain-bud-art" style="width:' + (px || '2rem') + ';filter:hue-rotate(' + (s.hue || 0) + 'deg)">'; }

  var UI = { activeTab: 'battle', farmOpen: false, profileOpen: false, settingsOpen: false, realityWarp: false, liftedCardId: null, liftOnUpgrade: null, playerSelectOpen: false, casinoGame: 'menu', casinoToast: '', slotOverlay: false, blackjack: null };
  var G = null;
  var activePlayerId = null;
  var dialogueState = { lastKey: '', lastAt: 0, count: 0 };
  var portalNames = ['Portal Alpha', 'Portal Beta', 'Portal Gamma', 'Portal Delta', 'Portal Epsilon', 'Portal Zeta'];
  var bossTickAcc = 0;

  function freshState(pid) {
    var p = playerDef(pid);
    return {
      playerId: pid, saveVersion: SAVE_VERSION, cash: 250000, sp: 100, empireLevel: 1, empireXp: 0,
      name: p.defaultName, avatar: p.avatar, badgeIds: [null, null, null],
      storefrontSlots: emptySF(), strains: [], inventory: STORE.map(function (i) { return Object.assign({}, i, { owned: 0 }); }),
      factoryFloors: [], sectorUpgrades: clone(SECTORS), blitzUpgrades: clone(BLITZ),
      blitzEndsAt: Date.now() + BLITZ_MS, purchasedBlitzIds: [], counterPrices: {},
      cloneJob: null, focusedStrainId: null, packReveal: { open: false, packType: null, strain: null },
      farmSubTab: 'portal', transactionBeam: null, lastTickAt: Date.now(), nextPortalNum: 1,
      bossRound: 1, bossHp: 0, bossMaxHp: 0, bossName: '', bossSeed: 0, bossRarity: 'dust', equippedBattleIds: [],
      indexSearch: '', indexSort: 'recent',
    };
  }

  function readPlayerSave(pid) { try { var r = localStorage.getItem(saveKey(pid)); if (!r) return null; return JSON.parse(r); } catch (e) { return null; } }
  function saveGame() {
    if (!G || !activePlayerId) return;
    try {
      G.saveVersion = SAVE_VERSION;
      var p = { playerId: activePlayerId, saveVersion: SAVE_VERSION };
      PERSIST.forEach(function (k) { p[k] = G[k]; });
      localStorage.setItem(saveKey(activePlayerId), JSON.stringify(p));
    } catch (e) { }
  }

  function sanitizeSave(pid) {
    delete G.planetOffers;
    delete G.profileViewIndex;
    var p = playerDef(pid);
    if (G.name === 'VoidPilot_Aden' || G.name === 'VoidPilot') G.name = p.defaultName;
    G.strains = (G.strains || []).map(migrateStrain);
    if (!G.equippedBattleIds) G.equippedBattleIds = [];
    if (!G.indexSearch) G.indexSearch = '';
    if (!G.indexSort) G.indexSort = 'recent';
    if (!G.bossRound) G.bossRound = 1;
    if (!G.saveVersion || G.saveVersion < SAVE_VERSION) {
      var hadLegacyFloors = (G.factoryFloors || []).length >= 3 && !G.nextPortalNum;
      if (!G.saveVersion || hadLegacyFloors || G.saveVersion < 2) {
        G.factoryFloors = [];
        G.nextPortalNum = 1;
      }
      G.saveVersion = SAVE_VERSION;
    }
    if (!G.bossMaxHp || G.bossHp <= 0) spawnBoss();
  }

  function loadGame(pid) {
    var d = readPlayerSave(pid);
    if (!d && pid === 'aden') { try { var leg = localStorage.getItem(LEGACY_SAVE); if (leg) d = JSON.parse(leg); } catch (e) { } }
    G = d ? Object.assign(freshState(pid), d, { playerId: pid }) : freshState(pid);
    if (!G.factoryFloors) G.factoryFloors = [];
    if (!G.nextPortalNum) G.nextPortalNum = (G.factoryFloors.length || 0) + 1;
    sanitizeSave(pid);
  }

  function getSharedOffers() {
    var offers = [];
    PLAYERS.forEach(function (pl) {
      if (pl.id === activePlayerId) return;
      var save = readPlayerSave(pl.id);
      if (!save || !save.storefrontSlots) return;
      save.storefrontSlots.forEach(function (slot, si) {
        if (!slot.strainId || !slot.price) return;
        var strain = (save.strains || []).find(function (s) { return s.id === slot.strainId; });
        if (!strain) return;
        offers.push({ id: pl.id + '-slot-' + si, strainName: strain.name, thcPercent: strain.thcPercent, yield: strain.yield, offerPrice: slot.price, sellerName: save.name || pl.label, sellerId: pl.id });
      });
    });
    return offers;
  }

  function getPokerRoom() {
    try {
      var r = localStorage.getItem(POKER_KEY);
      if (!r) return { ready: {}, active: false, startedAt: null };
      return JSON.parse(r);
    } catch (e) { return { ready: {}, active: false }; }
  }
  function savePokerRoom(room) { try { localStorage.setItem(POKER_KEY, JSON.stringify(room)); } catch (e) { } }
  function pokerReadyCount(room) { return PLAYERS.filter(function (p) { return room.ready[p.id]; }).length; }

  function genBossName(rng) {
    return BOSS_PREFIX[Math.floor(rng() * BOSS_PREFIX.length)] + ' ' + BOSS_SUFFIX[Math.floor(rng() * BOSS_SUFFIX.length)];
  }

  function spawnBoss() {
    var round = G.bossRound || 1;
    var seed = Date.now() + round * 7919 + (activePlayerId || '').split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
    var rng = rngSeed(seed);
    var rar = pickRarity(rng, undefined, scanMult() * 0.01 + blitzMod('packLuck') * 0.5);
    G.bossSeed = seed;
    G.bossRarity = rar;
    G.bossName = genBossName(rng);
    G.bossMaxHp = Math.floor(800 * round * rMult(rar) * (1 + round * 0.15));
    G.bossHp = G.bossMaxHp;
  }

  function strainById(id) { return G.strains.find(function (s) { return s.id === id; }); }

  function strainBattleDps(s, rng) {
    if (!s) return 0;
    var base = (s.yield * s.thcPercent / 100) * rMult(s.rarity) * s.quantity;
    if (hasAbility(s, 'boss_slayer')) base *= 1.3;
    if (hasAbility(s, 'thc_overdrive')) base *= 1.15;
    if (hasAbility(s, 'crit_burst') && rng && rng() < 0.15) base *= 3;
    return base;
  }

  function totalBattleDps() {
    var rng = rngSeed(G.bossSeed + Math.floor(Date.now() / 1000));
    var ids = (G.equippedBattleIds || []).slice(0, 4);
    var dot = 0;
    ids.forEach(function (id) {
      var s = strainById(id);
      if (s && hasAbility(s, 'poison_cloud')) dot += 5 * s.quantity;
    });
    var dps = ids.reduce(function (t, id) { return t + strainBattleDps(strainById(id), rng); }, 0);
    return dps + dot;
  }

  function killBoss() {
    var round = G.bossRound || 1;
    var mult = 1;
    (G.equippedBattleIds || []).forEach(function (id) {
      var s = strainById(id);
      if (s && hasAbility(s, 'cash_magnet')) mult += 0.08;
    });
    G.cash += Math.floor(5000 * round * rMult(G.bossRarity) * mult);
    addXp(40 + round * 10);
    G.bossRound = round + 1;
    spawnBoss();
    var root = document.getElementById('screen-root');
    if (root) { root.classList.add('screen-shake'); setTimeout(function () { root.classList.remove('screen-shake'); }, 500); }
    plantSay('boss_kill', true);
  }

  function tickBoss(dt) {
    if (!G.bossMaxHp || G.bossHp <= 0) return;
    var dps = totalBattleDps();
    if (dps <= 0) return;
    G.bossHp = Math.max(0, G.bossHp - dps * (dt / 1000));
    if (G.bossHp <= 0) killBoss();
  }

  function equipBattle(sid) {
    var ids = (G.equippedBattleIds || []).slice();
    var idx = ids.indexOf(sid);
    if (idx >= 0) { ids.splice(idx, 1); G.equippedBattleIds = ids; return true; }
    if (ids.length >= 4) return false;
    if (!strainById(sid)) return false;
    ids.push(sid);
    G.equippedBattleIds = ids;
    plantSay('equip');
    return true;
  }

  function topStrain() {
    if (G.focusedStrainId) { var f = strainById(G.focusedStrainId); if (f) return f; }
    if (!G.strains.length) return null;
    return G.strains.slice().sort(function (a, b) { return revSec(b) - revSec(a); })[0];
  }

  function plantLine(reason) {
    var s = topStrain(), pl = playerDef(activePlayerId);
    if (!s) return pl.label + ', the Index is empty. Hit Shop and wake me up with a fresh pack.';
    var lines = {
      welcome: 'Yo ' + pl.label + '. It\'s me, ' + s.name + '. I run this farm now.',
      pack: '*rustle* ' + s.name + ' just joined the crew. Smells loud.',
      portal: 'New portal online. Stick a strain in me and watch me print.',
      clone: 'Cloning ' + s.name + '… my roots are tingling.',
      equip: s.name + ' locked in. We\'re growing.',
      upgrade: s.name + ' got stronger. I feel that in my leaves.',
      lowcash: 'Wallet\'s dry, ' + pl.label + '. Equip a portal strain or open a pack.',
      revenue: s.name + ' here — pulling ' + fmtRev(revSecTotal()) + ' for the empire.',
      empty_board: 'Share board\'s quiet. List a strain in your Profile storefront.',
      tab_shop: 'Shop time. I need siblings in the Index.',
      tab_battle: 'Boss arena online. Equip strains and let auto-battle rip.',
      tab_index: 'Index online. Tap a card to inspect genetics.',
      tab_coop: 'Co-op sync. See what the family\'s running.',
      tab_casino: 'Casino deck. Poker needs two ready players minimum.',
      boss_kill: s.name + ' just watched that boss fold. Next round\'s bigger.',
      tab_farm: 'Portal shaft open. Drop strains in the rocket.',
    };
    return lines[reason] || s.name + ' watching the void… keep farming.';
  }

  function plantSay(reason, force) {
    var key = reason + '|' + (topStrain() ? topStrain().id : 'none');
    var now = Date.now();
    if (!force && key === dialogueState.lastKey && now - dialogueState.lastAt < 45000) return;
    dialogueState.lastKey = key; dialogueState.lastAt = now; dialogueState.count++;
    var el = document.getElementById('overlay-dialogue');
    var mascot = document.getElementById('plant-mascot');
    var s = topStrain();
    if (el) { el.textContent = plantLine(reason); el.classList.add('visible'); }
    if (mascot) {
      if (s) mascot.innerHTML = budImg(s, '1.5rem');
      else { mascot.textContent = '🌱'; mascot.style.filter = 'none'; }
      mascot.title = s ? s.name : 'No strain yet';
    }
  }

  function selectPlayer(pid) {
    if (activePlayerId && G) saveGame();
    activePlayerId = pid;
    try { sessionStorage.setItem(SESSION_KEY, pid); } catch (e) { }
    loadGame(pid);
    UI.playerSelectOpen = false;
    UI.activeTab = 'battle';
    UI.farmOpen = false;
    plantSay('welcome', true);
    render();
  }

  function switchPlayerPrompt() { saveGame(); UI.playerSelectOpen = true; UI.profileOpen = false; UI.settingsOpen = false; render(); }
  function blitzMod(t) { return G.blitzUpgrades.filter(function (b) { return b.purchased && b.modifierType === t; }).reduce(function (s, b) { return s + b.modifier; }, 0); }
  function scanMult() { return G.sectorUpgrades.reduce(function (s, x) { return s + x.level * x.scanRateBonus; }, 0) + blitzMod('scan'); }
  function revMs() {
    var rm = 1 + blitzMod('revenue'), ym = 1 + blitzMod('yield'), t = 0;
    G.factoryFloors.forEach(function (f) {
      if (!f.equippedStrainId) return;
      var s = strainById(f.equippedStrainId);
      if (!s) return;
      var fm = 1;
      if (hasAbility(s, 'yield_surge')) fm *= 1.2;
      if (hasAbility(s, 'portal_sync')) fm *= 1.12;
      t += revSec(s) * f.level * rm * ym * fm;
    });
    G.inventory.forEach(function (i) { if (i.type === 'nutrient' && i.owned > 0) t += i.owned * 0.5; });
    return t / 1000;
  }
  function revSecTotal() { return revMs() * 1000; }
  function blitzRem() { return Math.max(0, G.blitzEndsAt - Date.now()); }
  function cloneRem() { return G.cloneJob ? Math.max(0, G.cloneJob.startedAt + G.cloneJob.durationMs - Date.now()) : 0; }
  function portalCost() { return PORTAL_BASE_COST * G.nextPortalNum; }
  function floorUpCost(f) { return Math.floor(5000 * f.level * f.level); }
  function addXp(amt) { var xp = G.empireXp + amt, lvl = G.empireLevel; while (xp >= lvl * XP_LVL) { xp -= lvl * XP_LVL; lvl++; } G.empireXp = xp; G.empireLevel = lvl; }

  function tick(now) {
    var d = now - G.lastTickAt;
    if (d <= 0) return;
    G.cash += revMs() * d;
    if (G.cloneJob && now >= G.cloneJob.startedAt + G.cloneJob.durationMs) completeClone();
    bossTickAcc += d;
    if (bossTickAcc >= 100) { tickBoss(bossTickAcc); bossTickAcc = 0; }
    G.lastTickAt = now;
  }

  function completeClone() {
    if (!G.cloneJob) return;
    var sid = G.cloneJob.strainId;
    G.cloneJob = null;
    var i = G.strains.findIndex(function (s) { return s.id === sid; });
    if (i < 0) return;
    G.strains = G.strains.slice();
    G.strains[i] = Object.assign({}, G.strains[i], { quantity: G.strains[i].quantity + 1 });
    plantSay('clone');
  }

  function buyPack(type) {
    var p = PACKS.find(function (x) { return x.type === type; });
    if (!p) return false;
    var nc = G.cash, ns = G.sp;
    if (type === 'omega' && G.cash < p.price && p.spCost && G.sp >= p.spCost) ns -= p.spCost;
    else if (G.cash < p.price) return false;
    else { nc -= p.price; ns += Math.floor(p.price / 500); }
    var luck = blitzMod('packLuck');
    G.strains.forEach(function (st) { if (hasAbility(st, 'rift_luck')) luck += 0.05; });
    var strain = genPack(type, Date.now() + Math.floor(Math.random() * 99999), { scanBonus: scanMult(), packLuckBonus: luck });
    G.cash = nc; G.sp = ns;
    G.packReveal = { open: true, packType: type, strain: strain };
    return true;
  }
  function closePack() {
    if (G.packReveal.strain) {
      G.strains = mergeStrains(G.strains, G.packReveal.strain);
      if (!G.focusedStrainId) G.focusedStrainId = G.packReveal.strain.id;
      addXp(25);
      plantSay('pack', true);
    }
    G.packReveal = { open: false, packType: null, strain: null };
  }
  function buyBlitz(id) {
    var u = G.blitzUpgrades.find(function (b) { return b.id === id; });
    if (!u || u.purchased || G.cash < u.price) return false;
    var first = !G.purchasedBlitzIds.length;
    G.cash -= u.price;
    G.blitzUpgrades = G.blitzUpgrades.map(function (b) { return b.id === id ? Object.assign({}, b, { purchased: true }) : b; });
    G.purchasedBlitzIds = G.purchasedBlitzIds.concat([id]);
    if (first) G.blitzEndsAt = Date.now() + BLITZ_MS;
    return true;
  }
  function buyItem(id) {
    var it = G.inventory.find(function (i) { return i.id === id; });
    if (!it || G.cash < it.price) return false;
    G.cash -= it.price;
    G.inventory = G.inventory.map(function (i) { return i.id === id ? Object.assign({}, i, { owned: i.owned + 1 }) : i; });
    return true;
  }
  function upSector(id) {
    var s = G.sectorUpgrades.find(function (x) { return x.id === id; });
    if (!s || s.level >= s.maxLevel) return false;
    var c = s.baseCost * (s.level + 1);
    if (G.cash < c) return false;
    G.cash -= c;
    G.sectorUpgrades = G.sectorUpgrades.map(function (x) { return x.id === id ? Object.assign({}, x, { level: x.level + 1 }) : x; });
    return true;
  }
  function acceptOffer(oid) {
    var offers = getSharedOffers(), o = offers.find(function (x) { return x.id === oid; });
    if (!o || G.cash < o.offerPrice) return false;
    var s = genPack('guaranteed', oid.split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0));
    s.name = o.strainName; s.thcPercent = o.thcPercent; s.yield = o.yield;
    G.cash -= o.offerPrice;
    G.strains = mergeStrains(G.strains, s);
    if (!G.focusedStrainId) G.focusedStrainId = s.id;
    addXp(15);
    plantSay('pack');
    return true;
  }
  function counterOffer(oid) {
    var offers = getSharedOffers(), o = offers.find(function (x) { return x.id === oid; }), c = G.counterPrices[oid];
    if (!o || !c || c <= 0 || G.cash < c || c < o.offerPrice * 0.85) return false;
    var s = genPack('basic', c);
    s.name = o.strainName; s.thcPercent = o.thcPercent; s.yield = o.yield;
    G.cash -= c;
    G.strains = mergeStrains(G.strains, s);
    return true;
  }
  function buyPortal() {
    var cost = portalCost();
    if (G.cash < cost) return false;
    G.cash -= cost;
    var n = G.nextPortalNum, name = portalNames[(n - 1) % portalNames.length] || ('Portal #' + n);
    G.factoryFloors = G.factoryFloors.concat([{ id: 'floor-' + n, name: name, equippedStrainId: null, level: 1 }]);
    G.nextPortalNum = n + 1;
    plantSay('portal', true);
    return true;
  }
  function equipFloor(fid, sid) { G.factoryFloors = G.factoryFloors.map(function (f) { return f.id === fid ? Object.assign({}, f, { equippedStrainId: sid || null }) : f; }); if (sid) plantSay('equip'); }
  function upFloor(fid) {
    var f = G.factoryFloors.find(function (x) { return x.id === fid; });
    if (!f) return false;
    var c = floorUpCost(f);
    if (G.cash < c) return false;
    G.cash -= c;
    G.factoryFloors = G.factoryFloors.map(function (x) { return x.id === fid ? Object.assign({}, x, { level: x.level + 1 }) : x; });
    plantSay('upgrade');
    return true;
  }
  function startClone(sid) {
    if (G.cloneJob) return false;
    if (!strainById(sid)) return false;
    var cd = CLONE_MS * (1 - blitzMod('clone'));
    G.strains.forEach(function (st) { if (hasAbility(st, 'clone_echo')) cd *= 0.9; });
    G.cloneJob = { strainId: sid, startedAt: Date.now(), durationMs: cd };
    return true;
  }
  function upStrain(sid) {
    var i = G.strains.findIndex(function (s) { return s.id === sid; });
    if (i < 0) return false;
    var s = G.strains[i], c = upCost(s);
    if (G.cash < c) return false;
    G.cash -= c;
    var u = G.strains.slice();
    u[i] = Object.assign({}, s, { yield: Math.round(s.yield * 1.12), potency: Math.min(100, s.potency + 5), thcPercent: parseFloat(Math.min(35, s.thcPercent + 0.8).toFixed(1)) });
    G.strains = u;
    addXp(10);
    plantSay('upgrade');
    return true;
  }

  function filteredStrains() {
    var list = G.strains.slice();
    var q = (G.indexSearch || '').toLowerCase();
    if (q) list = list.filter(function (s) { return s.name.toLowerCase().indexOf(q) >= 0; });
    if (G.indexSort === 'rarity') list.sort(function (a, b) { return rarityIndex(b.rarity) - rarityIndex(a.rarity); });
    else if (G.indexSort === 'name') list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    else list.sort(function (a, b) { return (b.discoveredAt || 0) - (a.discoveredAt || 0); });
    return list;
  }

  function abilityListHtml(ids) {
    return (ids || []).map(function (aid) {
      var a = ABILITIES.find(function (x) { return x.id === aid; });
      return a ? '<div class="text-xs mb-1"><span class="text-green">' + esc(a.name) + '</span> — ' + esc(a.desc) + '</div>' : '';
    }).join('');
  }

  function liftWrap(id, inner, onUp) { return '<div class="liftable-wrap" data-lift="' + esc(id) + '" data-lift-up="' + (onUp || '') + '"><div class="neon-card p-4">' + inner + '</div></div>'; }

  function crCardHtml(s, opts) {
    opts = opts || {};
    var c = rarityColor(s.rarity), sel = opts.selected ? ' selected' : '';
    return '<button type="button" class="cr-card cr-card-glow' + sel + '" data-strain-focus="' + esc(s.id) + '" style="--rarity-color:' + c + ';border-color:' + c + '55">' +
      '<div class="cr-card-art">' + budImg(s, '3rem') + '</div>' +
      '<div class="font-mono" style="font-size:0.45rem;color:' + c + '">' + esc(rarityName(s.rarity).toUpperCase()) + '</div>' +
      '<div style="font-weight:600;font-size:0.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(s.name) + '</div>' +
      '<div class="font-mono text-xs text-muted">THC ' + s.thcPercent + '% · x' + s.quantity + '</div></button>';
  }

  function showCasinoToast(msg) { UI.casinoToast = msg; setTimeout(function () { if (UI.casinoToast === msg) UI.casinoToast = ''; render(); }, 3000); }

  function newDeck() {
    var suits = ['♠', '♥', '♦', '♣'], deck = [];
    for (var v = 1; v <= 13; v++) suits.forEach(function (su) { deck.push({ v: Math.min(v, 10), label: (v === 1 ? 'A' : v === 11 ? 'J' : v === 12 ? 'Q' : v === 13 ? 'K' : String(v)) + su }); });
    for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    return deck;
  }
  function handVal(hand) { return hand.reduce(function (s, c) { return s + c.v; }, 0); }

  function startBlackjack() {
    if (G.cash < 1000) return;
    G.cash -= 1000;
    var deck = newDeck();
    UI.blackjack = { deck: deck, player: [deck.pop(), deck.pop()], dealer: [deck.pop(), deck.pop()], bet: 1000, done: false, win: null };
  }
  function blackjackHit() {
    var bj = UI.blackjack;
    if (!bj || bj.done) return;
    bj.player.push(bj.deck.pop());
    if (handVal(bj.player) > 21) { bj.done = true; bj.win = false; }
    render();
  }
  function blackjackStand() {
    var bj = UI.blackjack;
    if (!bj || bj.done) return;
    while (handVal(bj.dealer) < 17) bj.dealer.push(bj.deck.pop());
    var pv = handVal(bj.player), dv = handVal(bj.dealer);
    bj.done = true;
    if (dv > 21 || pv > dv) { bj.win = true; G.cash += bj.bet * 2; }
    else if (pv === dv) { bj.win = null; G.cash += bj.bet; }
    else { bj.win = false; }
    scheduleSave();
    render();
  }

  function spinSlots() {
    if (G.cash < SLOT_COST) return false;
    G.cash -= SLOT_COST;
    var rng = rngSeed(Date.now());
    var reels = [SLOT_SYMBOLS[Math.floor(rng() * SLOT_SYMBOLS.length)], SLOT_SYMBOLS[Math.floor(rng() * SLOT_SYMBOLS.length)], SLOT_SYMBOLS[Math.floor(rng() * SLOT_SYMBOLS.length)]];
    var win = 0;
    if (reels[0] === reels[1] && reels[1] === reels[2]) win = SLOT_COST * 20;
    else if (reels[0] === reels[1] || reels[1] === reels[2]) win = SLOT_COST * 3;
    G.cash += win;
    UI.slotResult = { reels: reels, win: win };
    return true;
  }

  function togglePokerReady() {
    var room = getPokerRoom();
    if (!room.ready) room.ready = {};
    room.ready[activePlayerId] = !room.ready[activePlayerId];
    savePokerRoom(room);
    return room;
  }
  function startPoker() {
    var room = getPokerRoom();
    var count = pokerReadyCount(room);
    if (count < 2) { showCasinoToast('Need more players'); return false; }
    room.active = true;
    room.startedAt = Date.now();
    savePokerRoom(room);
    UI.casinoGame = 'poker';
    return true;
  }

  function renderHUD() {
    var pl = playerDef(activePlayerId);
    var av = document.getElementById('hud-avatar');
    if (av) {
      if (pl.portrait) av.innerHTML = '<img src="' + pl.portrait + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';
      else av.textContent = G.avatar;
    }
    document.getElementById('hud-name').textContent = G.name;
    document.getElementById('hud-level').textContent = 'LV.' + G.empireLevel;
    document.getElementById('hud-cash').textContent = fmtCash(G.cash);
    document.getElementById('phone-shell').classList.toggle('dimmed', !!UI.liftedCardId);
    document.getElementById('voidline-app').classList.toggle('reality-warp-active', UI.realityWarp);
    document.getElementById('overlay-reality-warp').classList.toggle('active', UI.realityWarp);
    document.querySelectorAll('.nav-btn').forEach(function (b) {
      var tab = b.dataset.tab;
      b.classList.toggle('active', tab === UI.activeTab && !UI.farmOpen);
    });
    var rocket = document.getElementById('hub-rocket-btn');
    if (!rocket) {
      var hdr = document.getElementById('hud-header');
      if (hdr) {
        rocket = document.createElement('button');
        rocket.type = 'button';
        rocket.id = 'hub-rocket-btn';
        rocket.className = 'hub-rocket-btn';
        rocket.dataset.action = 'toggle-farm';
        rocket.title = 'Portal Farm';
        rocket.innerHTML = '<img src="/public/art/rocket.svg" alt="" style="width:1.5rem;height:1.5rem">';
        hdr.insertBefore(rocket, hdr.children[1]);
      }
    }
    if (rocket) {
      rocket.title = UI.farmOpen ? 'Back to Battle' : 'Portal Farm';
      rocket.classList.toggle('active', UI.farmOpen);
    }
    var s = topStrain(), mascot = document.getElementById('plant-mascot'), label = document.getElementById('plant-label');
    if (mascot) {
      if (s) mascot.innerHTML = budImg(s, '1.5rem');
      else { mascot.textContent = '🌱'; mascot.style.filter = 'none'; }
    }
    if (label) label.textContent = s ? s.name : 'No strain';
  }

  function renderPlayerSelect() {
    var el = document.getElementById('overlay-player-select');
    if (!el) return;
    if (!UI.playerSelectOpen) { el.classList.remove('open'); el.innerHTML = ''; return; }
    el.classList.add('open');
    var h = '<div class="overlay-panel p-5 text-center"><h2 class="font-display chromatic-text mb-2" style="font-size:1rem;letter-spacing:0.15em">WHO ARE YOU?</h2><p class="text-muted text-xs mb-4">Each person gets their own save on this device.</p><div class="player-pick-grid">';
    PLAYERS.forEach(function (pl) {
      var save = readPlayerSave(pl.id);
      var lvl = save ? save.empireLevel : 1;
      var av = pl.portrait ? '<img src="' + pl.portrait + '" alt="" style="width:2.5rem;height:2.5rem;object-fit:contain">' : '<div style="font-size:2rem">' + pl.avatar + '</div>';
      h += '<button type="button" class="player-pick-card" data-action="pick-player" data-pid="' + pl.id + '">' + av + '<div style="font-weight:700">' + esc(pl.label) + '</div><div class="font-mono text-muted" style="font-size:0.55rem">' + esc(save ? (save.name || pl.label) : 'New game') + ' · Lv.' + lvl + '</div></button>';
    });
    h += '</div></div>';
    el.innerHTML = h;
  }

  function renderBattle() {
    var hpPct = G.bossMaxHp ? Math.max(0, G.bossHp / G.bossMaxHp * 100) : 0;
    var bc = rarityColor(G.bossRarity);
    var dps = totalBattleDps();
    var h = '<div class="screen-section boss-arena"><div class="text-center mb-2"><h2 class="font-display chromatic-text" style="font-size:1.125rem;letter-spacing:0.2em">BOSS ARENA</h2><p class="font-mono text-muted text-xs">Round ' + G.bossRound + ' · Auto-battle active</p></div>';
    h += '<div class="neon-card p-4 mb-3 text-center"><img src="' + BOSS_ART + '" alt="" style="width:6rem;height:6rem;filter:hue-rotate(' + (G.bossSeed % 360) + 'deg)"><div class="font-display mt-2" style="font-size:1rem;color:' + bc + '">' + esc(G.bossName) + '</div><div class="font-mono text-xs text-muted">' + esc(rarityName(G.bossRarity)) + ' tier</div>';
    h += '<div class="progress-bar mt-3 mb-1"><div class="progress-fill" style="width:' + hpPct + '%;background:' + bc + '"></div></div>';
    h += '<div class="font-mono text-xs flex-between"><span class="text-green">' + Math.ceil(G.bossHp).toLocaleString() + ' HP</span><span class="text-muted">' + G.bossMaxHp.toLocaleString() + '</span></div>';
    h += '<div class="font-mono text-green text-xs mt-2">DPS ' + dps.toFixed(1) + '/sec</div></div>';
    h += '<div class="section-label mb-2">BATTLE LOADOUT (4 MAX)</div><div class="grid-3 mb-3">';
    for (var slot = 0; slot < 4; slot++) {
      var eid = (G.equippedBattleIds || [])[slot];
      var es = eid ? strainById(eid) : null;
      h += '<div class="neon-card p-2 text-center" style="min-height:4.5rem">' + (es ? budImg(es, '2rem') + '<div class="text-xs mt-1" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(es.name) + '</div>' : '<div class="text-muted text-xs">Empty</div>') + '</div>';
    }
    h += '</div><div class="section-label mb-2">EQUIP FROM INDEX</div>';
    if (!G.strains.length) h += '<div class="neon-card p-4 text-center text-muted text-sm">No strains — open a pack in Shop.</div>';
    G.strains.forEach(function (s) {
      var on = (G.equippedBattleIds || []).indexOf(s.id) >= 0;
      h += '<div class="flex-between neon-card p-3 mb-2"><div class="flex-row" style="min-width:0">' + budImg(s, '1.5rem') + '<div style="min-width:0"><div class="text-xs font-weight-600" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(s.name) + '</div><div class="font-mono text-xs text-muted">DPS ' + strainBattleDps(s).toFixed(1) + '</div></div></div><button type="button" class="game-btn game-btn-sm' + (on ? '' : ' game-btn-green') + '" data-action="equip-battle" data-id="' + esc(s.id) + '">' + (on ? 'UNEQUIP' : 'EQUIP') + '</button></div>';
    });
    h += '</div>';
    return h;
  }

  function renderFarm() {
    var h = '<div class="screen-section"><div class="neon-card neon-card-green p-3 text-center mb-2"><div class="font-mono text-green" style="font-size:0.55rem;letter-spacing:0.15em">PASSIVE REVENUE · SCAN +' + ((scanMult() * 100).toFixed(0)) + '%</div><div class="font-display chromatic-text" style="font-size:1.125rem;font-weight:700">' + fmtRev(revSecTotal()) + '</div></div>';
    h += '<div class="farm-tabs mb-3">';
    ['upgrade', 'control', 'portal'].forEach(function (t) {
      var lbl = { upgrade: 'UPGRADE DECK', control: 'CONTROL DECK', portal: 'PORTAL FARM' }[t];
      h += '<button type="button" class="farm-tab' + (G.farmSubTab === t ? ' active' : '') + '" data-action="farm-tab" data-id="' + t + '">' + lbl + '</button>';
    });
    h += '</div>';
    if (G.farmSubTab === 'upgrade') {
      h += '<div class="section-label mb-2">SECTOR SCAN RATE UPGRADES</div>';
      G.sectorUpgrades.forEach(function (s) {
        var c = s.baseCost * (s.level + 1);
        h += '<div class="neon-card p-4 mb-3"><div class="flex-between mb-2"><div><div style="font-weight:600;font-size:0.875rem">' + esc(s.name) + '</div><div class="text-muted" style="font-size:0.55rem">Lv.' + s.level + '/' + s.maxLevel + ' · +' + ((s.level * s.scanRateBonus * 100).toFixed(0)) + '% scan</div></div><button type="button" class="game-btn game-btn-green game-btn-sm" data-action="up-sector" data-id="' + s.id + '"' + (s.level >= s.maxLevel || G.cash < c ? ' disabled' : '') + '>' + (s.level >= s.maxLevel ? 'MAX' : fmtCash(c)) + '</button></div><div class="progress-bar"><div class="progress-fill" style="width:' + (s.level / s.maxLevel * 100) + '%"></div></div></div>';
      });
    } else if (G.farmSubTab === 'control') {
      var offers = getSharedOffers();
      h += '<div class="section-label mb-2">PLANET SHARE BOARD</div><p class="text-muted text-xs text-center mb-3">Real listings from Aden, Dad, or Jamie — set slots in Profile.</p>';
      if (!offers.length) h += '<div class="neon-card p-4 text-center text-muted text-sm">No listings yet.</div>';
      offers.forEach(function (o) {
        h += '<div class="neon-card p-4 mb-3"><div class="font-mono text-muted" style="font-size:0.55rem">' + esc(o.sellerName) + '</div><div style="font-weight:600;font-size:0.875rem">' + esc(o.strainName) + '</div><div class="text-green" style="font-size:0.55rem">THC ' + o.thcPercent + '% · Yield ' + o.yield + '</div><div class="font-mono text-cyan mb-3" style="font-weight:700;font-size:0.875rem">Ask: ' + fmtCash(o.offerPrice) + '</div><input type="number" class="input-field mb-2" placeholder="Counter price" data-action="counter-input" data-id="' + o.id + '" value="' + (G.counterPrices[o.id] || '') + '"><div class="flex-row gap-2"><button type="button" class="game-btn game-btn-green game-btn-sm" style="flex:1" data-action="accept-offer" data-id="' + o.id + '"' + (G.cash < o.offerPrice ? ' disabled' : '') + '>ACCEPT</button><button type="button" class="game-btn game-btn-sm" style="flex:1" data-action="counter-offer" data-id="' + o.id + '"' + (function () { var c = G.counterPrices[o.id]; return (!c || c <= 0 || c < o.offerPrice * 0.85 || G.cash < c) ? ' disabled' : ''; })() + '>COUNTER</button></div></div>';
      });
    } else {
      h += '<div class="rocket-shaft mb-3">';
      G.factoryFloors.forEach(function (f, fi) {
        var eq = f.equippedStrainId ? strainById(f.equippedStrainId) : null;
        h += '<div class="rocket-floor" style="--floor-index:' + fi + '"><div class="rocket-floor-label">F' + (fi + 1) + ' Lv.' + f.level + '</div>' + (eq ? '<div class="rocket-strain">' + budImg(eq, '1.25rem') + '</div>' : '<div class="rocket-empty"></div>') + '</div>';
      });
      if (!G.factoryFloors.length) h += '<div class="rocket-floor rocket-floor-empty"><div class="text-muted text-xs">Empty shaft</div></div>';
      h += '</div><div class="section-label mb-2">PORTAL FARM</div>';
      if (!G.factoryFloors.length) {
        h += '<div class="neon-card p-5 text-center mb-3"><div style="font-size:2.5rem;margin-bottom:0.5rem">🌀</div><div class="text-muted text-sm mb-3">No portals yet. Buy your first floor to start mining.</div><button type="button" class="game-btn game-btn-green w-full" data-action="buy-portal"' + (G.cash < portalCost() ? ' disabled' : '') + '>BUY FLOOR · ' + fmtCash(portalCost()) + '</button></div>';
      }
      G.factoryFloors.forEach(function (f) {
        var eq = f.equippedStrainId ? strainById(f.equippedStrainId) : null;
        var uc = floorUpCost(f);
        h += '<div class="neon-card p-4 mb-3"><div class="flex-between mb-3"><div><div style="font-weight:600">' + esc(f.name) + '</div><div class="text-muted" style="font-size:0.55rem">Floor Lv.' + f.level + '</div></div><button type="button" class="game-btn game-btn-sm game-btn-green" data-action="up-floor" data-id="' + f.id + '"' + (G.cash < uc ? ' disabled' : '') + '>UP · ' + fmtCash(uc) + '</button></div>' + (eq ? '<div class="font-mono text-green text-xs mb-2">' + esc(eq.name) + '</div>' : '') + '<select class="input-field" data-action="equip-floor" data-id="' + f.id + '"><option value="">— Select strain —</option>';
        G.strains.forEach(function (s) { h += '<option value="' + esc(s.id) + '"' + (f.equippedStrainId === s.id ? ' selected' : '') + '>' + esc(s.name) + ' (x' + s.quantity + ')</option>'; });
        h += '</select></div>';
      });
      if (G.factoryFloors.length) h += '<button type="button" class="game-btn game-btn-green w-full mb-3" data-action="buy-portal"' + (G.cash < portalCost() ? ' disabled' : '') + '>+ BUY FLOOR · ' + fmtCash(portalCost()) + '</button>';
      var cr = cloneRem();
      h += '<div class="neon-card capsule-cloner p-4 mb-3"><div class="clone-bubbles"></div><div class="font-mono text-muted mb-2" style="font-size:0.55rem;letter-spacing:0.15em">CAPSULE CLONER</div>';
      if (G.cloneJob) {
        var cs = strainById(G.cloneJob.strainId);
        h += '<div class="text-center py-4 clone-active"><div>' + (cs ? budImg(cs, '2.5rem') : '🧬') + '</div><div class="font-mono text-green" style="font-size:1.125rem;font-weight:700">' + fmtCd(cr) + '</div><div class="text-muted text-xs">Cloning ' + (cs ? esc(cs.name) : 'strain') + '...</div></div>';
      } else {
        h += '<select class="input-field mb-3" id="clone-select"><option value="">— Select strain —</option>';
        G.strains.forEach(function (s) { h += '<option value="' + esc(s.id) + '">' + esc(s.name) + '</option>'; });
        h += '</select><button type="button" class="game-btn game-btn-green w-full" data-action="start-clone"' + (G.strains.length ? '' : ' disabled') + '>START CLONE (+1)</button>';
      }
      h += '</div>';
    }
    h += '</div>';
    return h;
  }

  function renderShop() {
    var h = '<div class="screen-section"><div class="text-center mb-2"><h2 class="font-display chromatic-text" style="font-size:1.125rem;letter-spacing:0.2em">NEBULA MARKET</h2><p class="font-mono text-muted" style="font-size:0.65rem;margin-top:0.25rem">Balance: ' + fmtCash(G.cash) + '</p></div><div class="section-label section-label-green mb-2">MYSTERY PACKS</div>';
    PACKS.forEach(function (p) {
      var dis = G.cash < p.price && !(p.type === 'omega' && p.spCost && G.sp >= p.spCost);
      h += liftWrap('pack-' + p.type, '<div class="flex-row"><div style="font-size:1.875rem">' + p.emoji + '</div><div style="flex:1;min-width:0"><div style="font-weight:600;font-size:0.875rem">' + esc(p.name) + '</div><div class="text-muted text-xs">' + esc(p.desc) + '</div><div class="text-green font-mono text-xs" style="font-weight:700;margin-top:0.25rem">' + fmtCash(p.price) + (p.spCost ? ' or ' + p.spCost + ' SP' : '') + '</div></div><button type="button" class="game-btn game-btn-green game-btn-sm" data-action="buy-pack" data-pack="' + p.type + '"' + (dis ? ' disabled' : '') + '>OPEN</button></div>', 'buy-pack:' + p.type);
    });
    h += '<div class="neon-card neon-card-green p-4 mb-3"><div class="flex-between mb-3"><div><div class="font-mono text-green" style="font-size:0.55rem;letter-spacing:0.15em">BLITZ WINDOW</div><div style="font-weight:700;font-size:0.875rem">Permanent Upgrades</div></div><div id="blitz-timer" class="font-mono text-green" style="font-size:1.125rem;font-weight:700">' + fmtCd(blitzRem()) + '</div></div>';
    G.blitzUpgrades.forEach(function (u) {
      h += '<div class="flex-between p-3 mb-2" style="background:rgba(0,0,0,0.35);border-radius:0.75rem;border:1px solid ' + (u.purchased ? 'rgba(100,100,100,0.3)' : 'rgba(57,255,20,0.25)') + '"><div style="flex:1;margin-right:0.5rem"><div style="font-size:0.75rem;font-weight:600">' + esc(u.name) + '</div><div class="text-muted" style="font-size:0.55rem">' + esc(u.description) + '</div></div><button type="button" class="game-btn game-btn-sm' + (u.purchased ? '' : ' game-btn-green') + '" data-action="buy-blitz" data-id="' + u.id + '"' + (u.purchased || G.cash < u.price ? ' disabled' : '') + '>' + (u.purchased ? 'PURCHASED' : fmtCash(u.price)) + '</button></div>';
    });
    h += '</div><div class="section-label mb-2">GENERAL STORE</div>';
    G.inventory.forEach(function (it) {
      h += '<div class="neon-card p-3 mb-2"><div class="flex-row"><div style="font-size:1.5rem">' + it.emoji + '</div><div style="flex:1"><div style="font-weight:600;font-size:0.875rem">' + esc(it.name) + '</div><div class="text-muted" style="font-size:0.55rem">' + it.type + ' · Owned: ' + it.owned + '</div></div><button type="button" class="game-btn game-btn-green game-btn-sm" data-action="buy-item" data-id="' + it.id + '"' + (G.cash < it.price ? ' disabled' : '') + '>' + fmtCash(it.price) + '</button></div></div>';
    });
    h += '</div>';
    return h;
  }

  function renderIndex() {
    var list = filteredStrains();
    var h = '<div class="screen-section"><div class="neon-card neon-card-green p-4 text-center mb-2"><div class="font-mono text-green" style="font-size:0.55rem;letter-spacing:0.3em">STRAIN INDEX</div><div class="font-display chromatic-text" style="font-size:1.875rem;font-weight:700">' + G.strains.length + ' <span class="text-muted" style="font-size:1rem">/ ∞</span></div><div class="text-muted text-xs">Scanning the void for new genetics...</div></div>';
    h += '<input type="search" class="input-field mb-2" placeholder="Search strains..." data-action="index-search" value="' + esc(G.indexSearch || '') + '">';
    h += '<select class="input-field mb-3" data-action="index-sort"><option value="recent"' + (G.indexSort === 'recent' ? ' selected' : '') + '>Sort: Recent</option><option value="rarity"' + (G.indexSort === 'rarity' ? ' selected' : '') + '>Sort: Rarity</option><option value="name"' + (G.indexSort === 'name' ? ' selected' : '') + '>Sort: Name</option></select>';
    if (!list.length) {
      h += '<div class="neon-card p-5 text-center">' + budImg({ hue: 120 }, '2rem') + '<div class="text-muted text-sm mt-2">No strains yet.</div></div>';
    } else {
      h += '<div class="binder-grid mb-3">';
      list.forEach(function (s) {
        h += '<div class="liftable-wrap" data-lift="index-' + esc(s.id) + '" data-lift-up="up-strain:' + esc(s.id) + '">' + crCardHtml(s, { selected: G.focusedStrainId === s.id }) + '</div>';
      });
      h += '</div>';
      var foc = G.focusedStrainId ? strainById(G.focusedStrainId) : null;
      if (foc) h += '<div class="neon-card p-4 mt-2" style="max-height:12rem;overflow-y:auto"><div class="font-mono text-green text-xs mb-2">FOCUSED GENETICS</div><div class="flex-row mb-2">' + budImg(foc, '2.5rem') + '<div><div style="font-weight:700">' + esc(foc.name) + '</div><div class="text-xs" style="color:' + rarityColor(foc.rarity) + '">' + esc(rarityName(foc.rarity)) + '</div></div></div>' + abilityListHtml(foc.abilities) + '</div>';
    }
    h += '</div>';
    return h;
  }

  function renderCoop() {
    var h = '<div class="screen-section"><div class="text-center mb-3"><h2 class="font-display chromatic-text" style="font-size:1.125rem;letter-spacing:0.2em">FAMILY CO-OP</h2><p class="text-muted text-xs">Aden · Dad · Jamie sync board</p></div>';
    PLAYERS.forEach(function (pl) {
      var save = readPlayerSave(pl.id) || {};
      var strains = save.strains || [];
      var floors = save.factoryFloors || [];
      var battleNames = (save.equippedBattleIds || []).map(function (id) { var s = strains.find(function (x) { return x.id === id; }); return s ? s.name : null; }).filter(Boolean);
      var portalNames2 = floors.map(function (f) { if (!f.equippedStrainId) return null; var s = strains.find(function (x) { return x.id === f.equippedStrainId; }); return s ? s.name : null; }).filter(Boolean);
      h += '<div class="coop-card neon-card p-4 mb-3' + (pl.id === activePlayerId ? ' neon-card-green' : '') + '"><div class="flex-between mb-2"><div style="font-weight:700">' + esc(save.name || pl.label) + '</div><div class="font-mono text-xs text-muted">Boss R' + (save.bossRound || 1) + '</div></div>';
      h += '<div class="font-mono text-xs text-muted mb-1">Floors: ' + floors.length + ' · Strains: ' + strains.length + '</div>';
      h += '<div class="text-xs mb-1"><span class="text-green">Battle:</span> ' + (battleNames.length ? esc(battleNames.join(', ')) : '—') + '</div>';
      h += '<div class="text-xs"><span class="text-cyan">Portal:</span> ' + (portalNames2.length ? esc(portalNames2.join(', ')) : '—') + '</div></div>';
    });
    var offers = getSharedOffers();
    h += '<div class="section-label mb-2 mt-3">SHARE BOARD LISTINGS</div>';
    if (!offers.length) h += '<div class="neon-card p-4 text-center text-muted text-sm">No listings yet.</div>';
    offers.forEach(function (o) {
      h += '<div class="neon-card p-3 mb-2"><div class="font-mono text-xs text-muted">' + esc(o.sellerName) + '</div><div style="font-weight:600;font-size:0.875rem">' + esc(o.strainName) + '</div><div class="text-green text-xs">' + fmtCash(o.offerPrice) + '</div></div>';
    });
    h += '</div>';
    return h;
  }

  function renderCasino() {
    var room = getPokerRoom();
    var readyCount = pokerReadyCount(room);
    var isReady = !!(room.ready && room.ready[activePlayerId]);
    var h = '<div class="screen-section"><div class="text-center mb-3"><h2 class="font-display chromatic-text" style="font-size:1.125rem;letter-spacing:0.2em">VOID CASINO</h2>';
    if (UI.casinoToast) h += '<div class="neon-card p-2 mb-2 text-center text-xs" style="border-color:#F87171;color:#F87171">' + esc(UI.casinoToast) + '</div>';
    if (UI.casinoGame === 'menu') {
      h += '<div class="grid-3 gap-2 mb-3"><button type="button" class="game-btn game-btn-green" data-action="casino-select" data-id="poker">♠ POKER</button><button type="button" class="game-btn" data-action="casino-select" data-id="blackjack">🃏 BLACKJACK 21</button><button type="button" class="game-btn" data-action="casino-select" data-id="slots-info">🎰 SLOTS</button></div>';
      h += '<div class="neon-card p-4 text-center text-muted text-xs">Poker: family ready room · Blackjack: hit/stand · Slots unlock during active poker</div></div>';
      return h;
    }
    if (UI.casinoGame === 'poker' || (room.active && UI.casinoGame !== 'blackjack')) {
      h += '<div class="neon-card p-4 mb-3"><div class="font-mono text-green text-xs mb-2">POKER ROOM · ' + readyCount + '/3 ready</div>';
      PLAYERS.forEach(function (pl) {
        var r = room.ready && room.ready[pl.id];
        h += '<div class="flex-between mb-2 text-sm"><span>' + esc(pl.label) + (pl.id === activePlayerId ? ' (you)' : '') + '</span><span class="' + (r ? 'text-green' : 'text-muted') + '">' + (r ? 'READY' : '—') + '</span></div>';
      });
      h += '<div class="flex-row gap-2 mt-3"><button type="button" class="game-btn game-btn-sm" style="flex:1" data-action="poker-ready">' + (isReady ? 'UNREADY' : 'READY UP') + '</button><button type="button" class="game-btn game-btn-green game-btn-sm" style="flex:1" data-action="poker-start">START</button></div>';
      if (room.active) h += '<button type="button" class="game-btn w-full mt-2" data-action="open-slots">🎰 OPEN SLOT MACHINE</button>';
      h += '<button type="button" class="game-btn w-full mt-2" data-action="casino-select" data-id="menu">← BACK</button></div></div>';
      return h;
    }
    if (UI.casinoGame === 'blackjack') {
      var bj = UI.blackjack;
      h += '<div class="casino-table neon-card p-4 mb-3">';
      if (!bj) {
        h += '<p class="text-muted text-xs text-center mb-3">Bet $1,000 — beat the dealer to 21.</p><button type="button" class="game-btn game-btn-green w-full" data-action="blackjack-deal"' + (G.cash < 1000 ? ' disabled' : '') + '>DEAL</button>';
      } else {
        h += '<div class="mb-3"><div class="text-xs text-muted mb-1">DEALER (' + handVal(bj.dealer) + ')</div><div>' + bj.dealer.map(function (c) { return c.label; }).join(' ') + '</div></div>';
        h += '<div class="mb-3"><div class="text-xs text-green mb-1">YOU (' + handVal(bj.player) + ')</div><div>' + bj.player.map(function (c) { return c.label; }).join(' ') + '</div></div>';
        if (bj.done) h += '<div class="text-center mb-2 ' + (bj.win === true ? 'text-green' : bj.win === false ? 'text-muted' : 'text-cyan') + '">' + (bj.win === true ? 'YOU WIN!' : bj.win === false ? 'BUST / LOSE' : 'PUSH') + '</div>';
        else h += '<div class="flex-row gap-2"><button type="button" class="game-btn game-btn-green" style="flex:1" data-action="blackjack-hit">HIT</button><button type="button" class="game-btn" style="flex:1" data-action="blackjack-stand">STAND</button></div>';
        if (bj.done) h += '<button type="button" class="game-btn w-full mt-2" data-action="blackjack-deal"' + (G.cash < 1000 ? ' disabled' : '') + '>DEAL AGAIN</button>';
      }
      h += '<button type="button" class="game-btn w-full mt-2" data-action="casino-select" data-id="menu">← BACK</button></div></div>';
      return h;
    }
    if (UI.casinoGame === 'slots-info') {
      h += '<div class="neon-card p-4 text-center text-sm text-muted mb-3">Slot machine opens during an active poker session. Spin costs ' + fmtCash(SLOT_COST) + '.</div><button type="button" class="game-btn w-full" data-action="casino-select" data-id="menu">← BACK</button></div>';
      return h;
    }
    h += '</div>';
    return h;
  }

  function renderSlotOverlay() {
    var el = document.getElementById('overlay-slot-machine');
    if (!el) {
      el = document.createElement('div');
      el.id = 'overlay-slot-machine';
      el.className = 'overlay';
      document.getElementById('voidline-app').appendChild(el);
    }
    if (!UI.slotOverlay) { el.classList.remove('open'); el.innerHTML = ''; return; }
    var r = UI.slotResult || { reels: ['?', '?', '?'], win: 0 };
    el.classList.add('open');
    el.innerHTML = '<button type="button" class="overlay-backdrop" data-action="close-slots"></button><div class="overlay-panel slot-machine p-5 text-center"><h3 class="font-display mb-3">VOID SLOTS</h3><div class="font-mono" style="font-size:2rem;letter-spacing:0.5em;margin:1rem 0">' + r.reels.join(' ') + '</div><div class="text-muted text-xs mb-3">Cost ' + fmtCash(SLOT_COST) + ' per spin</div>' + (r.win > 0 ? '<div class="text-green mb-2">Won ' + fmtCash(r.win) + '!</div>' : '') + '<button type="button" class="game-btn game-btn-green w-full mb-2" data-action="slot-spin"' + (G.cash < SLOT_COST ? ' disabled' : '') + '>SPIN</button><button type="button" class="game-btn w-full" data-action="close-slots">CLOSE</button></div>';
  }

  function renderProfile() {
    var pl = playerDef(activePlayerId);
    var h = '<div class="profile-banner"><button type="button" class="profile-close" data-close="profile">✕</button><div class="profile-avatar-lg"><div class="avatar-ring"></div><div class="avatar-inner" style="inset:4px;font-size:1.5rem;border-width:3px">' + G.avatar + '</div></div></div><div class="profile-body"><div class="font-mono text-green text-center mb-2" style="font-size:0.6rem;letter-spacing:0.2em">' + esc(pl.label.toUpperCase()) + '</div><input type="text" class="input-field text-center font-display chromatic-text mb-3" id="edit-name" value="' + esc(G.name) + '" maxlength="24"><div class="stat-grid"><div class="neon-card stat-box"><div class="stat-label">CASH</div><div class="stat-value">' + fmtCash(G.cash) + '</div></div><div class="neon-card stat-box"><div class="stat-label">SP</div><div class="stat-value">' + fmtSp(G.sp) + '</div></div><div class="neon-card stat-box"><div class="stat-label">REV/SEC</div><div class="stat-value">' + fmtRev(revSecTotal()) + '</div></div></div><div class="font-mono text-muted text-center mb-3" style="font-size:0.55rem">LV.' + G.empireLevel + ' EMPIRE · BOSS R' + G.bossRound + '</div><div class="font-mono text-muted mb-2" style="font-size:0.5rem">AVATAR</div><div class="avatar-picker">';
    AVATARS.forEach(function (a) { h += '<button type="button" class="avatar-opt' + (G.avatar === a ? ' selected' : '') + '" data-action="set-avatar" data-av="' + a + '">' + a + '</button>'; });
    h += '</div><div class="font-mono text-muted mb-2" style="font-size:0.5rem">BADGES</div><div class="grid-3 mb-3">';
    [0, 1, 2].forEach(function (slot) {
      h += '<select class="input-field" data-action="set-badge" data-slot="' + slot + '"><option value="">—</option>';
      BADGES.forEach(function (b) { h += '<option value="' + b.id + '"' + (G.badgeIds[slot] === b.id ? ' selected' : '') + '>' + b.emoji + ' ' + b.label + '</option>'; });
      h += '</select>';
    });
    h += '</div><div class="font-mono text-muted mb-2" style="font-size:0.5rem">STOREFRONT (3 SLOTS) — SHARE BOARD</div>';
    [0, 1, 2].forEach(function (slot) {
      var sf = G.storefrontSlots[slot];
      h += '<div class="flex-row mb-2"><select class="input-field" style="flex:1" data-action="sf-strain" data-slot="' + slot + '"><option value="">Empty</option>';
      G.strains.forEach(function (s) { h += '<option value="' + esc(s.id) + '"' + (sf.strainId === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; });
      h += '</select><input type="number" class="input-field" style="width:5rem" placeholder="Price" data-action="sf-price" data-slot="' + slot + '" value="' + (sf.price || '') + '"></div>';
    });
    h += '<div class="flex-row gap-2 mb-3"><button type="button" class="game-btn" style="flex:1" data-action="switch-player">⇄ SWITCH PLAYER</button><button type="button" class="game-btn" style="flex:1" data-action="open-settings">⚙ SETTINGS</button></div><button type="button" class="game-btn game-btn-green w-full" data-close="profile">RESUME</button></div>';
    document.getElementById('profile-panel').innerHTML = h;
  }

  function renderSettings() {
    document.getElementById('settings-panel').innerHTML = '<div class="flex-between mb-3"><h3 class="font-display" style="font-size:0.875rem;letter-spacing:0.2em">SYSTEM CONFIG</h3><button type="button" data-close="settings" style="background:none;border:none;color:var(--muted);font-size:1.125rem;cursor:pointer">✕</button></div><div class="flex-between p-4 mb-3" style="border-radius:0.75rem;background:' + (UI.realityWarp ? 'rgba(57,255,20,0.08)' : 'rgba(31,0,51,0.5)') + ';border:1px solid ' + (UI.realityWarp ? 'rgba(57,255,20,0.4)' : 'rgba(61,0,102,0.6)') + '"><div><div class="chromatic-text" style="font-weight:600;font-size:0.875rem">Reality Warp Mode</div><div class="text-muted" style="font-size:0.65rem">Hyper-focus shader overlay</div></div><button type="button" class="toggle-switch" data-action="toggle-warp" style="background:' + (UI.realityWarp ? 'linear-gradient(90deg,#39FF14,#A855F7)' : 'rgba(61,0,102,0.8)') + '"><span class="toggle-knob" style="left:' + (UI.realityWarp ? 'calc(100% - 1.625rem)' : '0.125rem') + '"></span></button></div><button type="button" class="game-btn w-full mb-2" data-action="switch-player">⇄ SWITCH PLAYER</button><p class="font-mono text-muted" style="font-size:0.6rem;line-height:1.5">Applies vignette, chromatic aberration, and rhythmic contrast breathing.</p>';
  }

  function renderPack() {
    var pr = G.packReveal;
    if (!pr.open || !pr.strain) { document.getElementById('overlay-pack-reveal').classList.remove('open'); return; }
    var s = pr.strain, c = rarityColor(s.rarity);
    document.getElementById('pack-panel').innerHTML = '<div class="overlay-panel pack-reveal-card" style="background:linear-gradient(160deg,hsl(' + s.hue + ',60%,15%),#0C011A 50%,#1a0040);border:2px solid ' + c + ';box-shadow:0 0 60px ' + c + '66"><div class="pack-shimmer"></div><div class="p-5 text-center" style="position:relative"><div class="font-mono text-muted mb-2" style="font-size:0.6rem;letter-spacing:0.4em">' + (pr.packType || '').toUpperCase() + ' PACK OPENED</div><div style="margin-bottom:1rem">' + budImg(s, '3.75rem') + '</div><h2 class="font-display chromatic-text mb-1">' + esc(s.name) + '</h2><div class="font-mono mb-2" style="color:' + c + ';font-size:0.65rem;font-weight:700">' + esc(rarityName(s.rarity).toUpperCase()) + '</div>' + abilityListHtml(s.abilities) + '<div class="grid-3 mb-4 mt-3"><div class="neon-card stat-box"><div class="stat-label">THC</div><div class="stat-value">' + s.thcPercent + '%</div></div><div class="neon-card stat-box"><div class="stat-label">YIELD</div><div class="stat-value">' + s.yield + '</div></div><div class="neon-card stat-box"><div class="stat-label">POTENCY</div><div class="stat-value">' + s.potency + '</div></div></div><button type="button" class="game-btn game-btn-green w-full" data-close="pack">ADD TO INDEX</button></div></div>';
    document.getElementById('overlay-pack-reveal').classList.add('open');
  }

  function renderLiftBody() {
    var id = UI.liftedCardId;
    if (!id) return '';
    if (id.indexOf('index-') === 0) {
      var s = strainById(id.slice(6));
      if (!s) return '';
      return crCardHtml(s, { selected: G.focusedStrainId === s.id }) + '<div class="mt-3">' + abilityListHtml(s.abilities) + '<button type="button" class="game-btn game-btn-green game-btn-sm w-full mt-2" data-action="up-strain" data-id="' + esc(s.id) + '">UPGRADE · ' + fmtCash(upCost(s)) + '</button></div>';
    }
    if (id.indexOf('pack-') === 0) {
      var pt = id.slice(5);
      var p = PACKS.find(function (x) { return x.type === pt; });
      if (!p) return '';
      var dis = G.cash < p.price && !(p.type === 'omega' && p.spCost && G.sp >= p.spCost);
      return '<div class="flex-row"><div style="font-size:1.875rem">' + p.emoji + '</div><div style="flex:1;min-width:0"><div style="font-weight:600;font-size:0.875rem">' + esc(p.name) + '</div><div class="text-muted text-xs">' + esc(p.desc) + '</div><div class="text-green font-mono text-xs" style="font-weight:700;margin-top:0.25rem">' + fmtCash(p.price) + (p.spCost ? ' or ' + p.spCost + ' SP' : '') + '</div></div><button type="button" class="game-btn game-btn-green game-btn-sm" data-action="buy-pack" data-pack="' + p.type + '"' + (dis ? ' disabled' : '') + '>OPEN</button></div>';
    }
    var wrap = document.querySelector('[data-lift="' + id + '"]');
    return wrap ? wrap.innerHTML : '';
  }

  function renderLift() {
    var el = document.getElementById('overlay-card-lift');
    if (!UI.liftedCardId) { el.innerHTML = ''; return; }
    var body = renderLiftBody();
    if (!body) { el.innerHTML = ''; UI.liftedCardId = null; UI.liftOnUpgrade = null; return; }
    el.innerHTML = '<button type="button" class="card-lift-backdrop" data-action="dismiss-lift"></button><div class="lifted-card"><div class="neon-card" style="max-height:80vh;overflow-y:auto">' + body + (UI.liftOnUpgrade ? '<div class="lift-actions"><button type="button" class="game-btn game-btn-green" data-action="lift-upgrade">🔋 UPGRADE CARD</button></div>' : '') + '</div></div>';
  }

  function renderBeam() {
    var b = document.getElementById('overlay-transaction-beam');
    if (G.transactionBeam && G.transactionBeam.active) { b.classList.add('active'); document.getElementById('beam-label').textContent = G.transactionBeam.from + ' → ' + G.transactionBeam.to; }
    else b.classList.remove('active');
  }

  function activeScreen() {
    if (UI.farmOpen && UI.activeTab === 'battle') return renderFarm;
    var screens = { battle: renderBattle, shop: renderShop, index: renderIndex, coop: renderCoop, casino: renderCasino };
    return screens[UI.activeTab] || renderBattle;
  }

  function render() {
    if (!G) return;
    var root = document.getElementById('screen-root');
    var scrollTop = root ? root.scrollTop : 0;
    renderHUD();
    renderPlayerSelect();
    if (!UI.playerSelectOpen && root) {
      root.innerHTML = activeScreen()();
      root.scrollTop = scrollTop;
    }
    document.getElementById('overlay-profile').classList.toggle('open', UI.profileOpen);
    document.getElementById('overlay-settings').classList.toggle('open', UI.settingsOpen);
    if (UI.profileOpen) renderProfile();
    if (UI.settingsOpen) renderSettings();
    renderPack();
    renderLift();
    renderBeam();
    renderSlotOverlay();
  }

  var saveTimer = null;
  function scheduleSave() { if (saveTimer) clearTimeout(saveTimer); saveTimer = setTimeout(saveGame, 800); }

  function runAction(act, val) {
    if (act==='pick-player') { selectPlayer(val); return; }
    if (act==='switch-player') { switchPlayerPrompt(); scheduleSave(); render(); return; }
    if (act==='toggle-farm') {
      if (UI.activeTab !== 'battle') UI.activeTab = 'battle';
      UI.farmOpen = !UI.farmOpen;
      if (UI.farmOpen) plantSay('tab_farm', true);
      else plantSay('tab_battle', true);
      scheduleSave(); render(); return;
    }
    if (act==='buy-pack') buyPack(val);
    else if (act==='buy-blitz') buyBlitz(val);
    else if (act==='buy-item') buyItem(val);
    else if (act==='buy-portal') buyPortal();
    else if (act==='farm-tab') { G.farmSubTab = val; plantSay('tab_farm'); }
    else if (act==='open-profile') { UI.profileOpen = true; UI.settingsOpen = false; }
    else if (act==='up-sector') upSector(val);
    else if (act==='accept-offer') acceptOffer(val);
    else if (act==='counter-offer') counterOffer(val);
    else if (act==='equip-floor') equipFloor(val.split(':')[0], val.split(':')[1] || null);
    else if (act==='up-floor') upFloor(val);
    else if (act==='equip-battle') equipBattle(val);
    else if (act==='start-clone') { var sel = document.getElementById('clone-select'); if (sel && sel.value) startClone(sel.value); }
    else if (act==='up-strain') upStrain(val);
    else if (act==='set-avatar') G.avatar = val;
    else if (act==='set-badge') { var p = val.split(':'); G.badgeIds = G.badgeIds.slice(); G.badgeIds[parseInt(p[0], 10)] = p[1] || null; }
    else if (act==='sf-strain') { var p2 = val.split(':'); var slot = parseInt(p2[0], 10); G.storefrontSlots = G.storefrontSlots.slice(); G.storefrontSlots[slot] = Object.assign({}, G.storefrontSlots[slot], { strainId: p2[1] || null }); }
    else if (act==='sf-price') { var p3 = val.split(':'); var slot2 = parseInt(p3[0], 10); G.storefrontSlots = G.storefrontSlots.slice(); G.storefrontSlots[slot2] = Object.assign({}, G.storefrontSlots[slot2], { price: parseFloat(p3[1]) || 0 }); }
    else if (act==='toggle-warp') UI.realityWarp = !UI.realityWarp;
    else if (act==='open-settings') { UI.settingsOpen = true; UI.profileOpen = false; }
    else if (act==='dismiss-lift') { UI.liftedCardId = null; UI.liftOnUpgrade = null; }
    else if (act==='lift-upgrade' && UI.liftOnUpgrade) { runAction(UI.liftOnUpgrade.split(':')[0], UI.liftOnUpgrade.split(':').slice(1).join(':')); UI.liftedCardId = null; UI.liftOnUpgrade = null; }
    else if (act==='index-search') G.indexSearch = val;
    else if (act==='index-sort') G.indexSort = val;
    else if (act==='casino-select') { UI.casinoGame = val; UI.blackjack = null; }
    else if (act==='poker-ready') togglePokerReady();
    else if (act==='poker-start') startPoker();
    else if (act==='blackjack-deal') { if (G.cash >= 1000) startBlackjack(); }
    else if (act==='blackjack-hit') blackjackHit();
    else if (act==='blackjack-stand') blackjackStand();
    else if (act==='open-slots') { var rm = getPokerRoom(); if (rm.active) UI.slotOverlay = true; }
    else if (act==='close-slots') UI.slotOverlay = false;
    else if (act==='slot-spin') spinSlots();
    void ACTION_TOGGLE_FARM;
    scheduleSave();
    render();
  }

  document.getElementById('voidline-app').addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab],[data-action],[data-close],[data-lift],[data-strain-focus]');
    if (!t) return;
    if (t.dataset.action === 'pick-player') { runAction('pick-player', t.dataset.pid); return; }
    if (t.dataset.tab) {
      var tab = t.dataset.tab;
      UI.farmOpen = false;
      if (tab !== UI.activeTab) plantSay('tab_' + tab);
      UI.activeTab = tab;
      render();
      return;
    }
    if (t.dataset.close === 'profile') { UI.profileOpen = false; render(); return; }
    if (t.dataset.close === 'settings') { UI.settingsOpen = false; render(); return; }
    if (t.dataset.close === 'pack') { closePack(); render(); return; }
    if (t.dataset.action) {
      e.stopPropagation();
      var a = t.dataset.action, v = t.dataset.id || t.dataset.pack || t.dataset.pid || t.dataset.av;
      if (a === 'equip-floor') runAction(a, t.dataset.id + ':' + (t.value !== undefined ? t.value : ''));
      else if (a === 'set-badge') runAction(a, t.dataset.slot + ':' + t.value);
      else if (a === 'sf-strain') runAction(a, t.dataset.slot + ':' + t.value);
      else if (a === 'sf-price') runAction(a, t.dataset.slot + ':' + t.value);
      else if (a === 'set-avatar') runAction(a, t.dataset.av);
      else if (a === 'pick-player') runAction(a, t.dataset.pid);
      else runAction(a, v);
      return;
    }
    var liftEl = e.target.closest('[data-lift]');
    if (liftEl && !UI.liftedCardId) { UI.liftedCardId = liftEl.dataset.lift; UI.liftOnUpgrade = liftEl.dataset.liftUp || null; render(); return; }
    if (t.dataset.strainFocus) { G.focusedStrainId = G.focusedStrainId === t.dataset.strainFocus ? null : t.dataset.strainFocus; plantSay('tab_index'); scheduleSave(); render(); return; }
  });

  document.getElementById('voidline-app').addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset.action === 'equip-floor') runAction('equip-floor', t.dataset.id + ':' + t.value);
    if (t.dataset.action === 'counter-input') { G.counterPrices = Object.assign({}, G.counterPrices, { [t.dataset.id]: Number(t.value) }); scheduleSave(); render(); }
    if (t.dataset.action === 'index-search') runAction('index-search', t.value);
    if (t.dataset.action === 'index-sort') runAction('index-sort', t.value);
    if (t.id === 'edit-name') { G.name = t.value.trim() || playerDef(activePlayerId).defaultName; scheduleSave(); }
    if (t.dataset.action === 'set-badge') runAction('set-badge', t.dataset.slot + ':' + t.value);
    if (t.dataset.action === 'sf-strain') runAction('sf-strain', t.dataset.slot + ':' + t.value);
    if (t.dataset.action === 'sf-price') runAction('sf-price', t.dataset.slot + ':' + t.value);
  });

  document.getElementById('voidline-app').addEventListener('input', function (e) {
    if (e.target.id === 'edit-name') G.name = e.target.value.trim() || playerDef(activePlayerId).defaultName;
    if (e.target.dataset.action === 'counter-input') { G.counterPrices = Object.assign({}, G.counterPrices, { [e.target.dataset.id]: Number(e.target.value) }); render(); }
    if (e.target.dataset.action === 'index-search') { G.indexSearch = e.target.value; render(); }
  });

  try {
    var storedVer = localStorage.getItem(VERSION_KEY);
    if (storedVer !== APP_VERSION) {
      localStorage.setItem(VERSION_KEY, APP_VERSION);
      try { sessionStorage.removeItem(SESSION_KEY); } catch (e2) { }
      UI.playerSelectOpen = true;
      G = freshState('aden');
      render();
    } else {
      var sess = sessionStorage.getItem(SESSION_KEY);
      if (sess && PLAYERS.some(function (p) { return p.id === sess; })) selectPlayer(sess);
      else { UI.playerSelectOpen = true; G = freshState('aden'); render(); }
    }
  } catch (e) { UI.playerSelectOpen = true; G = freshState('aden'); render(); }

  setInterval(function () {
    if (!G || UI.playerSelectOpen) return;
    tick(Date.now());
    renderHUD();
    if (UI.activeTab === 'battle' && !UI.farmOpen) {
      var hp = document.querySelector('.boss-arena .progress-fill');
      if (hp && G.bossMaxHp) hp.style.width = Math.max(0, G.bossHp / G.bossMaxHp * 100) + '%';
      var dpsEl = document.querySelector('.boss-arena .font-mono.text-green.text-xs.mt-2');
      if (dpsEl) dpsEl.textContent = 'DPS ' + totalBattleDps().toFixed(1) + '/sec';
    }
    if (UI.activeTab === 'shop') { var cd = document.getElementById('blitz-timer'); if (cd) cd.textContent = fmtCd(blitzRem()); }
    if (UI.farmOpen && G.farmSubTab === 'portal' && G.cloneJob) { var cr = document.querySelector('.clone-active .font-mono.text-green'); if (cr) cr.textContent = fmtCd(cloneRem()); }
    document.getElementById('hud-cash').textContent = fmtCash(G.cash);
    if (G.cash < 10000 && Date.now() - dialogueState.lastAt > 60000) plantSay('lowcash');
    scheduleSave();
  }, 50);
})();
