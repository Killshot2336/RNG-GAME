/* Voidline Galaxy Farm — procedural ability & blitz catalogs (500 each) */
(function (global) {
  'use strict';

  var CORE_ABILITIES = [
    { id: 'crit_burst', mechanic: 'crit_burst', name: 'Crit Burst', category: 'battle', desc: '15% chance to deal 3× boss damage per hit.', minRarity: 4, icon: '💥' },
    { id: 'yield_surge', mechanic: 'yield_surge', name: 'Yield Surge', category: 'passive', desc: '+20% passive revenue from portal floors.', minRarity: 3, icon: '📈' },
    { id: 'thc_overdrive', mechanic: 'thc_overdrive', name: 'THC Overdrive', category: 'battle', desc: '+15% battle DPS from this strain.', minRarity: 4, icon: '⚡' },
    { id: 'shield_sap', mechanic: 'shield_sap', name: 'Shield Sap', category: 'battle', desc: 'Boss HP regen slowed by 8% while equipped.', minRarity: 6, icon: '🛡' },
    { id: 'poison_cloud', mechanic: 'poison_cloud', name: 'Poison Cloud', category: 'battle', desc: 'Adds 5× quantity DoT to boss each tick.', minRarity: 5, icon: '☠' },
    { id: 'clone_echo', mechanic: 'clone_echo', name: 'Clone Echo', category: 'economy', desc: '−10% clone duration empire-wide per stack.', minRarity: 2, icon: '🧬' },
    { id: 'cash_magnet', mechanic: 'cash_magnet', name: 'Cash Magnet', category: 'economy', desc: '+8% boss kill cash per equipped copy.', minRarity: 3, icon: '💰' },
    { id: 'portal_sync', mechanic: 'portal_sync', name: 'Portal Sync', category: 'passive', desc: '+12% portal floor revenue when mining.', minRarity: 4, icon: '🌀' },
    { id: 'blitz_rush', mechanic: 'blitz_rush', name: 'Blitz Rush', category: 'economy', desc: '+10% to all purchased blitz modifiers.', minRarity: 8, icon: '🔥' },
    { id: 'rift_luck', mechanic: 'rift_luck', name: 'Rift Luck', category: 'pack', desc: '+5% pack rarity luck per strain owned.', minRarity: 5, icon: '🎲' },
    { id: 'boss_slayer', mechanic: 'boss_slayer', name: 'Boss Slayer', category: 'battle', desc: '+30% boss DPS from this strain.', minRarity: 7, icon: '👹' },
    { id: 'regen_mist', mechanic: 'regen_mist', name: 'Regen Mist', category: 'battle', desc: '+3% battle DPS per wave cleared this cycle.', minRarity: 6, icon: '💨' },
  ];

  var CORE_BLITZ = [
    { id: 'blitz-1', name: 'Hyperdrive Yield', description: '+15% passive revenue', modifier: 0.15, modifierType: 'revenue', price: 50000 },
    { id: 'blitz-2', name: 'Rift Amplifier', description: '+20% strain yield on floors', modifier: 0.2, modifierType: 'yield', price: 75000 },
    { id: 'blitz-3', name: 'Scan Burst', description: '+25% sector scan rate', modifier: 0.25, modifierType: 'scan', price: 60000 },
    { id: 'blitz-4', name: 'Clone Accelerator', description: '−30% clone time', modifier: 0.3, modifierType: 'clone', price: 90000 },
    { id: 'blitz-5', name: 'Pack Resonance', description: '+10% pack rarity luck', modifier: 0.1, modifierType: 'packLuck', price: 120000 },
    { id: 'blitz-fleet', name: 'Fleet Auto-Scanner', description: 'Auto-scan planets every 60s (keeps Mist+)', modifier: 0, modifierType: 'autoScan', price: 150000 },
  ];

  var END_GAME_BLITZ = [
    { id: 'blitz-eg-1', name: 'Singularity Yield Coil', description: '+40% passive revenue', modifier: 0.4, modifierType: 'revenue', price: 2500000, endGame: true, minEmpireLevel: 20 },
    { id: 'blitz-eg-2', name: 'Void Rift Amplifier Mk-VII', description: '+45% portal floor yield', modifier: 0.45, modifierType: 'yield', price: 2800000, endGame: true, minEmpireLevel: 20 },
    { id: 'blitz-eg-3', name: 'Deep Space Scan Matrix', description: '+55% sector scan rate', modifier: 0.55, modifierType: 'scan', price: 2600000, endGame: true, minEmpireLevel: 22 },
    { id: 'blitz-eg-4', name: 'Oracle Pack Resonance', description: '+28% pack rarity luck', modifier: 0.28, modifierType: 'packLuck', price: 3200000, endGame: true, minEmpireLevel: 22 },
    { id: 'blitz-eg-5', name: 'Campaign Apex Overdrive', description: '+38% campaign squad DPS', modifier: 0.38, modifierType: 'battle', price: 4000000, endGame: true, minEmpireLevel: 24 },
    { id: 'blitz-eg-6', name: 'Raid Annihilation Core', description: '+35% raid squad DPS', modifier: 0.35, modifierType: 'raid', price: 3800000, endGame: true, minEmpireLevel: 24 },
    { id: 'blitz-eg-7', name: 'Planet Sovereign Harvest', description: '+50% planet output', modifier: 0.5, modifierType: 'planet', price: 3500000, endGame: true, minEmpireLevel: 25 },
    { id: 'blitz-eg-8', name: 'Temporal Clone Collapse', description: '−45% clone duration', modifier: 0.45, modifierType: 'clone', price: 2900000, endGame: true, minEmpireLevel: 23 },
    { id: 'blitz-eg-9', name: 'Mutation Essence Forge', description: '+60% mutation essence from burns', modifier: 0.6, modifierType: 'mutationEssence', price: 4800000, endGame: true, minEmpireLevel: 26 },
    { id: 'blitz-eg-10', name: 'Boss Bounty Singularity', description: '+35% boss kill cash', modifier: 0.35, modifierType: 'bossCash', price: 3400000, endGame: true, minEmpireLevel: 25 },
    { id: 'blitz-eg-11', name: 'Empire Ascension Node', description: '+30% empire XP gain', modifier: 0.3, modifierType: 'xp', price: 3000000, endGame: true, minEmpireLevel: 23 },
    { id: 'blitz-eg-12', name: 'Syndicate Points Reactor', description: '+40% SP from boss kills', modifier: 0.4, modifierType: 'sp', price: 3600000, endGame: true, minEmpireLevel: 24 },
    { id: 'blitz-eg-13', name: 'Campaign Wave Dominator', description: '+25% boss wave rewards (cash/XP/SP)', modifier: 0.25, modifierType: 'campaignNode', price: 5000000, endGame: true, minEmpireLevel: 28 },
    { id: 'blitz-eg-14', name: 'Void Essence Magnetar', description: '+20% void essence on prestige', modifier: 0.2, modifierType: 'voidEssence', price: 6500000, endGame: true, minEmpireLevel: 30 },
    { id: 'blitz-eg-15', name: 'Omega Fleet Scanner', description: '−30% auto-scan interval + keeps Mist+', modifier: 0.3, modifierType: 'autoScanSpeed', price: 4200000, endGame: true, minEmpireLevel: 27 },
  ];

  var AB_PREFIX = ['Void', 'Rift', 'Nebula', 'Cosmic', 'Dark', 'Crystal', 'Burning', 'Frozen', 'Royal', 'Ancient', 'Quantum', 'Stellar', 'Null', 'Hyper', 'Omega', 'Primal', 'Astral', 'Crimson', 'Emerald', 'Solar'];
  var AB_SUFFIX = ['Burst', 'Surge', 'Overdrive', 'Mist', 'Cloud', 'Echo', 'Magnet', 'Sync', 'Rush', 'Luck', 'Slayer', 'Sap', 'Pulse', 'Fang', 'Bloom', 'Drift', 'Storm', 'Ward', 'Flux', 'Nova'];
  var BLITZ_PREFIX = ['Hyper', 'Void', 'Rift', 'Omega', 'Quantum', 'Stellar', 'Nebula', 'Primal', 'Astral', 'Dark'];
  var BLITZ_CORE = ['Yield Drive', 'Amplifier', 'Scan Burst', 'Clone Coil', 'Pack Luck', 'Battle Forge', 'Planet Harvest', 'Revenue Coil', 'THC Boost', 'Boss Hunter'];
  var BLITZ_TYPES = ['revenue', 'yield', 'scan', 'clone', 'packLuck', 'battle', 'planet', 'autoScan', 'raid', 'mutationEssence', 'bossCash', 'xp', 'sp', 'campaignNode', 'voidEssence', 'autoScanSpeed'];

  function buildAbilityCatalog() {
    var list = [];
    var byId = {};
    var byMech = {};
    CORE_ABILITIES.forEach(function (a) {
      var e = Object.assign({}, a);
      list.push(e);
      byId[e.id] = e;
      byMech[e.mechanic] = e;
    });
    var i = list.length;
    while (list.length < 500) {
      var base = CORE_ABILITIES[i % CORE_ABILITIES.length];
      var prefix = AB_PREFIX[Math.floor(i / CORE_ABILITIES.length) % AB_PREFIX.length];
      var suffix = AB_SUFFIX[(i * 3 + 7) % AB_SUFFIX.length];
      var name = prefix + ' ' + suffix;
      if (i % 17 === 0) name = base.name + ' II';
      else if (i % 23 === 0) name = prefix + ' ' + base.name.split(' ').pop();
      var id = 'ab_' + i;
      var minRarity = Math.min(24, Math.max(base.minRarity, Math.floor(i / 22)));
      var entry = {
        id: id,
        mechanic: base.mechanic,
        name: name,
        category: base.category,
        desc: base.desc,
        minRarity: minRarity,
        icon: base.icon,
      };
      list.push(entry);
      byId[id] = entry;
      i++;
    }
    return { list: list, byId: byId, byMech: byMech, core: CORE_ABILITIES };
  }

  function buildBlitzCatalog() {
    var list = [];
    var byId = {};
    CORE_BLITZ.forEach(function (b) {
      var e = Object.assign({ purchased: false }, b);
      list.push(e);
      byId[e.id] = e;
    });
    END_GAME_BLITZ.forEach(function (b) {
      var e = Object.assign({ purchased: false }, b);
      list.push(e);
      byId[e.id] = e;
    });
    var i = list.length;
    while (list.length < 500) {
      var type = BLITZ_TYPES[i % BLITZ_TYPES.length];
      var prefix = BLITZ_PREFIX[Math.floor(i / BLITZ_TYPES.length) % BLITZ_PREFIX.length];
      var core = BLITZ_CORE[i % BLITZ_CORE.length];
      var mod = 0.08 + (i % 12) * 0.015 + Math.floor(i / 50) * 0.01;
      if (type === 'clone') mod = Math.min(0.45, 0.1 + (i % 8) * 0.04);
      var price = Math.floor(40000 + i * 850 + (i % 7) * 5000);
      var descMap = {
        revenue: '+' + (mod * 100).toFixed(0) + '% passive revenue',
        yield: '+' + (mod * 100).toFixed(0) + '% portal yield',
        scan: '+' + (mod * 100).toFixed(0) + '% scan rate',
        clone: '−' + (mod * 100).toFixed(0) + '% clone time',
        packLuck: '+' + (mod * 100).toFixed(0) + '% pack luck',
        battle: '+' + (mod * 100).toFixed(0) + '% battle DPS',
        planet: '+' + (mod * 100).toFixed(0) + '% planet output',
        autoScan: 'Auto-scan fleet (Mist+ worlds)',
        raid: '+' + (mod * 100).toFixed(0) + '% raid DPS',
        mutationEssence: '+' + (mod * 100).toFixed(0) + '% mutation essence',
        bossCash: '+' + (mod * 100).toFixed(0) + '% boss kill cash',
        xp: '+' + (mod * 100).toFixed(0) + '% empire XP',
        sp: '+' + (mod * 100).toFixed(0) + '% boss SP',
        campaignNode: '+' + (mod * 100).toFixed(0) + '% wave rewards',
        voidEssence: '+' + (mod * 100).toFixed(0) + '% void essence',
        autoScanSpeed: '−' + (mod * 100).toFixed(0) + '% auto-scan interval',
      };
      var id = 'blitz-' + (i + 1);
      var entry = {
        id: id,
        name: prefix + ' ' + core,
        description: descMap[type] || ('+' + (mod * 100).toFixed(0) + '%'),
        modifier: parseFloat(mod.toFixed(3)),
        modifierType: type,
        price: price,
        purchased: false,
      };
      list.push(entry);
      byId[id] = entry;
      i++;
    }
    return { list: list, byId: byId, core: CORE_BLITZ, endGame: END_GAME_BLITZ };
  }

  var abilityCat = buildAbilityCatalog();
  var blitzCat = buildBlitzCatalog();

  global.VoidlineCatalog = {
    abilities: abilityCat.list,
    abilityById: abilityCat.byId,
    abilityCore: abilityCat.core,
    abilityByMech: abilityCat.byMech,
    blitz: blitzCat.list,
    blitzById: blitzCat.byId,
    blitzCore: blitzCat.core,
    blitzEndGame: blitzCat.endGame,
    abilityUpgradeCost: function (lvl) {
      return Math.floor(10 + lvl * 12 * Math.pow(1.12, Math.min(lvl, 120)));
    },
    abilityBoostMult: function (lvl) {
      var soft = 1 - Math.pow(0.5, lvl / 40);
      return 1 + lvl * 0.06 * (0.35 + soft * 0.65);
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
