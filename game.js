/* Voidline Galaxy Farm — monolith engine v5 */
(function () {
  'use strict';
  var BLITZ_MS = 1800000, CLONE_MS = 60000, XP_LVL = 500;
  var SAVE_PREFIX = 'voidline_galaxy_farm_v2_';
  var LEGACY_SAVE = 'voidline_galaxy_farm_v1';
  var SESSION_KEY = 'voidline_active_player';
  var LAST_PLAYER_KEY = 'voidline_last_player';
  var POKER_KEY = 'voidline_poker_room';
  var APP_VERSION = '6';
  var VERSION_KEY = 'voidline_app_version';
  var SAVE_VERSION = 6;
  var PLANET_REGISTRY_KEY = 'voidline_planet_registry';
  var PLANET_PREFIX = ['Kepler', 'Nova', 'Rift', 'Obsidian', 'Crimson', 'Azure', 'Phantom', 'Eclipse', 'Stellar', 'Void'];
  var PLANET_SUFFIX = ['IV', 'VII', 'IX', 'Prime', 'Reach', 'Haven', 'Crown', 'Shard', 'Belt', 'Gate'];
  var PORTAL_BASE_COST = 25000;
  var SLOT_COST = 500;
  var BET_CHIPS = [500, 1000, 2500, 5000, 10000, 25000];
  var BUD_ART = '/public/art/strain-bud.svg';
  var BOSS_ART = '/public/art/boss.svg';
  var ACTION_TOGGLE_FARM = 'data-action="toggle-farm"';
  var BATTLE_EQUIP_MAX = 8;
  var MERGE_SP_COST = 15;

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
    { id: 'nutrient-a', name: 'Nebula Nutrients', type: 'nutrient', price: 1200, emoji: '🧪', desc: 'Boosts passive revenue +0.5/sec each.', revPerSec: 0.5 },
    { id: 'nutrient-b', name: 'Void Bloom Mix', type: 'nutrient', price: 3500, emoji: '💧', desc: 'Premium nutrients — +0.5/sec passive each.', revPerSec: 0.5 },
    { id: 'pipe-a', name: 'Quantum Pipe Mk.I', type: 'pipe', price: 8000, emoji: '🔧', desc: 'Smooths portal flow — +1.2/sec passive each.', revPerSec: 1.2 },
    { id: 'pipe-b', name: 'Hyperflow Conduit', type: 'pipe', price: 18000, emoji: '⚙️', desc: 'Hypercharged conduit — +2.5/sec passive each.', revPerSec: 2.5 },
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
  var MINION_NAMES = ['Void Scout', 'Rift Raider', 'Nebula Enforcer', 'Cosmic Champion'];
  var BOSS_PREFIX = ['Void', 'Nebula', 'Rift', 'Cosmic', 'Dark', 'Quantum', 'Stellar', 'Null'];
  var BOSS_SUFFIX = ['Behemoth', 'Leviathan', 'Titan', 'Warden', 'Harbinger', 'Colossus', 'Reaper', 'Overlord'];
  var SLOT_SYMBOLS = ['🍒', '💎', '7️⃣', '🌌', '⭐'];

  var PERSIST = [
    'saveVersion', 'cash', 'sp', 'empireLevel', 'empireXp', 'name', 'avatar', 'badgeIds', 'storefrontSlots',
    'strains', 'inventory', 'factoryFloors', 'sectorUpgrades', 'blitzUpgrades', 'blitzEndsAt', 'purchasedBlitzIds',
    'counterPrices', 'cloneJob', 'focusedStrainId', 'farmSubTab', 'nextPortalNum', 'lastTickAt',
    'bossRound', 'bossHp', 'bossMaxHp', 'bossName', 'bossSeed', 'bossRarity', 'equippedBattleIds',
    'indexSearch', 'indexSort', 'casinoBets', 'ownedPlanets', 'scanPending', 'breedSlotA', 'breedSlotB', 'pendingRewards',
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
    var min = 1 + Math.floor(tierIdx / 6);
    var max = Math.min(ABILITIES.length, min + 2 + Math.floor(tierIdx / 4));
    var count = min + Math.floor(rng() * (max - min + 1));
    var pool = ABILITIES.slice();
    var out = [];
    for (var i = 0; i < count && pool.length; i++) {
      var idx = Math.floor(rng() * pool.length);
      out.push(pool[idx].id);
      pool.splice(idx, 1);
    }
    return out;
  }

  function abilityBoostLvl(s, aid) { return (s.abilityBoosts && s.abilityBoosts[aid]) || 0; }
  function abilityBoostMult(s, aid) { return 1 + abilityBoostLvl(s, aid) * 0.08; }

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
    if (!s.abilityBoosts) s.abilityBoosts = {};
    if (s.planetExclusive === undefined) s.planetExclusive = !!s.planetId;
    return s;
  }

  function getPlanetRegistry() {
    try { return JSON.parse(localStorage.getItem(PLANET_REGISTRY_KEY)) || {}; } catch (e) { return {}; }
  }
  function savePlanetRegistry(reg) { try { localStorage.setItem(PLANET_REGISTRY_KEY, JSON.stringify(reg)); } catch (e) { } }
  function isPlanetGenomeClaimed(genomeId) { return !!getPlanetRegistry()[genomeId]; }
  function claimPlanetGenome(genomeId, playerId) {
    var reg = getPlanetRegistry();
    reg[genomeId] = playerId;
    savePlanetRegistry(reg);
  }

  function genPlanetName(rng) {
    return PLANET_PREFIX[Math.floor(rng() * PLANET_PREFIX.length)] + '-' + PLANET_SUFFIX[Math.floor(rng() * PLANET_SUFFIX.length)];
  }

  function genPlanet(seed) {
    var rng = rngSeed(seed);
    var rar = pickRarity(rng, undefined, scanMult() * 0.02 + blitzMod('scan') * 0.1);
    var genomeId = 'pg_' + seed + '_' + Math.floor(rng() * 0xffffff).toString(16);
    return {
      id: 'planet_' + genomeId,
      genomeId: genomeId,
      proceduralName: genPlanetName(rng),
      customName: null,
      rarity: rar,
      hue: Math.floor(rng() * 360),
      seed: seed,
      harvesterLv: 0,
      conveyorLv: 0,
      upgraderMult: 1,
      exclusiveStrainId: null,
      storedYield: 0,
      discoveredAt: Date.now(),
    };
  }

  function rollScanPlanet() {
    var tries = 0;
    while (tries < 40) {
      var seed = Date.now() + Math.floor(Math.random() * 1e9) + tries * 7919;
      var p = genPlanet(seed);
      if (!isPlanetGenomeClaimed(p.genomeId)) return p;
      tries++;
    }
    return genPlanet(Date.now() + tries);
  }

  function planetDisplayName(p) { return p.customName || p.proceduralName; }

  function genExclusivePlanetStrain(planet) {
    var s = genStrain(planet.seed + 42, planet.rarity, 0.05);
    s.name = planetDisplayName(planet) + ' Prime';
    s.planetId = planet.id;
    s.planetExclusive = true;
    s.genomeId = 'pex_' + planet.genomeId;
    s.id = 'strain_' + s.genomeId;
    return s;
  }

  function planetOutputPerSec(planet) {
    var base = 3 * rMult(planet.rarity);
    var harv = 1 + planet.harvesterLv * 0.3;
    var conv = 1 + planet.conveyorLv * 0.2;
    return base * harv * conv * (planet.upgraderMult || 1);
  }

  function planetById(id) { return (G.ownedPlanets || []).find(function (p) { return p.id === id; }); }

  function startMapScan() {
    if (UI.scanAnimating) return;
    UI.scanAnimating = true;
    G.scanPending = null;
    render();
    setTimeout(function () {
      G.scanPending = rollScanPlanet();
      UI.scanAnimating = false;
      shakeScreen();
      popArcade('label', 0, { label: 'SIGNAL FOUND!', mega: true });
      popArcade('label', 0, { label: 'NEW WORLD', jackpot: true, delay: 150 });
      plantSay('tab_map', true);
      scheduleSave();
      render();
    }, 1400);
  }

  function keepScannedPlanet() {
    var p = G.scanPending;
    if (!p) return;
    if (p.customName) p = Object.assign({}, p, { customName: p.customName.trim() || null });
    claimPlanetGenome(p.genomeId, activePlayerId);
    var strain = genExclusivePlanetStrain(p);
    G.strains = mergeStrains(G.strains, strain);
    p.exclusiveStrainId = strain.id;
    p.harvesterLv = 1;
    p.conveyorLv = 1;
    G.ownedPlanets = (G.ownedPlanets || []).concat([p]);
    G.scanPending = null;
    addXp(30, true);
    popArcadeBurst([
      { type: 'label', label: 'PLANET CLAIMED!', jackpot: true },
      { type: 'strain', strain: strain, mega: true, delay: 90 },
      { type: 'xp', amount: 30, big: true, delay: 180 },
    ]);
    showBattleToast('PLANET CLAIMED: ' + planetDisplayName(p), true);
    plantSay('planet_keep', true);
    scheduleSave();
  }

  function discardScannedPlanet() {
    G.scanPending = null;
    plantSay('tab_map');
    scheduleSave();
  }

  function renamePlanet(pid, name) {
    var updated = null;
    G.ownedPlanets = G.ownedPlanets.map(function (p) {
      if (p.id !== pid) return p;
      updated = Object.assign({}, p, { customName: (name || '').trim() || p.proceduralName });
      return updated;
    });
    if (updated && updated.exclusiveStrainId) {
      var newName = planetDisplayName(updated) + ' Prime';
      G.strains = G.strains.map(function (s) {
        return s.id === updated.exclusiveStrainId ? Object.assign({}, s, { name: newName }) : s;
      });
    }
    scheduleSave();
  }

  function upPlanetUpgrade(pid, kind) {
    var planet = planetById(pid);
    if (!planet) return false;
    var costs = { harvester: 5000 * (planet.harvesterLv + 1), conveyor: 4000 * (planet.conveyorLv + 1), upgrader: 25 * (planet.upgraderMult) };
    if (kind === 'harvester') {
      if (G.cash < costs.harvester || planet.harvesterLv >= 20) return false;
      G.cash -= costs.harvester;
      planet.harvesterLv++;
    } else if (kind === 'conveyor') {
      if (G.cash < costs.conveyor || planet.conveyorLv >= 20) return false;
      G.cash -= costs.conveyor;
      planet.conveyorLv++;
    } else if (kind === 'upgrader') {
      if (G.sp < costs.upgrader || planet.upgraderMult >= 8) return false;
      G.sp -= costs.upgrader;
      planet.upgraderMult++;
    } else return false;
    G.ownedPlanets = G.ownedPlanets.map(function (p) { return p.id === pid ? planet : p; });
    return true;
  }

  function harvestPlanet(pid) {
    var planet = planetById(pid);
    if (!planet || planet.storedYield < 1) return false;
    var strain = strainById(planet.exclusiveStrainId);
    if (!strain) return false;
    var qty = Math.floor(planet.storedYield);
    planet.storedYield -= qty;
    var i = G.strains.findIndex(function (s) { return s.id === strain.id; });
    if (i >= 0) {
      G.strains = G.strains.slice();
      G.strains[i] = Object.assign({}, G.strains[i], { quantity: G.strains[i].quantity + qty });
    }
    G.ownedPlanets = G.ownedPlanets.map(function (p) { return p.id === pid ? planet : p; });
    addXp(qty * 4, true);
    popArcadeBurst([
      { type: 'label', label: 'HARVEST!', mega: true },
      { type: 'strain', strain: strain, qty: qty, big: true, delay: 80 },
      { type: 'xp', amount: qty * 4, big: true, delay: 160 },
    ]);
    showBattleToast('Harvested x' + qty + ' ' + strain.name, false);
    return true;
  }

  function tickPlanets(dt) {
    if (!G.ownedPlanets || !G.ownedPlanets.length) return;
    var ms = dt / 1000;
    var cashAcc = 0, spAcc = 0;
    G.ownedPlanets = G.ownedPlanets.map(function (p) {
      var out = planetOutputPerSec(p) * ms;
      var spBonus = 0;
      var strain = strainById(p.exclusiveStrainId);
      if (strain && hasAbility(strain, 'yield_surge')) spBonus += out * 0.02;
      var cashGain = out * 8;
      G.cash += cashGain;
      cashAcc += cashGain;
      if (strain) {
        p = Object.assign({}, p, { storedYield: (p.storedYield || 0) + out * 0.15 });
      }
      if (spBonus) { G.sp += spBonus; spAcc += spBonus; }
      return p;
    });
    UI._planetCashAcc = (UI._planetCashAcc || 0) + cashAcc;
    UI._planetSpAcc = (UI._planetSpAcc || 0) + spAcc;
    maybePlanetPops();
  }

  function maybePlanetPops() {
    var now = Date.now();
    if (now - (UI._lastPlanetPop || 0) < 2000) return;
    var items = [];
    if ((UI._planetCashAcc || 0) >= 25) {
      items.push({ type: 'cash', amount: UI._planetCashAcc, big: UI._planetCashAcc >= 400 });
      UI._planetCashAcc = 0;
    }
    if ((UI._planetSpAcc || 0) >= 1.5) {
      items.push({ type: 'sp', amount: Math.max(1, Math.floor(UI._planetSpAcc)), big: UI._planetSpAcc >= 8 });
      UI._planetSpAcc = 0;
    }
    if (!items.length) return;
    popArcadeBurst(items);
    UI._lastPlanetPop = now;
  }

  function breedStrains(idA, idB) {
    var a = strainById(idA), b = strainById(idB);
    if (!a || !b || idA === idB) return null;
    var seed = ((a.seed || 0) ^ (b.seed || 0)) + Date.now();
    var rng = rngSeed(seed);
    var tierIdx = Math.max(rarityIndex(a.rarity), rarityIndex(b.rarity));
    var bump = rng() > 0.65 ? 1 : 0;
    var childRar = RARITIES[Math.min(RARITIES.length - 1, tierIdx + bump)].id;
    var child = genStrain(seed, childRar, 0.03);
    child.hue = Math.floor((a.hue + b.hue) / 2 + (rng() - 0.5) * 40) % 360;
    if (child.hue < 0) child.hue += 360;
    var na = a.name.split(' ')[0], nb = b.name.split(' ')[0];
    child.name = (na + ' × ' + nb + ' F1').slice(0, 28);
    child.thcPercent = parseFloat(((a.thcPercent + b.thcPercent) / 2 + rng() * 4).toFixed(1));
    child.yield = Math.round((a.yield + b.yield) / 2 * (0.9 + rng() * 0.25));
    child.parentIds = [a.id, b.id];
    var ab = {};
    (a.abilities || []).concat(b.abilities || []).forEach(function (aid) { ab[aid] = true; });
    child.abilities = Object.keys(ab);
    if (rng() > 0.5 && child.abilities.length < 5) {
      var pool = ABILITIES.filter(function (x) { return child.abilities.indexOf(x.id) < 0; });
      if (pool.length) child.abilities.push(pool[Math.floor(rng() * pool.length)].id);
    }
    child.abilityBoosts = {};
    return child;
  }

  function mergeLabError() {
    if (!G.breedSlotA || !G.breedSlotB) return 'Pick two parent strains.';
    if (G.breedSlotA === G.breedSlotB) return 'Parents must be different strains.';
    if ((G.sp || 0) < MERGE_SP_COST) return 'Need ' + MERGE_SP_COST + ' SP to fuse.';
    return '';
  }

  function startMergeFuse() {
    var err = mergeLabError();
    if (err) { UI.mergeLab = Object.assign({}, UI.mergeLab || {}, { error: err }); return false; }
    if (UI.mergeLab && UI.mergeLab.phase === 'fusing') return false;
    G.sp -= MERGE_SP_COST;
    var child = breedStrains(G.breedSlotA, G.breedSlotB);
    if (!child) { G.sp += MERGE_SP_COST; UI.mergeLab.error = 'Fusion failed — try different parents.'; return false; }
    UI.mergeLab = { open: true, phase: 'fusing', child: child, error: '', fuseAt: Date.now() };
    scheduleSave();
    var dur = 2000 + Math.floor(Math.random() * 2000);
    setTimeout(function () {
      if (!UI.mergeLab || UI.mergeLab.phase !== 'fusing') return;
      UI.mergeLab.phase = 'reveal';
      renderMergeLab();
    }, dur);
    renderMergeLab();
    return true;
  }

  function finishMergeLab() {
    if (!UI.mergeLab || !UI.mergeLab.child || UI.mergeLab.phase !== 'reveal') return false;
    var child = UI.mergeLab.child;
    G.strains = mergeStrains(G.strains, child);
    if (!G.focusedStrainId) G.focusedStrainId = child.id;
    G.breedSlotA = null;
    G.breedSlotB = null;
    addXp(25);
    popStrain(child, { mega: true, delay: 80 });
    popArcade('label', 0, { label: 'FUSION COMPLETE!', mega: true });
    plantSay('breed', true);
    UI.mergeLab = { open: false, phase: 'idle', child: null, error: '' };
    scheduleSave();
    render();
    return true;
  }

  function runBreed() { return startMergeFuse(); }

  function upStrainAbility(sid, aid) {
    var s = strainById(sid);
    if (!s || (s.abilities || []).indexOf(aid) < 0) return false;
    if (!s.abilityBoosts) s.abilityBoosts = {};
    var lvl = s.abilityBoosts[aid] || 0;
    var cost = 10 + lvl * 12;
    if (G.sp < cost || lvl >= 5) return false;
    G.sp -= cost;
    s.abilityBoosts[aid] = lvl + 1;
    G.strains = G.strains.map(function (x) { return x.id === sid ? s : x; });
    return true;
  }

  function planetCardHtml(p, opts) {
    opts = opts || {};
    var tier = cardTierClass(p.rarity);
    var c = rarityColor(p.rarity);
    var nm = planetDisplayName(p);
    var focusAttr = opts.asAction ? ' data-action="planet-focus" data-id="' + esc(p.id) + '"' : ' data-planet-focus="' + esc(p.id) + '"';
    var rev = Math.max(1, Math.floor(planetOutputPerSec(p) * 8));
    var lvl = Math.max(1, (p.harvesterLv || 0) + (p.conveyorLv || 0) + 1);
    var orb = '<div class="cr-planet-orb" style="background:radial-gradient(circle at 32% 28%,' + c + 'dd,' + c + '55 42%,#1A1209 78%);filter:hue-rotate(' + (p.hue || 0) + 'deg)"></div>';
    return '<button type="button" class="cr-card planet-card' + (opts.selected ? ' selected' : '') + '"' + focusAttr + '>' +
      crCardFrameInner({ tier: tier, name: nm, artHtml: orb,
        badgeLeft: '<div class="cr-badge cr-badge-thc cr-badge-sm">' + rev + '</div>',
        badgeRight: '<div class="cr-badge cr-badge-lvl"><span>Lv</span>' + lvl + '</div>',
        tag: '🪐' }) + '</button>';
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

  var UI = { activeTab: 'battle', farmOpen: false, profileOpen: false, profileTab: 'stats', settingsOpen: false, helpOpen: false, realityWarp: false, liftedCardId: null, liftOnUpgrade: null, playerSelectOpen: false, casinoGame: 'menu', casinoToast: '', slotOverlay: false, blackjack: null, battleToasts: [], battleFlash: null, scanAnimating: false, focusedPlanetId: null, strainPickerFloorId: null, strainPickerSearch: '', strainPickerSort: 'rarity', battleEquipSearch: '', battleEquipSort: 'dps', mergeLab: { open: false, phase: 'idle', child: null, error: '' }, arcadePops: [], _arcadeDirty: false, _passiveCashAcc: 0, _lastPassivePop: 0, _lastCritPop: 0, _planetSpAcc: 0, _lastPlanetPop: 0 };
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
      cloneJob: null, focusedStrainId: null, packReveal: { open: false, packType: null, strain: null, strains: null },
      farmSubTab: 'portal', transactionBeam: null, lastTickAt: Date.now(), nextPortalNum: 1,
      bossRound: 1, bossHp: 0, bossMaxHp: 0, bossName: '', bossSeed: 0, bossRarity: 'dust', equippedBattleIds: [],
      indexSearch: '', indexSort: 'recent',
      casinoBets: { blackjack: 1000, slots: 500 },
      ownedPlanets: [], scanPending: null, breedSlotA: null, breedSlotB: null, pendingRewards: [],
    };
  }

  function readPlayerSave(pid) {
    var key = saveKey(pid);
    try {
      var r = localStorage.getItem(key);
      if (!r) r = localStorage.getItem(key + '_backup');
      if (!r) return null;
      return JSON.parse(r);
    } catch (e) {
      try {
        var b = localStorage.getItem(key + '_backup');
        if (b) return JSON.parse(b);
      } catch (e2) { }
      return null;
    }
  }
  function saveGame() {
    if (!G || !activePlayerId) return false;
    try {
      G.saveVersion = SAVE_VERSION;
      G.lastTickAt = Date.now();
      var p = { playerId: activePlayerId, saveVersion: SAVE_VERSION };
      PERSIST.forEach(function (k) { p[k] = G[k]; });
      var key = saveKey(activePlayerId);
      var blob = JSON.stringify(p);
      localStorage.setItem(key, blob);
      localStorage.setItem(key + '_backup', blob);
      localStorage.setItem(LAST_PLAYER_KEY, activePlayerId);
      try { sessionStorage.setItem(SESSION_KEY, activePlayerId); } catch (e2) { }
      return true;
    } catch (e) {
      console.error('[Voidline] Save failed — progress may not persist:', e);
      return false;
    }
  }

  function sanitizeSave(pid) {
    delete G.planetOffers;
    delete G.profileViewIndex;
    var p = playerDef(pid);
    if (G.name === 'VoidPilot_Aden' || G.name === 'VoidPilot') G.name = p.defaultName;
    if (!G.casinoBets.slots) G.casinoBets.slots = 500;
    if (G.sp == null || isNaN(G.sp)) G.sp = 100;
    if (!G.pendingRewards) G.pendingRewards = [];
    if (!G.ownedPlanets) G.ownedPlanets = [];
    if (G.scanPending === undefined) G.scanPending = null;
    G.strains = (G.strains || []).map(migrateStrain);
    if (!G.equippedBattleIds) G.equippedBattleIds = [];
    if (G.equippedBattleIds.length > BATTLE_EQUIP_MAX) G.equippedBattleIds = G.equippedBattleIds.slice(0, BATTLE_EQUIP_MAX);
    if (!G.indexSearch) G.indexSearch = '';
    if (!G.indexSort) G.indexSort = 'recent';
    if (!G.casinoBets) G.casinoBets = { blackjack: 1000, slots: 500 };
    if (!G.casinoBets.blackjack) G.casinoBets.blackjack = 1000;
    if (!G.casinoBets.slots) G.casinoBets.slots = 500;
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
    if (G.packReveal && G.packReveal.strains === undefined) G.packReveal.strains = null;
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

  function battleWaveNum() { return ((G.bossRound || 1) - 1) % 5 + 1; }
  function isBossWave() { return battleWaveNum() === 5; }
  function xpNeededForLevel(lvl) { return (lvl || 1) * XP_LVL; }
  function packLuckBonus() {
    var luck = blitzMod('packLuck');
    G.strains.forEach(function (st) { if (hasAbility(st, 'rift_luck')) luck += 0.05; });
    return luck;
  }

  function genUniqueStrainPair(minR, packType) {
    var luck = packLuckBonus();
    var seed = Date.now() + Math.floor(Math.random() * 0xffffff);
    var s1 = genPack('basic', seed, { scanBonus: scanMult(), packLuckBonus: luck });
    if (packType === 'boss' || packType === 'milestone') s1 = genPack('guaranteed', seed, { scanBonus: scanMult(), packLuckBonus: luck + 0.05 });
    var s2, tries = 0;
    do {
      s2 = genPack('basic', seed + 1337 + tries * 9973, { scanBonus: scanMult(), packLuckBonus: luck });
      if (packType === 'boss' || packType === 'milestone') s2 = genPack('guaranteed', seed + 1337 + tries * 9973, { scanBonus: scanMult(), packLuckBonus: luck + 0.05 });
      tries++;
    } while (s2.genomeId === s1.genomeId && tries < 24);
    return [s1, s2];
  }

  function queueReward(kind, packType) {
    G.pendingRewards = G.pendingRewards || [];
    G.pendingRewards.push({ kind: kind, packType: packType || kind });
    drainRewardQueue();
  }

  function drainRewardQueue() {
    if (!G || (G.packReveal && G.packReveal.open)) return;
    var q = G.pendingRewards;
    if (!q || !q.length) return;
    var r = q.shift();
    if (r.kind === 'dual') {
      var pair = genUniqueStrainPair(r.packType === 'boss' ? 'bloom' : 'pulse', r.packType);
      G.packReveal = { open: true, packType: r.packType || 'rift-twin', strains: pair, strain: null };
    } else if (r.kind === 'single') {
      var s = genPack('basic', Date.now() + Math.floor(Math.random() * 1e9), { scanBonus: scanMult(), packLuckBonus: packLuckBonus() });
      G.packReveal = { open: true, packType: r.packType || 'level', strains: null, strain: s };
    }
    scheduleSave();
    render();
  }

  function onLevelUp(newLvl) {
    queueReward('single', 'level');
    if (newLvl % 10 === 0) queueReward('dual', 'milestone');
    popArcadeBurst([
      { type: 'label', label: 'LEVEL UP!', mega: true },
      { type: 'label', label: 'LV.' + newLvl, mega: true, delay: 100 },
      { type: 'label', label: 'NEW STRAIN!', mega: true, delay: 200 },
    ]);
    if (newLvl % 10 === 0) popArcade('label', 0, { label: 'MILESTONE PACK!', jackpot: true, delay: 400 });
    showBattleToast('LEVEL UP! LV.' + newLvl, true);
    shakeScreen();
    plantSay('level_up', true);
  }

  function showBattleToast(msg, big) {
    UI.battleToasts = UI.battleToasts || [];
    UI.battleToasts.push({ msg: msg, big: !!big, at: Date.now() });
    if (UI.battleToasts.length > 6) UI.battleToasts.shift();
    var el = document.getElementById('battle-toast-layer');
    if (el) renderBattleToasts();
  }

  function popArcade(type, amount, opts) {
    opts = opts || {};
    var text;
    if (type === 'label') text = opts.label || '';
    else if (type === 'strain') text = opts.label || '+STRAIN';
    else if (type === 'cash') text = '+' + fmtCash(amount);
    else if (type === 'xp') text = '+' + Math.floor(amount) + ' XP';
    else if (type === 'sp') text = '+' + Math.floor(amount) + ' SP';
    else text = String(amount);
    if (type !== 'label' && type !== 'strain' && (!amount || amount <= 0)) return;
    UI.arcadePops = UI.arcadePops || [];
    var big = !!(opts.big || opts.mega || opts.jackpot);
    if (!big && type === 'cash' && amount >= 2500) big = true;
    if (!big && type === 'xp' && amount >= 40) big = true;
    if (!big && type === 'sp' && amount >= 10) big = true;
    UI.arcadePops.push({
      type: type === 'label' ? (opts.jackpot ? 'jackpot' : 'mega') : type,
      text: text,
      rarity: opts.rarity || null,
      big: big,
      mega: !!(opts.mega || opts.jackpot),
      jackpot: !!opts.jackpot,
      x: opts.x != null ? opts.x : (10 + Math.random() * 80),
      y: opts.y != null ? opts.y : (28 + Math.random() * 38),
      at: Date.now(),
      delay: opts.delay || 0,
      dur: opts.jackpot ? 2600 : (opts.mega ? 2100 : 1550),
    });
    if (UI.arcadePops.length > 20) UI.arcadePops.splice(0, UI.arcadePops.length - 20);
    if (arcadePopsAllowed()) markArcadeDirty();
  }

  function popCash(amt, opts) { popArcade('cash', amt, opts || {}); }
  function popXp(amt, opts) { popArcade('xp', amt, opts || {}); }
  function popSp(amt, opts) { popArcade('sp', amt, opts || {}); }

  function popStrain(strain, opts) {
    if (!strain) return;
    opts = opts || {};
    var qty = opts.qty != null ? opts.qty : 1;
    var name = strain.name || 'Strain';
    if (name.length > 22) name = name.slice(0, 20) + '…';
    var text = qty > 1 ? '+' + qty + ' ' + name : '+' + name;
    var idx = rarityIndex(strain.rarity);
    popArcade('strain', 0, {
      label: text,
      rarity: strain.rarity,
      big: opts.big || idx >= 8,
      mega: opts.mega || idx >= 12,
      jackpot: opts.jackpot || idx >= 16,
      delay: opts.delay,
      x: opts.x,
      y: opts.y,
    });
  }

  function popArcadeBurst(items) {
    items.forEach(function (it, i) {
      setTimeout(function () {
        if (it.type === 'label') popArcade('label', 0, { label: it.label, mega: it.mega, jackpot: it.jackpot, delay: it.delay, x: 18 + i * 22, y: 30 + (i % 3) * 10 });
        else if (it.type === 'strain') popStrain(it.strain, { qty: it.qty, big: it.big, mega: it.mega, jackpot: it.jackpot, delay: it.delay, x: 15 + i * 20 + Math.random() * 8, y: 32 + (i % 2) * 12 });
        else popArcade(it.type, it.amount, { big: it.big, mega: it.mega, jackpot: it.jackpot, delay: it.delay, x: 15 + i * 20 + Math.random() * 8, y: 32 + (i % 2) * 12 });
      }, (it.delay || 0) + i * 85);
    });
  }

  function markArcadeDirty() { UI._arcadeDirty = true; }

  function clearArcadePops() {
    UI.arcadePops = [];
    UI._arcadeDirty = false;
    var el = document.getElementById('arcade-pop-layer');
    if (el) el.innerHTML = '';
  }

  function arcadePopsAllowed() {
    return UI.activeTab === 'battle' && !UI.farmOpen && !UI.playerSelectOpen;
  }

  function renderArcadePops() {
    var el = document.getElementById('arcade-pop-layer');
    if (!el) return;
    if (!arcadePopsAllowed()) { el.innerHTML = ''; return; }
    var now = Date.now();
    UI.arcadePops = (UI.arcadePops || []).filter(function (p) { return now - p.at - (p.delay || 0) < (p.dur || 1550); });
    el.innerHTML = UI.arcadePops.map(function (p) {
      var age = now - p.at - (p.delay || 0);
      if (age < 0) return '';
      var cls = 'arcade-pop arcade-pop-' + esc(p.type) + (p.big ? ' arcade-pop-big' : '') + (p.mega ? ' arcade-pop-mega' : '') + (p.jackpot ? ' arcade-pop-jackpot' : '');
      var style = 'left:' + p.x + '%;top:' + p.y + '%;animation-duration:' + ((p.dur || 1550) / 1000) + 's';
      if (p.rarity) style += ';color:' + rarityDef(p.rarity).color;
      return '<div class="' + cls + '" style="' + style + '">' + esc(p.text) + '</div>';
    }).join('');
    UI._arcadeDirty = false;
  }

  function renderArcadePopsIfDirty() {
    if (UI._arcadeDirty) renderArcadePops();
  }

  function maybePassiveCashPop() {
    var now = Date.now();
    if (now - (UI._lastPassivePop || 0) < 2800) return;
    if ((UI._passiveCashAcc || 0) < 35) return;
    popCash(UI._passiveCashAcc, { big: UI._passiveCashAcc >= 500 });
    UI._passiveCashAcc = 0;
    UI._lastPassivePop = now;
  }

  function renderBattleToasts() {
    var el = document.getElementById('battle-toast-layer');
    if (!el) return;
    var now = Date.now();
    UI.battleToasts = (UI.battleToasts || []).filter(function (t) { return now - t.at < 2800; });
    el.innerHTML = UI.battleToasts.map(function (t) {
      return '<div class="battle-toast' + (t.big ? ' battle-toast-big' : '') + '">' + esc(t.msg) + '</div>';
    }).join('');
  }

  function shakeScreen() {
    var shell = document.getElementById('phone-shell');
    if (!shell) return;
    shell.classList.remove('screen-shake');
    void shell.offsetWidth;
    shell.classList.add('screen-shake');
    setTimeout(function () { shell.classList.remove('screen-shake'); }, 450);
  }

  function flashBossHit(crit) {
    UI.battleFlash = crit ? 'crit' : 'hit';
    var art = document.querySelector('.boss-arena-art');
    if (art) {
      art.classList.remove('boss-hit-flash', 'boss-crit-flash');
      void art.offsetWidth;
      art.classList.add(crit ? 'boss-crit-flash' : 'boss-hit-flash');
    }
  }

  function spawnBoss() {
    var round = G.bossRound || 1;
    var wave = battleWaveNum();
    var mega = wave === 5;
    var seed = Date.now() + round * 7919 + (activePlayerId || '').split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
    var rng = rngSeed(seed);
    var rar = pickRarity(rng, undefined, scanMult() * 0.01 + blitzMod('packLuck') * 0.5);
    G.bossSeed = seed;
    G.bossRarity = rar;
    G.bossIsMega = mega;
    if (mega) {
      G.bossName = genBossName(rng);
      G.bossMaxHp = Math.floor(800 * round * rMult(rar) * (1 + round * 0.15) * 2.2);
    } else {
      G.bossName = MINION_NAMES[wave - 1] || MINION_NAMES[0];
      G.bossMaxHp = Math.floor(180 * round * rMult(rar) * (0.45 + wave * 0.12));
    }
    G.bossHp = G.bossMaxHp;
  }

  function strainById(id) { return G.strains.find(function (s) { return s.id === id; }); }

  function strainBattleDpsBase(s) {
    if (!s) return 0;
    var base = (s.yield * s.thcPercent / 100) * rMult(s.rarity) * s.quantity;
    if (hasAbility(s, 'boss_slayer')) base *= 1.3 * abilityBoostMult(s, 'boss_slayer');
    if (hasAbility(s, 'thc_overdrive')) base *= 1.15 * abilityBoostMult(s, 'thc_overdrive');
    return base;
  }

  function strainBattleDps(s, rng) {
    if (!s) return 0;
    var base = strainBattleDpsBase(s);
    if (hasAbility(s, 'crit_burst') && rng && rng() < 0.15) base *= 3 * abilityBoostMult(s, 'crit_burst');
    return base;
  }

  function totalBattleDps() {
    var rng = rngSeed(G.bossSeed + Math.floor(Date.now() / 200));
    var ids = (G.equippedBattleIds || []).slice(0, BATTLE_EQUIP_MAX);
    var dot = 0;
    var hadCrit = false;
    ids.forEach(function (id) {
      var s = strainById(id);
      if (s && hasAbility(s, 'poison_cloud')) dot += 5 * s.quantity;
    });
    var dps = ids.reduce(function (t, id) {
      var s = strainById(id);
      if (!s) return t;
      var base = (s.yield * s.thcPercent / 100) * rMult(s.rarity) * s.quantity;
      if (hasAbility(s, 'boss_slayer')) base *= 1.3 * abilityBoostMult(s, 'boss_slayer');
      if (hasAbility(s, 'thc_overdrive')) base *= 1.15 * abilityBoostMult(s, 'thc_overdrive');
      if (hasAbility(s, 'crit_burst') && rng() < 0.15) { base *= 3 * abilityBoostMult(s, 'crit_burst'); hadCrit = true; }
      return t + base;
    }, 0);
    if (hadCrit && (!UI._lastCritPop || Date.now() - UI._lastCritPop > 1200)) {
      UI._lastCritPop = Date.now();
      flashBossHit(true);
      popArcade('label', 0, { label: 'CRIT!', mega: true, x: 42 + Math.random() * 16, y: 38 + Math.random() * 10 });
    }
    return dps + dot;
  }

  function killBoss() {
    var round = G.bossRound || 1;
    var wave = battleWaveNum();
    var mega = wave === 5;
    var mult = 1;
    (G.equippedBattleIds || []).forEach(function (id) {
      var s = strainById(id);
      if (s && hasAbility(s, 'cash_magnet')) mult += 0.08;
    });
    var cashGain = Math.floor((mega ? 5000 : 750) * round * rMult(G.bossRarity) * mult * (mega ? 1 : 0.35 + wave * 0.1));
    G.cash += cashGain;
    var spGain = mega ? (12 + round * 4) : Math.max(1, Math.floor(wave / 2));
    G.sp = (G.sp || 0) + spGain;
    var xpGain = mega ? (40 + round * 10) : (12 + wave * 6);
    addXp(xpGain, true);
    popArcadeBurst([
      { type: 'cash', amount: cashGain, mega: mega, jackpot: mega && cashGain >= 8000 },
      { type: 'sp', amount: spGain, big: true, mega: mega },
      { type: 'xp', amount: xpGain, big: true, mega: mega },
    ]);
    if (mega) {
      popArcade('label', 0, { label: 'BOSS JACKPOT!', jackpot: true, delay: 280 });
      popArcade('label', 0, { label: 'RIFT TWIN PACK!', mega: true, delay: 380 });
    } else if (wave === 4) {
      popArcade('label', 0, { label: 'MEGA BOSS NEXT!', mega: true, delay: 200 });
    }
    if (mega) queueReward('dual', 'boss');
    G.bossRound = round + 1;
    spawnBoss();
    shakeScreen();
    if (mega) {
      showBattleToast('BOSS DOWN! +' + spGain + ' SP · RIFT TWIN PACK!', true);
      plantSay('boss_kill', true);
    } else {
      showBattleToast('Wave ' + wave + '/5 · +' + spGain + ' SP', false);
      plantSay('wave_clear', true);
    }
    scheduleSave();
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
    if (idx >= 0) { ids.splice(idx, 1); G.equippedBattleIds = ids; scheduleSave(); return true; }
    if (ids.length >= BATTLE_EQUIP_MAX) return false;
    if (!strainById(sid)) return false;
    ids.push(sid);
    G.equippedBattleIds = ids;
    scheduleSave();
    return true;
  }

  function equipBestBattle() {
    var sorted = G.strains.slice().sort(function (a, b) { return strainBattleDpsBase(b) - strainBattleDpsBase(a); });
    G.equippedBattleIds = sorted.slice(0, BATTLE_EQUIP_MAX).map(function (s) { return s.id; });
    scheduleSave();
    return true;
  }

  function filteredBattleEquipStrains() {
    var equipped = G.equippedBattleIds || [];
    var list = G.strains.filter(function (s) { return equipped.indexOf(s.id) < 0; });
    var q = (UI.battleEquipSearch || '').toLowerCase();
    if (q) list = list.filter(function (s) { return s.name.toLowerCase().indexOf(q) >= 0 || rarityName(s.rarity).toLowerCase().indexOf(q) >= 0; });
    var sort = UI.battleEquipSort || 'dps';
    if (sort === 'dps') list.sort(function (a, b) { return strainBattleDpsBase(b) - strainBattleDpsBase(a); });
    else if (sort === 'rarity') list.sort(function (a, b) { return rarityIndex(b.rarity) - rarityIndex(a.rarity); });
    else if (sort === 'name') list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    else list.sort(function (a, b) { return (b.discoveredAt || 0) - (a.discoveredAt || 0); });
    return list;
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
      tab_map: 'Universe rail online. Scan for worlds only you can claim.',
      planet_keep: s.name + ' locked a new world. Exclusive genetics planted.',
      breed: 'Lab fusion complete. ' + s.name + ' approves the new lineage.',
      boss_kill: s.name + ' just watched that boss fold. Next round\'s bigger.',
      wave_clear: 'Wave cleared. ' + s.name + ' wants the big boss.',
      level_up: s.name + ' leveled up! Fresh genetics incoming.',
      tab_farm: 'Portal shaft open. Drop strains in the rocket.',
    };
    return lines[reason] || s.name + ' watching the void… keep farming.';
  }

  function plantSay(reason, force) {
    var key = reason + '|' + (topStrain() ? topStrain().id : 'none');
    var now = Date.now();
    if (!force && key === dialogueState.lastKey && now - dialogueState.lastAt < 120000) return;
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
    try {
      sessionStorage.setItem(SESSION_KEY, pid);
      localStorage.setItem(LAST_PLAYER_KEY, pid);
    } catch (e) { }
    loadGame(pid);
    saveGame();
    UI.playerSelectOpen = false;
    UI.activeTab = 'battle';
    UI.farmOpen = false;
    plantSay('welcome', true);
    render();
    if (G.pendingRewards && G.pendingRewards.length) drainRewardQueue();
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
    G.inventory.forEach(function (i) {
      if (!i.owned) return;
      var def = STORE.find(function (x) { return x.id === i.id; });
      var bonus = def && def.revPerSec != null ? def.revPerSec : (i.type === 'nutrient' ? 0.5 : i.type === 'pipe' ? 1.2 : 0);
      t += i.owned * bonus;
    });
    return t / 1000;
  }

  function inventoryRevPerSec() {
    var t = 0;
    G.inventory.forEach(function (i) {
      if (!i.owned) return;
      var def = STORE.find(function (x) { return x.id === i.id; });
      var bonus = def && def.revPerSec != null ? def.revPerSec : (i.type === 'nutrient' ? 0.5 : i.type === 'pipe' ? 1.2 : 0);
      t += i.owned * bonus;
    });
    return t;
  }
  function revSecTotal() { return revMs() * 1000; }
  function blitzRem() { return Math.max(0, G.blitzEndsAt - Date.now()); }
  function cloneRem() { return G.cloneJob ? Math.max(0, G.cloneJob.startedAt + G.cloneJob.durationMs - Date.now()) : 0; }
  function portalCost() { return PORTAL_BASE_COST * G.nextPortalNum; }
  function floorUpCost(f) { return Math.floor(5000 * f.level * f.level); }
  function addXp(amt, skipPop) {
    if (amt > 0 && !skipPop) popXp(amt);
    G.empireXp = (G.empireXp || 0) + amt;
    while (G.empireXp >= xpNeededForLevel(G.empireLevel)) {
      G.empireXp -= xpNeededForLevel(G.empireLevel);
      G.empireLevel++;
      onLevelUp(G.empireLevel);
    }
  }

  function tick(now) {
    var d = now - G.lastTickAt;
    if (d <= 0) return;
    var cashGain = revMs() * d;
    G.cash += cashGain;
    UI._passiveCashAcc = (UI._passiveCashAcc || 0) + cashGain;
    maybePassiveCashPop();
    tickPlanets(d);
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
    var cloned = G.strains[i];
    popArcadeBurst([
      { type: 'label', label: 'CLONED!', mega: true },
      { type: 'strain', strain: cloned, delay: 90 },
      { type: 'xp', amount: 8, delay: 170 },
    ]);
    addXp(8, true);
    plantSay('clone');
  }

  function buyPack(type) {
    if (G.packReveal && G.packReveal.open) {
      showBattleToast('Close the open pack reveal first', false);
      return false;
    }
    var p = PACKS.find(function (x) { return x.type === type; });
    if (!p) return false;
    var nc = G.cash, ns = G.sp || 0;
    var spEarn = 0;
    if (type === 'omega' && G.cash < p.price && p.spCost && G.sp >= p.spCost) ns -= p.spCost;
    else if (G.cash < p.price) return false;
    else { nc -= p.price; spEarn = Math.floor(p.price / 2500); ns += spEarn; }
    var luck = blitzMod('packLuck');
    G.strains.forEach(function (st) { if (hasAbility(st, 'rift_luck')) luck += 0.05; });
    var strain = genPack(type, Date.now() + Math.floor(Math.random() * 99999), { scanBonus: scanMult(), packLuckBonus: luck });
    G.cash = nc; G.sp = ns;
    G.packReveal = { open: true, packType: type, strain: strain };
    if (spEarn > 0) popSp(spEarn, { big: spEarn >= 5 });
    popArcade('label', 0, { label: 'PACK OPEN!', mega: true });
    return true;
  }
  function closePack() {
    var pr = G.packReveal;
    if (pr.strains && pr.strains.length) {
      pr.strains.forEach(function (s) {
        G.strains = mergeStrains(G.strains, s);
        if (!G.focusedStrainId) G.focusedStrainId = s.id;
      });
      addXp(25 * pr.strains.length);
      var dualItems = [{ type: 'label', label: 'DUAL PACK!', jackpot: true }];
      pr.strains.forEach(function (s, i) {
        dualItems.push({ type: 'strain', strain: s, delay: 100 + i * 110 });
      });
      popArcadeBurst(dualItems);
      plantSay('pack', true);
    } else if (pr.strain) {
      G.strains = mergeStrains(G.strains, pr.strain);
      if (!G.focusedStrainId) G.focusedStrainId = G.packReveal.strain.id;
      addXp(25);
      var isBoss = pr.packType === 'boss' || pr.packType === 'milestone';
      if (pr.packType === 'breed') popArcade('label', 0, { label: 'FUSION COMPLETE!', mega: true });
      else if (isBoss) popArcade('label', 0, { label: 'LEGENDARY DROP!', jackpot: true });
      popStrain(pr.strain, { mega: pr.packType === 'breed' || isBoss, jackpot: isBoss, delay: 120 });
      plantSay('pack', true);
    }
    G.packReveal = { open: false, packType: null, strain: null, strains: null };
    drainRewardQueue();
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
    popStrain(s, { big: true });
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
    popStrain(s);
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

  function filteredPickerStrains() {
    var list = G.strains.slice();
    var q = (UI.strainPickerSearch || '').toLowerCase();
    if (q) list = list.filter(function (s) { return s.name.toLowerCase().indexOf(q) >= 0 || rarityName(s.rarity).toLowerCase().indexOf(q) >= 0; });
    var sort = UI.strainPickerSort || 'rarity';
    if (sort === 'rarity') list.sort(function (a, b) { return rarityIndex(b.rarity) - rarityIndex(a.rarity); });
    else if (sort === 'name') list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    else list.sort(function (a, b) { return (b.discoveredAt || 0) - (a.discoveredAt || 0); });
    return list;
  }

  function abilityListHtml(strainOrIds, opts) {
    opts = opts || {};
    var ids = typeof strainOrIds === 'object' && strainOrIds && strainOrIds.abilities ? strainOrIds.abilities : (strainOrIds || []);
    var strain = typeof strainOrIds === 'object' && strainOrIds && strainOrIds.id ? strainOrIds : null;
    return (ids || []).map(function (aid) {
      var a = ABILITIES.find(function (x) { return x.id === aid; });
      if (!a) return '';
      var lvl = strain ? abilityBoostLvl(strain, aid) : 0;
      var upBtn = '';
      if (opts.upgradeable && strain) {
        var cost = 10 + lvl * 12;
        upBtn = ' <button type="button" class="game-btn game-btn-sm" style="padding:2px 6px;font-size:0.45rem;margin-left:0.25rem" data-action="up-ability" data-id="' + esc(strain.id) + ':' + aid + '"' + (G.sp < cost || lvl >= 5 ? ' disabled' : '') + '>+' + cost + ' SP</button>';
      }
      return '<div class="text-xs mb-1 flex-between" style="gap:0.25rem;align-items:flex-start"><span><span class="text-green">' + esc(a.name) + (lvl ? ' Lv.' + lvl : '') + '</span> — ' + esc(a.desc) + '</span>' + upBtn + '</div>';
    }).join('');
  }

  function cardTierClass(rarity) {
    var idx = rarityIndex(rarity);
    if (idx >= 25) return 'cr-tier-god';
    if (idx >= 20) return 'cr-tier-champion';
    if (idx >= 18) return 'cr-tier-legend';
    if (idx >= 10) return 'cr-tier-epic';
    if (idx >= 4) return 'cr-tier-rare';
    return 'cr-tier-common';
  }

  function cardTierArtIndex(rarity) {
    var idx = rarityIndex(rarity);
    if (idx >= 25) return 5;
    if (idx >= 20) return 4;
    if (idx >= 18) return 3;
    if (idx >= 10) return 2;
    if (idx >= 4) return 1;
    return 0;
  }

  function strainCardArt(s) {
    return '/public/art/cards/bud-tier-' + cardTierArtIndex(s.rarity) + '.svg';
  }

  function strainCardLevel(s) {
    return Math.max(1, Math.min(99, Math.floor((s.potency || 10) / 8) + 1));
  }

  function strainCardArtImg(s) {
    var hue = Math.round((s.hue || 0) * 0.12);
    return '<img src="' + strainCardArt(s) + '" alt="" draggable="false"' + (hue ? ' style="filter:hue-rotate(' + hue + 'deg)"' : '') + '>';
  }

  function crCardFrameInner(opts) {
    var qtyBadge = (opts.qty && opts.qty > 1) ? '<div class="cr-badge cr-badge-qty">x' + opts.qty + '</div>' : '';
    var tagBadge = opts.tag ? '<div class="cr-badge cr-badge-tag">' + opts.tag + '</div>' : '';
    return '<div class="cr-card-frame ' + opts.tier + (opts.frameExtra || '') + '">' +
      '<div class="cr-card-bevel"></div>' +
      '<div class="cr-card-arena"></div>' +
      '<div class="cr-card-art">' + opts.artHtml + '</div>' +
      opts.badgeLeft + opts.badgeRight + qtyBadge + tagBadge +
      '<div class="cr-card-banner"><span class="cr-card-name">' + esc(opts.name) + '</span></div>' +
      '<div class="cr-card-shine"></div></div>';
  }

  function casinoBet(game) {
    if (!G.casinoBets) G.casinoBets = { blackjack: 1000, slots: 500 };
    return G.casinoBets[game] || (game === 'slots' ? 500 : 1000);
  }

  function setCasinoBet(game, amt) {
    if (!G.casinoBets) G.casinoBets = { blackjack: 1000, slots: 500 };
    var n = Math.max(BET_CHIPS[0], Math.min(Math.floor(amt), G.cash));
    G.casinoBets[game] = n;
  }

  function renderBetPicker(game) {
    var cur = casinoBet(game);
    var h = '<div class="bet-picker mb-3"><div class="bet-picker-label">BET · ' + fmtCash(cur) + '</div><div class="bet-chips">';
    BET_CHIPS.forEach(function (amt) {
      h += '<button type="button" class="bet-chip' + (cur === amt ? ' active' : '') + '" data-action="set-bet" data-id="' + game + ':' + amt + '"' + (G.cash < amt ? ' disabled' : '') + '>' + fmtCash(amt) + '</button>';
    });
    h += '<button type="button" class="bet-chip bet-chip-max' + (cur === G.cash && G.cash > 0 ? ' active' : '') + '" data-action="set-bet" data-id="' + game + ':max"' + (G.cash < BET_CHIPS[0] ? ' disabled' : '') + '>MAX</button></div></div>';
    return h;
  }

  function playingCardHtml(card, hidden) {
    if (hidden) return '<div class="playing-card playing-card-back"><div class="playing-card-pattern"></div></div>';
    var red = card.label.indexOf('♥') >= 0 || card.label.indexOf('♦') >= 0;
    var rank = card.label.slice(0, -1);
    var suit = card.label.slice(-1);
    return '<div class="playing-card' + (red ? ' playing-card-red' : '') + '">' +
      '<div class="playing-card-corner tl"><span class="pc-rank">' + rank + '</span><span class="pc-suit">' + suit + '</span></div>' +
      '<div class="playing-card-center">' + suit + '</div>' +
      '<div class="playing-card-corner br"><span class="pc-rank">' + rank + '</span><span class="pc-suit">' + suit + '</span></div></div>';
  }

  function playingHandHtml(hand, hideSecond) {
    return '<div class="playing-hand">' + hand.map(function (c, i) { return playingCardHtml(c, hideSecond && i === 1); }).join('') + '</div>';
  }

  function liftWrap(id, inner, onUp) { return '<div class="liftable-wrap" data-lift="' + esc(id) + '" data-lift-up="' + (onUp || '') + '"><div class="neon-card neon-card-static p-4">' + inner + '</div></div>'; }

  function crCardHtml(s, opts) {
    opts = opts || {};
    var tier = cardTierClass(s.rarity);
    var thc = parseFloat(s.thcPercent || 0);
    var thcStr = thc % 1 === 0 ? String(Math.floor(thc)) : thc.toFixed(1);
    var thcCls = thcStr.length > 3 ? ' cr-badge-sm' : '';
    var tag = s.planetExclusive ? '🌍' : ((s.parentIds && s.parentIds.length) ? '🧬' : '');
    var cls = 'cr-card' + (opts.selected ? ' selected' : '') + (opts.large ? ' cr-card-lg' : '');
    var inner = crCardFrameInner({
      tier: tier, name: s.name, artHtml: strainCardArtImg(s),
      badgeLeft: '<div class="cr-badge cr-badge-thc' + thcCls + '">' + thcStr + '</div>',
      badgeRight: '<div class="cr-badge cr-badge-lvl"><span>Lv</span>' + strainCardLevel(s) + '</div>',
      qty: s.quantity, tag: tag,
    });
    if (opts.noFocus) return '<div class="' + cls + '">' + inner + '</div>';
    return '<button type="button" class="' + cls + '" data-strain-focus="' + esc(s.id) + '">' + inner + '</button>';
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
    var bet = casinoBet('blackjack');
    if (G.cash < bet) return;
    G.cash -= bet;
    var deck = newDeck();
    UI.blackjack = { deck: deck, player: [deck.pop(), deck.pop()], dealer: [deck.pop(), deck.pop()], bet: bet, done: false, win: null };
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
    if (dv > 21 || pv > dv) {
      bj.win = true;
      var winAmt = bj.bet * 2;
      G.cash += winAmt;
      popCash(winAmt, { mega: true, jackpot: bj.bet >= 10000 });
      popArcade('label', 0, { label: 'BLACKJACK!', mega: true, delay: 120 });
      shakeScreen();
    } else if (pv === dv) { bj.win = null; G.cash += bj.bet; popCash(bj.bet, { big: true }); }
    else { bj.win = false; }
    scheduleSave();
    render();
  }

  function spinSlots() {
    var cost = casinoBet('slots');
    if (G.cash < cost) return false;
    G.cash -= cost;
    var rng = rngSeed(Date.now());
    var reels = [SLOT_SYMBOLS[Math.floor(rng() * SLOT_SYMBOLS.length)], SLOT_SYMBOLS[Math.floor(rng() * SLOT_SYMBOLS.length)], SLOT_SYMBOLS[Math.floor(rng() * SLOT_SYMBOLS.length)]];
    var win = 0;
    if (reels[0] === reels[1] && reels[1] === reels[2]) win = cost * 20;
    else if (reels[0] === reels[1] || reels[1] === reels[2]) win = cost * 3;
    G.cash += win;
    UI.slotResult = { reels: reels, win: win };
    if (win > 0) {
      var jackpot = win >= cost * 15;
      popCash(win, { jackpot: jackpot, mega: win >= cost * 5 });
      if (jackpot) popArcade('label', 0, { label: 'JACKPOT!', jackpot: true, delay: 120 });
      shakeScreen();
    }
    return true;
  }

  function shakeScreen() {
    var shell = document.getElementById('phone-shell');
    if (!shell) return;
    shell.classList.remove('screen-shake');
    void shell.offsetWidth;
    shell.classList.add('screen-shake');
    setTimeout(function () { shell.classList.remove('screen-shake'); }, 450);
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
    var xpNeed = xpNeededForLevel(G.empireLevel);
    var xpPct = Math.min(100, (G.empireXp / xpNeed) * 100);
    var xpFill = document.getElementById('hud-xp-fill');
    var xpText = document.getElementById('hud-xp-text');
    if (xpFill) xpFill.style.width = xpPct + '%';
    if (xpText) xpText.textContent = 'XP ' + Math.floor(G.empireXp) + ' / ' + xpNeed;
    var spEl = document.getElementById('hud-sp');
    if (spEl) spEl.textContent = fmtSp(G.sp || 0);
    renderBattleToasts();
    renderArcadePopsIfDirty();
    var shell = document.getElementById('phone-shell');
    shell.className = 'phone-inner void-bg tab-bg-' + (UI.farmOpen ? 'farm' : UI.activeTab);
    shell.classList.toggle('dimmed', !!UI.liftedCardId || !!UI.strainPickerFloorId);
    document.getElementById('voidline-app').classList.toggle('reality-warp-active', UI.realityWarp);
    document.getElementById('overlay-reality-warp').classList.toggle('active', UI.realityWarp);
    document.getElementById('phone-shell').className = 'phone-inner void-bg tab-bg-' + (UI.farmOpen ? 'farm' : UI.activeTab);
    document.querySelectorAll('.nav-btn').forEach(function (b) {
      var tab = b.dataset.tab;
      b.classList.toggle('active', tab === UI.activeTab && !UI.farmOpen);
    });
    var rocket = document.getElementById('hub-rocket-btn');
    if (rocket) rocket.classList.toggle('active', UI.farmOpen);
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
    var wave = battleWaveNum();
    var mega = isBossWave();
    var equipped = G.equippedBattleIds || [];
    var h = '<div class="screen-section battle-screen boss-arena' + (mega ? ' boss-arena-mega' : '') + '">';
    h += '<div class="fight-top-bar mb-2"><button type="button" id="hub-rocket-btn" class="hub-rocket-btn" data-action="toggle-farm" title="' + (UI.farmOpen ? 'Back to Battle' : 'Portal Farm') + '"><img src="/public/art/rocket.svg" alt="" style="width:1.35rem;height:1.35rem"></button>';
    h += '<div class="fight-top-info"><h2 class="font-display chromatic-text" style="font-size:0.95rem;letter-spacing:0.15em;margin:0">' + (mega ? 'BOSS ARENA' : 'VOID SKIRMISH') + '</h2>';
    h += '<p class="font-mono text-muted text-xs" style="margin:0.15rem 0 0">Wave ' + wave + '/5 · Cycle ' + Math.ceil(G.bossRound / 5) + (mega ? ' · <span class="text-green">MEGA</span>' : '') + '</p></div></div>';
    h += '<div class="battle-layout"><div class="battle-main">';
    h += '<div class="neon-card neon-card-static p-4 mb-3 text-center' + (mega ? ' boss-card-mega' : '') + '"><div class="boss-arena-art"><img src="' + BOSS_ART + '" alt="" style="width:' + (mega ? '7rem' : '5rem') + ';height:' + (mega ? '7rem' : '5rem') + ';filter:hue-rotate(' + (G.bossSeed % 360) + 'deg)"></div><div class="font-display mt-2" style="font-size:1rem;color:' + bc + '">' + esc(G.bossName) + '</div><div class="font-mono text-xs text-muted">' + esc(rarityName(G.bossRarity)) + ' tier</div>';
    if (mega) h += '<div class="font-mono text-green text-xs mt-1">RIFT TWIN PACK on kill</div>';
    h += '<div class="progress-bar mt-3 mb-1"><div class="progress-fill boss-hp-fill" style="width:' + hpPct + '%;background:' + bc + '"></div></div>';
    h += '<div class="font-mono text-xs flex-between"><span class="text-green">' + Math.ceil(G.bossHp).toLocaleString() + ' HP</span><span class="text-muted">' + G.bossMaxHp.toLocaleString() + '</span></div>';
    h += '<div class="font-mono text-green text-xs mt-2">DPS ' + dps.toFixed(1) + '/sec</div></div></div>';
    h += '<div class="battle-side"><div class="flex-between mb-2"><div class="section-label section-label-green" style="margin:0;text-align:left">BATTLE LOADOUT</div><button type="button" class="game-btn game-btn-sm game-btn-green" data-action="equip-best">EQUIP BEST</button></div>';
    h += '<div class="battle-loadout-grid mb-3">';
    for (var slot = 0; slot < BATTLE_EQUIP_MAX; slot++) {
      var eid = equipped[slot];
      var es = eid ? strainById(eid) : null;
      if (es) h += '<button type="button" class="battle-slot cr-card-wrap" data-action="equip-battle" data-id="' + esc(es.id) + '" title="Tap to unequip">' + crCardHtml(es, { noFocus: true }) + '</button>';
      else h += '<div class="battle-slot battle-slot-empty"><span class="text-muted text-xs">Empty</span></div>';
    }
    h += '</div><div class="section-label mb-2" style="text-align:left">EQUIP FROM INDEX</div>';
    h += '<input type="search" class="input-field mb-2" placeholder="Search strains..." data-action="battle-equip-search" value="' + esc(UI.battleEquipSearch || '') + '">';
    h += '<select class="input-field mb-2" data-action="battle-equip-sort"><option value="dps"' + (UI.battleEquipSort === 'dps' ? ' selected' : '') + '>Sort: DPS</option><option value="rarity"' + (UI.battleEquipSort === 'rarity' ? ' selected' : '') + '>Sort: Rarity</option><option value="name"' + (UI.battleEquipSort === 'name' ? ' selected' : '') + '>Sort: Name</option><option value="recent"' + (UI.battleEquipSort === 'recent' ? ' selected' : '') + '>Sort: Recent</option></select>';
    if (!G.strains.length) h += '<div class="neon-card p-4 text-center text-muted text-sm">No strains — open a pack in Shop.</div>';
    else {
      var pool = filteredBattleEquipStrains();
      if (!pool.length) h += '<div class="neon-card p-3 text-center text-muted text-xs">All strains equipped or none match search.</div>';
      else {
        h += '<div class="binder-grid battle-equip-grid">';
        pool.forEach(function (s) {
          h += '<button type="button" class="battle-equip-card" data-action="equip-battle" data-id="' + esc(s.id) + '">' + crCardHtml(s, { noFocus: true }) + '<div class="font-mono text-green text-xs mt-1">DPS ' + strainBattleDpsBase(s).toFixed(1) + '</div></button>';
        });
        h += '</div>';
      }
    }
    h += '</div></div></div>';
    return h;
  }

  function renderFarm() {
    var h = '<div class="screen-section"><div class="neon-card neon-card-green neon-card-pulse p-3 text-center mb-2"><div class="font-mono text-green" style="font-size:0.55rem;letter-spacing:0.15em">PASSIVE REVENUE · SCAN +' + ((scanMult() * 100).toFixed(0)) + '%</div><div class="font-display chromatic-text" style="font-size:1.125rem;font-weight:700">' + fmtRev(revSecTotal()) + '</div></div>';
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
        h += '<div class="neon-card p-4 mb-3"><div class="flex-between mb-3"><div><div style="font-weight:600">' + esc(f.name) + '</div><div class="text-muted" style="font-size:0.55rem">Floor Lv.' + f.level + '</div></div><button type="button" class="game-btn game-btn-sm game-btn-green" data-action="up-floor" data-id="' + f.id + '"' + (G.cash < uc ? ' disabled' : '') + '>UP · ' + fmtCash(uc) + '</button></div>';
        if (eq) {
          h += '<div class="flex-row mb-2 portal-equipped"><div style="flex-shrink:0">' + budImg(eq, '1.5rem') + '</div><div style="flex:1;min-width:0"><div class="font-mono text-green text-xs" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(eq.name) + '</div><div class="text-muted text-xs">' + esc(rarityName(eq.rarity)) + ' · x' + eq.quantity + '</div></div></div>';
        } else {
          h += '<div class="text-muted text-xs mb-2 text-center">No strain mining this portal</div>';
        }
        h += '<div class="flex-row gap-2"><button type="button" class="game-btn game-btn-green game-btn-sm" style="flex:1" data-action="open-strain-picker" data-id="' + esc(f.id) + '"' + (G.strains.length ? '' : ' disabled') + '>SELECT STRAIN</button>';
        if (eq) h += '<button type="button" class="game-btn game-btn-sm" style="flex:1" data-action="clear-floor-strain" data-id="' + esc(f.id) + '">CLEAR</button>';
        h += '</div></div>';
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
    h += '<div class="neon-card neon-card-green neon-card-pulse p-4 mb-3"><div class="flex-between mb-3"><div><div class="font-mono text-green" style="font-size:0.55rem;letter-spacing:0.15em">BLITZ WINDOW</div><div style="font-weight:700;font-size:0.875rem">Permanent Upgrades</div></div><div id="blitz-timer" class="font-mono text-green" style="font-size:1.125rem;font-weight:700">' + fmtCd(blitzRem()) + '</div></div>';
    G.blitzUpgrades.forEach(function (u) {
      h += '<div class="flex-between p-3 mb-2" style="background:rgba(0,0,0,0.35);border-radius:0.75rem;border:1px solid ' + (u.purchased ? 'rgba(100,100,100,0.3)' : 'rgba(57,255,20,0.25)') + '"><div style="flex:1;margin-right:0.5rem"><div style="font-size:0.75rem;font-weight:600">' + esc(u.name) + '</div><div class="text-muted" style="font-size:0.55rem">' + esc(u.description) + '</div></div><button type="button" class="game-btn game-btn-sm' + (u.purchased ? '' : ' game-btn-green') + '" data-action="buy-blitz" data-id="' + u.id + '"' + (u.purchased || G.cash < u.price ? ' disabled' : '') + '>' + (u.purchased ? 'PURCHASED' : fmtCash(u.price)) + '</button></div>';
    });
    h += '</div><div class="section-label mb-2">GENERAL STORE</div>';
    G.inventory.forEach(function (it) {
      var def = STORE.find(function (x) { return x.id === it.id; }) || it;
      var revBonus = def.revPerSec || (it.type === 'nutrient' ? 0.5 : it.type === 'pipe' ? 1.2 : 0);
      h += '<div class="neon-card p-3 mb-2"><div class="flex-row"><div style="font-size:1.5rem">' + it.emoji + '</div><div style="flex:1;min-width:0"><div style="font-weight:600;font-size:0.875rem">' + esc(it.name) + '</div><div class="text-muted text-xs">' + esc(def.desc || it.type) + '</div><div class="font-mono text-green text-xs mt-1">+' + revBonus + '/sec each · Owned: ' + it.owned + '</div></div><button type="button" class="game-btn game-btn-green game-btn-sm" data-action="buy-item" data-id="' + it.id + '"' + (G.cash < it.price ? ' disabled' : '') + '>' + fmtCash(it.price) + '</button></div></div>';
    });
    h += '</div>';
    return h;
  }

  function renderIndex() {
    var list = filteredStrains();
    var h = '<div class="screen-section"><div class="neon-card neon-card-green neon-card-pulse p-4 text-center mb-2"><div class="font-mono text-green" style="font-size:0.55rem;letter-spacing:0.3em">STRAIN INDEX</div><div class="font-display chromatic-text" style="font-size:1.875rem;font-weight:700">' + G.strains.length + ' <span class="text-muted" style="font-size:1rem">/ ∞</span></div><div class="text-muted text-xs">All strains in your collection</div></div>';
    h += '<input type="search" class="input-field mb-2" placeholder="Search strains..." data-action="index-search" value="' + esc(G.indexSearch || '') + '">';
    h += '<div class="flex-row gap-2 mb-2"><button type="button" class="game-btn game-btn-green game-btn-sm" style="flex:1" data-action="open-merge-lab">🧬 MERGE STRAINS</button></div>';
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
      if (foc) h += '<div class="neon-card p-4 mt-2" style="max-height:16rem;overflow-y:auto"><div class="font-mono text-green text-xs mb-2">FOCUSED GENETICS</div><div class="flex-row mb-2">' + budImg(foc, '2.5rem') + '<div><div style="font-weight:700">' + esc(foc.name) + '</div><div class="text-xs" style="color:' + rarityColor(foc.rarity) + '">' + esc(rarityName(foc.rarity)) + (foc.planetExclusive ? ' · PLANET EXCLUSIVE' : '') + '</div></div></div>' + abilityListHtml(foc, { upgradeable: true }) + '<button type="button" class="game-btn game-btn-green game-btn-sm w-full mt-2" data-action="up-strain" data-id="' + esc(foc.id) + '">UPGRADE · ' + fmtCash(upCost(foc)) + '</button></div>';
    }
    h += '</div>';
    return h;
  }

  function renderMap() {
    var owned = G.ownedPlanets || [];
    var h = '<div class="screen-section map-screen"><div class="text-center mb-2"><h2 class="font-display chromatic-text" style="font-size:1.125rem;letter-spacing:0.2em">UNIVERSE MAP</h2><p class="font-mono text-muted text-xs">' + owned.length + ' claimed world' + (owned.length === 1 ? '' : 's') + ' · scan the void</p></div>';
    h += '<div class="map-scan-rail' + (UI.scanAnimating ? ' map-scan-active' : '') + '"><div class="map-scan-line"></div><div class="map-scan-beam"></div>';
    h += '<button type="button" class="map-scan-bubble" data-action="map-scan"' + (UI.scanAnimating ? ' disabled' : '') + '><span class="map-scan-label">SCAN</span></button></div>';
    if (UI.scanAnimating) h += '<div class="font-mono text-cyan text-xs text-center mb-3 map-pulse">Scanning hyperspace lanes…</div>';
    if (G.scanPending) {
      var p = G.scanPending;
      var exStrain = genExclusivePlanetStrain(p);
      h += '<div class="section-label section-label-green mb-2">PLANET DETECTED</div>';
      h += '<div class="liftable-wrap mb-3" data-lift="planet-scan">' + planetCardHtml(p) + '</div>';
      h += '<div class="neon-card p-3 mb-3 text-xs text-muted">Exclusive strain: <span class="text-green">' + esc(exStrain.name) + '</span> (' + esc(rarityName(p.rarity)) + ') — harvestable only on this world.</div>';
      h += '<input type="text" class="input-field mb-2" placeholder="Name your planet (optional)" data-action="planet-rename-pending" value="' + esc(p.customName || '') + '">';
      h += '<div class="flex-row gap-2 mb-3"><button type="button" class="game-btn game-btn-green" style="flex:1" data-action="planet-keep">KEEP</button><button type="button" class="game-btn" style="flex:1" data-action="planet-discard">DISCARD</button></div>';
    }
    if (owned.length) {
      h += '<div class="section-label mb-2">OWNED WORLDS</div>';
      h += '<div class="binder-grid planet-owned-grid mb-3">';
      owned.forEach(function (pl) {
        var sel = UI.focusedPlanetId === pl.id;
        h += '<div class="liftable-wrap planet-lift-wrap" data-lift="planet-' + esc(pl.id) + '">' + planetCardHtml(pl, { selected: sel }) + '</div>';
      });
      h += '</div>';
      var fpl = UI.focusedPlanetId ? owned.find(function (p) { return p.id === UI.focusedPlanetId; }) : owned[0];
      if (fpl) {
        var strain = strainById(fpl.exclusiveStrainId);
        h += '<div class="neon-card p-3 mb-3 planet-owned-detail"><div style="font-weight:600;font-size:0.9rem;text-align:center">' + esc(planetDisplayName(fpl)) + '</div>';
        h += '<div class="text-muted text-xs text-center mb-2">' + fmtRev(planetOutputPerSec(fpl) * 8) + ' · x' + (fpl.upgraderMult || 1) + ' mult</div>';
        if (strain) h += '<div class="text-green text-xs text-center mb-2">' + esc(strain.name) + ' · stored ' + Math.floor(fpl.storedYield || 0) + '</div>';
        h += '<input type="text" class="input-field mb-2" placeholder="Rename planet" data-action="planet-rename" data-id="' + esc(fpl.id) + '" value="' + esc(fpl.customName || '') + '">';
        var hc = 5000 * (fpl.harvesterLv + 1), cc = 4000 * (fpl.conveyorLv + 1), uc = 25 * (fpl.upgraderMult || 1);
        h += '<div class="grid-3 gap-2 mb-2"><button type="button" class="game-btn game-btn-sm game-btn-green" data-action="up-planet" data-id="' + esc(fpl.id) + ':harvester"' + (G.cash < hc || fpl.harvesterLv >= 20 ? ' disabled' : '') + '>HARV Lv.' + fpl.harvesterLv + '</button>';
        h += '<button type="button" class="game-btn game-btn-sm game-btn-green" data-action="up-planet" data-id="' + esc(fpl.id) + ':conveyor"' + (G.cash < cc || fpl.conveyorLv >= 20 ? ' disabled' : '') + '>CONV Lv.' + fpl.conveyorLv + '</button>';
        h += '<button type="button" class="game-btn game-btn-sm" data-action="up-planet" data-id="' + esc(fpl.id) + ':upgrader"' + (G.sp < uc || (fpl.upgraderMult || 1) >= 8 ? ' disabled' : '') + '>x' + (fpl.upgraderMult || 1) + ' · ' + uc + ' SP</button></div>';
        h += '<button type="button" class="game-btn game-btn-green w-full game-btn-sm" data-action="harvest-planet" data-id="' + esc(fpl.id) + '"' + ((fpl.storedYield || 0) < 1 ? ' disabled' : '') + '>HARVEST EXCLUSIVE STRAIN</button></div>';
      }
    } else if (!G.scanPending && !UI.scanAnimating) {
      h += '<div class="neon-card p-4 text-center text-muted text-sm">No worlds claimed. Tap SCAN on the rail to probe the universe.</div>';
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
      var bet = casinoBet('blackjack');
      h += '<div class="casino-scene"><div class="casino-table neon-card neon-card-static p-4 mb-3">';
      h += renderBetPicker('blackjack');
      if (!bj) {
        h += '<p class="text-muted text-xs text-center mb-3">Beat the dealer to 21. Current bet: <span class="text-green">' + fmtCash(bet) + '</span></p>';
        h += '<button type="button" class="game-btn game-btn-green w-full" data-action="blackjack-deal"' + (G.cash < bet ? ' disabled' : '') + '>DEAL · ' + fmtCash(bet) + '</button>';
      } else {
        h += '<div class="bj-zone mb-3"><div class="bj-label text-muted">DEALER · ' + (bj.done ? handVal(bj.dealer) : '?') + '</div>' + playingHandHtml(bj.dealer, !bj.done) + '</div>';
        h += '<div class="bj-zone mb-3"><div class="bj-label text-green">YOU · ' + handVal(bj.player) + '</div>' + playingHandHtml(bj.player, false) + '</div>';
        if (bj.done) h += '<div class="text-center mb-3 bj-result ' + (bj.win === true ? 'text-green' : bj.win === false ? 'text-muted' : 'text-cyan') + '">' + (bj.win === true ? 'YOU WIN +' + fmtCash(bj.bet) + '!' : bj.win === false ? 'BUST / LOSE' : 'PUSH') + '</div>';
        else h += '<div class="flex-row gap-2"><button type="button" class="game-btn game-btn-green" style="flex:1" data-action="blackjack-hit">HIT</button><button type="button" class="game-btn" style="flex:1" data-action="blackjack-stand">STAND</button></div>';
        if (bj.done) h += '<button type="button" class="game-btn w-full mt-2" data-action="blackjack-deal"' + (G.cash < bet ? ' disabled' : '') + '>DEAL AGAIN · ' + fmtCash(bet) + '</button>';
      }
      h += '<button type="button" class="game-btn w-full mt-2" data-action="casino-select" data-id="menu">← BACK</button></div></div>';
      return h;
    }
    if (UI.casinoGame === 'slots-info') {
      h += renderBetPicker('slots');
      h += '<div class="neon-card neon-card-static p-4 text-center text-sm text-muted mb-3">Slot machine opens during an active poker session. Spins cost your selected bet (' + fmtCash(casinoBet('slots')) + ').</div><button type="button" class="game-btn w-full" data-action="casino-select" data-id="menu">← BACK</button></div>';
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
    el.innerHTML = '<button type="button" class="overlay-backdrop" data-action="close-slots"></button><div class="overlay-panel slot-machine p-5 text-center"><h3 class="font-display mb-2">VOID SLOTS</h3>' + renderBetPicker('slots') + '<div class="slot-reels font-mono" style="font-size:2rem;letter-spacing:0.5em;margin:1rem 0">' + r.reels.join(' ') + '</div><div class="text-muted text-xs mb-3">Spin · ' + fmtCash(casinoBet('slots')) + '</div>' + (r.win > 0 ? '<div class="text-green mb-2">Won ' + fmtCash(r.win) + '!</div>' : '') + '<button type="button" class="game-btn game-btn-green w-full mb-2" data-action="slot-spin"' + (G.cash < casinoBet('slots') ? ' disabled' : '') + '>SPIN</button><button type="button" class="game-btn w-full" data-action="close-slots">CLOSE</button></div>';
  }

  function renderStrainPicker() {
    var el = document.getElementById('overlay-strain-picker');
    if (!el) {
      el = document.createElement('div');
      el.id = 'overlay-strain-picker';
      el.className = 'overlay';
      document.getElementById('voidline-app').appendChild(el);
    }
    if (!UI.strainPickerFloorId) { el.classList.remove('open'); el.innerHTML = ''; return; }
    var floor = G.factoryFloors.find(function (f) { return f.id === UI.strainPickerFloorId; });
    if (!floor) { UI.strainPickerFloorId = null; el.classList.remove('open'); el.innerHTML = ''; return; }
    var list = filteredPickerStrains();
    var sort = UI.strainPickerSort || 'rarity';
    el.classList.add('open');
    var h = '<button type="button" class="overlay-backdrop" data-close="strain-picker"></button><div class="overlay-panel strain-picker-panel p-4">';
    h += '<div class="flex-between mb-3"><div><h3 class="font-display" style="font-size:0.875rem;letter-spacing:0.12em">SELECT STRAIN</h3><div class="font-mono text-muted text-xs">' + esc(floor.name) + ' · Floor Lv.' + floor.level + '</div></div><button type="button" class="profile-close" data-close="strain-picker" style="position:static;width:2rem;height:2rem">✕</button></div>';
    h += '<input type="search" class="input-field mb-2" placeholder="Search by name or rarity..." data-action="strain-picker-search" value="' + esc(UI.strainPickerSearch || '') + '" autocomplete="off">';
    h += '<select class="input-field mb-3" data-action="strain-picker-sort"><option value="rarity"' + (sort === 'rarity' ? ' selected' : '') + '>Sort: Rarity (high → low)</option><option value="name"' + (sort === 'name' ? ' selected' : '') + '>Sort: Name</option><option value="recent"' + (sort === 'recent' ? ' selected' : '') + '>Sort: Recent</option></select>';
    if (!G.strains.length) {
      h += '<div class="neon-card p-4 text-center text-muted text-sm">No strains in your Index. Open a pack in Shop first.</div>';
    } else if (!list.length) {
      h += '<div class="neon-card p-4 text-center text-muted text-sm">No strains match your search.</div>';
    } else {
      h += '<div class="binder-grid strain-picker-grid">';
      list.forEach(function (s) {
        var on = floor.equippedStrainId === s.id;
        h += '<button type="button" class="strain-picker-card' + (on ? ' picker-equipped' : '') + '" data-action="pick-floor-strain" data-id="' + esc(s.id) + '">';
        h += crCardHtml(s, { noFocus: true, selected: on });
        if (on) h += '<div class="strain-picker-equipped">EQUIPPED</div>';
        h += '</button>';
      });
      h += '</div>';
    }
    h += '</div>';
    el.innerHTML = h;
  }

  function profileStatsHtml() {
    var dps = totalBattleDps();
    var blitzCount = G.purchasedBlitzIds ? G.purchasedBlitzIds.length : 0;
    var invRev = inventoryRevPerSec();
    var rows = [
      ['Cash', fmtCash(G.cash)], ['SP', fmtSp(G.sp || 0)], ['XP', Math.floor(G.empireXp) + ' / ' + xpNeededForLevel(G.empireLevel)],
      ['Level', 'LV.' + G.empireLevel], ['Boss Round', 'R' + (G.bossRound || 1)], ['Battle DPS', dps.toFixed(1) + '/sec'],
      ['Passive Rev', fmtRev(revSecTotal())], ['Inventory Rev', '+' + invRev.toFixed(1) + '/sec'],
      ['Planets', String((G.ownedPlanets || []).length)], ['Strains', String(G.strains.length)],
      ['Portal Floors', String(G.factoryFloors.length)], ['Blitz Mods', String(blitzCount) + ' / ' + BLITZ.length],
      ['Scan Bonus', ((scanMult() * 100).toFixed(0)) + '%'], ['Equipped', String((G.equippedBattleIds || []).length) + ' / ' + BATTLE_EQUIP_MAX],
    ];
    var h = '<div class="profile-stats-scroll"><div class="stat-grid profile-stat-grid">';
    rows.forEach(function (r) {
      h += '<div class="neon-card stat-box"><div class="stat-label">' + esc(r[0]) + '</div><div class="stat-value">' + esc(r[1]) + '</div></div>';
    });
    h += '</div></div>';
    return h;
  }

  function helpEncyclopediaHtml() {
    return '<div class="help-scroll text-xs" style="line-height:1.55;color:var(--muted)">' +
      '<p><span class="text-green">SP</span> — Strain Points from boss waves. Spend on merges, ability upgrades, and planet multipliers.</p>' +
      '<p><span class="text-green">XP</span> — Empire XP from packs, clones, harvests. Level up for milestone packs.</p>' +
      '<p><span class="text-green">Planets</span> — Scan the map, claim worlds, upgrade harvesters/conveyors, harvest exclusive strains.</p>' +
      '<p><span class="text-green">Boss</span> — 5 waves per cycle; wave 5 is mega boss with twin pack reward. Equip strains for DPS.</p>' +
      '<p><span class="text-green">Strains</span> — CR cards with THC, yield, abilities. Equip for battle or portal floors.</p>' +
      '<p><span class="text-green">Merge</span> — Fuse two parents in the Merge Lab for 15 SP → new F1 hybrid.</p>' +
      '<p><span class="text-green">Shop</span> — Packs, blitz upgrades, nutrients (+0.5/sec), pipes (+1.2–2.5/sec).</p>' +
      '<p><span class="text-green">Packs</span> — Basic, guaranteed, and omega rift packs add genetics to your Index.</p>' +
      '<p><span class="text-green">Conveyors</span> — Planet conveyors speed stored yield; harvest when ready.</p>' +
      '<p><span class="text-green">Floors</span> — Portal farm floors mine passive cash when strains are equipped.</p>' +
      '<p><span class="text-green">Stats</span> — Profile Stats tab tracks empire progress at a glance.</p></div>';
  }

  function renderMergeLab() {
    var el = document.getElementById('overlay-merge-lab');
    if (!el) return;
    var ml = UI.mergeLab || { open: false };
    if (!ml.open) { el.classList.remove('open'); el.innerHTML = ''; return; }
    el.classList.add('open');
    var phase = ml.phase || 'idle';
    var err = ml.error || mergeLabError();
    var h = '<button type="button" class="overlay-backdrop" data-action="close-merge-lab"></button><div class="overlay-panel merge-lab-panel p-4">';
    h += '<div class="flex-between mb-3"><h3 class="font-display" style="font-size:0.875rem;letter-spacing:0.12em">MERGE LAB</h3><button type="button" class="profile-close" data-action="close-merge-lab" style="position:static;width:2rem;height:2rem">✕</button></div>';
    if (phase === 'reveal' && ml.child) {
      h += '<div class="text-center mb-3">' + crCardHtml(ml.child, { noFocus: true, large: true }) + '</div>';
      h += '<p class="text-muted text-xs text-center mb-3">New hybrid ready for the Index!</p>';
      h += '<button type="button" class="game-btn game-btn-green w-full" data-action="merge-add-index">ADD TO INDEX</button>';
    } else if (phase === 'fusing') {
      h += '<div class="merge-result-card mb-3"><div class="cr-card-frame cr-tier-epic merge-mystery-card"><div class="cr-card-arena"></div><div class="merge-mystery-q">?</div><div class="cr-card-banner"><span class="cr-card-name">Fusing…</span></div></div></div>';
      h += '<div class="merge-fuse-anim font-mono text-green text-center text-xs">Genetic recombination in progress…</div>';
    } else {
      h += '<div class="merge-result-card mb-3"><div class="cr-card-frame cr-tier-epic merge-mystery-card"><div class="cr-card-arena"></div><div class="merge-mystery-q">?</div><div class="cr-card-banner"><span class="cr-card-name">Mystery Hybrid</span></div></div></div>';
      h += '<div class="merge-slots flex-row mb-3" style="justify-content:center;align-items:center;gap:0.5rem">';
      [G.breedSlotA, G.breedSlotB].forEach(function (sid, si) {
        var bs = sid ? strainById(sid) : null;
        h += '<div class="merge-slot">' + (bs ? crCardHtml(bs, { noFocus: true }) : '<div class="merge-slot-empty">Slot ' + (si + 1) + '</div>') + '</div>';
        if (si === 0) h += '<div class="merge-plus">+</div>';
      });
      h += '</div>';
      h += '<div class="binder-grid merge-pick-grid mb-3" style="max-height:28vh;overflow-y:auto">';
      G.strains.filter(function (s) { return !s.planetExclusive || s.quantity > 1; }).forEach(function (s) {
        var onA = G.breedSlotA === s.id, onB = G.breedSlotB === s.id;
        h += '<button type="button" class="merge-pick-card' + (onA || onB ? ' selected' : '') + '" data-action="merge-pick" data-id="' + esc(s.id) + '">' + crCardHtml(s, { noFocus: true, selected: onA || onB }) + '</button>';
      });
      h += '</div>';
      if (err) h += '<div class="text-xs mb-2" style="color:#F87171;text-align:center">' + esc(err) + '</div>';
      h += '<button type="button" class="game-btn game-btn-green w-full" data-action="breed-run"' + (err ? ' disabled' : '') + '>FUSE · ' + MERGE_SP_COST + ' SP</button>';
    }
    h += '</div>';
    el.innerHTML = h;
  }

  function renderProfile() {
    var pl = playerDef(activePlayerId);
    var tab = UI.profileTab || 'stats';
    var h = '<div class="profile-banner"><button type="button" class="profile-close" data-close="profile">✕</button><div class="profile-avatar-lg"><div class="avatar-ring"></div><div class="avatar-inner" style="inset:4px;font-size:1.5rem;border-width:3px">' + G.avatar + '</div></div></div><div class="profile-body">';
    h += '<div class="farm-tabs mb-3"><button type="button" class="farm-tab' + (tab === 'stats' ? ' active' : '') + '" data-action="profile-tab" data-id="stats">STATS</button><button type="button" class="farm-tab' + (tab === 'custom' ? ' active' : '') + '" data-action="profile-tab" data-id="custom">CUSTOMIZE</button></div>';
    if (tab === 'stats') {
      h += profileStatsHtml();
    } else {
      h += '<div class="font-mono text-green text-center mb-2" style="font-size:0.6rem;letter-spacing:0.2em">' + esc(pl.label.toUpperCase()) + '</div><input type="text" class="input-field text-center font-display chromatic-text mb-3" id="edit-name" value="' + esc(G.name) + '" maxlength="24">';
      h += '<div class="font-mono text-muted mb-2" style="font-size:0.5rem">AVATAR</div><div class="avatar-picker">';
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
    }
    h += '<div class="flex-row gap-2 mb-3"><button type="button" class="game-btn" style="flex:1" data-action="switch-player">⇄ SWITCH PLAYER</button><button type="button" class="game-btn" style="flex:1" data-action="open-settings">⚙ SETTINGS</button></div><button type="button" class="game-btn game-btn-green w-full" data-close="profile">RESUME</button></div>';
    document.getElementById('profile-panel').innerHTML = h;
  }

  function renderSettings() {
    var helpOpen = UI.helpOpen;
    var h = '<div class="flex-between mb-3"><h3 class="font-display" style="font-size:0.875rem;letter-spacing:0.2em">SYSTEM CONFIG</h3><button type="button" data-close="settings" style="background:none;border:none;color:var(--muted);font-size:1.125rem;cursor:pointer">✕</button></div>';
    h += '<div class="flex-between p-4 mb-3" style="border-radius:0.75rem;background:' + (UI.realityWarp ? 'rgba(57,255,20,0.08)' : 'rgba(31,0,51,0.5)') + ';border:1px solid ' + (UI.realityWarp ? 'rgba(57,255,20,0.4)' : 'rgba(61,0,102,0.6)') + '"><div><div class="chromatic-text" style="font-weight:600;font-size:0.875rem">Reality Warp Mode</div><div class="text-muted" style="font-size:0.65rem">Subtle color drift & soft pulse</div></div><button type="button" class="toggle-switch" data-action="toggle-warp" style="background:' + (UI.realityWarp ? 'linear-gradient(90deg,#39FF14,#A855F7)' : 'rgba(61,0,102,0.8)') + '"><span class="toggle-knob" style="left:' + (UI.realityWarp ? 'calc(100% - 1.625rem)' : '0.125rem') + '"></span></button></div>';
    h += '<button type="button" class="game-btn w-full mb-2" data-action="toggle-help">' + (helpOpen ? '✕ CLOSE HELP' : '📖 GAME ENCYCLOPEDIA') + '</button>';
    if (helpOpen) h += helpEncyclopediaHtml();
    h += '<button type="button" class="game-btn w-full mb-2" data-action="switch-player">⇄ SWITCH PLAYER</button>';
    document.getElementById('settings-panel').innerHTML = h;
  }

  function renderPack() {
    var pr = G.packReveal;
    var hasDual = pr.strains && pr.strains.length >= 2;
    var hasSingle = !!pr.strain;
    if (!pr.open || (!hasSingle && !hasDual)) { document.getElementById('overlay-pack-reveal').classList.remove('open'); return; }
    var title = (pr.packType || 'reward').toUpperCase().replace(/-/g, ' ');
    var inner = '<div class="font-mono text-muted mb-2" style="font-size:0.6rem;letter-spacing:0.4em">' + esc(title) + '</div>';
    if (hasDual) {
      inner += '<div class="dual-pack-grid mb-3">';
      pr.strains.forEach(function (s) {
        inner += '<div>' + crCardHtml(s, { noFocus: true, large: true }) + '</div>';
      });
      inner += '</div><p class="text-muted text-xs mb-3">Two unique genetics — never the same genome.</p>';
    } else {
      var s = pr.strain;
      inner += '<div class="mb-3">' + crCardHtml(s, { noFocus: true, large: true }) + '</div>';
      inner += abilityListHtml(s) + '<div class="grid-3 mb-4 mt-3"><div class="neon-card stat-box"><div class="stat-label">THC</div><div class="stat-value">' + s.thcPercent + '%</div></div><div class="neon-card stat-box"><div class="stat-label">YIELD</div><div class="stat-value">' + s.yield + '</div></div><div class="neon-card stat-box"><div class="stat-label">POTENCY</div><div class="stat-value">' + s.potency + '</div></div></div>';
    }
    var borderC = hasDual ? '#39FF14' : rarityColor(pr.strain.rarity);
    document.getElementById('pack-panel').innerHTML = '<div class="overlay-panel pack-reveal-card" style="background:linear-gradient(160deg,rgba(61,0,102,0.9),#0C011A 50%,#1a0040);border:2px solid ' + borderC + ';box-shadow:0 0 60px ' + borderC + '66"><div class="pack-shimmer"></div><div class="p-5 text-center" style="position:relative">' + inner + '<button type="button" class="game-btn game-btn-green w-full" data-close="pack">ADD TO INDEX</button></div></div>';
    document.getElementById('overlay-pack-reveal').classList.add('open');
  }

  function renderLiftBody() {
    var id = UI.liftedCardId;
    if (!id) return '';
    if (id.indexOf('index-') === 0) {
      var s = strainById(id.slice(6));
      if (!s) return '';
      return crCardHtml(s, { selected: G.focusedStrainId === s.id, large: true }) + '<div class="mt-3">' + abilityListHtml(s, { upgradeable: true }) + '<button type="button" class="game-btn game-btn-green game-btn-sm w-full mt-2" data-action="up-strain" data-id="' + esc(s.id) + '">UPGRADE · ' + fmtCash(upCost(s)) + '</button></div>';
    }
    if (id.indexOf('planet-') === 0) {
      var pid = id.slice(7);
      var pl = (G.ownedPlanets || []).find(function (p) { return p.id === pid; });
      if (!pl) return '';
      return planetCardHtml(pl, { large: true }) + '<div class="mt-3 text-xs text-muted text-center">' + fmtRev(planetOutputPerSec(pl) * 8) + ' · exclusive genetics</div>';
    }
    if (id === 'planet-scan' && G.scanPending) {
      return planetCardHtml(G.scanPending) + '<div class="mt-3 text-xs text-muted text-center">Rarity-tier genetics exclusive to this world.</div>';
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
    el.innerHTML = '<button type="button" class="card-lift-backdrop" data-action="dismiss-lift"></button><div class="lifted-card"><div class="neon-card neon-card-static" style="max-height:80vh;overflow-y:auto">' + body + (UI.liftOnUpgrade ? '<div class="lift-actions"><button type="button" class="game-btn game-btn-green" data-action="lift-upgrade">🔋 UPGRADE CARD</button></div>' : '') + '</div></div>';
  }

  function renderBeam() {
    var b = document.getElementById('overlay-transaction-beam');
    if (G.transactionBeam && G.transactionBeam.active) { b.classList.add('active'); document.getElementById('beam-label').textContent = G.transactionBeam.from + ' → ' + G.transactionBeam.to; }
    else b.classList.remove('active');
  }

  function activeScreen() {
    if (UI.farmOpen && UI.activeTab === 'battle') return renderFarm;
    var screens = { battle: renderBattle, shop: renderShop, index: renderIndex, map: renderMap, coop: renderCoop, casino: renderCasino };
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
    renderStrainPicker();
    renderMergeLab();
  }

  var saveTimer = null;
  var lastSaveAt = 0;
  var AUTOSAVE_MS = 2500;
  function scheduleSave() { if (saveTimer) clearTimeout(saveTimer); saveTimer = setTimeout(flushSave, 400); }
  function flushSave() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (!G || !activePlayerId || UI.playerSelectOpen) return;
    var ok = saveGame();
    if (ok) lastSaveAt = Date.now();
  }
  function resolveStartupPlayer() {
    try {
      var pid = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(LAST_PLAYER_KEY);
      if (pid && PLAYERS.some(function (p) { return p.id === pid; })) return pid;
    } catch (e) { }
    return null;
  }
  function hasAnyPlayerSave() {
    return PLAYERS.some(function (p) { return !!readPlayerSave(p.id); });
  }

  function runAction(act, val) {
    if (act==='pick-player') { selectPlayer(val); return; }
    if (act==='switch-player') { switchPlayerPrompt(); scheduleSave(); render(); return; }
    if (act==='toggle-farm') {
      if (UI.activeTab !== 'battle') UI.activeTab = 'battle';
      UI.farmOpen = !UI.farmOpen;
      if (UI.farmOpen) plantSay('tab_farm', true);
      scheduleSave(); render(); return;
    }
    if (act==='buy-pack') buyPack(val);
    else if (act==='buy-blitz') buyBlitz(val);
    else if (act==='buy-item') buyItem(val);
    else if (act==='buy-portal') buyPortal();
    else if (act==='farm-tab') { G.farmSubTab = val; }
    else if (act==='open-profile') { UI.profileOpen = true; UI.settingsOpen = false; }
    else if (act==='up-sector') upSector(val);
    else if (act==='accept-offer') acceptOffer(val);
    else if (act==='counter-offer') counterOffer(val);
    else if (act==='equip-floor') equipFloor(val.split(':')[0], val.split(':')[1] || null);
    else if (act==='open-strain-picker') { UI.strainPickerFloorId = val; UI.strainPickerSearch = ''; UI.strainPickerSort = 'rarity'; }
    else if (act==='close-strain-picker') { UI.strainPickerFloorId = null; }
    else if (act==='pick-floor-strain') { if (UI.strainPickerFloorId) { equipFloor(UI.strainPickerFloorId, val); UI.strainPickerFloorId = null; plantSay('equip'); } }
    else if (act==='clear-floor-strain') equipFloor(val, null);
    else if (act==='strain-picker-search') UI.strainPickerSearch = val;
    else if (act==='strain-picker-sort') UI.strainPickerSort = val;
    else if (act==='up-floor') upFloor(val);
    else if (act==='equip-battle') equipBattle(val);
    else if (act==='equip-best') equipBestBattle();
    else if (act==='battle-equip-search') UI.battleEquipSearch = val;
    else if (act==='battle-equip-sort') UI.battleEquipSort = val;
    else if (act==='open-merge-lab') { UI.mergeLab = { open: true, phase: 'idle', child: null, error: '' }; }
    else if (act==='close-merge-lab') { UI.mergeLab = { open: false, phase: 'idle', child: null, error: '' }; G.breedSlotA = null; G.breedSlotB = null; }
    else if (act==='merge-add-index') finishMergeLab();
    else if (act==='merge-pick') {
      if (G.breedSlotA !== val && G.breedSlotB !== val) {
        if (!G.breedSlotA) G.breedSlotA = val;
        else if (!G.breedSlotB) G.breedSlotB = val;
        else G.breedSlotB = val;
      } else {
        if (G.breedSlotA === val) G.breedSlotA = null;
        if (G.breedSlotB === val) G.breedSlotB = null;
      }
      UI.mergeLab = Object.assign({}, UI.mergeLab || {}, { error: '' });
    }
    else if (act==='profile-tab') UI.profileTab = val;
    else if (act==='toggle-help') UI.helpOpen = !UI.helpOpen;
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
    else if (act==='blackjack-deal') { if (G.cash >= casinoBet('blackjack')) startBlackjack(); }
    else if (act==='blackjack-hit') blackjackHit();
    else if (act==='blackjack-stand') blackjackStand();
    else if (act==='set-bet') {
      var bp = val.split(':');
      var bgame = bp[0];
      var braw = bp.slice(1).join(':');
      if (braw === 'max') setCasinoBet(bgame, G.cash);
      else setCasinoBet(bgame, parseInt(braw, 10) || casinoBet(bgame));
    }
    else if (act==='open-slots') { var rm = getPokerRoom(); if (rm.active) UI.slotOverlay = true; }
    else if (act==='close-slots') UI.slotOverlay = false;
    else if (act==='slot-spin') spinSlots();
    else if (act==='map-scan') { startMapScan(); scheduleSave(); render(); return; }
    else if (act==='planet-keep') { keepScannedPlanet(); }
    else if (act==='planet-discard') { discardScannedPlanet(); }
    else if (act==='planet-focus') { UI.focusedPlanetId = UI.focusedPlanetId === val ? null : val; }
    else if (act==='up-planet') { var pu = val.split(':'); upPlanetUpgrade(pu[0], pu[1]); }
    else if (act==='harvest-planet') { harvestPlanet(val); }
    else if (act==='breed-run') { startMergeFuse(); return; }
    else if (act==='up-ability') { var ab = val.split(':'); upStrainAbility(ab[0], ab[1]); }
    else if (act==='breed-pick') {
      var bp = val.split(':');
      if (bp[0] === 'a') G.breedSlotA = bp[1] || null;
      else G.breedSlotB = bp[1] || null;
    }
    else if (act==='planet-rename') { renamePlanet(val.split(':')[0], val.split(':').slice(1).join(':')); }
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
      if (tab !== UI.activeTab) clearArcadePops();
      UI.activeTab = tab;
      if (tab === 'map' && !UI.focusedPlanetId && G.ownedPlanets && G.ownedPlanets.length) UI.focusedPlanetId = G.ownedPlanets[0].id;
      render();
      return;
    }
    if (t.dataset.close === 'profile') { UI.profileOpen = false; render(); return; }
    if (t.dataset.close === 'settings') { UI.settingsOpen = false; render(); return; }
    if (t.dataset.close === 'pack') { closePack(); render(); return; }
    if (t.dataset.close === 'strain-picker') { UI.strainPickerFloorId = null; render(); return; }
    if (t.dataset.action) {
      e.stopPropagation();
      var a = t.dataset.action, v = t.dataset.id || t.dataset.pack || t.dataset.pid || t.dataset.av;
      if (a === 'equip-floor') runAction(a, t.dataset.id + ':' + (t.value !== undefined ? t.value : ''));
      else if (a === 'set-bet') runAction(a, t.dataset.id);
      else if (a === 'set-badge') runAction(a, t.dataset.slot + ':' + t.value);
      else if (a === 'sf-strain') runAction(a, t.dataset.slot + ':' + t.value);
      else if (a === 'sf-price') runAction(a, t.dataset.slot + ':' + t.value);
      else if (a === 'set-avatar') runAction(a, t.dataset.av);
      else if (a === 'pick-player') runAction(a, t.dataset.pid);
      else runAction(a, v);
      return;
    }
    var liftEl = e.target.closest('[data-lift]');
    if (liftEl && !UI.liftedCardId) {
      UI.liftedCardId = liftEl.dataset.lift;
      if (UI.liftedCardId.indexOf('planet-') === 0) UI.focusedPlanetId = UI.liftedCardId.slice(7);
      UI.liftOnUpgrade = liftEl.dataset.liftUp || null;
      render();
      return;
    }
    if (t.dataset.strainFocus) { G.focusedStrainId = G.focusedStrainId === t.dataset.strainFocus ? null : t.dataset.strainFocus; scheduleSave(); render(); return; }
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
    if (t.dataset.action === 'breed-pick') runAction('breed-pick', t.dataset.slot + ':' + t.value);
    if (t.dataset.action === 'strain-picker-sort') { runAction('strain-picker-sort', t.value); render(); }
    if (t.dataset.action === 'battle-equip-sort') { runAction('battle-equip-sort', t.value); render(); }
  });

  document.getElementById('voidline-app').addEventListener('input', function (e) {
    if (e.target.id === 'edit-name') G.name = e.target.value.trim() || playerDef(activePlayerId).defaultName;
    if (e.target.dataset.action === 'counter-input') { G.counterPrices = Object.assign({}, G.counterPrices, { [e.target.dataset.id]: Number(e.target.value) }); render(); }
    if (e.target.dataset.action === 'index-search') { G.indexSearch = e.target.value; render(); }
    if (e.target.dataset.action === 'battle-equip-search') { UI.battleEquipSearch = e.target.value; render(); }
    if (e.target.dataset.action === 'strain-picker-search') { UI.strainPickerSearch = e.target.value; renderStrainPicker(); }
    if (e.target.dataset.action === 'planet-rename') { renamePlanet(e.target.dataset.id, e.target.value); }
    if (e.target.dataset.action === 'planet-rename-pending' && G.scanPending) {
      G.scanPending = Object.assign({}, G.scanPending, { customName: e.target.value.trim() || null });
    }
  });

  try {
    var storedVer = localStorage.getItem(VERSION_KEY);
    if (storedVer !== APP_VERSION) localStorage.setItem(VERSION_KEY, APP_VERSION);
    var startPid = resolveStartupPlayer();
    if (startPid) {
      selectPlayer(startPid);
    } else if (hasAnyPlayerSave()) {
      UI.playerSelectOpen = true;
      G = freshState('aden');
      render();
    } else {
      UI.playerSelectOpen = true;
      G = freshState('aden');
      render();
    }
  } catch (e) { UI.playerSelectOpen = true; G = freshState('aden'); render(); }

  window.addEventListener('pagehide', flushSave);
  window.addEventListener('beforeunload', flushSave);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') flushSave();
  });

  setInterval(function () {
    if (!G || UI.playerSelectOpen) return;
    tick(Date.now());
    renderHUD();
    if (UI.activeTab === 'battle' && !UI.farmOpen) {
      var hp = document.querySelector('.boss-hp-fill');
      if (hp && G.bossMaxHp) hp.style.width = Math.max(0, G.bossHp / G.bossMaxHp * 100) + '%';
      var dpsEl = document.querySelector('.boss-arena .font-mono.text-green.text-xs.mt-2');
      if (dpsEl) dpsEl.textContent = 'DPS ' + totalBattleDps().toFixed(1) + '/sec';
    }
    var xpNeed = xpNeededForLevel(G.empireLevel);
    var xpFill = document.getElementById('hud-xp-fill');
    var xpText = document.getElementById('hud-xp-text');
    if (xpFill) xpFill.style.width = Math.min(100, (G.empireXp / xpNeed) * 100) + '%';
    if (xpText) xpText.textContent = 'XP ' + Math.floor(G.empireXp) + ' / ' + xpNeed;
    var spEl = document.getElementById('hud-sp');
    if (spEl) spEl.textContent = fmtSp(G.sp || 0);
    renderBattleToasts();
    renderArcadePopsIfDirty();
    if (UI.activeTab === 'shop') { var cd = document.getElementById('blitz-timer'); if (cd) cd.textContent = fmtCd(blitzRem()); }
    if (UI.farmOpen && G.farmSubTab === 'portal' && G.cloneJob) { var cr = document.querySelector('.clone-active .font-mono.text-green'); if (cr) cr.textContent = fmtCd(cloneRem()); }
    document.getElementById('hud-cash').textContent = fmtCash(G.cash);
    if (G.cash < 10000 && Date.now() - dialogueState.lastAt > 60000) plantSay('lowcash');
    if (Date.now() - lastSaveAt >= AUTOSAVE_MS) flushSave();
  }, 50);
})();
