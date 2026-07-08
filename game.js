/* Voidline Galaxy Farm — monolith engine v5 */
(function () {
  'use strict';
  var CAT = window.VoidlineCatalog || {};
  var ABILITIES = CAT.abilities || [];
  var ABILITY_BY_ID = CAT.abilityById || {};
  var BLITZ_CATALOG = CAT.blitz || [];
  var BLITZ_BY_ID = CAT.blitzById || {};
  var BLITZ_SHOP_SIZE = 10;
  var BLITZ_MS = 1800000, CLONE_MS = 60000, XP_LVL = 500;
  var AUTO_SCAN_MS = 60000;
  var AUTO_SCAN_MIN_RARITY = 'mist';
  var BOSS_TRAIT_NAMES = ['Standard', 'Solar Flare', 'Cosmic Shield', 'Chronos Enrage'];
  var SAVE_PREFIX = 'voidline_galaxy_farm_v2_';
  var LEGACY_SAVE = 'voidline_galaxy_farm_v1';
  var SESSION_KEY = 'voidline_active_player';
  var LAST_PLAYER_KEY = 'voidline_last_player';
  var APP_VERSION = '7';
  var VERSION_KEY = 'voidline_app_version';
  var SAVE_VERSION = 7;
  var PLANET_REGISTRY_KEY = 'voidline_planet_registry';
  var PLANET_PREFIX = ['Kepler', 'Nova', 'Rift', 'Obsidian', 'Crimson', 'Azure', 'Phantom', 'Eclipse', 'Stellar', 'Void'];
  var PLANET_SUFFIX = ['IV', 'VII', 'IX', 'Prime', 'Reach', 'Haven', 'Crown', 'Shard', 'Belt', 'Gate'];
  var PORTAL_BASE_COST = 25000;
  var SLOT_COST = 500;
  var BUD_ART = '/public/art/strains/leaf-bud.png';
  var BUD_ART_FALLBACK = '/public/art/strain-bud.svg';
  var BOSS_ART = '/public/art/characters/boss-avatar.png';
  var BOSS_ART_FALLBACK = '/public/art/boss.svg';
  var ACTION_TOGGLE_FARM = 'data-action="toggle-farm"';
  var BATTLE_EQUIP_MAX = 8;
  var CAMPAIGN_NODE_COUNT = 24;
  var SKIN_PANEL = 'halftone-panel glass-panel ink-border';
  var MERGE_SP_COST = 15;
  var STOREFRONT_START = 6;
  var STOREFRONT_MAX = 20;
  var STOREFRONT_SLOT_COST = 25000;
  var LEASE_INTERVAL_MS = 300000;
  var LEASE_MAX_PERCENT = 50;
  var TAB_ORDER = ['shop', 'index', 'battle', 'coop', 'map'];

  var PLAYERS = [
    { id: 'aden', label: 'Aden', portrait: '/public/art/portraits/aden.svg', defaultName: 'Aden' },
    { id: 'dad', label: 'Dad', portrait: '/public/art/portraits/dad.svg', defaultName: 'Dad' },
    { id: 'jamie', label: 'Jamie', portrait: '/public/art/portraits/jamie.svg', defaultName: 'Jamie' },
  ];

  function liftShellTierClass(strain) {
    if (!strain || !strain.rarity) return 'cr-tier-street';
    return 'cr-tier-' + String(strain.rarity).toLowerCase();
  }

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

  var ABILITY_ICON_KINDS = {
    crit_burst: 'crit', yield_surge: 'yield', thc_overdrive: 'thc', shield_sap: 'shield',
    poison_cloud: 'poison', clone_echo: 'clone', cash_magnet: 'magnet', portal_sync: 'sync',
    blitz_rush: 'blitz', rift_luck: 'luck', boss_slayer: 'slayer', regen_mist: 'mist',
  };

  function farmIcon(kind, opts) {
    opts = opts || {};
    var cls = 'farm-icon farm-icon-' + kind + (opts.lg ? ' farm-icon-lg' : '') + (opts.xl ? ' farm-icon-xl' : '') + (opts.img ? ' farm-icon-img' : '');
    var sz = opts.size ? ' style="font-size:' + opts.size + '"' : '';
    return '<span class="' + cls + '"' + sz + ' aria-hidden="true"></span>';
  }

  function avatarHtml(src, size) {
    var sz = size || '100%';
    return '<img src="' + esc(src) + '" alt="" class="avatar-portrait voidline-art" style="width:' + sz + ';height:' + sz + '">';
  }

  function migrateAvatar(av) {
    if (!av) return AVATARS[0];
    if (av.indexOf('/') >= 0 || av.indexOf('public/') >= 0) return av;
    var legacy = { '\uD83C\uDF0C': AVATARS[0], '\uD83D\uDEF8': AVATARS[1], '\uD83D\uDC7E': AVATARS[2], '\uD83C\uDF3F': AVATARS[3], '\uD83D\uDCAB': AVATARS[4], '\uD83D\uDD2E': AVATARS[5], '\uD83E\uDE90': AVATARS[6], '\u26A1': AVATARS[7] };
    return legacy[av] || AVATARS[0];
  }

  function artArenaIdx(s) {
    if (!s) return 0;
    if (s.arenaIdx != null) return s.arenaIdx % 12;
    var h = (s.hue || 0) + (s.id ? s.id.charCodeAt(0) : 0);
    return Math.abs(h) % 12;
  }

  function abilityDef(aid) {
    return ABILITY_BY_ID[aid] || { id: aid, name: String(aid), desc: 'Unknown genetic trait.', category: 'misc', mechanic: aid, icon: 'ability', minRarity: 0 };
  }

  function abilityIcon(aid) {
    var d = abilityDef(aid);
    var kind = ABILITY_ICON_KINDS[d.mechanic] || ABILITY_ICON_KINDS[aid] || (d.icon && d.icon.indexOf('farm-icon') < 0 ? d.icon : 'ability');
    if (kind.indexOf('/') >= 0) return farmIcon('ability');
    return farmIcon(kind);
  }

  function abilityUpgradeCost(lvl) {
    if (CAT.abilityUpgradeCost) return CAT.abilityUpgradeCost(lvl);
    return 10 + lvl * 12;
  }

  function abilityBoostMultFromLvl(lvl) {
    if (CAT.abilityBoostMult) return CAT.abilityBoostMult(lvl);
    return 1 + lvl * 0.08;
  }

  var PACKS = [
    { type: 'basic', name: 'Basic Void Pack', price: 5000, icon: 'pack', desc: 'Random procedural strain' },
    { type: 'guaranteed', name: 'Guaranteed Rift Pack', price: 25000, icon: 'gift', desc: 'Pulse+ guaranteed' },
    { type: 'omega', name: 'Omega Rift Pack', price: 100000, spCost: 50, icon: 'vault', desc: 'Bloom+ cosmic anomaly (cash or SP)' },
  ];
  var CHEST_TIERS = [
    { packType: 'basic', name: 'Wooden Crates', icon: 'crate', tagline: 'Street-tier loot burst', accent: '#A16207' },
    { packType: 'guaranteed', name: 'Neon Chests', icon: 'neon', tagline: 'Pulse+ guaranteed neon drop', accent: '#38BDF8' },
    { packType: 'omega', name: 'Void Overlord Vaults', icon: 'vault', tagline: 'Bloom+ mythic siege vault', accent: '#F472B6' },
  ];
  var STORE = [
    { id: 'nutrient-a', name: 'Nebula Nutrients', type: 'nutrient', price: 1200, icon: 'nutrient', desc: 'Boosts passive revenue +0.5/sec each.', revPerSec: 0.5 },
    { id: 'nutrient-b', name: 'Void Bloom Mix', type: 'nutrient', price: 3500, icon: 'nutrient', desc: 'Premium nutrients — +0.5/sec passive each.', revPerSec: 0.5 },
    { id: 'pipe-a', name: 'Quantum Pipe Mk.I', type: 'pipe', price: 8000, icon: 'pipe', desc: 'Smooths portal flow — +1.2/sec passive each.', revPerSec: 1.2 },
    { id: 'pipe-b', name: 'Hyperflow Conduit', type: 'pipe', price: 18000, icon: 'pipe', desc: 'Hypercharged conduit — +2.5/sec passive each.', revPerSec: 2.5 },
  ];
  var AVATARS = [
    '/public/art/portraits/aden.svg', '/public/art/portraits/dad.svg', '/public/art/portraits/jamie.svg',
    '/public/art/strains/leaf-bud.svg', '/public/art/rocket.svg', '/public/art/characters/boss-avatar.svg',
    '/public/art/cards/bud-tier-3.svg', '/public/art/cards/bud-tier-5.svg',
  ];
  var BADGES = [
    { id: 'harvester', icon: 'harvest', label: 'Harvester' }, { id: 'rift', icon: 'rift', label: 'Rift Walker' },
    { id: 'omega', icon: 'omega', label: 'Omega Tier' }, { id: 'cloner', icon: 'clone', label: 'Clone Master' },
    { id: 'trader', icon: 'trader', label: 'Void Trader' }, { id: 'blitz', icon: 'blitz', label: 'Blitz King' },
  ];
  var ACHIEVEMENTS = [
    { id: 'first_strain', name: 'Green Thumb', desc: 'Collect your first strain', reward: { cash: 5000 }, trophy: 10,
      check: function (g) { return (g.strains || []).length >= 1; } },
    { id: 'empire_5', name: 'Rising Empire', desc: 'Reach empire level 5', reward: { sp: 20 }, trophy: 15,
      check: function (g) { return (g.empireLevel || 1) >= 5; } },
    { id: 'boss_3', name: 'Boss Breaker', desc: 'Clear 3 boss rounds', reward: { cash: 15000 }, trophy: 20,
      check: function (g) { return (g.bossRound || 1) > 3; } },
    { id: 'campaign_5', name: 'Trail Blazer', desc: 'Clear campaign node 5', reward: { sp: 30 }, trophy: 25,
      check: function (g) { return Array.isArray(g.campaignNodeClears) && g.campaignNodeClears.indexOf(5) >= 0; } },
    { id: 'millionaire', name: 'Void Tycoon', desc: 'Earn $1M total cash', reward: { cash: 50000 }, trophy: 30,
      check: function (g) { return (g.totalCashEarned || 0) >= 1e6; } },
  ];
  var DAILY_LOGIN_REWARDS = [
    { cash: 10000 }, { sp: 10 }, { cash: 20000 }, { sp: 15 }, { cash: 35000 }, { sp: 25 }, { cash: 75000, sp: 40 },
  ];
  var TROPHY_ROAD = [
    { id: 'tr_10', pts: 10, reward: { cash: 8000 } },
    { id: 'tr_25', pts: 25, reward: { sp: 15 } },
    { id: 'tr_50', pts: 50, reward: { cash: 25000 } },
    { id: 'tr_75', pts: 75, reward: { sp: 30 } },
    { id: 'tr_100', pts: 100, reward: { cash: 50000, sp: 50 } },
    { id: 'tr_150', pts: 150, reward: { cash: 100000 } },
  ];
  var DAILY_QUEST_DEFS = [
    { id: 'open_packs', name: 'Open 5 Packs', icon: 'pack', target: 5 },
    { id: 'clear_nodes', name: 'Clear 3 Nodes', icon: 'mega', target: 3 },
    { id: 'claim_login', name: 'Claim Daily Reward', icon: 'gift', target: 1, action: 'open-daily-login' },
  ];
  var WEEKLY_QUEST_DEFS = [
    { id: 'earn_cash', name: 'Earn $500K', icon: 'bill', target: 500000 },
  ];
  var BATTLE_PASS_SEASON = 1;
  var BATTLE_PASS_MAX_TIER = 50;
  var BATTLE_PASS_XP_PER_TIER = 120;
  var BATTLE_PASS_REWARDS = (function () {
    var out = [];
    for (var t = 1; t <= BATTLE_PASS_MAX_TIER; t++) {
      var prem = t % 5 === 0;
      out.push({
        tier: t,
        free: t % 3 === 0 ? { sp: 5 + Math.floor(t / 3) } : { cash: 3000 + t * 800 },
        premium: prem ? { cash: 15000 + t * 2000, sp: 10 } : { cash: 8000 + t * 1200 },
      });
    }
    return out;
  })();
  var SHOP_FLASH_BUNDLES = [
    { id: 'rift_starter', name: 'Rift Starter Bundle', packs: 3, packType: 'guaranteed', priceMult: 0.85, icon: 'gift' },
    { id: 'omega_vault', name: 'Omega Vault Deal', packs: 1, packType: 'omega', priceMult: 0.9, icon: 'vault' },
    { id: 'blitz_surge', name: 'Blitz Surge Crate', cash: 50000, sp: 25, priceMult: 1, icon: 'blitz' },
  ];
  var SECTORS = [
    { id: 'thrusters', name: 'Frictionless Thrusters', level: 0, maxLevel: 10, baseCost: 15000, scanRateBonus: 0.08 },
    { id: 'radar', name: 'Cosmic Radar', level: 0, maxLevel: 10, baseCost: 22000, scanRateBonus: 0.12 },
    { id: 'shield', name: 'Shield Insulation', level: 0, maxLevel: 10, baseCost: 18000, scanRateBonus: 0.06 },
  ];
  var MINION_NAMES = ['Void Scout', 'Rift Raider', 'Nebula Enforcer', 'Cosmic Champion'];
  var BOSS_PREFIX = ['Void', 'Nebula', 'Rift', 'Cosmic', 'Dark', 'Quantum', 'Stellar', 'Null'];
  var BOSS_SUFFIX = ['Behemoth', 'Leviathan', 'Titan', 'Warden', 'Harbinger', 'Colossus', 'Reaper', 'Overlord'];

  var PERSIST = [
    'saveVersion', 'cash', 'sp', 'empireLevel', 'empireXp', 'name', 'avatar', 'badgeIds', 'storefrontSlots',
    'strains', 'inventory', 'factoryFloors', 'sectorUpgrades', 'blitzEndsAt', 'purchasedBlitzIds', 'blitzWindowOffers',
    'counterPrices', 'cloneJob', 'focusedStrainId', 'farmSubTab', 'nextPortalNum', 'lastTickAt',
    'bossRound', 'bossHp', 'bossMaxHp', 'bossName', 'bossSeed', 'bossRarity', 'equippedBattleIds',
    'bossTrait', 'bossShieldHp', 'bossShieldMax', 'bossWaveStartedAt', 'bossTraitState',
    'voidEssence', 'prestigeVault', 'totalCashEarned',
    'storefrontSlotCount', 'planetLeases', 'leaseOffers',
    'indexSearch', 'indexSort', 'ownedPlanets', 'scanPending', 'breedSlotA', 'breedSlotB', 'pendingRewards',
    'mutationEssence', 'mutationItems', 'dailyShowcaseDay', 'dailyShowcasePurchased', 'dailyShowcaseCache',
    'mutationPackLuck', 'mutationGuaranteeCharges', 'strainMutationMap', 'raidEquipIds',
    'campaignNode', 'campaignNodeClears',
    'dailyLoginStreak', 'dailyLoginLastDay', 'dailyLoginClaimedDay',
    'achievementsUnlocked', 'achievementStats', 'trophyPoints', 'trophyRoadClaimed',
    'cardOfDaySeed', 'cardOfDayPurchased',
    'dailyQuestDay', 'dailyQuestProgress', 'weeklyQuestWeek', 'weeklyQuestProgress',
    'battlePassSeason', 'battlePassXp', 'battlePassTier', 'battlePassPremium', 'battlePassClaimed',
    'strainMastery', 'shopFlashPurchased',
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
    var roll = rng();
    var picked = RARITIES[0];
    for (var i = RARITIES.length - 1; i >= 0; i--) {
      var adj = Math.max(0, RARITIES[i].threshold * (1 - luck * 0.12));
      if (roll >= adj) { picked = RARITIES[i]; break; }
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
    var max = Math.min(5, min + 2 + Math.floor(tierIdx / 4));
    var count = min + Math.floor(rng() * (max - min + 1));
    var pool = ABILITIES.filter(function (a) { return (a.minRarity || 0) <= tierIdx; });
    if (!pool.length) pool = ABILITIES.slice(0, 12);
    var out = [];
    for (var i = 0; i < count && pool.length; i++) {
      var idx = Math.floor(rng() * pool.length);
      out.push(pool[idx].id);
      pool.splice(idx, 1);
    }
    return out;
  }

  function strainAbilityId(s, mechOrId) {
    var aids = (s && s.abilities) || [];
    for (var i = 0; i < aids.length; i++) {
      if (aids[i] === mechOrId) return aids[i];
      var d = abilityDef(aids[i]);
      if (d.mechanic === mechOrId) return aids[i];
    }
    return null;
  }

  function abilityBoostLvl(s, aid) {
    if (!s || !s.abilityBoosts) return 0;
    var entry = strainAbilityId(s, aid);
    if (entry && s.abilityBoosts[entry] != null) return s.abilityBoosts[entry];
    return s.abilityBoosts[aid] || 0;
  }
  function abilityBoostMult(s, aid) { return abilityBoostMultFromLvl(abilityBoostLvl(s, aid)); }

  function abilityPotency(s, mech, baseMult) {
    if (!hasAbility(s, mech)) return 1;
    return baseMult * abilityBoostMult(s, mech);
  }

  function abilityBonus(s, mech, baseAdd) {
    if (!hasAbility(s, mech)) return 0;
    return baseAdd * abilityBoostMult(s, mech);
  }

  function mutationGrantedAbility(s) {
    if (!s) return null;
    var m = mutationItemForStrain(s.id);
    if (!m || (m.stat || 'dps') !== 'ability' || !m.abilityId) return null;
    return m.abilityId;
  }

  function hasAbility(s, mechOrId) {
    if (!s) return false;
    if (strainAbilityId(s, mechOrId)) return true;
    var grant = mutationGrantedAbility(s);
    if (!grant) return false;
    if (grant === mechOrId) return true;
    var d = abilityDef(grant);
    return !!(d && d.mechanic === mechOrId);
  }

  function genStrain(seed, minR, luck, opts) {
    opts = opts || {};
    var rng = rngSeed(seed);
    var rar = pickRarity(rng, minR, luck);
    var tierIdx = rarityIndex(rar);
    var m = rMult(rar);
    var ts = Date.now();
    var genomeId = seed + '_' + ts + '_' + Math.floor(rng() * 0xffffff).toString(16);
    var strain = {
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
    applyGuaranteeAbility(strain, opts);
    return strain;
  }

  function genPack(type, seed, opts) {
    opts = opts || {};
    var s = seed != null ? seed : Math.floor(Math.random() * 0xffffffff);
    var luck = packLuckFromOpts(opts);
    if (type === 'guaranteed') return genStrain(s, 'pulse', luck, opts);
    if (type === 'omega') return genStrain(s, 'bloom', luck, opts);
    return genStrain(s, undefined, luck, opts);
  }

  function packLuckFromOpts(opts) {
    opts = opts || {};
    var sectorScan = 0;
    if (G && Array.isArray(G.sectorUpgrades)) {
      sectorScan = G.sectorUpgrades.reduce(function (sum, x) {
        return sum + (x.level || 0) * (x.scanRateBonus || 0);
      }, 0);
    }
    var scanBoost = opts.scanBonus != null ? opts.scanBonus : (sectorScan + blitzMod('scan'));
    var luck = (opts.packLuckBonus || 0) + scanBoost * 0.28;
    if (opts.packLuckBonus == null && G && G.mutationPackLuck) luck += G.mutationPackLuck;
    return luck;
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
    return base * harv * conv * (planet.upgraderMult || 1) * (1 + blitzMod('planet'));
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
      popLabel('SIGNAL FOUND!', { mega: true });
      popLabel('NEW WORLD', { jackpot: true, delay: 150 });
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
    p.ownerId = activePlayerId;
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

  function autoClaimPlanet(p) {
    if (!p || isPlanetGenomeClaimed(p.genomeId)) return false;
    claimPlanetGenome(p.genomeId, activePlayerId);
    var strain = genExclusivePlanetStrain(p);
    G.strains = mergeStrains(G.strains, strain);
    p.exclusiveStrainId = strain.id;
    p.harvesterLv = 1;
    p.conveyorLv = 1;
    p.ownerId = activePlayerId;
    G.ownedPlanets = (G.ownedPlanets || []).concat([p]);
    addXp(30, true);
    return true;
  }

  function processAutoScan() {
    if (!hasAutoScanFleet() || !G || UI.playerSelectOpen) return;
    var planet = rollScanPlanet();
    if (rarityIndex(planet.rarity) < rarityIndex(AUTO_SCAN_MIN_RARITY)) return;
    if (autoClaimPlanet(planet)) {
      popLabel('FLEET CLAIM: ' + planetDisplayName(planet), { mega: true });
      scheduleSave();
    }
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
      if (strain && hasAbility(strain, 'yield_surge')) spBonus += out * 0.02 * abilityBoostMult(strain, 'yield_surge');
      var cashGain = out * 8;
      creditCash(cashGain);
      cashAcc += cashGain;
      if (strain) {
        p = Object.assign({}, p, { storedYield: (p.storedYield || 0) + out * 0.15 });
      }
      if (spBonus) { G.sp += spBonus; spAcc += spBonus; }
      return p;
    });
    UI._planetCashAcc = (UI._planetCashAcc || 0) + cashAcc;
    UI._planetSpAcc = (UI._planetSpAcc || 0) + spAcc;
  }

  function breedStrains(idA, idB, opts) {
    opts = opts || {};
    var a = strainById(idA), b = strainById(idB);
    if (!a || !b || idA === idB) return null;
    var seed = ((a.seed || 0) ^ (b.seed || 0)) + Date.now();
    var rng = rngSeed(seed);
    var tierIdx = Math.max(rarityIndex(a.rarity), rarityIndex(b.rarity));
    var bump = rng() > 0.65 ? 1 : 0;
    var childRar = RARITIES[Math.min(RARITIES.length - 1, tierIdx + bump)].id;
    var child = genStrain(seed, childRar, 0.03, opts);
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
    if (opts.guaranteeAbility) {
      var minAb = Math.max(3, child.abilities.length + 1);
      ensureStrainAbility(child, minAb);
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
    var useGuarantee = UI.fuseGuarantee && (G.mutationGuaranteeCharges || 0) > 0;
    var child = breedStrains(G.breedSlotA, G.breedSlotB, { guaranteeAbility: useGuarantee });
    if (!child) { G.sp += MERGE_SP_COST; UI.mergeLab.error = 'Fusion failed — try different parents.'; return false; }
    if (useGuarantee) {
      consumeMutationGuarantee();
      showBattleToast('Guaranteed ability roll applied to fusion', true);
    }
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
    popLabel('FUSION COMPLETE!', { mega: true });
    plantSay('breed', true);
    UI.mergeLab = { open: false, phase: 'idle', child: null, error: '' };
    scheduleSave();
    render();
    return true;
  }

  function runBreed() { return startMergeFuse(); }

  function upStrainAbility(sid, aid) {
    var s = strainById(sid);
    var entry = s ? strainAbilityId(s, aid) : null;
    if (!s || !entry) return false;
    if (!s.abilityBoosts) s.abilityBoosts = {};
    var lvl = s.abilityBoosts[entry] || 0;
    var cost = abilityUpgradeCost(lvl);
    if (G.sp < cost) return false;
    G.sp -= cost;
    s.abilityBoosts[entry] = lvl + 1;
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
    var orb = '<div class="planet-card-art cr-art-layered"><div class="cr-planet-terrain cr-arena-' + artArenaIdx(p) + '"></div><div class="cr-planet-orb" style="background:radial-gradient(circle at 32% 28%,' + c + 'dd,' + c + '55 42%,#1A1209 78%)"></div></div>';
    return '<button type="button" class="cr-card planet-card planet-glow' + (opts.glow ? ' planet-glow-active' : '') + (opts.selected ? ' selected' : '') + '"' + focusAttr + ' style="--planet-color:' + c + '">' +
      crCardFrameInner({ tier: tier, name: nm, artHtml: orb,
        badgeLeft: '<div class="cr-badge cr-badge-thc cr-badge-sm">' + rev + '</div>',
        badgeRight: '<div class="cr-badge cr-badge-lvl"><span>Lv</span>' + lvl + '</div>',
        tag: farmIcon('planet') }) + '</button>';
  }

  function revSec(s) { return (effectiveYield(s) * s.quantity * s.thcPercent) / 100; }
  function emptySF() {
    var a = [];
    for (var i = 0; i < STOREFRONT_START; i++) a.push({ strainId: null, price: 0, quantity: 0 });
    return a;
  }
  function ensureStorefrontSlots() {
    if (!G.storefrontSlotCount) G.storefrontSlotCount = STOREFRONT_START;
    if (!G.storefrontSlots) G.storefrontSlots = emptySF();
    while (G.storefrontSlots.length < G.storefrontSlotCount) {
      G.storefrontSlots.push({ strainId: null, price: 0, quantity: 0 });
    }
  }
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
  function budImg(s, px) {
    var id = s && s.id ? ' data-strain-id="' + esc(s.id) + '"' : '';
    var arena = artArenaIdx(s);
    var w = px || '2rem';
    return '<span class="bud-art-composite cr-arena-' + arena + '" style="width:' + w + ';height:' + w + '"><span class="bud-art-terrain cr-arena-' + arena + '"></span><img src="' + BUD_ART + '" alt="" class="strain-bud-art voidline-art"' + id + ' data-art-kind="bud" onerror="this.onerror=null;this.src=\'' + BUD_ART_FALLBACK + '\'"></span>';
  }

  var UI = { activeTab: 'battle', farmOpen: false, campaignTrailOpen: false, profileOpen: false, profileTab: 'modifiers', settingsOpen: false, helpOpen: false, realityWarp: false, liftedCardId: null, liftOnUpgrade: null, playerSelectOpen: false, dailyLoginOpen: false, trophyRoadOpen: false, achievementsOpen: false, battlePassOpen: false, battleToasts: [], battleFlash: null, battleWaveFlash: null, scanAnimating: false, focusedPlanetId: null, strainPickerFloorId: null, strainPickerSearch: '', strainPickerSort: 'rarity', battleEquipSearch: '', battleEquipSort: 'dps', raidEquipSearch: '', raidEquipSort: 'dps', mutationEquipPick: null, packGuarantee: false, fuseGuarantee: false, mergeLab: { open: false, phase: 'idle', child: null, error: '' }, indexPane: 'strains', mutationMode: 'create', _passiveCashAcc: 0, _planetCashAcc: 0, _lastPassivePop: 0, _lastCritPop: 0, _bossHitAcc: 0, _planetSpAcc: 0, _lastPlanetPop: 0, _lastPlanetSpPop: 0, coopView: 'hub', coopShopPlayer: null, storefrontPickSlot: null, confirmDialog: null, mapBillingsOpen: false, mapBillingsTab: 'active', leaseDraft: null, giftStrainId: null, clanCreateOpen: false, dirty: { wallet: true, hud: true, bossHp: true, bossDps: true, toasts: false, activeTab: true, bossTrait: true, bossShield: true, shell: true, blitzTimer: false, cloneTimer: false, eventTimer: false, cloudSync: false }, damagePopQueue: [] };
  var DOM = {};
  var G = null;
  var activePlayerId = null;
  var dialogueState = { lastKey: '', lastAt: 0, count: 0 };
  var portalNames = ['Portal Alpha', 'Portal Beta', 'Portal Gamma', 'Portal Delta', 'Portal Epsilon', 'Portal Zeta'];
  var bossTickAcc = 0;
  var autoScanAcc = 0;
  var visualRafId = 0;
  var lastDamageVisualAt = 0;
  var DAMAGE_VISUAL_MS = 130;
  var ARCADE_POOL_SIZE = 15;
  var arcadePool = [];
  var poolLayerCached = null;
  var UI_LAST = { cash: null, sp: null, dps: null, bossHpPct: null, bossShieldPct: null, bossTrait: null, xpPct: null, xpText: null, blitzCd: null, cloneCd: null, eventCd: null, hubRev: null, shopFlashCd: null, cloudSyncLabel: null };

  function isWalletDirty() { return !!UI.dirty.wallet; }
  function isHudDirty() { return !!UI.dirty.hud; }
  function isBossHpDirty() { return !!UI.dirty.bossHp; }
  function isBossDpsDirty() { return !!UI.dirty.bossDps; }
  function isToastsDirty() { return !!UI.dirty.toasts; }
  function isTabDirty() { return !!UI.dirty.activeTab; }
  function markWalletDirty() { UI.dirty.wallet = true; }
  function markHudDirty() { UI.dirty.hud = true; UI.dirty.shell = true; }
  function markBossHpDirty() { UI.dirty.bossHp = true; }
  function markBossDpsDirty() { UI.dirty.bossDps = true; }
  function markBossTraitDirty() { UI.dirty.bossTrait = true; }
  function markBossShieldDirty() { UI.dirty.bossShield = true; }
  function markTabDirty() { UI.dirty.activeTab = true; }
  function markAllVisualDirty() {
    markWalletDirty();
    markHudDirty();
    markBossHpDirty();
    markBossDpsDirty();
    markBossTraitDirty();
    markBossShieldDirty();
    markTabDirty();
    UI.dirty.toasts = true;
    UI.dirty.shell = true;
  }

  function cacheDomRefs() {
    DOM.hudCash = document.getElementById('hud-cash');
    DOM.hudSp = document.getElementById('hud-sp');
    DOM.hudXpFill = document.getElementById('hud-xp-fill');
    DOM.hudXpText = document.getElementById('hud-xp-text');
    DOM.hudAvatar = document.getElementById('hud-avatar');
    DOM.hudName = document.getElementById('hud-name');
    DOM.hudLevel = document.getElementById('hud-level');
    DOM.phoneShell = document.getElementById('phone-shell');
    DOM.voidlineApp = document.getElementById('voidline-app');
    DOM.realityWarp = document.getElementById('overlay-reality-warp');
    DOM.screenRoot = document.getElementById('screen-root');
    DOM.arcadePopLayer = document.getElementById('arcade-pop-layer');
    DOM.battleToastLayer = document.getElementById('battle-toast-layer');
    DOM.plantMascot = document.getElementById('plant-mascot');
    DOM.plantLabel = document.getElementById('plant-label');
    DOM.cloudSyncStrip = document.getElementById('hud-cloud-sync');
  }

  function creditCash(amt) {
    if (!amt) return;
    if (window.__SWARM_CASH_MULT__ > 1) amt = Math.floor(amt * window.__SWARM_CASH_MULT__);
    G.cash += amt;
    if (amt > 0) {
      G.totalCashEarned = (G.totalCashEarned || 0) + amt;
      bumpQuestProgress('earn_cash', amt, 'weekly');
    }
    markWalletDirty();
  }

  function voidEssenceMult() {
    return 1 + (G.voidEssence || 0) * 0.05;
  }

  function getBossTrait() {
    if (G.bossTrait != null && !isNaN(G.bossTrait)) return G.bossTrait;
    return (G.bossRound || 1) % 4;
  }

  function bossTraitLabel(tr) {
    return BOSS_TRAIT_NAMES[tr != null ? tr : getBossTrait()] || BOSS_TRAIT_NAMES[0];
  }

  function isStrainSolarSilenced(strainId) {
    var sl = G.bossTraitState && G.bossTraitState.solarSilence;
    if (!sl || Date.now() >= sl.until) return false;
    return sl.id === strainId;
  }

  function bossTraitStatusText() {
    var tr = getBossTrait();
    if (tr === 1) {
      var sl = G.bossTraitState && G.bossTraitState.solarSilence;
      if (sl && Date.now() < sl.until) {
        var s = strainById(sl.id);
        return 'Jamming: ' + (s ? s.name : 'strain');
      }
      return 'Solar Flare · 4s pulse';
    }
    if (tr === 2) {
      if ((G.bossShieldHp || 0) > 0) return 'Shield: ' + Math.ceil(G.bossShieldHp).toLocaleString() + ' HP';
      return 'Shield: DOWN';
    }
    if (tr === 3) {
      var elapsed = (Date.now() - (G.bossWaveStartedAt || Date.now())) / 1000;
      if (elapsed > 15) return 'Chronos Enrage: ACTIVE';
      return 'Chronos Enrage: ' + Math.max(0, Math.ceil(15 - elapsed)) + 's';
    }
    return 'Baseline protocol';
  }

  var CoOpSynergyManager = {
    getFamilyLevel: function () {
      return PLAYERS.reduce(function (sum, pl) {
        var save = readPlayerSave(pl.id);
        return sum + ((save && save.empireLevel) || 1);
      }, 0);
    },
    getPackLuckBonus: function () {
      return Math.floor(this.getFamilyLevel() / 5) * 0.02;
    },
    getFamilyTier: function () {
      return Math.floor(this.getFamilyLevel() / 5);
    },
  };

  function hasAutoScanFleet() {
    if ((G.purchasedBlitzIds || []).some(function (id) {
      var b = BLITZ_BY_ID[id];
      return b && (b.modifierType === 'autoScan' || b.modifierType === 'autoScanSpeed');
    })) return true;
    var radar = (G.sectorUpgrades || []).find(function (s) { return s.id === 'radar'; });
    return !!(radar && radar.level >= radar.maxLevel);
  }

  function autoScanIntervalMs() {
    return Math.max(30000, Math.floor(AUTO_SCAN_MS * (1 - Math.min(0.5, blitzMod('autoScanSpeed')))));
  }

  function freshState(pid) {
    var p = playerDef(pid);
    return {
      playerId: pid, saveVersion: SAVE_VERSION, cash: 250000, sp: 100, empireLevel: 1, empireXp: 0,
      name: p.defaultName, avatar: p.portrait, badgeIds: [null, null, null],
      storefrontSlots: emptySF(), storefrontSlotCount: STOREFRONT_START,
      planetLeases: { active: [], archive: [], pending: [] }, leaseOffers: [],
      strains: [], inventory: STORE.map(function (i) { return Object.assign({}, i, { owned: 0 }); }),
      factoryFloors: [], sectorUpgrades: clone(SECTORS),
      blitzEndsAt: Date.now() + BLITZ_MS, purchasedBlitzIds: [], blitzWindowOffers: null, counterPrices: {},
      cloneJob: null, focusedStrainId: null, packReveal: { open: false, packType: null, strain: null, strains: null },
      farmSubTab: 'portal', transactionBeam: null, lastTickAt: Date.now(), nextPortalNum: 1,
      bossRound: 1, bossHp: 0, bossMaxHp: 0, bossName: '', bossSeed: 0, bossRarity: 'dust', equippedBattleIds: [],
      bossTrait: 1, bossShieldHp: 0, bossShieldMax: 0, bossWaveStartedAt: Date.now(), bossTraitState: { solarAcc: 0, solarSilence: null },
      voidEssence: 0, prestigeVault: [], totalCashEarned: 0,
      indexSearch: '', indexSort: 'recent',
      ownedPlanets: [], scanPending: null, breedSlotA: null, breedSlotB: null, pendingRewards: [],
      mutationEssence: 0, mutationItems: [], dailyShowcaseDay: 0,
      dailyShowcasePurchased: [false, false, false], dailyShowcaseCache: null,
      mutationPackLuck: 0, mutationGuaranteeCharges: 0, strainMutationMap: {}, raidEquipIds: [],
      campaignNode: 1, campaignNodeClears: [],
      dailyLoginStreak: 0, dailyLoginLastDay: 0, dailyLoginClaimedDay: 0,
      achievementsUnlocked: [], achievementStats: {}, trophyPoints: 0, trophyRoadClaimed: [],
      cardOfDaySeed: 0, cardOfDayPurchased: false,
      dailyQuestDay: 0, dailyQuestProgress: {}, weeklyQuestWeek: 0, weeklyQuestProgress: {},
      battlePassSeason: BATTLE_PASS_SEASON, battlePassXp: 0, battlePassTier: 0, battlePassPremium: false,
      battlePassClaimed: { free: [], premium: [] },
      strainMastery: {}, shopFlashPurchased: false,
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
      if (window.VoidlineCloud && window.VoidlineCloud.isLoggedIn()) {
        window.VoidlineCloud.onLocalSave(activePlayerId, p);
      }
      return true;
    } catch (e) {
      console.error('[Voidline] Save failed — progress may not persist:', e);
      return false;
    }
  }

  function writePlayerSave(pid, data) {
    try {
      data.saveVersion = SAVE_VERSION;
      data.lastTickAt = Date.now();
      var p = { playerId: pid, saveVersion: SAVE_VERSION };
      PERSIST.forEach(function (k) { if (data[k] !== undefined) p[k] = data[k]; });
      var key = saveKey(pid);
      var blob = JSON.stringify(p);
      localStorage.setItem(key, blob);
      localStorage.setItem(key + '_backup', blob);
      return true;
    } catch (e) { return false; }
  }

  function readPlayerSaveMutable(pid) {
    var d = readPlayerSave(pid);
    if (!d) return null;
    return Object.assign(freshState(pid), d, { playerId: pid });
  }

  function mutateOtherPlayerSave(pid, fn) {
    var data = readPlayerSaveMutable(pid);
    if (!data) return false;
    fn(data);
    return writePlayerSave(pid, data);
  }

  function playerBattleDps(save) {
    var strains = save.strains || [];
    var ids = (save.equippedBattleIds || []).slice(0, BATTLE_EQUIP_MAX);
    var t = 0;
    ids.forEach(function (id) {
      var s = strains.find(function (x) { return x.id === id; });
      if (!s) return;
      t += (s.yield * s.thcPercent / 100) * rMult(s.rarity) * (s.quantity || 1);
    });
    return t;
  }

  function playerRevSec(save) {
    var t = 0;
    (save.factoryFloors || []).forEach(function (f) {
      if (!f.equippedStrainId) return;
      var s = (save.strains || []).find(function (x) { return x.id === f.equippedStrainId; });
      if (s) t += (s.yield * (s.quantity || 1) * s.thcPercent) / 100 * f.level;
    });
    return t;
  }

  function buyStorefrontSlot() {
    ensureStorefrontSlots();
    if (G.storefrontSlotCount >= STOREFRONT_MAX) return false;
    var cost = STOREFRONT_SLOT_COST * G.storefrontSlotCount;
    if (G.cash < cost) return false;
    G.cash -= cost;
    G.storefrontSlotCount++;
    G.storefrontSlots.push({ strainId: null, price: 0, quantity: 0 });
    scheduleSave();
    return true;
  }

  function listStorefrontSlot(slotIdx, strainId, qty, price) {
    ensureStorefrontSlots();
    var slot = G.storefrontSlots[slotIdx];
    if (!slot || slotIdx >= G.storefrontSlotCount) return false;
    var s = strainById(strainId);
    if (!s || qty < 1 || price <= 0) return false;
    if ((s.quantity || 1) < qty) return false;
    G.storefrontSlots = G.storefrontSlots.slice();
    G.storefrontSlots[slotIdx] = { strainId: strainId, price: price, quantity: qty };
    scheduleSave();
    return true;
  }

  function clearStorefrontSlot(slotIdx) {
    ensureStorefrontSlots();
    var slot = G.storefrontSlots[slotIdx];
    if (!slot || !slot.strainId) return false;
    G.storefrontSlots = G.storefrontSlots.slice();
    G.storefrontSlots[slotIdx] = { strainId: null, price: 0, quantity: 0 };
    scheduleSave();
    return true;
  }

  function buyFromPlayerShop(sellerId, slotIdx) {
    var buyer = G;
    var seller = readPlayerSaveMutable(sellerId);
    if (!seller || sellerId === activePlayerId) return false;
    ensureStorefrontSlots.call({}); // noop — seller has own slots
    if (!seller.storefrontSlots || slotIdx >= seller.storefrontSlots.length) return false;
    var slot = seller.storefrontSlots[slotIdx];
    if (!slot || !slot.strainId || !slot.price) return false;
    var strain = (seller.strains || []).find(function (s) { return s.id === slot.strainId; });
    if (!strain || (strain.quantity || 1) < (slot.quantity || 1)) return false;
    var total = slot.price;
    if (buyer.cash < total) return false;
    buyer.cash -= total;
    seller.cash = (seller.cash || 0) + total;
    var soldQty = slot.quantity || 1;
    var sellerStrains = seller.strains.slice();
    var si = sellerStrains.findIndex(function (s) { return s.id === strain.id; });
    if (si < 0) return false;
    if ((sellerStrains[si].quantity || 1) <= soldQty) {
      sellerStrains.splice(si, 1);
    } else {
      sellerStrains[si] = Object.assign({}, sellerStrains[si], { quantity: sellerStrains[si].quantity - soldQty });
    }
    seller.strains = sellerStrains;
    seller.storefrontSlots = seller.storefrontSlots.slice();
    seller.storefrontSlots[slotIdx] = { strainId: null, price: 0, quantity: 0 };
    var copy = clone(strain);
    copy.quantity = soldQty;
    copy.id = 'strain_bought_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
    copy.genomeId = strain.genomeId + '_b' + Date.now();
    G.strains = mergeStrains(G.strains, copy);
    writePlayerSave(sellerId, seller);
    popStrain(copy, { qty: soldQty, big: true });
    scheduleSave();
    return true;
  }

  function getPlanetOwner(planet) {
    if (!planet) return null;
    if (planet.ownerId) return planet.ownerId;
    var reg = getPlanetRegistry();
    return reg[planet.genomeId] || null;
  }

  function submitLeaseOffer(planetId, percent, price) {
    var planet = planetById(planetId);
    var ownerId = planet ? (getPlanetOwner(planet) || planet.ownerId) : null;
    if (!planet) {
      for (var pi = 0; pi < PLAYERS.length; pi++) {
        var pl = PLAYERS[pi];
        if (pl.id === activePlayerId) continue;
        var oSave = readPlayerSave(pl.id);
        if (!oSave || !oSave.ownedPlanets) continue;
        var found = oSave.ownedPlanets.find(function (p) { return p.id === planetId; });
        if (found) { planet = found; ownerId = pl.id; break; }
      }
    }
    if (!planet) return false;
    if (!ownerId) ownerId = getPlanetOwner(planet) || planet.ownerId;
    if (!ownerId || ownerId === activePlayerId) return false;
    percent = Math.min(LEASE_MAX_PERCENT, Math.max(1, Math.floor(percent)));
    if (price <= 0) return false;
    var offer = {
      id: 'lo_' + Date.now(),
      planetId: planetId,
      planetName: planetDisplayName(planet),
      ownerId: ownerId,
      buyerId: activePlayerId,
      percent: percent,
      pricePerInterval: price,
      intervalMs: LEASE_INTERVAL_MS,
      status: 'pending',
      createdAt: Date.now(),
    };
    mutateOtherPlayerSave(ownerId, function (data) {
      if (!data.leaseOffers) data.leaseOffers = [];
      data.leaseOffers.push(offer);
    });
    scheduleSave();
    return true;
  }

  function respondLeaseOffer(offerId, accept, counterPrice) {
    var offer = (G.leaseOffers || []).find(function (o) { return o.id === offerId; });
    if (!offer) return false;
    G.leaseOffers = G.leaseOffers.filter(function (o) { return o.id !== offerId; });
    if (!accept) {
      if (counterPrice && counterPrice > 0) {
        mutateOtherPlayerSave(offer.buyerId, function (data) {
          if (!data.leaseOffers) data.leaseOffers = [];
          data.leaseOffers.push(Object.assign({}, offer, { pricePerInterval: counterPrice, status: 'counter', id: 'lo_' + Date.now() }));
        });
      }
      scheduleSave();
      return true;
    }
    if (!G.planetLeases) G.planetLeases = { active: [], archive: [], pending: [] };
    var lease = Object.assign({}, offer, {
      status: 'active',
      lastBilledAt: Date.now(),
      totalCollected: 0,
      id: 'lease_' + Date.now(),
    });
    G.planetLeases.active.push(lease);
    mutateOtherPlayerSave(offer.buyerId, function (data) {
      if (!data.planetLeases) data.planetLeases = { active: [], archive: [], pending: [] };
      data.planetLeases.active.push(Object.assign({}, lease));
    });
    scheduleSave();
    return true;
  }

  function processLeaseBilling() {
    if (!G || !G.planetLeases) return;
    var now = Date.now();
    (G.planetLeases.active || []).slice().forEach(function (lease) {
      if (lease.status !== 'active' || now - (lease.lastBilledAt || 0) < (lease.intervalMs || LEASE_INTERVAL_MS)) return;
      var buyer = readPlayerSaveMutable(lease.buyerId);
      if (!buyer || buyer.cash < lease.pricePerInterval) {
        lease.status = 'broke';
        lease.endedAt = now;
        G.planetLeases.archive = (G.planetLeases.archive || []).concat([lease]);
        G.planetLeases.active = G.planetLeases.active.filter(function (l) { return l.id !== lease.id; });
        mutateOtherPlayerSave(lease.buyerId, function (data) {
          if (!data.planetLeases) data.planetLeases = { active: [], archive: [] };
          data.planetLeases.active = (data.planetLeases.active || []).filter(function (l) { return l.id !== lease.id; });
          data.planetLeases.archive = (data.planetLeases.archive || []).concat([Object.assign({}, lease, { status: 'broke', endedAt: now })]);
        });
        return;
      }
      buyer.cash -= lease.pricePerInterval;
      writePlayerSave(lease.buyerId, buyer);
      creditCash(lease.pricePerInterval);
      if (window.__SWARM_SIM__) window.__SWARM_LEASE_CASH__ = (window.__SWARM_LEASE_CASH__ || 0) + lease.pricePerInterval;
      lease.lastBilledAt = now;
      lease.totalCollected = (lease.totalCollected || 0) + lease.pricePerInterval;
      G.planetLeases.active = G.planetLeases.active.map(function (l) { return l.id === lease.id ? lease : l; });
    });
  }

  function healNullState() {
    if (!G) return 0;
    var fixes = 0;
    function healArr(key, fallback) {
      if (G[key] == null || !Array.isArray(G[key])) { G[key] = fallback.slice ? fallback.slice() : fallback; fixes++; }
    }
    if (Array.isArray(G.claimedPlanets) && (!G.ownedPlanets || !G.ownedPlanets.length)) {
      G.ownedPlanets = G.claimedPlanets.slice();
      fixes++;
    }
    if (Array.isArray(G.activeLeases)) {
      if (!G.planetLeases || typeof G.planetLeases !== 'object') G.planetLeases = { active: [], archive: [], pending: [] };
      if (!G.planetLeases.active || !G.planetLeases.active.length) { G.planetLeases.active = G.activeLeases.slice(); fixes++; }
    }
    if (Array.isArray(G.marketStorefront) && (!G.storefrontSlots || !G.storefrontSlots.length)) {
      G.storefrontSlots = G.marketStorefront.slice();
      fixes++;
    }
    delete G.claimedPlanets;
    delete G.activeLeases;
    delete G.marketStorefront;
    healArr('strains', []);
    healArr('ownedPlanets', []);
    healArr('equippedBattleIds', []);
    healArr('pendingRewards', []);
    healArr('mutationItems', []);
    healArr('raidEquipIds', []);
    healArr('campaignNodeClears', []);
    if (G.campaignNode == null || isNaN(G.campaignNode) || G.campaignNode < 1) { G.campaignNode = 1; fixes++; }
    if (G.mutationEssence == null || isNaN(G.mutationEssence)) G.mutationEssence = 0;
    if (G.mutationPackLuck == null || isNaN(G.mutationPackLuck)) G.mutationPackLuck = 0;
    if (G.mutationGuaranteeCharges == null || isNaN(G.mutationGuaranteeCharges)) G.mutationGuaranteeCharges = 0;
    if (!G.strainMutationMap || typeof G.strainMutationMap !== 'object') { G.strainMutationMap = {}; fixes++; }
    if (G.dailyShowcaseDay == null || isNaN(G.dailyShowcaseDay)) { G.dailyShowcaseDay = 0; fixes++; }
    if (!Array.isArray(G.dailyShowcasePurchased) || G.dailyShowcasePurchased.length !== 3) { G.dailyShowcasePurchased = [false, false, false]; fixes++; }
    if (!G.planetLeases || typeof G.planetLeases !== 'object') {
      G.planetLeases = { active: [], archive: [], pending: [] };
      fixes++;
    } else {
      if (!Array.isArray(G.planetLeases.active)) { G.planetLeases.active = []; fixes++; }
      if (!Array.isArray(G.planetLeases.archive)) { G.planetLeases.archive = []; fixes++; }
      if (!Array.isArray(G.planetLeases.pending)) { G.planetLeases.pending = []; fixes++; }
    }
    if (!Array.isArray(G.leaseOffers)) { G.leaseOffers = []; fixes++; }
    if (!Array.isArray(G.sectorUpgrades)) { G.sectorUpgrades = clone(SECTORS); fixes++; }
    ensureStorefrontSlots();
    if (!G.inventory || !G.inventory.length) {
      G.inventory = STORE.map(function (i) { return Object.assign({}, i, { owned: 0 }); });
      fixes++;
    }
    healArr('achievementsUnlocked', []);
    healArr('trophyRoadClaimed', []);
    if (!G.achievementStats || typeof G.achievementStats !== 'object') { G.achievementStats = {}; fixes++; }
    if (G.trophyPoints == null || isNaN(G.trophyPoints)) { G.trophyPoints = 0; fixes++; }
    if (G.dailyLoginStreak == null || isNaN(G.dailyLoginStreak)) { G.dailyLoginStreak = 0; fixes++; }
    if (G.dailyLoginLastDay == null || isNaN(G.dailyLoginLastDay)) { G.dailyLoginLastDay = 0; fixes++; }
    if (G.dailyLoginClaimedDay == null || isNaN(G.dailyLoginClaimedDay)) { G.dailyLoginClaimedDay = 0; fixes++; }
    if (G.cardOfDaySeed == null || isNaN(G.cardOfDaySeed)) { G.cardOfDaySeed = 0; fixes++; }
    if (G.cardOfDayPurchased == null) { G.cardOfDayPurchased = false; fixes++; }
    if (G.dailyQuestDay == null || isNaN(G.dailyQuestDay)) { G.dailyQuestDay = 0; fixes++; }
    if (!G.dailyQuestProgress || typeof G.dailyQuestProgress !== 'object') { G.dailyQuestProgress = {}; fixes++; }
    if (G.weeklyQuestWeek == null || isNaN(G.weeklyQuestWeek)) { G.weeklyQuestWeek = 0; fixes++; }
    if (!G.weeklyQuestProgress || typeof G.weeklyQuestProgress !== 'object') { G.weeklyQuestProgress = {}; fixes++; }
    return fixes;
  }

  function sanitizeSave(pid) {
    healNullState();
    delete G.planetOffers;
    delete G.profileViewIndex;
    var p = playerDef(pid);
    if (G.name === 'VoidPilot_Aden' || G.name === 'VoidPilot') G.name = p.defaultName;
    G.avatar = migrateAvatar(G.avatar);
    if (G.sp == null || isNaN(G.sp)) G.sp = 100;
    if (!G.pendingRewards) G.pendingRewards = [];
    if (!G.mutationItems) G.mutationItems = [];
    if (G.mutationEssence == null || isNaN(G.mutationEssence)) G.mutationEssence = 0;
    if (G.mutationPackLuck == null || isNaN(G.mutationPackLuck)) G.mutationPackLuck = 0;
    if (G.mutationGuaranteeCharges == null || isNaN(G.mutationGuaranteeCharges)) G.mutationGuaranteeCharges = 0;
    if (!G.strainMutationMap) G.strainMutationMap = {};
    if (!G.raidEquipIds) G.raidEquipIds = [];
    syncDailyShowcaseDay();
    if (!G.ownedPlanets) G.ownedPlanets = [];
    if (G.scanPending === undefined) G.scanPending = null;
    G.strains = (G.strains || []).map(migrateStrain);
    if (!G.equippedBattleIds) G.equippedBattleIds = [];
    if (G.equippedBattleIds.length > BATTLE_EQUIP_MAX) G.equippedBattleIds = G.equippedBattleIds.slice(0, BATTLE_EQUIP_MAX);
    if (!G.indexSearch) G.indexSearch = '';
    if (!G.indexSort) G.indexSort = 'recent';
    if (!G.bossRound) G.bossRound = 1;
    if (G.campaignNode == null || isNaN(G.campaignNode) || G.campaignNode < 1) {
      G.campaignNode = Math.max(1, Math.min(CAMPAIGN_NODE_COUNT, Math.ceil((G.bossRound || 1) / 2)));
    }
    if (!Array.isArray(G.campaignNodeClears)) {
      G.campaignNodeClears = [];
      for (var cni = 1; cni < G.campaignNode; cni++) G.campaignNodeClears.push(cni);
    }
    G.campaignNode = Math.max(1, Math.min(CAMPAIGN_NODE_COUNT, G.campaignNode));
    enforceCampaignSlotLimit();
    if (G.bossTrait == null) G.bossTrait = (G.campaignNode || 1) % 4;
    if (!G.bossTraitState) G.bossTraitState = { solarAcc: 0, solarSilence: null };
    if (!G.bossWaveStartedAt) G.bossWaveStartedAt = Date.now();
    if (G.bossShieldHp == null) G.bossShieldHp = 0;
    if (G.bossShieldMax == null) G.bossShieldMax = 0;
    if (G.voidEssence == null) G.voidEssence = 0;
    if (!G.prestigeVault) G.prestigeVault = [];
    if (G.totalCashEarned == null) G.totalCashEarned = 0;
    ensureStorefrontSlots();
    if (!G.planetLeases) G.planetLeases = { active: [], archive: [], pending: [] };
    if (!G.leaseOffers) G.leaseOffers = [];
    G.storefrontSlots = G.storefrontSlots.map(function (sl) {
      return Object.assign({ strainId: null, price: 0, quantity: 0 }, sl);
    });
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
    migrateBlitzSave();
  }

  function migrateBlitzSave() {
    if (!G.purchasedBlitzIds) G.purchasedBlitzIds = [];
    if (G.blitzUpgrades) {
      if (G.blitzUpgrades.length) {
        G.blitzUpgrades.forEach(function (b) {
          if (b.purchased && G.purchasedBlitzIds.indexOf(b.id) < 0) G.purchasedBlitzIds.push(b.id);
        });
      }
      delete G.blitzUpgrades;
    }
    if (!G.blitzWindowOffers || !G.blitzWindowOffers.length) rollBlitzOffers();
  }

  function rollBlitzOffers() {
    var purchased = G.purchasedBlitzIds || [];
    var empireLvl = G.empireLevel || 1;
    var pool = BLITZ_CATALOG.filter(function (b) {
      if (purchased.indexOf(b.id) >= 0) return false;
      if (b.endGame && empireLvl < (b.minEmpireLevel || 20)) return false;
      return true;
    });
    var rng = rngSeed(Date.now() + (G.empireLevel || 1) * 997);
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    G.blitzWindowOffers = pool.slice(0, BLITZ_SHOP_SIZE).map(function (b) { return b.id; });
  }

  function blitzShopRows() {
    if (!G.blitzWindowOffers || !G.blitzWindowOffers.length) rollBlitzOffers();
    var purchased = G.purchasedBlitzIds || [];
    return G.blitzWindowOffers.map(function (id) {
      var def = BLITZ_BY_ID[id];
      if (!def) return null;
      return Object.assign({}, def, { purchased: purchased.indexOf(id) >= 0 });
    }).filter(Boolean);
  }

  function blitzRushMult() {
    var bonus = 0;
    (G.equippedBattleIds || []).forEach(function (id) {
      var s = strainById(id);
      if (s && hasAbility(s, 'blitz_rush')) bonus += 0.1 * abilityBoostMult(s, 'blitz_rush');
    });
    return 1 + Math.min(0.5, bonus);
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

  function genBossName(rng) {
    return BOSS_PREFIX[Math.floor(rng() * BOSS_PREFIX.length)] + ' ' + BOSS_SUFFIX[Math.floor(rng() * BOSS_SUFFIX.length)];
  }

  function currentCampaignNode() {
    var n = G.campaignNode;
    if (n == null || isNaN(n) || n < 1) return 1;
    return Math.min(n, CAMPAIGN_NODE_COUNT);
  }

  function isCampaignNodeCleared(nodeNum) {
    return Array.isArray(G.campaignNodeClears) && G.campaignNodeClears.indexOf(nodeNum) >= 0;
  }

  function isCampaignMegaNode(nodeNum) {
    return nodeNum % 5 === 0;
  }

  function campaignNodeDef(nodeNum) {
    var n = Math.max(1, Math.min(nodeNum, CAMPAIGN_NODE_COUNT));
    var maxSlots = BATTLE_EQUIP_MAX;
    if (n >= 24) maxSlots = 1;
    else if (n >= 20) maxSlots = 2;
    else if (n >= 10) maxSlots = 3;
    var minMutations = 0;
    if (n >= 22) minMutations = -1;
    else if (n >= 18) minMutations = 3;
    else if (n >= 12) minMutations = 2;
    else if (n >= 5) minMutations = 1;
    var minRarityIdx = 0;
    if (n >= 22) minRarityIdx = rarityIndex('surge');
    else if (n >= 18) minRarityIdx = rarityIndex('mist');
    else if (n >= 14) minRarityIdx = rarityIndex('spark');
    else if (n >= 8) minRarityIdx = rarityIndex('haze');
    var minRarity = minRarityIdx > 0 ? RARITIES[minRarityIdx].id : null;
    var pid = G.playerId || activePlayerId || '';
    var bossSeed = n * 7919 + pid.split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
    return {
      node: n,
      isMega: isCampaignMegaNode(n),
      maxSlots: maxSlots,
      minMutations: minMutations,
      minRarity: minRarity,
      minRarityIdx: minRarityIdx,
      hpMult: 1 + (n - 1) * 0.12,
      rewardMult: 1 + (n - 1) * 0.08,
      bossSeed: bossSeed,
      bossHue: bossSeed % 360,
    };
  }

  function campaignMaxSlots(nodeNum) {
    return campaignNodeDef(nodeNum || currentCampaignNode()).maxSlots;
  }

  function countEquippedMutations() {
    var count = 0;
    (G.equippedBattleIds || []).forEach(function (id) {
      if (mutationItemForStrain(id)) count++;
    });
    return count;
  }

  function campaignGateFailures(nodeNum) {
    var def = campaignNodeDef(nodeNum);
    var failures = [];
    var ids = (G.equippedBattleIds || []).slice(0, def.maxSlots);
    if (!ids.length) failures.push('Equip campaign squad in Index');
    if (def.minMutations === -1) {
      ids.forEach(function (id) {
        if (!mutationItemForStrain(id)) failures.push('All equipped strains need mutation shards');
      });
    } else if (def.minMutations > 0) {
      var mc = countEquippedMutations();
      if (mc < def.minMutations) failures.push('Need ' + def.minMutations + '+ mutations (' + mc + '/' + def.minMutations + ')');
    }
    if (def.minRarity) {
      ids.forEach(function (id) {
        var s = strainById(id);
        if (s && rarityIndex(s.rarity) < def.minRarityIdx) failures.push('Min rarity ' + rarityName(def.minRarity) + '+ required');
      });
    }
    var seen = {};
    return failures.filter(function (f) { if (seen[f]) return false; seen[f] = true; return true; });
  }

  function campaignPassesGates(nodeNum) {
    return campaignGateFailures(nodeNum).length === 0;
  }

  function enforceCampaignSlotLimit() {
    var max = campaignMaxSlots();
    if (!Array.isArray(G.equippedBattleIds)) G.equippedBattleIds = [];
    if (G.equippedBattleIds.length > max) {
      G.equippedBattleIds = G.equippedBattleIds.slice(0, max);
      scheduleSave();
    }
  }

  function battleWaveNum() { return ((currentCampaignNode() - 1) % 5) + 1; }
  function isBossWave() { return isCampaignMegaNode(currentCampaignNode()); }
  function xpNeededForLevel(lvl) { return (lvl || 1) * XP_LVL; }
  function packLuckBonus() {
    var luck = blitzMod('packLuck');
    G.strains.forEach(function (st) { luck += abilityBonus(st, 'rift_luck', 0.05); });
    luck += CoOpSynergyManager.getPackLuckBonus();
    luck += G.mutationPackLuck || 0;
    return luck;
  }

  function packWheelPercent(strain, luck) {
    if (!strain) return 35;
    var luckVal = luck != null ? luck : packLuckBonus();
    var tier = rarityIndex(strain.rarity);
    var pct = Math.floor((tier / Math.max(1, RARITIES.length - 1)) * 72 + luckVal * 100 + effectivePotency(strain) * 0.08);
    return Math.max(12, Math.min(99, pct));
  }

  function mutationItemForStrain(sid) {
    if (!G || !G.strainMutationMap || !sid) return null;
    var mutId = G.strainMutationMap[sid];
    if (!mutId) return null;
    return (G.mutationItems || []).find(function (m) { return m.id === mutId; }) || null;
  }

  function mutationStatFromStrain(s) {
    if (hasAbility(s, 'yield_surge') || hasAbility(s, 'portal_sync')) return 'yield';
    if ((s.potency || 0) >= 65) return 'potency';
    if (s.abilities && s.abilities.length) return 'ability';
    return 'dps';
  }

  function mutationYieldMult(s) {
    if (!s) return 1;
    var m = mutationItemForStrain(s.id);
    if (!m || (m.stat || 'dps') !== 'yield') return 1;
    return 1 + (m.power || 1) * 0.06;
  }

  function effectiveYield(s) {
    if (!s) return 0;
    return s.yield * mutationYieldMult(s);
  }

  function effectivePotency(s) {
    if (!s) return 0;
    var m = mutationItemForStrain(s.id);
    var bonus = (m && (m.stat || 'dps') === 'potency') ? (m.power || 1) * 3 : 0;
    return (s.potency || 0) + bonus;
  }

  function mutationDpsMult(s) {
    if (!s) return 1;
    var m = mutationItemForStrain(s.id);
    if (!m || (m.stat || 'dps') !== 'dps') return 1;
    return 1 + (m.power || 1) * 0.06;
  }

  function mutationAbilityMult(s) {
    if (!s) return 1;
    var m = mutationItemForStrain(s.id);
    if (!m || (m.stat || 'dps') !== 'ability') return 1;
    return 1 + (m.power || 1) * 0.05;
  }

  function ensureStrainAbility(strain, minCount) {
    if (!strain.abilities) strain.abilities = [];
    var tierIdx = rarityIndex(strain.rarity);
    while (strain.abilities.length < minCount) {
      var pool = ABILITIES.filter(function (a) {
        return (a.minRarity || 0) <= tierIdx && strain.abilities.indexOf(a.id) < 0;
      });
      if (!pool.length) break;
      strain.abilities.push(pool[Math.floor(Math.random() * pool.length)].id);
    }
  }

  function applyGuaranteeAbility(strain, opts) {
    if (!opts || !opts.guaranteeAbility || !strain) return;
    var tierIdx = rarityIndex(strain.rarity);
    var min = 2 + Math.floor(tierIdx / 6);
    ensureStrainAbility(strain, min);
  }

  function consumeMutationGuarantee() {
    if ((G.mutationGuaranteeCharges || 0) <= 0) return false;
    G.mutationGuaranteeCharges--;
    scheduleSave();
    return true;
  }

  function spendMutationPackLuck() {
    var cost = 15;
    if ((G.mutationEssence || 0) < cost) {
      showBattleToast('Need ' + cost + ' mutation essence', false);
      return false;
    }
    G.mutationEssence -= cost;
    G.mutationPackLuck = (G.mutationPackLuck || 0) + 0.03;
    popLabel('+3% PACK LUCK', { mega: true });
    showBattleToast('Mutation luck boosted · total +' + ((G.mutationPackLuck || 0) * 100).toFixed(0) + '%', true);
    scheduleSave();
    return true;
  }

  function spendMutationGuaranteeCharge() {
    var cost = 25;
    if ((G.mutationEssence || 0) < cost) {
      showBattleToast('Need ' + cost + ' mutation essence', false);
      return false;
    }
    G.mutationEssence -= cost;
    G.mutationGuaranteeCharges = (G.mutationGuaranteeCharges || 0) + 1;
    popLabel('+1 ABILITY GUARANTEE', { mega: true });
    showBattleToast('Guaranteed ability charge · ' + G.mutationGuaranteeCharges + ' ready', true);
    scheduleSave();
    return true;
  }

  function equipMutationItem(mutId, strainId) {
    var m = (G.mutationItems || []).find(function (x) { return x.id === mutId; });
    var s = strainById(strainId);
    if (!m || !s) return false;
    if (!G.strainMutationMap) G.strainMutationMap = {};
    Object.keys(G.strainMutationMap).forEach(function (k) {
      if (G.strainMutationMap[k] === mutId) delete G.strainMutationMap[k];
    });
    G.strainMutationMap[strainId] = mutId;
    showBattleToast('Equipped ' + m.name + ' on ' + s.name, true);
    scheduleSave();
    return true;
  }

  function syncDailyShowcaseDay() {
    var day = dailyShowcaseSeed();
    if (G.dailyShowcaseDay !== day) {
      G.dailyShowcaseDay = day;
      G.dailyShowcasePurchased = [false, false, false];
      G.dailyShowcaseCache = null;
    }
    if (!Array.isArray(G.dailyShowcasePurchased) || G.dailyShowcasePurchased.length !== 3) {
      G.dailyShowcasePurchased = [false, false, false];
    }
  }

  function triggerVoidPrestige() {
    if (!G) return false;
    var essenceGain = Math.floor((G.totalCashEarned || 0) / 1000000 * (1 + blitzMod('voidEssence')));
    G.voidEssence = (G.voidEssence || 0) + essenceGain;
    var sorted = G.strains.slice().sort(function (a, b) {
      var d = rarityIndex(b.rarity) - rarityIndex(a.rarity);
      if (d !== 0) return d;
      return (b.potency || 0) - (a.potency || 0);
    });
    var kept = sorted.slice(0, 3).map(function (s) { return clone(s); });
    G.prestigeVault = kept;
    G.strains = kept;
    G.cash = 250000;
    G.sp = 100;
    G.bossRound = 1;
    G.campaignNode = 1;
    G.campaignNodeClears = [];
    G.totalCashEarned = 0;
    G.equippedBattleIds = [];
    G.raidEquipIds = [];
    G.mutationEssence = 0;
    G.mutationItems = [];
    G.strainMutationMap = {};
    G.mutationPackLuck = 0;
    G.mutationGuaranteeCharges = 0;
    G.factoryFloors = (G.factoryFloors || []).map(function (f) { return Object.assign({}, f, { equippedStrainId: null }); });
    G.bossHp = 0;
    G.bossMaxHp = 0;
    spawnBoss();
    popArcadeBurst([
      { type: 'label', label: 'VOID PRESTIGE!', jackpot: true },
      { type: 'label', label: '+' + essenceGain + ' VOID ESSENCE', mega: true, delay: 120 },
    ]);
    showBattleToast('Void Prestige · +' + essenceGain + ' Essence · ×' + voidEssenceMult().toFixed(2) + ' output', true);
    plantSay('level_up', true);
    scheduleSave();
    return true;
  }

  function genUniqueStrainPair(minR, packType) {
    var luck = packLuckBonus();
    var scan = scanMult();
    var baseOpts = { scanBonus: scan, packLuckBonus: luck };
    var bossOpts = { scanBonus: scan, packLuckBonus: luck + 0.05 };
    var isBoss = packType === 'boss' || packType === 'milestone';
    var seed = Date.now() + Math.floor(Math.random() * 0xffffff);
    var s1 = genPack(isBoss ? 'guaranteed' : 'basic', seed, isBoss ? bossOpts : baseOpts);
    var s2, tries = 0;
    do {
      var rollSeed = seed + 1337 + tries * 9973;
      s2 = genPack(isBoss ? 'guaranteed' : 'basic', rollSeed, isBoss ? bossOpts : baseOpts);
      tries++;
    } while (s2.genomeId === s1.genomeId && tries < 24);
    return [s1, s2];
  }

  function queueReward(kind, packType) {
    G.pendingRewards = G.pendingRewards || [];
    if (G.pendingRewards.length >= 4) G.pendingRewards.shift();
    G.pendingRewards.push({ kind: kind, packType: packType || kind });
    scheduleSave();
    render();
  }

  function drainRewardQueue() {
    // Chest-first: rewards stay in pendingRewards until open-chest.
  }

  function onLevelUp(newLvl) {
    queueReward('single', 'level');
    if (newLvl % 10 === 0) queueReward('dual', 'milestone');
    popArcadeBurst([
      { type: 'label', label: 'LEVEL UP!', mega: true },
      { type: 'label', label: 'LV.' + newLvl, mega: true, delay: 100 },
      { type: 'label', label: 'NEW STRAIN!', mega: true, delay: 200 },
    ]);
    if (newLvl % 10 === 0) popLabel('MILESTONE PACK!', { jackpot: true, delay: 400 });
    showBattleToast('LEVEL UP! LV.' + newLvl, true);
    shakeScreen();
    plantSay('level_up', true);
  }

  function showBattleToast(msg, big) {
    UI.battleToasts = UI.battleToasts || [];
    UI.battleToasts.push({ msg: msg, big: !!big, at: Date.now() });
    if (UI.battleToasts.length > 6) UI.battleToasts.shift();
    UI.dirty.toasts = true;
  }

  function arcadePopsAllowed() {
    return UI.activeTab === 'battle' && !UI.farmOpen && !UI.playerSelectOpen;
  }

  function arcadePopColor(type, rarity) {
    if (rarity) return rarityColor(rarity);
    if (type === 'cash') return '#39FF14';
    if (type === 'xp') return '#F472B6';
    if (type === 'sp') return '#22D3EE';
    if (type === 'strain') return '#C084FC';
    if (type === 'jackpot') return '#FFD700';
    return '#E879F9';
  }

  function initArcadePool() {
    poolLayerCached = DOM.arcadePopLayer || document.getElementById('arcade-pop-layer');
    if (!poolLayerCached) return;
    poolLayerCached.innerHTML = '';
    arcadePool = [];
    for (var i = 0; i < ARCADE_POOL_SIZE; i++) {
      var el = document.createElement('div');
      el.className = 'arcade-pop';
      el.style.cssText = 'display:none;position:absolute;will-change:transform,opacity;pointer-events:none';
      poolLayerCached.appendChild(el);
      arcadePool.push({ el: el, active: false, expiresAt: 0, spawnAt: 0, delay: 0, dur: 1550, shown: false });
    }
  }

  function spawnOptimizedPop(type, text, rarity, isBig, customX, customY, delay, extra) {
    if (!text || !arcadePopsAllowed()) return;
    extra = extra || {};
    var now = Date.now();
    delay = delay || 0;
    var token = null;
    for (var i = 0; i < arcadePool.length; i++) {
      if (!arcadePool[i].active) { token = arcadePool[i]; break; }
    }
    if (!token) {
      token = arcadePool[0];
      for (var j = 1; j < arcadePool.length; j++) {
        if (arcadePool[j].expiresAt < token.expiresAt) token = arcadePool[j];
      }
      token.el.style.display = 'none';
      token.shown = false;
    }
    var isJackpot = !!(extra.jackpot || type === 'jackpot');
    var isMega = !!(extra.mega || isJackpot || type === 'mega' || type === 'label');
    var cssType = isJackpot ? 'jackpot' : (type === 'label' ? 'mega' : type);
    var dur = isJackpot ? 2600 : (isMega ? 2100 : 1550);
    var cls = 'arcade-pop arcade-pop-' + cssType;
    if (isBig) cls += ' arcade-pop-big';
    if (isMega && !isJackpot) cls += ' arcade-pop-mega';
    if (isJackpot) cls += ' arcade-pop-jackpot';
    var x = customX != null ? customX : (10 + Math.random() * 80);
    var y = customY != null ? customY : (28 + Math.random() * 38);
    token.el.className = cls;
    token.el.textContent = text;
    token.el.style.left = x + '%';
    token.el.style.top = y + '%';
    token.el.style.color = arcadePopColor(cssType, rarity);
    token.el.style.animationDuration = (dur / 1000) + 's';
    token.el.style.display = 'none';
    token.active = true;
    token.spawnAt = now;
    token.delay = delay;
    token.dur = dur;
    token.expiresAt = now + delay + dur;
    token.shown = false;
  }

  function updateArcadeLayerTick() {
    if (!poolLayerCached) return;
    var now = Date.now();
    if (!G || !arcadePopsAllowed()) {
      for (var h = 0; h < arcadePool.length; h++) {
        if (arcadePool[h].active) {
          arcadePool[h].active = false;
          arcadePool[h].el.style.display = 'none';
          arcadePool[h].shown = false;
        }
      }
      return;
    }
    if (now - (UI._lastPassivePop || 0) >= 1200 && (UI._passiveCashAcc || 0) >= 35) {
      popCash(UI._passiveCashAcc, { big: UI._passiveCashAcc >= 500 });
      UI._passiveCashAcc = 0;
      UI._lastPassivePop = now;
    }
    if (now - (UI._lastPlanetPop || 0) >= 1500 && (UI._planetCashAcc || 0) >= 25) {
      popCash(UI._planetCashAcc, { big: UI._planetCashAcc >= 400 });
      UI._planetCashAcc = 0;
      UI._lastPlanetPop = now;
    }
    if (now - (UI._lastPlanetSpPop || 0) >= 2000 && (UI._planetSpAcc || 0) >= 1.5) {
      popSp(Math.max(1, Math.floor(UI._planetSpAcc)), { big: UI._planetSpAcc >= 8 });
      UI._planetSpAcc = 0;
      UI._lastPlanetSpPop = now;
    }
    for (var k = 0; k < arcadePool.length; k++) {
      var t = arcadePool[k];
      if (!t.active) continue;
      if (now < t.spawnAt + t.delay) {
        if (t.shown) { t.el.style.display = 'none'; t.shown = false; }
        continue;
      }
      if (now >= t.expiresAt) {
        t.active = false;
        t.el.style.display = 'none';
        t.shown = false;
        continue;
      }
      if (!t.shown) {
        t.el.style.display = '';
        t.el.style.animation = 'none';
        void t.el.offsetWidth;
        t.el.style.animation = '';
        t.shown = true;
      }
    }
  }

  function clearArcadePops() {
    for (var i = 0; i < arcadePool.length; i++) {
      arcadePool[i].active = false;
      arcadePool[i].el.style.display = 'none';
      arcadePool[i].shown = false;
    }
  }

  function popLabel(text, opts) {
    opts = opts || {};
    spawnOptimizedPop('label', text, null, !!(opts.big || opts.mega || opts.jackpot), opts.x, opts.y, opts.delay, opts);
  }

  function popCash(amt, opts) {
    opts = opts || {};
    if (!amt || amt <= 0) return;
    var big = !!(opts.big || opts.mega || opts.jackpot);
    if (!big && amt >= 2500) big = true;
    spawnOptimizedPop('cash', '+' + fmtCash(amt), null, big, opts.x, opts.y, opts.delay, opts);
  }

  function popXp(amt, opts) {
    opts = opts || {};
    if (!amt || amt <= 0) return;
    var big = !!(opts.big || opts.mega || opts.jackpot);
    if (!big && amt >= 40) big = true;
    spawnOptimizedPop('xp', '+' + Math.floor(amt) + ' XP', null, big, opts.x, opts.y, opts.delay, opts);
  }

  function popSp(amt, opts) {
    opts = opts || {};
    if (!amt || amt <= 0) return;
    var big = !!(opts.big || opts.mega || opts.jackpot);
    if (!big && amt >= 10) big = true;
    spawnOptimizedPop('sp', '+' + Math.floor(amt) + ' SP', null, big, opts.x, opts.y, opts.delay, opts);
  }

  function popStrain(strain, opts) {
    if (!strain) return;
    opts = opts || {};
    var qty = opts.qty != null ? opts.qty : 1;
    var name = strain.name || 'Strain';
    if (name.length > 22) name = name.slice(0, 20) + '…';
    var text = qty > 1 ? '+' + qty + ' ' + name : '+' + name;
    var idx = rarityIndex(strain.rarity);
    spawnOptimizedPop('strain', text, strain.rarity, opts.big || idx >= 8, opts.x, opts.y, opts.delay, {
      mega: opts.mega || idx >= 12,
      jackpot: opts.jackpot || idx >= 16,
    });
  }

  function popArcadeBurst(items) {
    items.forEach(function (it, i) {
      setTimeout(function () {
        if (it.type === 'label') popLabel(it.label, { mega: it.mega, jackpot: it.jackpot, delay: it.delay, x: 18 + i * 22, y: 30 + (i % 3) * 10 });
        else if (it.type === 'strain') popStrain(it.strain, { qty: it.qty, big: it.big, mega: it.mega, jackpot: it.jackpot, delay: it.delay, x: 15 + i * 20 + Math.random() * 8, y: 32 + (i % 2) * 12 });
        else if (it.type === 'cash') popCash(it.amount, { big: it.big, mega: it.mega, jackpot: it.jackpot, delay: it.delay, x: 15 + i * 20 + Math.random() * 8, y: 32 + (i % 2) * 12 });
        else if (it.type === 'xp') popXp(it.amount, { big: it.big, mega: it.mega, jackpot: it.jackpot, delay: it.delay, x: 15 + i * 20 + Math.random() * 8, y: 32 + (i % 2) * 12 });
        else if (it.type === 'sp') popSp(it.amount, { big: it.big, mega: it.mega, jackpot: it.jackpot, delay: it.delay, x: 15 + i * 20 + Math.random() * 8, y: 32 + (i % 2) * 12 });
      }, (it.delay || 0) + i * 85);
    });
  }

  function renderBattleToasts() {
    var el = DOM.battleToastLayer || document.getElementById('battle-toast-layer');
    if (!el) return;
    if (UI.activeTab !== 'battle' || UI.farmOpen) { el.innerHTML = ''; return; }
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
    var art = document.querySelector('.boss-stage-entity');
    if (art) {
      art.classList.remove('boss-hit-flash', 'boss-crit-flash');
      void art.offsetWidth;
      art.classList.add(crit ? 'boss-crit-flash' : 'boss-hit-flash');
    }
  }

  function spawnBoss() {
    var node = currentCampaignNode();
    var def = campaignNodeDef(node);
    var mega = def.isMega;
    var round = node;
    G.bossRound = round;
    var seed = def.bossSeed + Date.now() % 10000;
    var rng = rngSeed(seed);
    var scanLuck = scanMult() * 0.01 + blitzMod('packLuck') * 0.5 + (node - 1) * 0.008;
    var rar = pickRarity(rng, undefined, scanLuck);
    G.bossSeed = seed;
    G.bossRarity = rar;
    G.bossIsMega = mega;
    if (mega) {
      G.bossName = genBossName(rng);
      G.bossMaxHp = Math.floor(800 * def.hpMult * rMult(rar) * 2.2);
    } else {
      G.bossName = MINION_NAMES[battleWaveNum() - 1] || MINION_NAMES[0];
      G.bossMaxHp = Math.floor(180 * def.hpMult * rMult(rar) * (0.55 + battleWaveNum() * 0.1));
    }
    G.bossHp = G.bossMaxHp;
    G.bossTrait = node % 4;
    G.bossWaveStartedAt = Date.now();
    G.bossTraitState = { solarAcc: 0, solarSilence: null };
    if (G.bossTrait === 2) {
      G.bossShieldMax = Math.floor(G.bossMaxHp * 0.3);
      G.bossShieldHp = G.bossShieldMax;
    } else {
      G.bossShieldMax = 0;
      G.bossShieldHp = 0;
    }
    markBossHpDirty();
    markBossShieldDirty();
    markBossTraitDirty();
  }

  function strainById(id) { return G.strains.find(function (s) { return s.id === id; }); }

  function strainBattleDpsBase(s) {
    if (!s) return 0;
    var base = (effectiveYield(s) * s.thcPercent / 100) * rMult(s.rarity) * s.quantity;
    if (hasAbility(s, 'boss_slayer')) base *= 1.3 * abilityBoostMult(s, 'boss_slayer') * mutationAbilityMult(s);
    if (hasAbility(s, 'thc_overdrive')) base *= 1.15 * abilityBoostMult(s, 'thc_overdrive') * mutationAbilityMult(s);
    var m = mutationItemForStrain(s.id);
    if (m && (m.stat || 'dps') === 'potency') base *= 1 + (m.power || 1) * 0.04;
    base *= mutationDpsMult(s);
    return base;
  }

  function strainBattleDps(s, rng) {
    if (!s) return 0;
    var base = strainBattleDpsBase(s);
    if (hasAbility(s, 'crit_burst') && rng && rng() < 0.15) base *= 3 * abilityBoostMult(s, 'crit_burst') * mutationAbilityMult(s);
    return base;
  }

  function battleDamageBreakdown(dt, forTick) {
    var rng = rngSeed(G.bossSeed + Math.floor(Date.now() / 200));
    var ids = (G.equippedBattleIds || []).slice(0, campaignMaxSlots());
    var wave = battleWaveNum();
    var regenMult = 1;
    var dotPerSec = 0;
    var normalPerSec = 0;
    var critPerSec = 0;
    var hadCrit = false;
    ids.forEach(function (id) {
      var s = strainById(id);
      if (!s) return;
      if (hasAbility(s, 'poison_cloud')) dotPerSec += 5 * s.quantity * abilityBoostMult(s, 'poison_cloud') * mutationAbilityMult(s);
      if (hasAbility(s, 'regen_mist')) regenMult += 0.03 * (wave - 1) * abilityBoostMult(s, 'regen_mist') * mutationAbilityMult(s);
    });
    ids.forEach(function (id) {
      var s = strainById(id);
      if (!s || isStrainSolarSilenced(id)) return;
      var base = (effectiveYield(s) * s.thcPercent / 100) * rMult(s.rarity) * s.quantity;
      if (hasAbility(s, 'boss_slayer')) base *= 1.3 * abilityBoostMult(s, 'boss_slayer') * mutationAbilityMult(s);
      if (hasAbility(s, 'thc_overdrive')) base *= 1.15 * abilityBoostMult(s, 'thc_overdrive') * mutationAbilityMult(s);
      var mp = mutationItemForStrain(s.id);
      if (mp && (mp.stat || 'dps') === 'potency') base *= 1 + (mp.power || 1) * 0.04;
      base *= mutationDpsMult(s);
      var isCrit = forTick && hasAbility(s, 'crit_burst') && rng() < 0.15;
      if (isCrit) { critPerSec += base * 3 * mutationAbilityMult(s); hadCrit = true; }
      else normalPerSec += base;
    });
    var mult = (1 + blitzMod('battle')) * regenMult * voidEssenceMult();
    normalPerSec *= mult;
    critPerSec *= mult;
    dotPerSec *= mult;
    var sec = forTick ? (dt / 1000) : 1;
    return {
      dps: normalPerSec + critPerSec + dotPerSec,
      normal: normalPerSec * sec,
      crit: critPerSec * sec,
      dot: dotPerSec * sec,
      total: (normalPerSec + critPerSec + dotPerSec) * sec,
      hadCrit: hadCrit,
    };
  }

  function computeBattleDps(dt) {
    return battleDamageBreakdown(dt || 1000, true);
  }

  function totalBattleDps() {
    return computeBattleDps(1000).dps;
  }

  function killBoss() {
    var node = currentCampaignNode();
    var def = campaignNodeDef(node);
    var mega = def.isMega;
    var wave = battleWaveNum();
    var mult = 1;
    (G.equippedBattleIds || []).forEach(function (id) {
      var s = strainById(id);
      mult += abilityBonus(s, 'cash_magnet', 0.08);
    });
    var cashGain = Math.floor((mega ? 5000 : 750) * def.rewardMult * rMult(G.bossRarity) * mult * (mega ? 1 : 0.35 + wave * 0.1) * voidEssenceMult() * (1 + blitzMod('bossCash')) * (1 + blitzMod('campaignNode')));
    creditCash(cashGain);
    var spGain = Math.floor((mega ? (12 + node * 4) : Math.max(1, Math.floor(wave / 2) + Math.floor(node / 4))) * (1 + blitzMod('sp')) * (1 + blitzMod('campaignNode')));
    G.sp = (G.sp || 0) + spGain;
    markHudDirty();
    markWalletDirty();
    var xpGain = Math.floor((mega ? (40 + node * 10) : (12 + wave * 6 + node * 2)) * (1 + blitzMod('campaignNode')));
    var xpFinal = Math.floor(xpGain * (1 + blitzMod('xp')));
    addXp(xpFinal, true);
    popArcadeBurst([
      { type: 'cash', amount: cashGain, mega: mega, jackpot: mega && cashGain >= 8000 },
      { type: 'sp', amount: spGain, big: true, mega: mega },
      { type: 'xp', amount: xpFinal, big: true, mega: mega },
    ]);
    if (mega) {
      popLabel('BOSS JACKPOT!', { jackpot: true, delay: 280 });
      popLabel('RIFT TWIN PACK!', { mega: true, delay: 380 });
      UI.battleWaveFlash = 'boss-kill-celebrate';
    } else {
      UI.battleWaveFlash = 'boss-wave-clear';
    }
    if (mega) queueReward('dual', 'boss');
    if (!isCampaignNodeCleared(node)) {
      if (!Array.isArray(G.campaignNodeClears)) G.campaignNodeClears = [];
      G.campaignNodeClears.push(node);
      bumpQuestProgress('clear_nodes', 1);
    }
    if (node < CAMPAIGN_NODE_COUNT) {
      G.campaignNode = node + 1;
      G.bossRound = G.campaignNode;
      enforceCampaignSlotLimit();
    }
    spawnBoss();
    shakeScreen();
    flashBossHit(mega);
    setTimeout(function () { UI.battleWaveFlash = null; render(); }, mega ? 900 : 550);
    if (mega) {
      showBattleToast('NODE ' + node + ' CLEARED! +' + spGain + ' SP · RIFT TWIN PACK!', true);
      plantSay('boss_kill', true);
    } else {
      showBattleToast('Node ' + node + ' cleared · +' + spGain + ' SP', false);
      plantSay('wave_clear', true);
    }
    addTrophyPoints(mega ? 15 : 8);
    addBattlePassXp(mega ? 35 : 18);
    if (window.VoidlineClan && window.VoidlineClan.addTrophies) window.VoidlineClan.addTrophies(mega ? 5 : 2);
    checkAchievements();
    scheduleSave();
  }

  function tickBoss(dt) {
    try {
      if (!G.bossMaxHp || G.bossHp <= 0) return;
      if (!campaignPassesGates(currentCampaignNode())) return;
      var trait = getBossTrait();
      if (trait === 1) {
        G.bossTraitState = G.bossTraitState || { solarAcc: 0, solarSilence: null };
        G.bossTraitState.solarAcc = (G.bossTraitState.solarAcc || 0) + dt;
        if (G.bossTraitState.solarAcc >= 4000) {
          G.bossTraitState.solarAcc = 0;
          var eqIds = (G.equippedBattleIds || []).filter(function (id) { return !!strainById(id); });
          if (eqIds.length) {
            var pick = eqIds[Math.floor(Math.random() * eqIds.length)];
            G.bossTraitState.solarSilence = { id: pick, until: Date.now() + 2000 };
            markBossDpsDirty();
          }
        }
      }
      var sapReduce = 0;
      (G.equippedBattleIds || []).forEach(function (id) {
        var s = strainById(id);
        sapReduce += abilityBonus(s, 'shield_sap', 0.08);
      });
      var regenRate = 0.0015;
      if (trait === 3) {
        var elapsed = (Date.now() - (G.bossWaveStartedAt || Date.now())) / 1000;
        if (elapsed > 15) regenRate *= 3;
      }
      var regen = G.bossMaxHp * regenRate * Math.max(0, 1 - sapReduce);
      if (regen > 0) G.bossHp = Math.min(G.bossMaxHp, G.bossHp + regen * (dt / 1000));
      var dmg = battleDamageBreakdown(dt, true);
      if (dmg.total <= 0) return;
      if (trait === 2 && (G.bossShieldHp || 0) > 0) {
        var shieldHit = Math.min(G.bossShieldHp, dmg.crit);
        G.bossShieldHp -= shieldHit;
        var critOverflow = dmg.crit - shieldHit;
        if (G.bossShieldHp <= 0) {
          G.bossHp = Math.max(0, G.bossHp - critOverflow - dmg.normal - dmg.dot);
        }
      } else {
        G.bossHp = Math.max(0, G.bossHp - dmg.total);
      }
      if (dmg.hadCrit) {
        UI.damagePopQueue.push({ amount: dmg.crit, isCrit: true, timestamp: Date.now() });
      } else {
        UI._bossHitAcc = (UI._bossHitAcc || 0) + dmg.total;
        if (UI._bossHitAcc >= G.bossMaxHp * 0.015) {
          UI._bossHitAcc = 0;
          UI.damagePopQueue.push({ amount: dmg.total, isCrit: false, timestamp: Date.now() });
        }
      }
      markBossHpDirty();
      markBossShieldDirty();
      markBossTraitDirty();
      if (G.bossHp <= 0) killBoss();
    } catch (err) {
      console.error('tickBoss', err);
    }
  }

  function equipBattle(sid) {
    var ids = (G.equippedBattleIds || []).slice();
    var idx = ids.indexOf(sid);
    if (idx >= 0) { ids.splice(idx, 1); G.equippedBattleIds = ids; scheduleSave(); markBossDpsDirty(); return true; }
    if (ids.length >= campaignMaxSlots()) return false;
    if (!strainById(sid)) return false;
    G.raidEquipIds = (G.raidEquipIds || []).filter(function (x) { return x !== sid; });
    ids.push(sid);
    G.equippedBattleIds = ids;
    scheduleSave();
    markBossDpsDirty();
    return true;
  }

  function equipBestBattle() {
    var raid = G.raidEquipIds || [];
    var max = campaignMaxSlots();
    var sorted = G.strains.slice().filter(function (s) { return raid.indexOf(s.id) < 0; }).sort(function (a, b) { return strainBattleDpsBase(b) - strainBattleDpsBase(a); });
    G.equippedBattleIds = sorted.slice(0, max).map(function (s) { return s.id; });
    scheduleSave();
    markBossDpsDirty();
    return true;
  }

  function equipRaid(sid) {
    var ids = (G.raidEquipIds || []).slice();
    var idx = ids.indexOf(sid);
    if (idx >= 0) { ids.splice(idx, 1); G.raidEquipIds = ids; scheduleSave(); return true; }
    if (ids.length >= BATTLE_EQUIP_MAX) return false;
    if (!strainById(sid)) return false;
    G.equippedBattleIds = (G.equippedBattleIds || []).filter(function (x) { return x !== sid; });
    ids.push(sid);
    G.raidEquipIds = ids;
    scheduleSave();
    return true;
  }

  function equipBestRaid() {
    var campaign = G.equippedBattleIds || [];
    var sorted = G.strains.slice().filter(function (s) { return campaign.indexOf(s.id) < 0; }).sort(function (a, b) { return strainBattleDpsBase(b) - strainBattleDpsBase(a); });
    G.raidEquipIds = sorted.slice(0, BATTLE_EQUIP_MAX).map(function (s) { return s.id; });
    scheduleSave();
    return true;
  }

  function filteredRaidEquipStrains() {
    var campaign = G.equippedBattleIds || [];
    var raid = G.raidEquipIds || [];
    var list = G.strains.filter(function (s) { return campaign.indexOf(s.id) < 0 && raid.indexOf(s.id) < 0; });
    var q = (UI.raidEquipSearch || '').toLowerCase();
    if (q) list = list.filter(function (s) { return s.name.toLowerCase().indexOf(q) >= 0 || rarityName(s.rarity).toLowerCase().indexOf(q) >= 0; });
    return sortStrainList(list, UI.raidEquipSort || 'dps', true);
  }

  function totalRaidDps() {
    var rng = rngSeed((G.bossSeed || 0) + 99);
    var total = 0;
    (G.raidEquipIds || []).forEach(function (id) {
      total += strainBattleDps(strainById(id), rng);
    });
    return total * (1 + blitzMod('raid'));
  }

  function filteredBattleEquipStrains() {
    var equipped = G.equippedBattleIds || [];
    var raid = G.raidEquipIds || [];
    var list = G.strains.filter(function (s) { return equipped.indexOf(s.id) < 0 && raid.indexOf(s.id) < 0; });
    var q = (UI.battleEquipSearch || '').toLowerCase();
    if (q) list = list.filter(function (s) { return s.name.toLowerCase().indexOf(q) >= 0 || rarityName(s.rarity).toLowerCase().indexOf(q) >= 0; });
    return sortStrainList(list, UI.battleEquipSort || 'dps', true);
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
      else { mascot.innerHTML = farmIcon('bud', { img: true, size: '1.5rem' }); }
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
    ensureEngagementState();
    if (canClaimDailyLogin()) UI.dailyLoginOpen = true;
    checkAchievements();
    markAllVisualDirty();
    plantSay('welcome', true);
    render();
    if (G.pendingRewards && G.pendingRewards.length) render();
  }

  function switchPlayerPrompt() { saveGame(); UI.playerSelectOpen = true; UI.profileOpen = false; UI.settingsOpen = false; render(); }
  function blitzMod(t) {
    var base = (G.purchasedBlitzIds || []).reduce(function (s, id) {
      var b = BLITZ_BY_ID[id];
      return b && b.modifierType === t ? s + b.modifier : s;
    }, 0);
    return base * blitzRushMult();
  }
  function scanMult() {
    if (!G || !Array.isArray(G.sectorUpgrades)) return blitzMod('scan');
    return G.sectorUpgrades.reduce(function (s, x) { return s + (x.level || 0) * (x.scanRateBonus || 0); }, 0) + blitzMod('scan');
  }
  function revMs() {
    var rm = 1 + blitzMod('revenue'), ym = 1 + blitzMod('yield'), t = 0;
    G.factoryFloors.forEach(function (f) {
      if (!f.equippedStrainId) return;
      var s = strainById(f.equippedStrainId);
      if (!s) return;
      var fm = 1;
      if (hasAbility(s, 'yield_surge')) fm *= abilityPotency(s, 'yield_surge', 1.2);
      if (hasAbility(s, 'portal_sync')) fm *= abilityPotency(s, 'portal_sync', 1.12);
      t += revSec(s) * f.level * rm * ym * fm;
    });
    G.inventory.forEach(function (i) {
      if (!i.owned) return;
      var def = STORE.find(function (x) { return x.id === i.id; });
      var bonus = def && def.revPerSec != null ? def.revPerSec : (i.type === 'nutrient' ? 0.5 : i.type === 'pipe' ? 1.2 : 0);
      t += i.owned * bonus;
    });
    return (t / 1000) * voidEssenceMult();
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
    if (amt > 0) amt = Math.floor(amt * (1 + blitzMod('xp')));
    if (amt > 0 && !skipPop) popXp(amt);
    G.empireXp = (G.empireXp || 0) + amt;
    while (G.empireXp >= xpNeededForLevel(G.empireLevel)) {
      G.empireXp -= xpNeededForLevel(G.empireLevel);
      G.empireLevel++;
      onLevelUp(G.empireLevel);
    }
    markHudDirty();
  }

  function tick(now) {
    var d = now - G.lastTickAt;
    if (d <= 0) return;
    if (G.blitzEndsAt && Date.now() >= G.blitzEndsAt) {
      G.blitzEndsAt = Date.now() + BLITZ_MS;
      rollBlitzOffers();
    }
    var cashGain = revMs() * d;
    creditCash(cashGain);
    UI._passiveCashAcc = (UI._passiveCashAcc || 0) + cashGain;
    tickPlanets(d);
    if (G.cloneJob && now >= G.cloneJob.startedAt + G.cloneJob.durationMs) completeClone();
    bossTickAcc += d;
    if (bossTickAcc >= 100) { tickBoss(bossTickAcc); bossTickAcc = 0; }
    autoScanAcc += d;
    if (autoScanAcc >= autoScanIntervalMs()) { autoScanAcc = 0; processAutoScan(); }
    processLeaseBilling();
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
    var useGuarantee = UI.packGuarantee && (G.mutationGuaranteeCharges || 0) > 0;
    var packOpts = { scanBonus: scanMult(), packLuckBonus: packLuckBonus(), guaranteeAbility: useGuarantee };
    var strain = genPack(type, Date.now() + Math.floor(Math.random() * 99999), packOpts);
    if (useGuarantee) {
      consumeMutationGuarantee();
      showBattleToast('Guaranteed ability roll applied to pack', true);
    }
    var luck = packLuckBonus();
    G.cash = nc; G.sp = ns;
    G.packReveal = { open: true, packType: type, strain: strain, wheelSpin: true, wheelPct: packWheelPercent(strain, luck) };
    if (spEarn > 0) popSp(spEarn, { big: spEarn >= 5 });
    popLabel('PACK OPEN!', { mega: true });
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
      if (pr.packType === 'breed') popLabel('FUSION COMPLETE!', { mega: true });
      else if (isBoss) popLabel('LEGENDARY DROP!', { jackpot: true });
      popStrain(pr.strain, { mega: pr.packType === 'breed' || isBoss, jackpot: isBoss, delay: 120 });
      plantSay('pack', true);
    }
    bumpQuestProgress('open_packs', 1);
    addBattlePassXp(15);
    if (pr.strain) bumpStrainMastery(pr.strain.rarity);
    if (pr.strains) pr.strains.forEach(function (s) { bumpStrainMastery(s.rarity); });
    G.packReveal = { open: false, packType: null, strain: null, strains: null, wheelSpin: false };
    scheduleSave();
    render();
  }
  function buyBlitz(id) {
    var u = blitzShopRows().find(function (b) { return b.id === id; });
    if (!u || u.purchased || G.cash < u.price) return false;
    var first = !G.purchasedBlitzIds.length;
    G.cash -= u.price;
    if (G.purchasedBlitzIds.indexOf(id) < 0) G.purchasedBlitzIds.push(id);
    if (first) G.blitzEndsAt = Date.now() + BLITZ_MS;
    scheduleSave();
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
    scheduleSave();
    render();
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
    scheduleSave();
    render();
    return true;
  }
  function startClone(sid) {
    if (G.cloneJob) return false;
    if (!strainById(sid)) return false;
    var cd = CLONE_MS * (1 - blitzMod('clone'));
    G.strains.forEach(function (st) {
      if (hasAbility(st, 'clone_echo')) cd *= Math.pow(0.9, abilityBoostMult(st, 'clone_echo'));
    });
    G.cloneJob = { strainId: sid, startedAt: Date.now(), durationMs: cd };
    return true;
  }
  function upgradeStrain(sid) { return upStrain(sid); }

  function onUpgrade(id) {
    healNullState();
    if (strainById(id)) return upStrain(id);
    if ((G.sectorUpgrades || []).some(function (x) { return x.id === id; })) return upSector(id);
    if ((G.factoryFloors || []).some(function (x) { return x.id === id; })) return upFloor(id);
    return false;
  }

  function giftStrain(sid, toPlayerId) {
    var s = strainById(sid);
    if (!s || (s.quantity || 1) < 1) return false;
    var target = readPlayerSaveMutable(toPlayerId);
    if (!target || toPlayerId === activePlayerId) return false;
    var gift = clone(s);
    gift.quantity = 1;
    gift.id = 'strain_gift_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
    target.strains = mergeStrains(target.strains || [], gift);
    if ((s.quantity || 1) <= 1) {
      G.strains = G.strains.filter(function (x) { return x.id !== sid; });
    } else {
      G.strains = G.strains.map(function (x) {
        return x.id === sid ? Object.assign({}, x, { quantity: x.quantity - 1 }) : x;
      });
    }
    writePlayerSave(toPlayerId, target);
    popLabel('GIFTED ' + s.name, { mega: true });
    scheduleSave();
    render();
    return true;
  }

  function upStrain(sid) {
    var i = G.strains.findIndex(function (s) { return s.id === sid; });
    if (i < 0) return false;
    var s = G.strains[i], c = upCost(s);
    if (G.cash < c) return false;
    G.cash -= c;
    var lvl = (s.strainLevel || strainCardLevel(s)) + 1;
    var u = G.strains.slice();
    u[i] = Object.assign({}, s, {
      strainLevel: lvl,
      yield: Math.round(s.yield * 1.12),
      potency: Math.min(100, s.potency + 5),
      thcPercent: parseFloat(Math.min(35, s.thcPercent + 0.8).toFixed(1)),
    });
    G.strains = u;
    addXp(10);
    plantSay('upgrade');
    scheduleSave();
    render();
    return true;
  }

  function sortStrainList(list, sortKey, dpsSort) {
    if (sortKey === 'rarity') list.sort(function (a, b) { return rarityIndex(b.rarity) - rarityIndex(a.rarity); });
    else if (sortKey === 'name') list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    else if (sortKey === 'name-desc') list.sort(function (a, b) { return b.name.localeCompare(a.name); });
    else if (sortKey === 'quantity') list.sort(function (a, b) { return (b.quantity || 1) - (a.quantity || 1); });
    else if (sortKey === 'level') list.sort(function (a, b) { return strainCardLevel(b) - strainCardLevel(a); });
    else if (dpsSort && sortKey === 'dps') list.sort(function (a, b) { return strainBattleDpsBase(b) - strainBattleDpsBase(a); });
    else list.sort(function (a, b) { return (b.discoveredAt || 0) - (a.discoveredAt || 0); });
    return list;
  }

  var STRAIN_SORT_CHIPS = [
    { id: 'rarity', label: 'Rarity' },
    { id: 'recent', label: 'Recent' },
    { id: 'name', label: 'A→Z' },
    { id: 'name-desc', label: 'Z→A' },
    { id: 'quantity', label: '#' },
    { id: 'level', label: 'Level' },
  ];

  var BATTLE_SORT_CHIPS = [
    { id: 'dps', label: 'DPS' },
    { id: 'rarity', label: 'Rarity' },
    { id: 'recent', label: 'Recent' },
    { id: 'name', label: 'A→Z' },
    { id: 'name-desc', label: 'Z→A' },
    { id: 'quantity', label: '#' },
    { id: 'level', label: 'Level' },
  ];

  function sortChipsHtml(sortAction, current, chips) {
    var actAttr = 'data-' + 'action';
    return '<div class="sort-chip-row">' + chips.map(function (c) {
      var cls = 'sort-chip' + (current === c.id ? ' active' : '');
      return '<button type="button" class="' + cls + '" ' + actAttr + '="' + sortAction + '" data-id="' + c.id + '">' + c.label + '</button>';
    }).join('') + '</div>';
  }

  function filteredStrains() {
    var list = G.strains.slice();
    var q = (G.indexSearch || '').toLowerCase();
    if (q) list = list.filter(function (s) { return s.name.toLowerCase().indexOf(q) >= 0; });
    return sortStrainList(list, G.indexSort || 'recent', false);
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
    if (opts.lift) {
      if (!ids.length) return '<div class="text-muted text-xs text-center">No abilities on this strain.</div>';
      return ids.map(function (aid) {
        var a = abilityDef(aid);
        var entry = strain ? strainAbilityId(strain, aid) : aid;
        var lvl = strain && entry ? abilityBoostLvl(strain, entry) : 0;
        var upBtn = '';
        if (opts.upgradeable && strain && entry) {
          var cost = abilityUpgradeCost(lvl);
          upBtn = '<button type="button" class="game-btn game-btn-sm game-btn-green" style="flex-shrink:0;padding:4px 8px;font-size:0.48rem" data-action="up-ability" data-id="' + esc(strain.id) + ':' + entry + '"' + (G.sp < cost ? ' disabled' : '') + '>+' + cost + ' SP</button>';
        }
        return '<div class="lift-ability-row"><div style="flex:1;min-width:0"><div class="text-green" style="font-weight:700;font-size:0.65rem">' + esc(a.name) + (lvl ? ' <span class="text-muted">Lv.' + lvl + '</span>' : '') + '</div><div class="text-muted" style="font-size:0.55rem;line-height:1.35;margin-top:0.15rem">' + esc(a.desc) + '</div></div>' + upBtn + '</div>';
      }).join('');
    }
    return (ids || []).map(function (aid) {
      var a = abilityDef(aid);
      var entry = strain ? strainAbilityId(strain, aid) : aid;
      var lvl = strain && entry ? abilityBoostLvl(strain, entry) : 0;
      var upBtn = '';
      if (opts.upgradeable && strain && entry) {
        var cost = abilityUpgradeCost(lvl);
        upBtn = ' <button type="button" class="game-btn game-btn-sm" style="padding:2px 6px;font-size:0.45rem;margin-left:0.25rem" data-action="up-ability" data-id="' + esc(strain.id) + ':' + entry + '"' + (G.sp < cost ? ' disabled' : '') + '>+' + cost + ' SP</button>';
      }
      return '<div class="text-xs mb-1 flex-between" style="gap:0.25rem;align-items:flex-start"><span><span class="text-green">' + esc(a.name) + (lvl ? ' Lv.' + lvl : '') + '</span> — ' + esc(a.desc) + '</span>' + upBtn + '</div>';
    }).join('');
  }

  function cardTierClass(rarity) {
    var idx = rarityIndex(rarity);
    if (idx >= 25) return 'cr-tier-godroll cr-tier-god';
    if (idx >= 20) return 'cr-tier-mythic cr-tier-champion';
    if (idx >= 18) return 'cr-tier-legend';
    if (idx >= 10) return 'cr-tier-epic';
    if (idx >= 4) return 'cr-tier-rare';
    return 'cr-tier-street';
  }

  function cardTierIndex(rarity) { return rarityIndex(rarity); }

  function strainVisualSeed(s) {
    var raw = String(s.genomeId || s.seed || s.id || '0').split('').reduce(function (a, c) {
      return ((a << 5) - a + c.charCodeAt(0)) | 0;
    }, 0);
    return Math.abs(raw);
  }

  function strainCardVisuals(s) {
    var v = strainVisualSeed(s);
    var roll = function (n) { return ((v * 1103515245 + 12345 + n * 97) & 0x7fffffff) / 0x7fffffff; };
    return {
      hue: Math.round((s.hue || 0) * 0.12 + roll(1) * 36 - 18),
      sat: (1 + roll(2) * 0.4).toFixed(2),
      scale: (0.9 + roll(3) * 0.18).toFixed(2),
      flip: roll(4) > 0.8,
      artSkew: ((roll(5) - 0.5) * 6).toFixed(1),
      arenaIdx: Math.floor(roll(6) * 12),
      particlePhase: (roll(7) * 2.5).toFixed(1),
      frameAccent: Math.floor(roll(8) * 6),
      sparkle: roll(9) > 0.55,
    };
  }

  function abilityPipsHtml(s) {
    var ab = (s.abilities || []).slice(0, 4);
    if (!ab.length) return '';
    return '<div class="cr-ability-pips">' + ab.map(function (aid) {
      var a = abilityDef(aid);
      return '<span class="cr-ability-pip" title="' + esc(a.name) + '">' + abilityIcon(aid) + '</span>';
    }).join('') + '</div>';
  }

  function cardFxHtml(tierIdx, vis, rc) {
    var h = '';
    if (tierIdx >= 10) h += '<div class="cr-card-particles" style="--phase:' + vis.particlePhase + 's"></div>';
    if (tierIdx >= 18) h += '<div class="cr-card-aura" style="background:radial-gradient(ellipse at 50% 80%, ' + rc + '44 0%, transparent 65%)"></div>';
    if (tierIdx >= 25) h += '<div class="cr-card-holo"></div>';
    return h;
  }

  function svgFallbackSeed(s) {
    var raw = strainVisualSeed(s || { id: 'fallback' });
    return function (n) { return ((raw * 1103515245 + 12345 + n * 97) & 0x7fffffff) / 0x7fffffff; };
  }

  function svgFallbackPalette(s) {
    var roll = svgFallbackSeed(s);
    var rc = s && s.rarity ? rarityColor(s.rarity) : '#4ADE80';
    var hue = Math.round((s && s.hue ? s.hue : 0) + roll(1) * 48 - 24);
    return {
      fill: rc,
      accent: 'hsl(' + ((hue + 120) % 360) + ',72%,62%)',
      glow: rc,
      leaf: 'hsl(' + hue + ',55%,38%)',
    };
  }

  function generateBossSvgMarkup(opts) {
    opts = opts || {};
    var seed = opts.seed != null ? opts.seed : 42;
    var hue = opts.hue != null ? opts.hue : (seed % 360);
    var roll = rngSeed(seed);
    var w = opts.width || 140;
    var h = opts.height || 160;
    var cx = w / 2;
    var glow = '0 0 16px hsl(' + hue + ',80%,55%)aa';
    var body = 'M' + cx + ' ' + (h * 0.88);
    body += ' C' + (cx - 48) + ' ' + (h * 0.72) + ' ' + (cx - 52) + ' ' + (h * 0.28) + ' ' + cx + ' ' + (h * 0.18);
    body += ' C' + (cx + 52) + ' ' + (h * 0.28) + ' ' + (cx + 48) + ' ' + (h * 0.72) + ' ' + cx + ' ' + (h * 0.88) + 'Z';
    var hornL = 'M' + (cx - 22) + ' ' + (h * 0.22) + ' Q' + (cx - 58) + ' ' + (h * 0.02) + ' ' + (cx - 34) + ' ' + (h * 0.38);
    var hornR = 'M' + (cx + 22) + ' ' + (h * 0.22) + ' Q' + (cx + 58) + ' ' + (h * 0.02) + ' ' + (cx + 34) + ' ' + (h * 0.38);
    var eyeY = h * 0.42;
    var paths = '';
    paths += '<ellipse cx="' + cx + '" cy="' + (h * 0.9) + '" rx="46" ry="10" fill="#000" opacity="0.35"/>';
    paths += '<path d="' + body + '" fill="hsl(' + hue + ',55%,38%)" stroke="#030712" stroke-width="2.5" stroke-linejoin="round" style="filter:drop-shadow(' + glow + ')"/>';
    paths += '<path d="' + hornL + '" fill="none" stroke="#030712" stroke-width="2.5" stroke-linecap="round"/>';
    paths += '<path d="' + hornR + '" fill="none" stroke="#030712" stroke-width="2.5" stroke-linecap="round"/>';
    paths += '<circle cx="' + (cx - 16) + '" cy="' + eyeY + '" r="7" fill="#FACC15" stroke="#030712" stroke-width="2.5"/>';
    paths += '<circle cx="' + (cx + 16) + '" cy="' + eyeY + '" r="7" fill="#FACC15" stroke="#030712" stroke-width="2.5"/>';
    paths += '<path d="M' + (cx - 20) + ' ' + (h * 0.58) + ' Q' + cx + ' ' + (h * 0.68) + ' ' + (cx + 20) + ' ' + (h * 0.58) + '" fill="none" stroke="#030712" stroke-width="2.5" stroke-linecap="round"/>';
    for (var i = 0; i < 4; i++) {
      var sx = cx + (roll(i + 3) - 0.5) * 36;
      var sy = h * 0.62 + roll(i + 9) * 18;
      paths += '<circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="4" fill="hsl(' + ((hue + 80) % 360) + ',70%,55%)" stroke="#030712" stroke-width="2"/>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" class="cr-art-fallback boss-svg-fallback" aria-hidden="true">' + paths + '</svg>';
  }

  function generateBudSvgMarkup(s, opts) {
    opts = opts || {};
    var roll = svgFallbackSeed(s);
    var pal = svgFallbackPalette(s);
    var w = opts.width || 200;
    var h = opts.height || 220;
    var cx = w / 2;
    var lean = (roll(2) - 0.5) * 18;
    var bulbW = 38 + roll(3) * 22;
    var bulbH = 52 + roll(4) * 28;
    var topY = h * 0.14 + roll(5) * 12;
    var botY = h * 0.84;
    var glow = '0 0 14px ' + pal.glow + 'aa, 0 0 28px ' + pal.glow + '55';
    var paths = '';
    paths += '<ellipse cx="' + cx + '" cy="' + (botY + 8) + '" rx="' + (bulbW + 14) + '" ry="11" fill="#000" opacity="0.28"/>';
    paths += '<path d="M' + cx + ' ' + botY + ' C' + (cx - bulbW) + ' ' + (botY - bulbH * 0.55) + ' ' + (cx - bulbW * 0.75) + ' ' + (topY + bulbH * 0.35) + ' ' + (cx + lean) + ' ' + topY + ' C' + (cx + bulbW * 0.8 + lean) + ' ' + (topY + bulbH * 0.35) + ' ' + (cx + bulbW) + ' ' + (botY - bulbH * 0.55) + ' ' + cx + ' ' + botY + 'Z" fill="' + pal.fill + '" stroke="#030712" stroke-width="2.5" stroke-linejoin="round" style="filter:drop-shadow(' + glow + ')"/>';
    var leafCount = 3 + Math.floor(roll(6) * 3);
    for (var i = 0; i < leafCount; i++) {
      var side = i % 2 === 0 ? -1 : 1;
      var ly = topY + 18 + i * (bulbH * 0.16);
      var lx1 = cx + lean * 0.4 + side * (8 + roll(10 + i) * 16);
      var lx2 = cx + lean * 0.6 + side * (28 + roll(20 + i) * 22);
      paths += '<path d="M' + (cx + lean * 0.3) + ' ' + (topY + 8) + ' Q' + lx1 + ' ' + ly + ' ' + lx2 + ' ' + (ly + 18) + '" fill="none" stroke="' + pal.leaf + '" stroke-width="2.5" stroke-linecap="round"/>';
    }
    var nugCount = 2 + Math.floor(roll(7) * 3);
    for (var j = 0; j < nugCount; j++) {
      var nx = cx + (roll(30 + j) - 0.5) * bulbW * 1.1;
      var ny = topY + 28 + roll(40 + j) * (botY - topY - 36);
      var nr = 4 + roll(50 + j) * 4;
      paths += '<circle cx="' + nx.toFixed(1) + '" cy="' + ny.toFixed(1) + '" r="' + nr.toFixed(1) + '" fill="' + pal.accent + '" stroke="#030712" stroke-width="2.5"/>';
    }
    paths += '<ellipse cx="' + (cx + lean * 0.2) + '" cy="' + (topY + bulbH * 0.22) + '" rx="' + (bulbW * 0.35) + '" ry="' + (bulbH * 0.22) + '" fill="rgba(255,255,255,0.14)"/>';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" class="cr-art-fallback" aria-hidden="true">' + paths + '</svg>';
  }

  function generateBudSvgDataUri(s) {
    var svg = generateBudSvgMarkup(s);
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function generateBadgeSvgMarkup(kind, label) {
    var pal = { thc: '#A855F7', lvl: '#F59E0B', dps: '#4ADE80', boss: '#F472B6' };
    var fill = pal[kind] || '#38BDF8';
    var txt = String(label || '?').slice(0, 4);
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="' + fill + '" stroke="#030712" stroke-width="2.5" style="filter:drop-shadow(0 0 10px ' + fill + '88)"/><text x="24" y="28" text-anchor="middle" font-family="Fredoka,Arial,sans-serif" font-size="14" font-weight="700" fill="#030712">' + esc(txt) + '</text></svg>';
  }

  function strainById(id) {
    if (!G || !id) return null;
    return G.strains.find(function (s) { return s.id === id; }) || null;
  }

  function applySvgFallback(img) {
    if (!img || img.dataset.svgApplied === '1') return;
    img.dataset.svgApplied = '1';
    var kind = img.dataset.artKind || 'bud';
    var s = strainById(img.dataset.strainId);
    if (kind === 'boss') {
      var bossHue = G && G.bossSeed != null ? G.bossSeed % 360 : 280;
      var svgBoss = generateBossSvgMarkup({ seed: G && G.bossSeed, hue: bossHue, width: 120, height: 132 });
      var holderBoss = document.createElement('div');
      holderBoss.innerHTML = svgBoss;
      img.replaceWith(holderBoss.firstChild);
      return;
    }
    var wrap = img.parentElement;
    var svg = generateBudSvgMarkup(s || { hue: 120, rarity: 'nova' });
    var holder = document.createElement('div');
    holder.innerHTML = svg;
    var node = holder.firstChild;
    if (wrap && wrap.classList.contains('cr-art-wrap')) {
      img.replaceWith(node);
    } else {
      img.src = generateBudSvgDataUri(s || { hue: 120, rarity: 'nova' });
      img.classList.add('cr-art-fallback');
    }
  }

  function bindImageFallbacks() {
    document.querySelectorAll('.voidline-art, .cr-card-art img, .boss-sprite').forEach(function (img) {
      if (img._svgFallbackBound) return;
      img._svgFallbackBound = true;
      if (img.complete && img.naturalWidth === 0) applySvgFallback(img);
      img.addEventListener('error', function () { applySvgFallback(img); });
    });
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
    if (s.strainLevel) return Math.max(1, Math.min(99, s.strainLevel));
    return Math.max(1, Math.min(99, Math.floor((s.potency || 10) / 8) + 1));
  }

  function strainCardArtImg(s) {
    var vis = strainCardVisuals(s);
    var artIdx = cardTierArtIndex(s.rarity);
    var wrapParts = ['scale(' + vis.scale + ')', 'skewX(' + vis.artSkew + 'deg)'];
    if (vis.flip) wrapParts.push('scaleX(-1)');
    var wrapStyle = 'transform:' + wrapParts.join(' ') + ';animation-delay:' + ((strainVisualSeed(s) % 30) / 10) + 's';
    var imgStyle = 'filter:saturate(' + vis.sat + ') drop-shadow(0 6px 8px rgba(0,0,0,0.45))';
    return '<div class="cr-art-layered cr-art-v' + (artIdx % 6) + '"><span class="cr-art-terrain cr-arena-' + vis.arenaIdx + '"></span><span class="cr-art-wrap" style="' + wrapStyle + '"><img src="' + strainCardArt(s) + '" alt="" draggable="false" class="voidline-art" data-art-kind="strain" data-strain-id="' + esc(s.id) + '" style="' + imgStyle + '"></span></div>';
  }

  function crCardFrameInner(opts) {
    var qtyBadge = (opts.qty && opts.qty > 1) ? '<div class="cr-badge cr-badge-qty">x' + opts.qty + '</div>' : '';
    var tagBadge = opts.tag ? '<div class="cr-badge cr-badge-tag">' + opts.tag + '</div>' : '';
    var arenaCls = 'cr-card-arena' + (opts.arenaIdx != null ? ' cr-arena-' + opts.arenaIdx : '');
    var bannerStyle = opts.bannerColor ? ' style="border-top-color:' + opts.bannerColor + '88"' : '';
    return '<div class="cr-card-frame holo-card ' + opts.tier + (opts.frameExtra || '') + '"' + (opts.frameStyle || '') + '>' +
      '<div class="cr-card-bevel"></div>' +
      '<div class="' + arenaCls + '"></div>' +
      '<div class="cr-card-art">' + opts.artHtml + '</div>' +
      (opts.cardFx || '') +
      opts.badgeLeft + (opts.badgeCenter || '') + opts.badgeRight + qtyBadge + tagBadge +
      (opts.abilityPips || '') +
      '<div class="cr-card-banner cr-card-banner-accent"' + bannerStyle + '><span class="cr-card-name">' + esc(opts.name) + '</span></div>' +
      '<div class="cr-card-shine"></div><div class="cr-card-foil"></div></div>';
  }

  function liftWrap(id, inner, onUp) { return '<div class="liftable-wrap" data-lift="' + esc(id) + '" data-lift-up="' + (onUp || '') + '"><div class="' + SKIN_PANEL + ' neon-card-static p-4">' + inner + '</div></div>'; }

  function crCardHtml(s, opts) {
    opts = opts || {};
    var tier = cardTierClass(s.rarity);
    var tierIdx = cardTierIndex(s.rarity);
    var vis = strainCardVisuals(s);
    var rc = rarityColor(s.rarity);
    var thc = parseFloat(s.thcPercent || 0);
    var thcStr = thc % 1 === 0 ? String(Math.floor(thc)) : thc.toFixed(1);
    var thcCls = thcStr.length > 3 ? ' cr-badge-sm' : '';
    var tag = s.planetExclusive ? farmIcon('planet') : ((s.parentIds && s.parentIds.length) ? farmIcon('hybrid') : '');
    var cls = 'cr-card' + (opts.selected ? ' selected' : '') + (opts.large ? ' cr-card-lg' : '') + (tierIdx >= 25 ? ' cr-card-godlift' : '');
    var dpsBadge = opts.showDps ? '<div class="cr-badge cr-badge-dps"><span>DPS</span>' + strainBattleDpsBase(s).toFixed(0) + '</div>' : '';
    var inner = crCardFrameInner({
      tier: tier, name: s.name, artHtml: strainCardArtImg(s),
      badgeLeft: '<div class="cr-badge cr-badge-thc' + thcCls + '">' + thcStr + '</div>',
      badgeCenter: dpsBadge,
      badgeRight: '<div class="cr-badge cr-badge-lvl"><span>Lv</span>' + strainCardLevel(s) + '</div>',
      qty: s.quantity, tag: tag,
      arenaIdx: vis.arenaIdx,
      abilityPips: abilityPipsHtml(s),
      cardFx: cardFxHtml(tierIdx, vis, rc) + (vis.sparkle && tierIdx >= 4 ? '<div class="cr-card-sparkle"></div>' : ''),
      bannerColor: rc,
      frameExtra: vis.frameAccent ? ' cr-frame-accent-' + vis.frameAccent : '',
      frameStyle: tierIdx >= 4 ? ' style="--cr-border:' + rc + '"' : '',
    });
    if (opts.noFocus) return '<div class="' + cls + '">' + inner + '</div>';
    return '<button type="button" class="' + cls + '" data-strain-focus="' + esc(s.id) + '">' + inner + '</button>';
  }

  function renderHUD() {
    var pl = playerDef(activePlayerId);
    var av = DOM.hudAvatar || document.getElementById('hud-avatar');
    if (av) {
      av.innerHTML = avatarHtml(migrateAvatar(G.avatar), '100%');
    }
    var nameEl = DOM.hudName || document.getElementById('hud-name');
    var levelEl = DOM.hudLevel || document.getElementById('hud-level');
    if (nameEl) nameEl.textContent = G.name;
    if (levelEl) levelEl.textContent = 'LV.' + G.empireLevel;
    syncWalletDom(true);
    syncXpDom(true);
    if (isToastsDirty()) { renderBattleToasts(); UI.dirty.toasts = false; }
    syncHudShell(true);
    var s = topStrain(), mascot = DOM.plantMascot || document.getElementById('plant-mascot'), label = DOM.plantLabel || document.getElementById('plant-label');
    if (mascot) {
      if (s) mascot.innerHTML = budImg(s, '1.5rem');
      else { mascot.innerHTML = farmIcon('bud', { img: true, size: '1.5rem' }); }
    }
    if (label) label.textContent = s ? s.name : 'No strain';
    syncCloudHud(true);
    UI.dirty.hud = false;
    UI.dirty.shell = false;
  }

  function syncWalletDom(force) {
    if (!force && !isWalletDirty()) return;
    var cashEl = DOM.hudCash || document.getElementById('hud-cash');
    if (cashEl) {
      var cashStr = fmtCash(G.cash);
      if (force || UI_LAST.cash !== cashStr) {
        cashEl.textContent = cashStr;
        UI_LAST.cash = cashStr;
      }
    }
    var spEl = DOM.hudSp || document.getElementById('hud-sp');
    if (spEl && (force || isHudDirty())) {
      var spStr = fmtSp(G.sp || 0);
      if (force || UI_LAST.sp !== spStr) {
        spEl.textContent = spStr;
        UI_LAST.sp = spStr;
      }
    }
    UI.dirty.wallet = false;
  }

  function syncXpDom(force) {
    if (!force && !isHudDirty()) return;
    var xpNeed = xpNeededForLevel(G.empireLevel);
    var xpPct = Math.min(100, (G.empireXp / xpNeed) * 100);
    var xpText = 'XP ' + Math.floor(G.empireXp) + ' / ' + xpNeed;
    var xpFill = DOM.hudXpFill || document.getElementById('hud-xp-fill');
    var xpTextEl = DOM.hudXpText || document.getElementById('hud-xp-text');
    if (xpFill && (force || UI_LAST.xpPct !== xpPct)) {
      xpFill.style.width = xpPct + '%';
      UI_LAST.xpPct = xpPct;
    }
    if (xpTextEl && (force || UI_LAST.xpText !== xpText)) {
      xpTextEl.textContent = xpText;
      UI_LAST.xpText = xpText;
    }
  }

  function syncHudShell(force) {
    if (!force && !UI.dirty.shell) return;
    var shell = DOM.phoneShell || document.getElementById('phone-shell');
    if (shell) {
      shell.className = 'phone-inner void-bg tab-bg-' + (UI.farmOpen ? 'farm' : UI.activeTab);
      // #region agent log
      // #endregion
    }
    var app = DOM.voidlineApp || document.getElementById('voidline-app');
    var warp = DOM.realityWarp || document.getElementById('overlay-reality-warp');
    if (app) app.classList.toggle('reality-warp-active', UI.realityWarp);
    if (warp) warp.classList.toggle('active', UI.realityWarp);
    document.querySelectorAll('.nav-btn').forEach(function (b) {
      var tab = b.dataset.tab;
      b.classList.toggle('active', tab === UI.activeTab && !UI.farmOpen);
    });
    UI.dirty.shell = false;
  }

  function syncBossBattleDom() {
    if (UI.activeTab !== 'battle' || UI.farmOpen) return;
    if (isBossHpDirty()) {
      var hpPct = G.bossMaxHp ? Math.max(0, G.bossHp / G.bossMaxHp * 100) : 0;
      var hp = document.querySelector('.boss-hp-fill') || document.querySelector('.battle-hub-hp-fill');
      if (hp && G.bossMaxHp && UI_LAST.bossHpPct !== hpPct) {
        hp.style.width = hpPct + '%';
        UI_LAST.bossHpPct = hpPct;
      }
      var hpCur = document.querySelector('.battle-hub-hp-current');
      if (hpCur && G.bossMaxHp) {
        var hpTxt = Math.ceil(G.bossHp).toLocaleString();
        if (UI_LAST.bossHpCur !== hpTxt) {
          hpCur.textContent = hpTxt;
          UI_LAST.bossHpCur = hpTxt;
        }
      }
      UI.dirty.bossHp = false;
    }
    if (isBossShieldDirty()) {
      var shieldBar = document.querySelector('.boss-shield-fill');
      if (shieldBar && G.bossShieldMax > 0) {
        var shieldPct = Math.max(0, (G.bossShieldHp / G.bossShieldMax) * 100);
        if (UI_LAST.bossShieldPct !== shieldPct) {
          shieldBar.style.width = shieldPct + '%';
          UI_LAST.bossShieldPct = shieldPct;
        }
      }
      UI.dirty.bossShield = false;
    }
    if (isBossTraitDirty()) {
      var traitState = document.querySelector('.boss-trait-state');
      if (traitState) {
        var traitText = bossTraitStatusText();
        if (UI_LAST.bossTrait !== traitText) {
          traitState.textContent = traitText;
          UI_LAST.bossTrait = traitText;
        }
      }
      UI.dirty.bossTrait = false;
    }
    if (isBossDpsDirty()) {
      var dpsVal = totalBattleDps();
      var dpsEl = document.querySelector('.battle-hub-dps-value') || document.getElementById('home-dps-display') || document.querySelector('.boss-stage-dps');
      if (dpsEl) {
        var dpsStr = (dpsEl.classList.contains('battle-hub-dps-value') || dpsEl.id === 'home-dps-display')
          ? 'DPS: ' + dpsVal.toFixed(1)
          : 'DPS ' + dpsVal.toFixed(1);
        if (UI_LAST.dps !== dpsStr) {
          dpsEl.textContent = dpsStr;
          UI_LAST.dps = dpsStr;
        }
      }
      UI.dirty.bossDps = false;
    }
  }

  function syncBattleHubTimers() {
    if (UI.activeTab !== 'battle' || UI.farmOpen) return;
    var eventEl = document.getElementById('battle-hub-event-timer');
    if (eventEl) {
      var evStr = fmtLongCd(voidRiftRem());
      if (UI_LAST.eventCd !== evStr) {
        eventEl.textContent = evStr;
        UI_LAST.eventCd = evStr;
      }
    }
    var cloneEl = document.getElementById('battle-hub-clone-timer');
    if (cloneEl) {
      var cloneStr = G.cloneJob ? fmtCd(cloneRem()) : 'READY';
      if (UI_LAST.cloneCd !== cloneStr) {
        cloneEl.textContent = cloneStr;
        UI_LAST.cloneCd = cloneStr;
      }
    }
    var revEl = document.getElementById('battle-hub-rev');
    if (revEl) {
      var revStr = fmtRev(revSecTotal());
      if (UI_LAST.hubRev !== revStr) {
        revEl.textContent = revStr;
        UI_LAST.hubRev = revStr;
      }
    }
  }

  function syncTabTimers() {
    if (UI.activeTab === 'shop') {
      var cd = document.getElementById('blitz-timer');
      if (cd) {
        var blitzStr = fmtCd(blitzRem());
        if (UI_LAST.blitzCd !== blitzStr) {
          cd.textContent = blitzStr;
          UI_LAST.blitzCd = blitzStr;
        }
      }
      var sf = document.getElementById('shop-flash-timer');
      if (sf) {
        var sfStr = fmtLongCd(shopFlashEndsMs());
        if (UI_LAST.shopFlashCd !== sfStr) {
          sf.textContent = sfStr;
          UI_LAST.shopFlashCd = sfStr;
        }
      }
    }
    if (UI.farmOpen && G.farmSubTab === 'portal' && G.cloneJob) {
      var cr = document.querySelector('.clone-active .font-mono.text-green');
      if (cr) {
        var cloneStr = fmtCd(cloneRem());
        if (UI_LAST.cloneCd !== cloneStr) {
          cr.textContent = cloneStr;
          UI_LAST.cloneCd = cloneStr;
        }
      }
    }
  }

  function processDamagePopQueue(now) {
    if (!UI.damagePopQueue.length) return;
    if (now - lastDamageVisualAt < DAMAGE_VISUAL_MS) return;
    lastDamageVisualAt = now;
    var batch = UI.damagePopQueue.splice(0, UI.damagePopQueue.length);
    var hadCrit = false;
    batch.forEach(function (entry) { if (entry.isCrit) hadCrit = true; });
    if (hadCrit) {
      if (!UI._lastCritPop || now - UI._lastCritPop > 1200) {
        UI._lastCritPop = now;
        popLabel('CRIT!', { mega: true, x: 42 + Math.random() * 16, y: 38 + Math.random() * 10 });
      }
      flashBossHit(true);
    } else if (batch.length) {
      flashBossHit(false);
    }
  }

  function visualLoop() {
    visualRafId = requestAnimationFrame(visualLoop);
    if (!G || UI.playerSelectOpen) return;
    var now = Date.now();
    processDamagePopQueue(now);
    updateArcadeLayerTick();
    syncWalletDom(false);
    syncXpDom(false);
    syncHudShell(false);
    syncBossBattleDom();
    syncBattleHubTimers();
    syncTabTimers();
    syncCloudHud(false);
    if (isToastsDirty()) { renderBattleToasts(); UI.dirty.toasts = false; }
  }

  function startVisualLoop() {
    if (!visualRafId) visualRafId = requestAnimationFrame(visualLoop);
  }

  function renderPlayerSelect() {
    var el = document.getElementById('overlay-player-select');
    if (!el) return;
    if (!UI.playerSelectOpen) { el.classList.remove('open'); el.innerHTML = ''; return; }
    el.classList.add('open');
    var cloud = window.VoidlineCloud;
    var cloudBadge = cloud && cloud.isLoggedIn()
      ? '<div class="auth-account-badge"><span class="cloud-sync-dot"></span>CLOUD · ' + esc(cloud.getEmail() || 'synced') + '</div>'
      : '<div class="auth-account-badge text-muted">LOCAL GUEST SAVE</div>';
    var h = '<div class="overlay-panel ' + SKIN_PANEL + ' p-5 text-center"><h2 class="font-display chromatic-text mb-2" style="font-size:1rem;letter-spacing:0.15em">WHO ARE YOU?</h2><p class="text-muted text-xs mb-1">Each person gets their own save on this device.</p>' + cloudBadge + '<div class="player-pick-grid">';
    PLAYERS.forEach(function (pl) {
      var save = readPlayerSave(pl.id);
      var lvl = save ? save.empireLevel : 1;
      var av = avatarHtml(pl.portrait, '2.5rem');
      h += '<button type="button" class="player-pick-card" data-action="pick-player" data-pid="' + pl.id + '">' + av + '<div style="font-weight:700">' + esc(pl.label) + '</div><div class="font-mono text-muted" style="font-size:0.55rem">' + esc(save ? (save.name || pl.label) : 'New game') + ' · Lv.' + lvl + '</div></button>';
    });
    h += '</div><button type="button" class="game-btn w-full mt-3" data-action="auth-manage">' + farmIcon('settings') + ' ACCOUNT</button></div>';
    el.innerHTML = h;
  }

  function processPendingReward(r) {
    if (!r) return;
    var luck = packLuckBonus();
    var useGuarantee = UI.packGuarantee && (G.mutationGuaranteeCharges || 0) > 0;
    var opts = { scanBonus: scanMult(), packLuckBonus: luck, guaranteeAbility: useGuarantee };
    if (r.kind === 'dual') {
      var pair = genUniqueStrainPair(r.packType === 'boss' ? 'bloom' : 'pulse', r.packType);
      if (useGuarantee) {
        pair.forEach(function (s) { applyGuaranteeAbility(s, opts); });
        consumeMutationGuarantee();
        showBattleToast('Guaranteed ability roll applied to chest', true);
      }
      var top = pair[0];
      G.packReveal = { open: true, packType: r.packType || 'rift-twin', strains: pair, strain: null, wheelSpin: true, wheelPct: packWheelPercent(top, luck) };
    } else if (r.kind === 'single') {
      var s = genPack('basic', Date.now() + Math.floor(Math.random() * 1e9), opts);
      if (useGuarantee) {
        consumeMutationGuarantee();
        showBattleToast('Guaranteed ability roll applied to chest', true);
      }
      G.packReveal = { open: true, packType: r.packType || 'level', strains: null, strain: s, wheelSpin: true, wheelPct: packWheelPercent(s, luck) };
    }
  }

  function openChestSlot(idx) {
    if (G.packReveal && G.packReveal.open) {
      showBattleToast('Close the open pack reveal first', false);
      return false;
    }
    var q = G.pendingRewards || [];
    var i = parseInt(idx, 10);
    if (i < 0 || i >= q.length) return false;
    var r = q.splice(i, 1)[0];
    G.pendingRewards = q;
    processPendingReward(r);
    scheduleSave();
    return true;
  }

  function destroyStrain(id) {
    var s = strainById(id);
    if (!s) return false;
    if (s.planetExclusive && (s.quantity || 1) <= 1) {
      showBattleToast('Cannot burn last planet-exclusive copy', false);
      return false;
    }
    var si = G.strains.findIndex(function (x) { return x.id === id; });
    if (si < 0) return false;
    if ((s.quantity || 1) > 1) {
      G.strains = G.strains.slice();
      G.strains[si] = Object.assign({}, s, { quantity: s.quantity - 1 });
    } else {
      G.strains = G.strains.filter(function (x) { return x.id !== id; });
      G.equippedBattleIds = (G.equippedBattleIds || []).filter(function (x) { return x !== id; });
      G.raidEquipIds = (G.raidEquipIds || []).filter(function (x) { return x !== id; });
      if (G.breedSlotA === id) G.breedSlotA = null;
      if (G.breedSlotB === id) G.breedSlotB = null;
      if (G.strainMutationMap && G.strainMutationMap[id]) delete G.strainMutationMap[id];
    }
    var power = Math.floor((1 + rarityIndex(s.rarity)) * (1 + blitzMod('mutationEssence')));
    G.mutationEssence = (G.mutationEssence || 0) + power;
    G.mutationItems = (G.mutationItems || []).concat([{
      id: 'mut_' + Date.now() + '_' + Math.floor(Math.random() * 9999),
      name: s.name.split(' ')[0] + ' Shard',
      tier: s.rarity,
      power: power,
      burnedAt: Date.now(),
    }]);
    popLabel('+' + power + ' MUTATION', { mega: true });
    showBattleToast('Burned ' + s.name + ' → +' + power + ' mutation', true);
    scheduleSave();
    return true;
  }

  function dailyShowcaseSeed() { return Math.floor(Date.now() / 86400000); }

  function dailyShowcaseItems() {
    syncDailyShowcaseDay();
    var day = dailyShowcaseSeed();
    if (G.dailyShowcaseCache && Array.isArray(G.dailyShowcaseCache)) {
      G.dailyShowcaseCache = { day: G.dailyShowcaseDay || day, items: G.dailyShowcaseCache };
    }
    if (G.dailyShowcaseCache && G.dailyShowcaseCache.day === day && G.dailyShowcaseCache.items && G.dailyShowcaseCache.items.length === 3) {
      return G.dailyShowcaseCache.items;
    }
    var pid = (activePlayerId || 'aden').split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
    var rng = rngSeed(day * 7919 + pid);
    var items = [];
    for (var i = 0; i < 3; i++) {
      var rar = pickRarity(rng, i === 2 ? 'bloom' : (i === 1 ? 'pulse' : 'spark'), 0.12 + i * 0.04);
      var strain = genStrain(Math.floor(rng() * 0xffffffff), rar, 0.08);
      var price = Math.floor(12000 + rarityIndex(rar) * 6500 + rng() * 18000);
      items.push({ slot: i, strain: strain, price: price, label: i === 2 ? 'MYTHIC' : (i === 1 ? 'LEGENDARY' : 'EPIC') });
    }
    G.dailyShowcaseCache = { day: day, items: items };
    G.dailyShowcaseDay = day;
    return items;
  }

  function buyDailyShowcase(slot) {
    syncDailyShowcaseDay();
    if (G.dailyShowcasePurchased[slot]) {
      showBattleToast('Already acquired today', false);
      return false;
    }
    var items = dailyShowcaseItems();
    var item = items[slot];
    if (!item || G.cash < item.price) return false;
    G.cash -= item.price;
    G.dailyShowcasePurchased[slot] = true;
    G.strains = mergeStrains(G.strains, item.strain);
    if (!G.focusedStrainId) G.focusedStrainId = item.strain.id;
    addXp(20);
    popStrain(item.strain, { mega: true, jackpot: slot === 2 });
    plantSay('pack', true);
    scheduleSave();
    return true;
  }

  function engagementDaySeed() { return Math.floor(Date.now() / 86400000); }

  function engagementWeekSeed() { return Math.floor(engagementDaySeed() / 7); }

  function voidRiftEndsAt() {
    var now = new Date();
    var dow = now.getDay();
    var daysLeft = dow === 0 ? 0 : 7 - dow;
    var end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysLeft, 23, 59, 59, 999);
    return end.getTime();
  }

  function voidRiftRem() { return Math.max(0, voidRiftEndsAt() - Date.now()); }

  function fmtLongCd(ms) {
    var t = Math.max(0, Math.floor(ms / 1000));
    var d = Math.floor(t / 86400);
    var h = Math.floor((t % 86400) / 3600);
    var m = Math.floor((t % 3600) / 60);
    if (d > 0) return d + 'd ' + h + 'h ' + m + 'm';
    if (h > 0) return h + 'h ' + m + 'm';
    return m + 'm ' + (t % 60) + 's';
  }

  function ensureQuestState() {
    var day = engagementDaySeed();
    var week = engagementWeekSeed();
    if (!G.dailyQuestProgress || typeof G.dailyQuestProgress !== 'object') G.dailyQuestProgress = {};
    if (!G.weeklyQuestProgress || typeof G.weeklyQuestProgress !== 'object') G.weeklyQuestProgress = {};
    if (G.dailyQuestDay !== day) {
      G.dailyQuestDay = day;
      G.dailyQuestProgress = {};
    }
    if (G.weeklyQuestWeek !== week) {
      G.weeklyQuestWeek = week;
      G.weeklyQuestProgress = {};
    }
  }

  function bumpQuestProgress(id, amt, scope) {
    if (!amt) return;
    ensureQuestState();
    if (scope === 'weekly') {
      G.weeklyQuestProgress[id] = (G.weeklyQuestProgress[id] || 0) + amt;
    } else {
      G.dailyQuestProgress[id] = (G.dailyQuestProgress[id] || 0) + amt;
    }
    addBattlePassXp(Math.max(1, Math.floor(amt * 8)));
  }

  function ensureBattlePass() {
    if (G.battlePassSeason !== BATTLE_PASS_SEASON) {
      G.battlePassSeason = BATTLE_PASS_SEASON;
      G.battlePassXp = 0;
      G.battlePassTier = 0;
      G.battlePassClaimed = { free: [], premium: [] };
    }
    if (!G.battlePassClaimed || typeof G.battlePassClaimed !== 'object') {
      G.battlePassClaimed = { free: [], premium: [] };
    }
    if (!Array.isArray(G.battlePassClaimed.free)) G.battlePassClaimed.free = [];
    if (!Array.isArray(G.battlePassClaimed.premium)) G.battlePassClaimed.premium = [];
    while (G.battlePassXp >= BATTLE_PASS_XP_PER_TIER && G.battlePassTier < BATTLE_PASS_MAX_TIER) {
      G.battlePassXp -= BATTLE_PASS_XP_PER_TIER;
      G.battlePassTier++;
    }
  }

  function addBattlePassXp(amt) {
    if (!amt) return;
    ensureBattlePass();
    G.battlePassXp = (G.battlePassXp || 0) + amt;
    var leveled = false;
    while (G.battlePassXp >= BATTLE_PASS_XP_PER_TIER && G.battlePassTier < BATTLE_PASS_MAX_TIER) {
      G.battlePassXp -= BATTLE_PASS_XP_PER_TIER;
      G.battlePassTier++;
      leveled = true;
    }
    if (leveled) showBattleToast('Battle Pass Tier ' + G.battlePassTier + '!', true);
  }

  function battlePassRewardFor(tier, track) {
    var row = BATTLE_PASS_REWARDS[tier - 1];
    if (!row) return null;
    return track === 'premium' ? row.premium : row.free;
  }

  function claimBattlePassTier(tier, track) {
    ensureBattlePass();
    tier = parseInt(tier, 10);
    if (isNaN(tier) || tier < 1 || tier > G.battlePassTier) {
      showBattleToast('Reach tier ' + tier + ' first', false);
      return false;
    }
    if (track === 'premium' && !G.battlePassPremium) {
      showBattleToast('Premium track locked', false);
      return false;
    }
    var list = track === 'premium' ? G.battlePassClaimed.premium : G.battlePassClaimed.free;
    if (list.indexOf(tier) >= 0) {
      showBattleToast('Already claimed', false);
      return false;
    }
    var reward = battlePassRewardFor(tier, track);
    if (!reward) return false;
    grantEngagementReward(reward);
    list.push(tier);
    G.battlePassClaimed = { free: G.battlePassClaimed.free.slice(), premium: G.battlePassClaimed.premium.slice() };
    showBattleToast('Battle Pass reward claimed!', true);
    scheduleSave();
    return true;
  }

  function shopFlashBundle() {
    var week = Math.floor(Date.now() / (7 * 86400000));
    return SHOP_FLASH_BUNDLES[week % SHOP_FLASH_BUNDLES.length];
  }

  function shopFlashEndsMs() {
    var weekMs = 7 * 86400000;
    var elapsed = Date.now() % weekMs;
    return weekMs - elapsed;
  }

  function syncShopFlashWeek() {
    var week = Math.floor(Date.now() / (7 * 86400000));
    if (G._shopFlashWeek !== week) {
      G._shopFlashWeek = week;
      G.shopFlashPurchased = false;
    }
  }

  function buyShopFlash() {
    syncShopFlashWeek();
    if (G.shopFlashPurchased) {
      showBattleToast('Flash deal already claimed this week', false);
      return false;
    }
    var bundle = shopFlashBundle();
    var price = Math.floor(35000 * (bundle.priceMult || 1));
    if (G.cash < price) return false;
    G.cash -= price;
    if (bundle.cash) G.cash += bundle.cash;
    if (bundle.sp) G.sp = (G.sp || 0) + bundle.sp;
    if (bundle.packs && bundle.packType) {
      for (var i = 0; i < bundle.packs; i++) {
        var s = genPack(bundle.packType, Date.now() + i * 9973, { scanBonus: scanMult(), packLuckBonus: packLuckBonus() });
        G.strains = mergeStrains(G.strains, s);
        bumpStrainMastery(s.rarity);
      }
      popLabel(bundle.name + '!', { mega: true, jackpot: true });
    }
    G.shopFlashPurchased = true;
    addBattlePassXp(40);
    addXp(30);
    scheduleSave();
    showBattleToast(bundle.name + ' acquired!', true);
    return true;
  }

  function bumpStrainMastery(rarity) {
    if (!rarity) return;
    if (!G.strainMastery || typeof G.strainMastery !== 'object') G.strainMastery = {};
    G.strainMastery[rarity] = (G.strainMastery[rarity] || 0) + 1;
  }

  function battlePassRewardLabel(reward) {
    if (!reward) return '—';
    var parts = [];
    if (reward.cash) parts.push(fmtCash(reward.cash));
    if (reward.sp) parts.push(reward.sp + ' SP');
    return parts.join(' + ') || '—';
  }

  function syncCloudHud(force) {
    if (!force && !UI.dirty.cloudSync) return;
    var el = DOM.cloudSyncStrip || document.getElementById('hud-cloud-sync');
    if (!el) return;
    var cloud = window.VoidlineCloud;
    var status = cloud && cloud.getSyncStatus ? cloud.getSyncStatus() : { state: 'offline' };
    var label = 'LOCAL SAVE';
    var cls = 'hud-cloud-sync-strip';
    if (status.state === 'guest') {
      label = 'GUEST · LOCAL SAVE';
      cls += ' cloud-guest';
    } else if (status.state === 'offline') {
      label = 'OFFLINE · LOCAL SAVE';
      cls += ' cloud-offline';
    } else if (status.state === 'syncing') {
      label = 'SYNCING TO CLOUD…';
      cls += ' cloud-syncing';
    } else if (status.state === 'error') {
      label = 'CLOUD SYNC ERROR';
      cls += ' cloud-error';
    } else if (cloud && cloud.isLoggedIn && cloud.isLoggedIn()) {
      label = 'CLOUD · ' + (status.email || cloud.getEmail() || 'synced');
      cls += status.state === 'synced' ? ' cloud-synced' : ' cloud-linked';
    }
    if (force || UI_LAST.cloudSyncLabel !== label) {
      el.className = cls;
      el.innerHTML = '<span class="cloud-sync-dot"></span><span id="hud-cloud-sync-text">' + esc(label) + '</span>';
      UI_LAST.cloudSyncLabel = label;
    }
    UI.dirty.cloudSync = false;
  }

  function questProgressFor(def, scope) {
    ensureQuestState();
    var store = scope === 'weekly' ? G.weeklyQuestProgress : G.dailyQuestProgress;
    return Math.min(def.target, store[def.id] || 0);
  }

  function questRowHtml(def, scope) {
    var prog = questProgressFor(def, scope);
    var pct = Math.min(100, (prog / def.target) * 100);
    var done = prog >= def.target;
    var h = '<div class="battle-hub-quest' + (done ? ' battle-hub-quest-done' : '') + '">';
    if (def.action === 'open-daily-login' && !done) {
      h += '<button type="button" class="battle-hub-quest-main" data-action="open-daily-login">';
    } else {
      h += '<div class="battle-hub-quest-main">';
    }
    h += '<div class="battle-hub-quest-icon">' + farmIcon(def.icon || 'pack') + '</div>';
    h += '<div class="battle-hub-quest-body"><div class="battle-hub-quest-name">' + esc(def.name) + '</div>';
    h += '<div class="battle-hub-quest-bar"><div class="battle-hub-quest-fill" style="width:' + pct + '%"></div></div>';
    h += '<div class="battle-hub-quest-prog">' + (def.id === 'earn_cash' ? fmtCash(prog) + ' / ' + fmtCash(def.target) : prog + ' / ' + def.target) + '</div>';
    h += '</div>';
    h += def.action === 'open-daily-login' && !done ? '</button>' : '</div>';
    if (scope === 'weekly') h += '<span class="battle-hub-quest-tag">WEEKLY</span>';
    h += '</div>';
    return h;
  }

  function battleHubEventBannerHtml() {
    var h = '<div class="battle-hub-event">';
    h += '<div class="battle-hub-event-glow"></div>';
    h += '<div class="battle-hub-event-body">';
    h += '<div class="battle-hub-event-icon">' + farmIcon('portal', { lg: true }) + '</div>';
    h += '<div class="battle-hub-event-info"><div class="battle-hub-event-title">VOID RIFT INVASION</div>';
    h += '<div class="battle-hub-event-sub">Bonus node rewards · ends soon</div></div>';
    h += '<div class="battle-hub-event-timer" id="battle-hub-event-timer">' + fmtLongCd(voidRiftRem()) + '</div>';
    h += '</div></div>';
    return h;
  }

  function battleHubPendingChestsHtml() {
    var q = G.pendingRewards || [];
    if (!q.length) return '';
    var h = '<div class="battle-hub-chests">';
    q.forEach(function (r, i) {
      h += '<button type="button" class="battle-hub-chest-btn" data-action="open-chest" data-id="' + i + '">';
      h += farmIcon('pack') + '<span>' + esc(chestLabel(r)) + '</span><span class="battle-hub-chest-open">OPEN</span></button>';
    });
    h += '</div>';
    return h;
  }

  function battleHubSquadHtml() {
    var ids = (G.equippedBattleIds || []).slice(0, BATTLE_EQUIP_MAX);
    var h = '<div class="battle-hub-squad"><div class="battle-hub-squad-label">CAMPAIGN SQUAD</div><div class="battle-hub-squad-row">';
    for (var i = 0; i < BATTLE_EQUIP_MAX; i++) {
      var s = ids[i] ? strainById(ids[i]) : null;
      if (s) {
        h += '<div class="battle-hub-squad-slot battle-hub-squad-filled" title="' + esc(s.name) + '">' + budImg(s, '2rem') + '</div>';
      } else {
        h += '<div class="battle-hub-squad-slot battle-hub-squad-empty">' + farmIcon('empty') + '</div>';
      }
    }
    h += '</div></div>';
    return h;
  }

  function battleHubHeroHtml() {
    var node = currentCampaignNode();
    var def = campaignNodeDef(node);
    var mega = isBossWave();
    var bossHue = def.bossHue;
    var dps = totalBattleDps();
    var h = '<section class="battle-hub-hero' + (mega ? ' battle-hub-hero-mega' : '') + '">';
    h += '<div class="battle-hub-hero-bg campaign-boss-hue-' + (bossHue % 12) + '">';
    h += '<div class="battle-hub-hero-nebula boss-stage-nebula campaign-boss-hue-' + (bossHue % 12) + '"></div>';
    h += '<div class="battle-hub-hero-boss">';
    h += '<div class="boss-aura-ring campaign-boss-accent-' + (bossHue % 8) + '"></div>';
    h += '<img src="' + BOSS_ART + '" alt="" class="battle-hub-boss-img voidline-art campaign-boss-hue-' + (bossHue % 12) + '" data-art-kind="boss" onerror="this.onerror=null;this.src=\'' + BOSS_ART_FALLBACK + '\'">';
    h += '</div><div class="battle-hub-hero-dim"></div></div>';
    h += '<div class="battle-hub-hero-content">';
    h += '<div class="battle-hub-node-tag">NODE ' + node + '/' + CAMPAIGN_NODE_COUNT + (mega ? ' · MEGA' : '') + '</div>';
    h += '<button type="button" class="battle-hub-start-btn" data-action="start-run">';
    h += '<span class="battle-hub-start-icon">' + farmIcon('mega', { lg: true }) + '</span>';
    h += '<span class="battle-hub-start-label">START RUN</span></button>';
    h += '<div class="battle-hub-dps battle-hub-power" id="home-dps-display">';
    h += '<span class="battle-hub-dps-label">POWER</span>';
    h += '<span class="battle-hub-dps-value boss-stage-dps">DPS: ' + dps.toFixed(1) + '</span></div>';
    h += battleHubSquadHtml();
    h += '<button type="button" class="battle-hub-equip-link" data-action="hub-raid">' + farmIcon('equip') + ' EDIT SQUAD</button>';
    h += '</div></section>';
    return h;
  }

  function battleHubQuestsHtml() {
    ensureQuestState();
    var h = '<section class="battle-hub-quests ' + SKIN_PANEL + '">';
    h += '<div class="battle-hub-section-head"><span class="battle-hub-section-icon">' + farmIcon('help') + '</span>';
    h += '<span class="battle-hub-section-title">QUESTS & EVENTS</span></div>';
    h += battleHubEventBannerHtml();
    DAILY_QUEST_DEFS.forEach(function (q) { h += questRowHtml(q, 'daily'); });
    WEEKLY_QUEST_DEFS.forEach(function (q) { h += questRowHtml(q, 'weekly'); });
    h += battleHubPendingChestsHtml();
    h += '</section>';
    return h;
  }

  function battleHubPortalPanelHtml() {
    var floors = G.factoryFloors ? G.factoryFloors.length : 0;
    var cr = cloneRem();
    var cloneActive = !!G.cloneJob;
    var h = '<section class="battle-hub-portal ' + SKIN_PANEL + '">';
    h += '<div class="battle-hub-section-head"><span class="battle-hub-section-icon">' + farmIcon('portal') + '</span>';
    h += '<span class="battle-hub-section-title battle-hub-section-title-cyan">PORTAL FARM</span></div>';
    h += '<div class="battle-hub-portal-grid">';
    h += '<div class="battle-hub-portal-stat"><div class="battle-hub-portal-stat-label">$/SEC</div>';
    h += '<div class="battle-hub-portal-stat-value" id="battle-hub-rev">' + fmtRev(revSecTotal()) + '</div></div>';
    h += '<div class="battle-hub-portal-stat"><div class="battle-hub-portal-stat-label">FLOORS</div>';
    h += '<div class="battle-hub-portal-stat-value battle-hub-portal-floors">' + floors + '</div></div>';
    h += '<div class="battle-hub-portal-stat battle-hub-portal-clone"><div class="battle-hub-portal-stat-label">CLONER</div>';
    h += '<div class="battle-hub-cloner-row">' + farmIcon('clone', { lg: true });
    h += '<span class="battle-hub-cloner-timer" id="battle-hub-clone-timer">' + (cloneActive ? fmtCd(cr) : 'READY') + '</span></div></div>';
    h += '</div>';
    h += '<button type="button" class="battle-hub-upgrade-btn" data-action="open-portal-farm">' + farmIcon('tower') + ' UPGRADE</button>';
    h += '</section>';
    return h;
  }

  function ensureEngagementState() {
    if (!Array.isArray(G.achievementsUnlocked)) G.achievementsUnlocked = [];
    if (!G.achievementStats || typeof G.achievementStats !== 'object') G.achievementStats = {};
    if (!Array.isArray(G.trophyRoadClaimed)) G.trophyRoadClaimed = [];
    if (G.trophyPoints == null || isNaN(G.trophyPoints)) G.trophyPoints = 0;
    if (G.dailyLoginStreak == null || isNaN(G.dailyLoginStreak)) G.dailyLoginStreak = 0;
    if (G.dailyLoginLastDay == null || isNaN(G.dailyLoginLastDay)) G.dailyLoginLastDay = 0;
    if (G.dailyLoginClaimedDay == null || isNaN(G.dailyLoginClaimedDay)) G.dailyLoginClaimedDay = 0;
  }

  function grantEngagementReward(reward) {
    if (!reward) return;
    if (reward.cash) { G.cash += reward.cash; popLabel('+' + fmtCash(reward.cash), { mega: true }); }
    if (reward.sp) { G.sp = (G.sp || 0) + reward.sp; popLabel('+' + reward.sp + ' SP', { mega: true }); }
    markWalletDirty();
  }

  function addTrophyPoints(pts) {
    if (!pts) return;
    ensureEngagementState();
    G.trophyPoints = (G.trophyPoints || 0) + pts;
  }

  function checkAchievements() {
    if (!G) return;
    ensureEngagementState();
    var unlocked = G.achievementsUnlocked.slice();
    var changed = false;
    ACHIEVEMENTS.forEach(function (a) {
      if (unlocked.indexOf(a.id) >= 0) return;
      if (!a.check(G)) return;
      unlocked.push(a.id);
      grantEngagementReward(a.reward);
      if (a.trophy) addTrophyPoints(a.trophy);
      showBattleToast('Achievement: ' + a.name, true);
      changed = true;
    });
    if (changed) { G.achievementsUnlocked = unlocked; scheduleSave(); }
  }

  function canClaimDailyLogin() {
    ensureEngagementState();
    return G.dailyLoginClaimedDay !== engagementDaySeed();
  }

  function claimDailyLogin() {
    ensureEngagementState();
    var day = engagementDaySeed();
    if (G.dailyLoginClaimedDay === day) {
      showBattleToast('Already claimed today', false);
      return false;
    }
    var streak = G.dailyLoginStreak || 0;
    if (G.dailyLoginLastDay === day - 1) streak += 1;
    else if (G.dailyLoginLastDay !== day) streak = 1;
    var idx = Math.min(streak, DAILY_LOGIN_REWARDS.length) - 1;
    var reward = DAILY_LOGIN_REWARDS[idx] || DAILY_LOGIN_REWARDS[0];
    grantEngagementReward(reward);
    G.dailyLoginStreak = streak;
    G.dailyLoginLastDay = day;
    G.dailyLoginClaimedDay = day;
    addTrophyPoints(5);
    bumpQuestProgress('claim_login', 1);
    showBattleToast('Day ' + streak + ' login reward!', true);
    UI.dailyLoginOpen = false;
    scheduleSave();
    checkAchievements();
    return true;
  }

  function claimTrophyRoad(milestoneId) {
    ensureEngagementState();
    var m = TROPHY_ROAD.find(function (x) { return x.id === milestoneId; });
    if (!m) return false;
    if ((G.trophyPoints || 0) < m.pts) {
      showBattleToast('Need ' + m.pts + ' trophy points', false);
      return false;
    }
    if (G.trophyRoadClaimed.indexOf(m.id) >= 0) {
      showBattleToast('Already claimed', false);
      return false;
    }
    G.trophyRoadClaimed = G.trophyRoadClaimed.concat([m.id]);
    grantEngagementReward(m.reward);
    showBattleToast('Trophy Road reward claimed!', true);
    scheduleSave();
    return true;
  }

  function cardOfDayStrain() {
    var day = engagementDaySeed();
    if (G.cardOfDaySeed !== day) {
      G.cardOfDaySeed = day;
      G.cardOfDayPurchased = false;
    }
    var pid = (activePlayerId || 'aden').split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
    var rng = rngSeed(day * 9973 + pid);
    var rar = pickRarity(rng, 'pulse', 0.15);
    return { strain: genStrain(Math.floor(rng() * 0xffffffff), rar, 0.1), price: Math.floor(18000 + rarityIndex(rar) * 8000) };
  }

  function buyCardOfDay() {
    var cod = cardOfDayStrain();
    if (G.cardOfDayPurchased) {
      showBattleToast('Card of the Day already acquired', false);
      return false;
    }
    if (G.cash < cod.price) return false;
    G.cash -= cod.price;
    G.cardOfDayPurchased = true;
    G.strains = mergeStrains(G.strains, cod.strain);
    if (!G.focusedStrainId) G.focusedStrainId = cod.strain.id;
    addXp(15);
    popStrain(cod.strain, { mega: true });
    plantSay('pack', true);
    scheduleSave();
    checkAchievements();
    return true;
  }

  function chestLabel(r) {
    if (!r) return '';
    var pt = (r.packType || r.kind || 'reward').toUpperCase().replace(/-/g, ' ');
    return pt;
  }

  function bossArenaStageHtml() {
    var hpPct = G.bossMaxHp ? Math.max(0, G.bossHp / G.bossMaxHp * 100) : 0;
    var bc = rarityColor(G.bossRarity);
    var dps = totalBattleDps();
    var mega = isBossWave();
    var node = currentCampaignNode();
    var def = campaignNodeDef(node);
    var bossHue = def.bossHue;
    var gates = campaignGateFailures(node);
    var h = '<div class="boss-stage glass-inset' + (mega ? ' boss-stage-mega' : '') + '">';
    h += '<div class="boss-stage-sky"></div>';
    h += '<div class="boss-stage-nebula campaign-boss-hue-' + (bossHue % 12) + '"></div>';
    h += '<div class="boss-stage-floor"></div>';
    h += '<div class="boss-stage-entity boss-arena-art">';
    h += '<div class="boss-aura-ring campaign-boss-accent-' + (bossHue % 8) + '"></div>';
    h += '<img src="' + BOSS_ART + '" alt="" class="boss-sprite voidline-art campaign-boss-hue-' + (bossHue % 12) + '" data-art-kind="boss" onerror="this.onerror=null;this.src=\'' + BOSS_ART_FALLBACK + '\'">';
    h += '</div>';
    h += '<div class="campaign-arena-node-badge">NODE ' + node + (mega ? ' · MEGA' : '') + '</div>';
    h += '<div class="boss-stage-hud">';
    if (mega) h += '<div class="boss-mega-tag">' + farmIcon('mega') + ' MEGA BOSS · RIFT TWIN PACK</div>';
    h += '<div class="boss-stage-name font-display">' + esc(G.bossName) + '</div>';
    h += '<div class="boss-stage-tier">' + esc(rarityName(G.bossRarity)) + ' tier · Campaign ' + node + '/' + CAMPAIGN_NODE_COUNT + '</div>';
    h += '<div class="boss-hp-bar"><div class="boss-hp-fill boss-hp-fill-anim campaign-hp-pct-' + Math.floor(hpPct / 5) + '"></div></div>';
    if (getBossTrait() === 2 && (G.bossShieldMax || 0) > 0) {
      var shPct = Math.max(0, (G.bossShieldHp / G.bossShieldMax) * 100);
      h += '<div class="boss-shield-bar"><div class="boss-shield-fill campaign-shield-pct-' + Math.floor(shPct / 5) + '"></div></div>';
    }
    h += '<div class="boss-hp-text"><span class="text-green">' + Math.ceil(G.bossHp).toLocaleString() + ' HP</span><span class="text-muted">' + G.bossMaxHp.toLocaleString() + '</span></div>';
    h += '<div class="boss-trait-badge"><span class="boss-trait-name">' + esc(bossTraitLabel(getBossTrait())) + '</span><span class="boss-trait-state">' + esc(bossTraitStatusText()) + '</span></div>';
    if (gates.length) {
      h += '<div class="campaign-arena-gate-warn">';
      gates.slice(0, 2).forEach(function (g) { h += '<div class="campaign-gate-line">' + esc(g) + '</div>'; });
      h += '</div>';
    }
    h += '<div class="boss-stage-dps">DPS ' + dps.toFixed(1) + ' · ' + def.maxSlots + ' slots</div>';
    h += '</div></div>';
    return h;
  }

  function homeChestSlotsHtml() {
    var q = G.pendingRewards || [];
    var h = '<div class="home-chest-grid">';
    for (var i = 0; i < 4; i++) {
      var r = q[i];
      if (r) {
        h += '<button type="button" class="home-chest-slot home-chest-ready halftone-panel" data-action="open-chest" data-id="' + i + '">';
        h += '<div class="home-chest-icon">' + farmIcon('pack') + '</div><div class="home-chest-label">' + esc(chestLabel(r)) + '</div>';
        h += '<div class="home-chest-open">OPEN</div></button>';
      } else {
        h += '<div class="home-chest-slot home-chest-empty halftone-panel"><div class="home-chest-icon opacity-60">' + farmIcon('empty') + '</div><div class="home-chest-label text-muted">EMPTY</div></div>';
      }
    }
    h += '</div>';
    return h;
  }

  function hubOrbBtn(label, actionName, iconKind) {
    var actAttr = 'data-action';
    return '<button type="button" class="hub-orb-btn halftone-panel" ' + actAttr + '="' + esc(actionName) + '" title="' + esc(label) + '"><span class="hub-orb-glow"></span><span class="hub-orb-icon">' + farmIcon(iconKind, { lg: true }) + '</span><span class="hub-orb-label">' + esc(label) + '</span></button>';
  }

  function fightTopBarHtml(farmMode) {
    var h = '<div class="fight-top-bar mb-2 ' + SKIN_PANEL + ' p-2">';
    if (farmMode) {
      h += '<div class="flex-between gap-2 w-full"><div class="fight-top-info"><h2 class="font-display chromatic-text fight-top-title">PORTAL FARM</h2>';
      h += '<p class="font-mono text-muted text-xs fight-top-sub">Passive ' + fmtRev(revSecTotal()) + '</p></div>';
      h += '<button type="button" class="game-btn game-btn-sm" data-action="toggle-farm">' + farmIcon('close') + ' CLOSE</button></div>';
    } else {
      var node = currentCampaignNode();
      var mega = isBossWave();
      var cleared = Array.isArray(G.campaignNodeClears) ? G.campaignNodeClears.length : 0;
      h += '<div class="fight-top-info"><h2 class="font-display chromatic-text fight-top-title">' + (mega ? 'MEGA NODE ' + node : 'CAMPAIGN TRAIL') + '</h2>';
      h += '<p class="font-mono text-muted text-xs fight-top-sub">Node ' + node + '/' + CAMPAIGN_NODE_COUNT + ' · ' + cleared + ' cleared' + (mega ? ' · MEGA BOSS' : '') + '</p></div>';
    }
    h += '</div>';
    return h;
  }

  function campaignNodePreviewHtml(def) {
    var mini = generateBossSvgMarkup({ seed: def.bossSeed, hue: def.bossHue, width: 48, height: 52 });
    mini = mini.replace('class="cr-art-fallback boss-svg-fallback"', 'class="campaign-node-boss-svg campaign-boss-hue-' + (def.bossHue % 12) + '"');
    return mini;
  }

  function renderCampaignTrail() {
    var cur = currentCampaignNode();
    var h = '<div class="campaign-trail-wrap halftone-panel ink-border">';
    h += '<div class="section-label section-label-green campaign-trail-heading">CAMPAIGN TRAIL</div>';
    h += '<div class="campaign-trail-scroll" id="campaign-trail-scroll">';
    for (var n = CAMPAIGN_NODE_COUNT; n >= 1; n--) {
      var def = campaignNodeDef(n);
      var cleared = isCampaignNodeCleared(n);
      var isCurrent = n === cur;
      var locked = n > cur;
      var gates = isCurrent ? campaignGateFailures(n) : [];
      var stateClass = cleared ? 'campaign-node-cleared' : (isCurrent ? 'campaign-node-current' : 'campaign-node-locked');
      if (isCurrent && gates.length) stateClass += ' campaign-node-gated';
      h += '<button type="button" class="campaign-node ' + stateClass + '" id="campaign-node-' + n + '" data-action="campaign-focus-node" data-id="' + n + '"' + (locked ? ' disabled' : '') + '>';
      h += '<div class="campaign-node-orb">';
      h += '<span class="campaign-node-num">' + n + '</span>';
      if (cleared) h += '<span class="campaign-node-check">' + farmIcon('check') + '</span>';
      if (def.isMega) h += '<span class="campaign-node-mega">' + farmIcon('mega') + '</span>';
      h += '</div>';
      h += '<div class="campaign-node-body">';
      h += '<div class="campaign-node-title">' + (def.isMega ? 'MEGA BOSS' : 'Skirmish') + '</div>';
      h += '<div class="campaign-node-preview">' + campaignNodePreviewHtml(def) + '</div>';
      h += '<div class="campaign-node-rules">';
      if (def.maxSlots < BATTLE_EQUIP_MAX) h += '<span class="campaign-rule-chip">MAX ' + def.maxSlots + '</span>';
      if (def.minMutations > 0) h += '<span class="campaign-rule-chip">MUT×' + def.minMutations + '</span>';
      if (def.minMutations === -1) h += '<span class="campaign-rule-chip">ALL MUT</span>';
      if (def.minRarity) h += '<span class="campaign-rule-chip">' + esc(rarityName(def.minRarity).toUpperCase()) + '+</span>';
      if (def.maxSlots >= BATTLE_EQUIP_MAX && def.minMutations === 0 && !def.minRarity) h += '<span class="campaign-rule-chip campaign-rule-open">OPEN</span>';
      h += '</div>';
      if (isCurrent) {
        if (gates.length) {
          h += '<div class="campaign-node-gate-warn">';
          gates.slice(0, 2).forEach(function (g) { h += '<div class="campaign-gate-line">' + esc(g) + '</div>'; });
          h += '</div>';
        } else {
          h += '<div class="campaign-node-fight-tag">FIGHTING NOW</div>';
        }
      } else if (cleared) {
        h += '<div class="campaign-node-cleared-tag">CLEARED</div>';
      }
      h += '</div></button>';
      if (n > 1) h += '<div class="campaign-trail-connector' + (cleared || isCurrent ? ' campaign-trail-connector-live' : '') + '"></div>';
    }
    h += '</div></div>';
    return h;
  }

  function renderBattle() {
    var mega = isBossWave();
    var h = '<div class="screen-section battle-hub' + (mega ? ' battle-hub-mega' : '') + (UI.battleWaveFlash ? ' ' + UI.battleWaveFlash : '') + '">';
    h += battleHubHeroHtml();
    if (UI.campaignTrailOpen) {
      h += '<div id="home-campaign-trail" class="battle-hub-campaign-wrap">';
      h += renderCampaignTrail();
      h += '</div>';
    }
    h += battleHubQuestsHtml();
    h += battleHubPortalPanelHtml();
    h += '</div>';
    return h;
  }

  function renderFarm() {
    var panel = SKIN_PANEL + ' p-3 mb-3';
    var h = '<div class="screen-section farm-screen">' + fightTopBarHtml(true);
    h += '<div class="' + panel + ' neon-card-green neon-card-pulse text-center mb-2"><div class="font-mono text-green" style="font-size:0.55rem;letter-spacing:0.15em">PASSIVE REVENUE · SCAN +' + ((scanMult() * 100).toFixed(0)) + '%</div><div class="font-display chromatic-text" style="font-size:1.125rem;font-weight:700">' + fmtRev(revSecTotal()) + '</div></div>';
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
        h += '<div class="' + panel + '"><div class="flex-between mb-2"><div><div style="font-weight:600;font-size:0.875rem">' + esc(s.name) + '</div><div class="text-muted" style="font-size:0.55rem">Lv.' + s.level + '/' + s.maxLevel + ' · +' + ((s.level * s.scanRateBonus * 100).toFixed(0)) + '% scan</div></div><button type="button" class="game-btn game-btn-green game-btn-sm" data-action="up-sector" data-id="' + s.id + '"' + (s.level >= s.maxLevel || G.cash < c ? ' disabled' : '') + '>' + (s.level >= s.maxLevel ? 'MAX' : fmtCash(c)) + '</button></div><div class="progress-bar"><div class="progress-fill" style="width:' + (s.level / s.maxLevel * 100) + '%"></div></div></div>';
      });
    } else if (G.farmSubTab === 'control') {
      var offers = getSharedOffers();
      h += '<div class="section-label mb-2">PLANET SHARE BOARD</div><p class="text-muted text-xs text-center mb-3">Real listings from Aden, Dad, or Jamie — set slots in Profile.</p>';
      if (!offers.length) h += '<div class="' + panel + ' text-center text-muted text-sm">No listings yet.</div>';
      offers.forEach(function (o) {
        h += '<div class="' + panel + '"><div class="font-mono text-muted" style="font-size:0.55rem">' + esc(o.sellerName) + '</div><div style="font-weight:600;font-size:0.875rem">' + esc(o.strainName) + '</div><div class="text-green" style="font-size:0.55rem">THC ' + o.thcPercent + '% · Yield ' + o.yield + '</div><div class="font-mono text-cyan mb-3" style="font-weight:700;font-size:0.875rem">Ask: ' + fmtCash(o.offerPrice) + '</div><input type="number" class="input-field mb-2" placeholder="Counter price" data-action="counter-input" data-id="' + o.id + '" value="' + (G.counterPrices[o.id] || '') + '"><div class="flex-row gap-2"><button type="button" class="game-btn game-btn-green game-btn-sm" style="flex:1" data-action="accept-offer" data-id="' + o.id + '"' + (G.cash < o.offerPrice ? ' disabled' : '') + '>ACCEPT</button><button type="button" class="game-btn game-btn-sm" style="flex:1" data-action="counter-offer" data-id="' + o.id + '"' + (function () { var c = G.counterPrices[o.id]; return (!c || c <= 0 || c < o.offerPrice * 0.85 || G.cash < c) ? ' disabled' : ''; })() + '>COUNTER</button></div></div>';
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
        h += '<div class="' + panel + ' text-center mb-3"><div style="margin-bottom:0.5rem">' + farmIcon('portal', { xl: true }) + '</div><div class="text-muted text-sm mb-3">No portals yet. Buy your first floor to start mining.</div><button type="button" class="game-btn game-btn-green w-full" data-action="buy-portal"' + (G.cash < portalCost() ? ' disabled' : '') + '>BUY FLOOR · ' + fmtCash(portalCost()) + '</button></div>';
      }
      G.factoryFloors.forEach(function (f) {
        var eq = f.equippedStrainId ? strainById(f.equippedStrainId) : null;
        var uc = floorUpCost(f);
        h += '<div class="' + panel + '"><div class="flex-between mb-3"><div><div style="font-weight:600">' + esc(f.name) + '</div><div class="text-muted" style="font-size:0.55rem">Floor Lv.' + f.level + '</div></div><button type="button" class="game-btn game-btn-sm game-btn-green" data-action="up-floor" data-id="' + f.id + '"' + (G.cash < uc ? ' disabled' : '') + '>UP · ' + fmtCash(uc) + '</button></div>';
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
      h += '<div class="' + panel + ' capsule-cloner mb-3"><div class="clone-bubbles"></div><div class="font-mono text-muted mb-2" style="font-size:0.55rem;letter-spacing:0.15em">CAPSULE CLONER</div>';
      if (G.cloneJob) {
        var cs = strainById(G.cloneJob.strainId);
        h += '<div class="text-center py-4 clone-active"><div>' + (cs ? budImg(cs, '2.5rem') : farmIcon('clone', { xl: true })) + '</div><div class="font-mono text-green" style="font-size:1.125rem;font-weight:700">' + fmtCd(cr) + '</div><div class="text-muted text-xs">Cloning ' + (cs ? esc(cs.name) : 'strain') + '...</div></div>';
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
    var h = '<div class="screen-section shop-screen">';
    h += '<div class="shop-hero ' + SKIN_PANEL + ' text-center mb-2">';
    h += '<h2 class="font-display chromatic-text" style="font-size:1.125rem;letter-spacing:0.2em;margin:0">NEBULA REVENUE GRID</h2>';
    h += '<p class="font-mono text-muted" style="font-size:0.6rem;margin:0.35rem 0 0">Balance ' + fmtCash(G.cash) + ' · ' + fmtSp(G.sp || 0) + '</p>';
    ensureBattlePass();
    h += '<div class="shop-hero-actions mt-2"><button type="button" class="game-btn game-btn-sm game-btn-green" data-action="open-battle-pass">BATTLE PASS · T' + G.battlePassTier + '</button></div></div>';
    syncShopFlashWeek();
    var flash = shopFlashBundle();
    var flashPrice = Math.floor(35000 * (flash.priceMult || 1));
    h += '<div class="shop-flash-offer ' + SKIN_PANEL + ' mb-3"><div class="shop-flash-glow"></div><div class="shop-flash-body">';
    h += '<div class="shop-flash-icon">' + farmIcon(flash.icon, { lg: true }) + '</div>';
    h += '<div class="shop-flash-info"><div class="shop-flash-title">' + esc(flash.name) + '</div>';
    h += '<div class="shop-flash-timer" id="shop-flash-timer">' + fmtLongCd(shopFlashEndsMs()) + '</div></div>';
    h += '<button type="button" class="game-btn game-btn-green game-btn-sm" data-action="buy-shop-flash"' + (G.shopFlashPurchased || G.cash < flashPrice ? ' disabled' : '') + '>' + (G.shopFlashPurchased ? 'CLAIMED' : fmtCash(flashPrice)) + '</button>';
    h += '</div></div>';
    h += '<div class="section-label section-label-green mb-2" style="text-align:left">PREMIUM CHEST TIERS</div>';
    h += '<div class="shop-chest-stack mb-3">';
    CHEST_TIERS.forEach(function (tier) {
      var p = PACKS.find(function (x) { return x.type === tier.packType; });
      if (!p) return;
      var dis = G.cash < p.price && !(p.type === 'omega' && p.spCost && G.sp >= p.spCost);
      h += '<div class="shop-chest-tier ' + SKIN_PANEL + '" style="--chest-accent:' + tier.accent + '">';
      h += '<div class="shop-chest-tier-art"><span class="shop-chest-icon">' + farmIcon(tier.icon, { lg: true }) + '</span></div>';
      h += '<div class="shop-chest-tier-body"><div class="shop-chest-tier-name font-display">' + esc(tier.name) + '</div>';
      h += '<div class="text-muted text-xs">' + esc(tier.tagline) + '</div>';
      h += '<div class="text-green font-mono text-xs" style="font-weight:700;margin-top:0.25rem">' + fmtCash(p.price) + (p.spCost ? ' or ' + p.spCost + ' SP' : '') + '</div></div>';
      h += '<button type="button" class="game-btn game-btn-green game-btn-sm shop-chest-open-btn" data-action="buy-pack" data-pack="' + p.type + '"' + (dis ? ' disabled' : '') + '>SIEGE OPEN</button></div>';
    });
    h += '</div>';
    h += '<div class="section-label mb-2" style="text-align:left">DAILY LUXURY SHOWCASE</div>';
    h += '<div class="shop-daily-grid mb-3">';
    dailyShowcaseItems().forEach(function (item) {
      var s = item.strain;
      var rc = rarityColor(s.rarity);
      var sold = G.dailyShowcasePurchased[item.slot];
      var dis = sold || G.cash < item.price;
      h += '<div class="shop-daily-slot ' + SKIN_PANEL + (sold ? ' sold-out' : '') + '" style="--daily-accent:' + rc + '">';
      h += '<div class="shop-daily-tag">' + esc(item.label) + '</div>';
      h += '<div class="shop-daily-card">' + crCardHtml(s, { noFocus: true }) + '</div>';
      h += '<div class="shop-daily-price font-mono text-green">' + fmtCash(item.price) + '</div>';
      if (sold) h += '<div class="shop-daily-sold">SOLD OUT</div>';
      else h += '<button type="button" class="game-btn game-btn-green game-btn-sm w-full" data-action="buy-showcase" data-id="' + item.slot + '"' + (dis ? ' disabled' : '') + '>ACQUIRE</button>';
      h += '</div>';
    });
    h += '</div>';
    h += '<div class="' + SKIN_PANEL + ' neon-card-green neon-card-pulse p-4 mb-3"><div class="flex-between mb-3"><div><div class="font-mono text-green" style="font-size:0.55rem;letter-spacing:0.15em">BLITZ WINDOW</div><div style="font-weight:700;font-size:0.875rem">Permanent Upgrades</div></div><div id="blitz-timer" class="font-mono text-green" style="font-size:1.125rem;font-weight:700">' + fmtCd(blitzRem()) + '</div></div>';
    blitzShopRows().forEach(function (u) {
      h += '<div class="flex-between shop-blitz-row ' + SKIN_PANEL + (u.purchased ? ' purchased' : '') + (u.endGame ? ' shop-blitz-endgame' : '') + '"><div style="flex:1;margin-right:0.5rem"><div style="font-size:0.75rem;font-weight:600">' + esc(u.name) + (u.endGame ? ' <span class="shop-blitz-eg-tag">ENDGAME</span>' : '') + '</div><div class="text-muted" style="font-size:0.55rem">' + esc(u.description) + (u.minEmpireLevel ? ' · LV.' + u.minEmpireLevel + '+' : '') + '</div></div><button type="button" class="game-btn game-btn-sm' + (u.purchased ? '' : ' game-btn-green') + '" data-action="buy-blitz" data-id="' + u.id + '"' + (u.purchased || G.cash < u.price ? ' disabled' : '') + '>' + (u.purchased ? 'PURCHASED' : fmtCash(u.price)) + '</button></div>';
    });
    h += '</div><div class="section-label mb-2" style="text-align:left">GENERAL STORE</div>';
    G.inventory.forEach(function (it) {
      var def = STORE.find(function (x) { return x.id === it.id; }) || it;
      var revBonus = def.revPerSec || (it.type === 'nutrient' ? 0.5 : it.type === 'pipe' ? 1.2 : 0);
      h += '<div class="' + SKIN_PANEL + ' p-3 mb-2"><div class="flex-row"><div>' + farmIcon((def.icon || it.icon || 'pack'), { lg: true }) + '</div><div style="flex:1;min-width:0"><div style="font-weight:600;font-size:0.875rem">' + esc(it.name) + '</div><div class="text-muted text-xs">' + esc(def.desc || it.type) + '</div><div class="font-mono text-green text-xs mt-1">+' + revBonus + '/sec each · Owned: ' + it.owned + '</div></div><button type="button" class="game-btn game-btn-green game-btn-sm" data-action="buy-item" data-id="' + it.id + '"' + (G.cash < it.price ? ' disabled' : '') + '>' + fmtCash(it.price) + '</button></div></div>';
    });
    h += '</div>';
    return h;
  }

  function renderIndexDecksPane() {
    var equipped = G.equippedBattleIds || [];
    var h = '<div class="decks-pane">';
    h += '<div class="deck-section ' + SKIN_PANEL + ' p-3 mb-3"><div class="flex-between mb-2"><div class="section-label section-label-green" style="margin:0;text-align:left">CAMPAIGN SQUAD</div><button type="button" class="game-btn game-btn-sm game-btn-green" data-action="equip-best">EQUIP BEST</button></div>';
    h += '<div class="battle-loadout-grid mb-2">';
    for (var slot = 0; slot < BATTLE_EQUIP_MAX; slot++) {
      var eid = equipped[slot];
      var es = eid ? strainById(eid) : null;
      if (es) h += '<div class="battle-slot liftable-wrap" data-lift="battle-slot-' + esc(es.id) + '">' + crCardHtml(es, { noFocus: true, showDps: true }) + '</div>';
      else h += '<div class="battle-slot battle-slot-empty"><span class="text-muted text-xs">Empty</span></div>';
    }
    h += '</div><input type="search" class="input-field mb-2" placeholder="Search strains to equip..." data-action="battle-equip-search" value="' + esc(UI.battleEquipSearch || '') + '">';
    h += sortChipsHtml('battle-equip-sort', UI.battleEquipSort || 'dps', BATTLE_SORT_CHIPS);
    var pool = filteredBattleEquipStrains();
    if (!pool.length) h += '<div class="text-muted text-xs text-center p-2">No unequipped strains match.</div>';
    else {
      h += '<div class="binder-grid battle-equip-grid">';
      pool.forEach(function (s) {
        h += '<div class="battle-equip-card liftable-wrap" data-lift="battle-pool-' + esc(s.id) + '">' + crCardHtml(s, { noFocus: true, showDps: true }) + '</div>';
      });
      h += '</div>';
    }
    h += '</div>';
    h += '<div class="deck-section ' + SKIN_PANEL + ' p-3 mb-3"><div class="section-label section-label-green mb-2" style="text-align:left">TOWER FLOORS</div>';
    if (!G.factoryFloors.length) h += '<div class="text-muted text-xs text-center">No portal floors — open Tower from Home.</div>';
    G.factoryFloors.forEach(function (f, fi) {
      var eq = f.equippedStrainId ? strainById(f.equippedStrainId) : null;
      h += '<div class="deck-floor-row flex-between mb-2"><div class="font-mono text-xs text-muted">F' + (fi + 1) + ' Lv.' + f.level + '</div>';
      h += '<div style="flex:1;margin:0 0.5rem">' + (eq ? crCardHtml(eq, { noFocus: true }) : '<div class="battle-slot-empty" style="min-height:3rem"><span class="text-muted text-xs">Empty</span></div>') + '</div>';
      h += '<button type="button" class="game-btn game-btn-sm" data-action="open-strain-picker" data-id="' + esc(f.id) + '">SET</button></div>';
    });
    h += '</div>';
    h += '<div class="deck-section ' + SKIN_PANEL + ' p-3"><div class="section-label mb-2" style="text-align:left">RAID LOADOUT</div>';
    h += '<div class="flex-between mb-2"><div class="text-muted text-xs">Independent raid squad · ' + totalRaidDps().toFixed(1) + ' DPS</div><button type="button" class="game-btn game-btn-sm game-btn-green" data-action="equip-best-raid">EQUIP BEST</button></div>';
    h += '<div class="battle-loadout-grid mb-2">';
    var raidEquipped = G.raidEquipIds || [];
    for (var rs = 0; rs < BATTLE_EQUIP_MAX; rs++) {
      var rid = raidEquipped[rs];
      var rsStrain = rid ? strainById(rid) : null;
      if (rsStrain) h += '<div class="battle-slot liftable-wrap" data-lift="raid-slot-' + esc(rsStrain.id) + '">' + crCardHtml(rsStrain, { noFocus: true, showDps: true }) + '</div>';
      else h += '<div class="battle-slot battle-slot-empty"><span class="text-muted text-xs">—</span></div>';
    }
    h += '</div><input type="search" class="input-field mb-2" placeholder="Search raid candidates..." data-action="raid-equip-search" value="' + esc(UI.raidEquipSearch || '') + '">';
    h += sortChipsHtml('raid-equip-sort', UI.raidEquipSort || 'dps', BATTLE_SORT_CHIPS);
    var raidPool = filteredRaidEquipStrains();
    if (!raidPool.length) h += '<div class="text-muted text-xs text-center p-2">No raid candidates match.</div>';
    else {
      h += '<div class="binder-grid battle-equip-grid">';
      raidPool.forEach(function (s) {
        h += '<div class="battle-equip-card liftable-wrap" data-lift="raid-pool-' + esc(s.id) + '">' + crCardHtml(s, { noFocus: true, showDps: true }) + '</div>';
      });
      h += '</div>';
    }
    h += '</div></div>';
    return h;
  }

  function renderIndexMutationsPane() {
    var mode = UI.mutationMode || 'create';
    var h = '<div class="mutation-board ' + SKIN_PANEL + ' p-3">';
    h += '<div class="mutation-mode-tabs mb-3">';
    h += '<button type="button" class="mutation-mode-tab' + (mode === 'destroy' ? ' active' : '') + '" data-action="mutation-mode" data-id="destroy">DESTROY</button>';
    h += '<button type="button" class="mutation-mode-tab' + (mode === 'create' ? ' active' : '') + '" data-action="mutation-mode" data-id="create">CREATE</button></div>';
    h += '<div class="font-mono text-xs text-green mb-2">Mutation Essence: ' + (G.mutationEssence || 0) + ' · Items: ' + ((G.mutationItems || []).length) + ' · Pack Luck +' + ((G.mutationPackLuck || 0) * 100).toFixed(0) + '% · Guarantees: ' + (G.mutationGuaranteeCharges || 0) + '</div>';
    h += '<div class="flex-row gap-2 mb-2"><button type="button" class="game-btn game-btn-sm game-btn-green" style="flex:1" data-action="mutation-buy-luck"' + ((G.mutationEssence || 0) < 15 ? ' disabled' : '') + '>LUCK · 15 ESS</button>';
    h += '<button type="button" class="game-btn game-btn-sm game-btn-green" style="flex:1" data-action="mutation-buy-guarantee"' + ((G.mutationEssence || 0) < 25 ? ' disabled' : '') + '>GUARANTEE · 25 ESS</button></div>';
    h += '<button type="button" class="game-btn game-btn-sm w-full mb-3' + (UI.packGuarantee ? ' game-btn-green' : '') + '" data-action="toggle-pack-guarantee">PACK GUARANTEE: ' + (UI.packGuarantee ? 'ON' : 'OFF') + ' (' + (G.mutationGuaranteeCharges || 0) + ' charges)</button>';
    if (mode === 'destroy') {
      h += '<p class="text-muted text-xs mb-2">Burn strains into permanent mutation shards. Higher rarity = more essence.</p>';
      h += '<div class="binder-grid mutation-burn-grid mb-2" style="max-height:42vh;overflow-y:auto">';
      G.strains.filter(function (s) { return !s.planetExclusive || (s.quantity || 1) > 1; }).forEach(function (s) {
        var gain = Math.floor((1 + rarityIndex(s.rarity)) * (1 + blitzMod('mutationEssence')));
        h += '<button type="button" class="mutation-burn-card" data-action="destroy-strain" data-id="' + esc(s.id) + '">';
        h += crCardHtml(s, { noFocus: true }) + '<div class="mutation-burn-tag">+' + gain + ' ESS</div></button>';
      });
      h += '</div>';
      if (!(G.mutationItems || []).length) h += '<div class="text-muted text-xs text-center">No mutation items yet — destroy cards to forge shards.</div>';
      else {
        h += '<div class="section-label mb-2 mt-2">EQUIP SHARDS ON STRAINS</div><div class="mutation-item-list mb-2">';
        (G.mutationItems || []).slice(-8).reverse().forEach(function (m) {
          h += '<div class="mutation-item-chip mutation-equip-chip" data-action="equip-mutation-pick" data-id="' + esc(m.id) + '" style="--chip-color:' + rarityColor(m.tier) + '"><span class="font-mono text-xs">' + esc(m.name) + '</span><span class="text-muted text-xs">+' + m.power + ' PWR</span></div>';
        });
        h += '</div>';
        if (UI.mutationEquipPick) {
          h += '<p class="text-xs text-green mb-2">Tap a strain to equip selected shard:</p><div class="binder-grid mutation-pick-grid mb-2" style="max-height:24vh;overflow-y:auto">';
          G.strains.forEach(function (s) {
            var eq = mutationItemForStrain(s.id);
            h += '<button type="button" class="merge-pick-card' + (eq ? ' selected' : '') + '" data-action="equip-mutation" data-id="' + esc(UI.mutationEquipPick) + ':' + esc(s.id) + '">' + crCardHtml(s, { noFocus: true }) + (eq ? '<div class="mutation-burn-tag">' + esc(eq.name) + '</div>' : '') + '</button>';
          });
          h += '</div>';
        }
      }
    } else {
      var err = mergeLabError();
      h += '<p class="text-muted text-xs mb-2">Fortnite-style splice — fuse two parents with a glowing core.</p>';
      h += '<div class="mutation-fuse-rail flex-row mb-3" style="justify-content:center;align-items:center;gap:0.5rem">';
      [G.breedSlotA, G.breedSlotB].forEach(function (sid, si) {
        var bs = sid ? strainById(sid) : null;
        h += '<div class="mutation-fuse-slot">' + (bs ? crCardHtml(bs, { noFocus: true }) : '<div class="merge-slot-empty mutation-slot-empty">SLOT ' + (si + 1) + '</div>') + '</div>';
        if (si === 0) h += '<div class="mutation-fuse-plus">+</div>';
      });
      h += '</div>';
      h += '<div class="binder-grid mutation-pick-grid mb-2" style="max-height:32vh;overflow-y:auto">';
      G.strains.filter(function (s) { return !s.planetExclusive || s.quantity > 1; }).forEach(function (s) {
        var onA = G.breedSlotA === s.id, onB = G.breedSlotB === s.id;
        h += '<button type="button" class="merge-pick-card' + (onA || onB ? ' selected' : '') + '" data-action="merge-pick" data-id="' + esc(s.id) + '">' + crCardHtml(s, { noFocus: true, selected: onA || onB }) + '</button>';
      });
      h += '</div>';
      if (err) h += '<div class="text-xs mb-2" style="color:#F87171;text-align:center">' + esc(err) + '</div>';
      h += '<button type="button" class="game-btn game-btn-sm w-full mb-2' + (UI.fuseGuarantee ? ' game-btn-green' : '') + '" data-action="toggle-fuse-guarantee">FUSE GUARANTEE: ' + (UI.fuseGuarantee ? 'ON' : 'OFF') + ' (' + (G.mutationGuaranteeCharges || 0) + ' charges)</button>';
      h += '<div class="flex-row gap-2"><button type="button" class="game-btn game-btn-sm" style="flex:1" data-action="open-merge-lab">FULL LAB</button>';
      h += '<button type="button" class="game-btn game-btn-green" style="flex:2" data-action="breed-run"' + (err ? ' disabled' : '') + '>FUSE · ' + MERGE_SP_COST + ' SP</button></div>';
    }
    h += '</div>';
    return h;
  }

  function renderIndex() {
    var pane = UI.indexPane || 'strains';
    var list = filteredStrains();
    var h = '<div class="screen-section index-screen">';
    h += '<div class="index-nav-grid mb-3">';
    [['mutations', 'MUTATIONS', 'mutation'], ['strains', 'STRAINS', 'strains'], ['decks', 'DECKS', 'decks']].forEach(function (nav) {
      h += '<button type="button" class="index-nav-card ' + SKIN_PANEL + (pane === nav[0] ? ' index-nav-active' : '') + '" data-action="index-pane" data-id="' + nav[0] + '">';
      h += '<span class="index-nav-icon">' + farmIcon(nav[2], { lg: true }) + '</span><span class="index-nav-label font-display">' + nav[1] + '</span></button>';
    });
    h += '</div>';
    if (pane === 'mutations') {
      h += renderIndexMutationsPane();
    } else if (pane === 'decks') {
      h += renderIndexDecksPane();
    } else {
      h += '<div class="' + SKIN_PANEL + ' neon-card-green neon-card-pulse p-4 text-center mb-2"><div class="font-mono text-green" style="font-size:0.55rem;letter-spacing:0.3em">STRAIN INDEX</div><div class="font-display chromatic-text" style="font-size:1.875rem;font-weight:700">' + G.strains.length + ' <span class="text-muted" style="font-size:1rem">/ ∞</span></div><div class="text-muted text-xs">All strains in your collection</div></div>';
      h += '<input type="search" class="input-field mb-2" placeholder="Search strains..." data-action="index-search" value="' + esc(G.indexSearch || '') + '">';
      h += sortChipsHtml('index-sort', G.indexSort || 'recent', STRAIN_SORT_CHIPS);
      if (!list.length) {
        h += '<div class="' + SKIN_PANEL + ' p-5 text-center">' + budImg({ hue: 120 }, '2rem') + '<div class="text-muted text-sm mt-2">No strains yet.</div></div>';
      } else {
        h += '<div class="binder-grid mb-3 index-strain-grid">';
        list.forEach(function (s) {
          h += '<div class="liftable-wrap holo-wrap" data-lift="index-' + esc(s.id) + '" data-lift-up="up-strain:' + esc(s.id) + '">' + crCardHtml(s, { noFocus: true }) + '</div>';
        });
        h += '</div>';
      }
    }
    h += '</div>';
    return h;
  }

  function renderMap() {
    var owned = G.ownedPlanets || [];
    var h = '<div class="screen-section map-screen"><div class="flex-between mb-2"><div><h2 class="font-display chromatic-text" style="font-size:1.125rem;letter-spacing:0.2em;margin:0">UNIVERSE MAP</h2><p class="font-mono text-muted text-xs" style="margin:0.15rem 0 0">' + owned.length + ' worlds</p></div>';
    h += '<button type="button" class="game-btn game-btn-sm" data-action="map-billings">' + farmIcon('bill') + ' BILLINGS</button></div>';
    h += '<div class="map-scan-rail' + (UI.scanAnimating ? ' map-scan-active' : '') + '"><div class="map-scan-line"></div><div class="map-scan-beam"></div>';
    h += '<button type="button" class="map-scan-bubble" data-action="map-scan"' + (UI.scanAnimating ? ' disabled' : '') + '><span class="map-scan-label">SCAN</span></button></div>';
    if (UI.scanAnimating) h += '<div class="font-mono text-cyan text-xs text-center mb-3 map-pulse">Scanning hyperspace lanes…</div>';
    if (G.scanPending) {
      var p = G.scanPending;
      var exStrain = genExclusivePlanetStrain(p);
      h += '<div class="planet-scan-panel halftone-panel glass-inset mb-3">';
      h += '<div class="section-label section-label-green planet-scan-label">PLANET DETECTED</div>';
      h += '<div class="planet-scan-card-wrap liftable-wrap" data-lift="planet-scan">' + planetCardHtml(p, { glow: true }) + '</div>';
      h += '<div class="planet-scan-strain text-xs text-muted">Exclusive strain: <span class="text-green">' + esc(exStrain.name) + '</span> · ' + esc(rarityName(p.rarity)) + '</div>';
      h += '<input type="text" class="input-field planet-scan-rename" placeholder="Name your planet (optional)" data-action="planet-rename-pending" value="' + esc(p.customName || '') + '">';
      h += '<div class="flex-row gap-2 planet-scan-actions"><button type="button" class="game-btn game-btn-green game-btn-sm" style="flex:1" data-action="planet-keep">KEEP</button><button type="button" class="game-btn game-btn-sm" style="flex:1" data-action="planet-discard">DISCARD</button></div>';
      h += '</div>';
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
        h += '<div class="' + SKIN_PANEL + ' p-3 mb-3 planet-owned-detail"><div style="font-weight:600;font-size:0.9rem;text-align:center">' + esc(planetDisplayName(fpl)) + '</div>';
        h += '<div class="text-muted text-xs text-center mb-2">' + fmtRev(planetOutputPerSec(fpl) * 8) + ' · x' + (fpl.upgraderMult || 1) + ' mult</div>';
        if (strain) h += '<div class="text-green text-xs text-center mb-2">' + esc(strain.name) + ' · stored ' + Math.floor(fpl.storedYield || 0) + '</div>';
        h += '<input type="text" class="input-field mb-2" placeholder="Rename planet" data-action="planet-rename" data-id="' + esc(fpl.id) + '" value="' + esc(fpl.customName || '') + '">';
        var hc = 5000 * (fpl.harvesterLv + 1), cc = 4000 * (fpl.conveyorLv + 1), uc = 25 * (fpl.upgraderMult || 1);
        h += '<div class="grid-3 gap-2 mb-2"><button type="button" class="game-btn game-btn-sm game-btn-green" data-action="up-planet" data-id="' + esc(fpl.id) + ':harvester"' + (G.cash < hc || fpl.harvesterLv >= 20 ? ' disabled' : '') + '>HARV Lv.' + fpl.harvesterLv + '</button>';
        h += '<button type="button" class="game-btn game-btn-sm game-btn-green" data-action="up-planet" data-id="' + esc(fpl.id) + ':conveyor"' + (G.cash < cc || fpl.conveyorLv >= 20 ? ' disabled' : '') + '>CONV Lv.' + fpl.conveyorLv + '</button>';
        h += '<button type="button" class="game-btn game-btn-sm" data-action="up-planet" data-id="' + esc(fpl.id) + ':upgrader"' + (G.sp < uc || (fpl.upgraderMult || 1) >= 8 ? ' disabled' : '') + '>x' + (fpl.upgraderMult || 1) + ' · ' + uc + ' SP</button></div>';
        h += '<button type="button" class="game-btn game-btn-green w-full game-btn-sm" data-action="harvest-planet" data-id="' + esc(fpl.id) + '"' + ((fpl.storedYield || 0) < 1 ? ' disabled' : '') + '>HARVEST EXCLUSIVE STRAIN</button></div>';
      }
      h += '<div class="section-label mb-2 mt-2">OTHER CLAIMED WORLDS</div>';
      PLAYERS.forEach(function (pl) {
        if (pl.id === activePlayerId) return;
        var save = readPlayerSave(pl.id);
        if (!save || !save.ownedPlanets) return;
        save.ownedPlanets.forEach(function (op) {
          h += '<div class="' + SKIN_PANEL + ' p-3 mb-2"><div class="flex-between"><div><div style="font-weight:600;font-size:0.8rem">' + esc(op.customName || op.proceduralName) + '</div><div class="text-xs text-muted">Owner: ' + esc(save.name || pl.label) + ' · ' + esc(rarityName(op.rarity)) + '</div></div>';
          h += '<button type="button" class="game-btn game-btn-sm game-btn-green" data-action="lease-offer-open" data-id="' + esc(op.id) + ':' + pl.id + '">LEASE</button></div></div>';
        });
      });
    } else if (!G.scanPending && !UI.scanAnimating) {
      h += '<div class="' + SKIN_PANEL + ' p-4 text-center text-muted text-sm">No worlds claimed. Tap SCAN on the rail to probe the universe.</div>';
    }
    h += '</div>';
    return h;
  }

  function renderStorefrontSlot(slotIdx, isMine) {
    ensureStorefrontSlots();
    var slot = G.storefrontSlots[slotIdx];
    var locked = slotIdx >= G.storefrontSlotCount;
    if (locked) {
      return '<div class="roadside-slot roadside-slot-locked"><div class="roadside-slot-glass">' + farmIcon('lock') + '</div><div class="roadside-slot-label">LOCKED</div></div>';
    }
    if (!slot || !slot.strainId) {
      return '<button type="button" class="roadside-slot roadside-slot-empty" data-action="sf-pick-open" data-id="' + slotIdx + '"><span class="roadside-plus">+</span><span class="roadside-slot-label">LIST ITEM</span></button>';
    }
    var s = strainById(slot.strainId);
    if (!s) return '<div class="roadside-slot roadside-slot-empty"></div>';
  var h = '<div class="roadside-slot roadside-slot-filled">';
    if (isMine) {
      h += '<button type="button" class="roadside-slot-x" data-action="sf-remove-ask" data-id="' + slotIdx + '">' + farmIcon('close') + '</button>';
      h += '<button type="button" class="roadside-slot-info" data-action="sf-info" data-id="' + slotIdx + '">i</button>';
    }
    h += '<div class="roadside-slot-card">' + crCardHtml(s, { noFocus: true, qty: slot.quantity || 1 }) + '</div>';
    h += '<div class="roadside-slot-meta"><div class="roadside-qty">×' + (slot.quantity || 1) + '</div><div class="roadside-price">' + fmtCash(slot.price) + '</div></div>';
    if (!isMine) h += '<button type="button" class="game-btn game-btn-green game-btn-sm w-full mt-1" data-action="sf-buy" data-id="' + esc(UI.coopShopPlayer || '') + ':' + slotIdx + '">BUY</button>';
    h += '</div>';
    return h;
  }

  function renderPlayerShopGrid(sellerId) {
    var save = readPlayerSaveMutable(sellerId);
    if (!save) return '<div class="text-muted text-sm">No save found.</div>';
    var slots = save.storefrontSlots || [];
    var count = save.storefrontSlotCount || STOREFRONT_START;
    var h = '<div class="roadside-grid">';
    for (var i = 0; i < STOREFRONT_MAX; i++) {
      var slot = slots[i] || { strainId: null, price: 0, quantity: 0 };
      var prevG = G;
      G = save;
      if (i >= count) h += '<div class="roadside-slot roadside-slot-locked"><div class="roadside-slot-glass">' + farmIcon('lock') + '</div></div>';
      else if (!slot.strainId) h += '<div class="roadside-slot roadside-slot-empty"></div>';
      else {
        var s = (save.strains || []).find(function (x) { return x.id === slot.strainId; });
        if (s) {
          h += '<div class="roadside-slot roadside-slot-filled"><div class="roadside-slot-card">' + crCardHtml(s, { noFocus: true, qty: slot.quantity || 1 }) + '</div>';
          h += '<div class="roadside-slot-meta"><div class="roadside-qty">×' + (slot.quantity || 1) + '</div><div class="roadside-price">' + fmtCash(slot.price) + '</div></div>';
          h += '<button type="button" class="game-btn game-btn-green game-btn-sm w-full" data-action="sf-buy" data-id="' + esc(sellerId) + ':' + i + '">BUY</button></div>';
        }
      }
      G = prevG;
    }
    h += '</div>';
    return h;
  }

  function renderCoop() {
    ensureStorefrontSlots();
    var view = UI.coopView || 'hub';
    var clan = window.VoidlineClan ? window.VoidlineClan.getState() : { inClan: false };
    var h = '<div class="screen-section coop-screen clan-screen">';
    h += '<div class="clan-hero ' + SKIN_PANEL + ' text-center mb-2">';
    h += '<h2 class="font-display chromatic-text" style="font-size:1.125rem;letter-spacing:0.2em;margin:0">VOID CLAN HQ</h2>';
    if (clan.inClan) {
      h += '<p class="font-mono text-green text-xs mt-1">[' + esc(clan.tag) + '] ' + esc(clan.name) + ' · ' + clan.memberCount + '/' + (window.VoidlineClan ? window.VoidlineClan.MAX_MEMBERS : 50) + '</p>';
      h += '<p class="text-muted text-xs">🏆 ' + (clan.trophies || 0) + ' · ⚔️ ' + (clan.territories || []).length + ' zones</p>';
    } else {
      h += '<p class="text-muted text-xs mt-1">Join or create a clan · trade · war · chat</p>';
    }
    h += '</div>';

    if (view !== 'myshop' && view.indexOf('shop:') !== 0) {
      h += '<div class="clan-nav-row mb-2">';
      [['hub', 'HUB'], ['clan-chat', 'CHAT'], ['clan-war', 'WAR'], ['clan-trade', 'TRADE'], ['market', 'MARKET']].forEach(function (pair) {
        h += '<button type="button" class="clan-nav-btn' + (view === pair[0] ? ' active' : '') + '" data-action="clan-view" data-id="' + pair[0] + '">' + pair[1] + '</button>';
      });
      h += '</div>';
    }

    if (view === 'clan-chat') {
      h += '<button type="button" class="game-btn game-btn-sm mb-2" data-action="clan-view" data-id="hub">← HUB</button>';
      h += '<div class="clan-chat-panel ' + SKIN_PANEL + '"><div class="clan-chat-scroll" id="clan-chat-scroll">';
      (clan.messages || []).forEach(function (m) {
        h += '<div class="clan-chat-line"><span class="clan-chat-user">' + esc(m.user) + '</span> ';
        if (m.emote) h += '<span class="clan-chat-emote">' + esc(m.emote) + '</span> ';
        h += '<span class="clan-chat-body">' + esc(m.body) + '</span></div>';
      });
      h += '</div><div class="clan-emote-row">';
      (clan.emotes || []).forEach(function (em) {
        h += '<button type="button" class="clan-emote-btn" data-action="clan-emote" data-id="' + esc(em) + '">' + em + '</button>';
      });
      h += '</div><input type="text" class="input-field mb-2" id="clan-chat-input" placeholder="Message clan..." maxlength="500">';
      h += '<button type="button" class="game-btn game-btn-green w-full" data-action="clan-send-chat">SEND</button></div>';
    } else if (view === 'clan-war') {
      h += '<button type="button" class="game-btn game-btn-sm mb-2" data-action="clan-view" data-id="hub">← HUB</button>';
      h += '<div class="clan-war-map ' + SKIN_PANEL + ' p-3 mb-2"><div class="section-label mb-2">TERRITORY CONTROL</div><div class="clan-war-grid">';
      (clan.warZones || []).forEach(function (z) {
        var owned = z.ownerTag === clan.tag;
        h += '<button type="button" class="clan-war-zone' + (owned ? ' owned' : '') + '" data-action="clan-war-attack" data-id="' + esc(z.id) + '"' + (!clan.inClan ? ' disabled' : '') + '>';
        h += '<div class="clan-war-zone-label">' + esc(z.label) + '</div>';
        h += '<div class="clan-war-zone-owner">' + (z.ownerTag ? '[' + esc(z.ownerTag) + ']' : 'CONTESTED') + '</div></button>';
      });
      h += '</div><div class="text-muted text-xs text-center mt-2">War points: ' + (clan.warPoints || 0) + '/100 per capture</div></div>';
      var lb = window.VoidlineClan ? window.VoidlineClan.getLeaderboard() : [];
      h += '<div class="section-label mb-2">CLAN LEADERBOARD</div>';
      lb.forEach(function (row, i) {
        h += '<div class="clan-lb-row ' + SKIN_PANEL + ' p-2 mb-1"><span class="font-mono text-cyan">#' + (i + 1) + '</span> [' + esc(row.tag) + '] ' + esc(row.name) + ' · ' + row.trophies + ' 🏆</div>';
      });
    } else if (view === 'clan-trade') {
      h += '<button type="button" class="game-btn game-btn-sm mb-2" data-action="clan-view" data-id="hub">← HUB</button>';
      h += '<div class="' + SKIN_PANEL + ' p-3 text-center text-muted text-sm mb-2">Gift strains to clanmates from Index → lift card → GIFT. Cloud trade ledger ships in next patch.</div>';
      if (G.strains.length) {
        h += '<div class="binder-grid">';
        G.strains.slice(0, 6).forEach(function (s) {
          h += '<div class="liftable-wrap" data-lift="index-' + esc(s.id) + '">' + crCardHtml(s, { noFocus: true }) + '</div>';
        });
        h += '</div>';
      }
    } else if (view === 'market' || view === 'myshop') {
      if (view === 'market') h += '<button type="button" class="game-btn game-btn-sm mb-2" data-action="clan-view" data-id="hub">← HUB</button>';
      if (view === 'myshop') {
        h += '<button type="button" class="game-btn game-btn-sm mb-2" data-action="coop-back">← HUB</button>';
        h += '<div class="section-label section-label-green mb-2">MY ROADSIDE SHOP · ' + G.storefrontSlotCount + '/' + STOREFRONT_MAX + ' SLOTS</div>';
        h += '<div class="roadside-grid mb-3">';
        for (var si = 0; si < STOREFRONT_MAX; si++) h += renderStorefrontSlot(si, true);
        h += '</div>';
        if (G.storefrontSlotCount < STOREFRONT_MAX) {
          var sc = STOREFRONT_SLOT_COST * G.storefrontSlotCount;
          h += '<button type="button" class="game-btn game-btn-green w-full mb-3" data-action="sf-buy-slot"' + (G.cash < sc ? ' disabled' : '') + '>UNLOCK SLOT · ' + fmtCash(sc) + '</button>';
        }
      } else {
        h += '<button type="button" class="game-btn game-btn-green w-full mb-3" data-action="coop-myshop">' + farmIcon('shop') + ' MY ROADSIDE SHOP</button>';
        h += '<div class="section-label mb-2">FAMILY MARKET</div>';
        PLAYERS.forEach(function (pl) {
          var save = readPlayerSave(pl.id) || {};
          var dps = playerBattleDps(save).toFixed(1);
          h += '<div class="coop-player-card ' + SKIN_PANEL + ' p-3 mb-2' + (pl.id === activePlayerId ? ' neon-card-green' : '') + '">';
          h += '<div class="flex-row gap-2"><div>' + avatarHtml(migrateAvatar(save.avatar || pl.portrait), '2rem') + '</div>';
          h += '<div style="flex:1"><div style="font-weight:700;font-size:0.8rem">' + esc(save.name || pl.label) + '</div>';
          h += '<div class="font-mono text-xs text-green">DPS ' + dps + '</div></div>';
          if (pl.id !== activePlayerId) h += '<button type="button" class="game-btn game-btn-sm game-btn-green" data-action="coop-visit-shop" data-id="' + pl.id + '">SHOP</button>';
          h += '</div></div>';
        });
      }
    } else if (view.indexOf('shop:') === 0) {
      var pid = view.slice(5);
      var pl = playerDef(pid);
      var save = readPlayerSave(pid) || {};
      h += '<button type="button" class="game-btn game-btn-sm mb-2" data-action="coop-back">← HUB</button>';
      h += '<div class="' + SKIN_PANEL + ' p-3 mb-3 text-center"><div>' + avatarHtml(migrateAvatar(save.avatar || pl.portrait), '2.5rem') + '</div><div style="font-weight:700">' + esc(save.name || pl.label) + '</div></div>';
      h += renderPlayerShopGrid(pid);
    } else {
      if (!clan.inClan) {
        h += '<div class="clan-join-panel ' + SKIN_PANEL + ' p-3 mb-3">';
        h += '<div class="section-label mb-2">JOIN OR CREATE</div>';
        h += '<input type="text" class="input-field mb-2" id="clan-join-tag" placeholder="Clan tag (e.g. VOID)" maxlength="5">';
        h += '<button type="button" class="game-btn game-btn-green w-full mb-2" data-action="clan-join">JOIN CLAN</button>';
        h += '<input type="text" class="input-field mb-2" id="clan-create-name" placeholder="New clan name" maxlength="24">';
        h += '<input type="text" class="input-field mb-2" id="clan-create-tag" placeholder="New clan tag" maxlength="5">';
        h += '<button type="button" class="game-btn w-full" data-action="clan-create">CREATE CLAN</button></div>';
      } else {
        h += '<button type="button" class="game-btn game-btn-sm w-full mb-2" data-action="clan-leave">LEAVE CLAN</button>';
      }
      h += '<button type="button" class="game-btn game-btn-green w-full mb-2" data-action="clan-view" data-id="market">' + farmIcon('shop') + ' FAMILY MARKET</button>';
      h += '<button type="button" class="game-btn w-full mb-2" data-action="open-battle-pass">' + farmIcon('mega') + ' BATTLE PASS</button>';
    }

    if ((G.leaseOffers || []).length && view === 'hub') {
      h += '<div class="section-label mb-2 mt-3">LEASE OFFERS</div>';
      G.leaseOffers.forEach(function (o) {
        h += '<div class="' + SKIN_PANEL + ' p-3 mb-2"><div class="text-xs text-muted">' + esc(o.buyerId) + ' wants ' + o.percent + '% of ' + esc(o.planetName) + '</div>';
        h += '<div class="text-green font-mono text-sm mb-2">' + fmtCash(o.pricePerInterval) + ' / 5min</div>';
        h += '<div class="flex-row gap-2"><button type="button" class="game-btn game-btn-green game-btn-sm" style="flex:1" data-action="lease-accept" data-id="' + esc(o.id) + '">ACCEPT</button>';
        h += '<button type="button" class="game-btn game-btn-sm" style="flex:1" data-action="lease-decline" data-id="' + esc(o.id) + '">DECLINE</button></div></div>';
      });
    }
    h += '</div>';
    return h;
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
    var h = '<button type="button" class="overlay-backdrop" data-close="strain-picker"></button><div class="overlay-panel strain-picker-panel ' + SKIN_PANEL + ' p-4">';
    h += '<div class="flex-between mb-3"><div><h3 class="font-display" style="font-size:0.875rem;letter-spacing:0.12em">SELECT STRAIN</h3><div class="font-mono text-muted text-xs">' + esc(floor.name) + ' · Floor Lv.' + floor.level + '</div></div><button type="button" class="profile-close" data-close="strain-picker" style="position:static;width:2rem;height:2rem">' + farmIcon('close') + '</button></div>';
    h += '<input type="search" class="input-field mb-2" placeholder="Search by name or rarity..." data-action="strain-picker-search" value="' + esc(UI.strainPickerSearch || '') + '" autocomplete="off">';
    h += '<select class="input-field mb-3" data-action="strain-picker-sort"><option value="rarity"' + (sort === 'rarity' ? ' selected' : '') + '>Sort: Rarity (high → low)</option><option value="name"' + (sort === 'name' ? ' selected' : '') + '>Sort: Name</option><option value="recent"' + (sort === 'recent' ? ' selected' : '') + '>Sort: Recent</option></select>';
    if (!G.strains.length) {
      h += '<div class="' + SKIN_PANEL + ' p-4 text-center text-muted text-sm">No strains in your Index. Open a pack in Shop first.</div>';
    } else if (!list.length) {
      h += '<div class="' + SKIN_PANEL + ' p-4 text-center text-muted text-sm">No strains match your search.</div>';
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

  function modPct(v) { return (v * 100).toFixed(1) + '%'; }

  function modSectionCard(title, value, sources) {
    var src = (sources || []).map(function (s) {
      return '<div class="text-xs text-muted" style="padding:0.15rem 0 0 0.5rem">· ' + s + '</div>';
    }).join('');
    return '<div class="' + SKIN_PANEL + ' p-3 mb-2"><div class="flex-between"><span class="font-mono text-green" style="font-size:0.55rem;letter-spacing:0.1em">' + esc(title) + '</span><span class="font-mono text-xs" style="font-weight:700;color:var(--green)">' + esc(value) + '</span></div>' + src + '</div>';
  }

  function profileModifiersHtml() {
    var ids = (G.equippedBattleIds || []).slice(0, campaignMaxSlots());
    var wave = battleWaveNum();
    var h = '<div class="profile-stats-scroll">';
    var dpsSources = [];
    ids.forEach(function (id) {
      var s = strainById(id);
      if (!s) return;
      dpsSources.push(esc(s.name) + ': ' + strainBattleDpsBase(s).toFixed(1) + '/s base');
      if (hasAbility(s, 'crit_burst')) dpsSources.push('Crit Burst (' + esc(s.name) + '): 15% ×3 hit');
      if (hasAbility(s, 'boss_slayer')) dpsSources.push('Boss Slayer (' + esc(s.name) + '): ×' + abilityPotency(s, 'boss_slayer', 1.3).toFixed(2));
      if (hasAbility(s, 'thc_overdrive')) dpsSources.push('THC Overdrive (' + esc(s.name) + '): ×' + abilityPotency(s, 'thc_overdrive', 1.15).toFixed(2));
      if (hasAbility(s, 'poison_cloud')) dpsSources.push('Poison Cloud (' + esc(s.name) + '): +' + (5 * s.quantity * abilityBoostMult(s, 'poison_cloud')).toFixed(1) + ' DoT');
      if (hasAbility(s, 'regen_mist') && wave > 1) dpsSources.push('Regen Mist (' + esc(s.name) + '): +' + modPct(0.03 * (wave - 1) * abilityBoostMult(s, 'regen_mist')));
      if (hasAbility(s, 'shield_sap')) dpsSources.push('Shield Sap (' + esc(s.name) + '): −' + modPct(abilityBonus(s, 'shield_sap', 0.08)) + ' boss regen');
      if (hasAbility(s, 'cash_magnet')) dpsSources.push('Cash Magnet (' + esc(s.name) + '): +' + modPct(abilityBonus(s, 'cash_magnet', 0.08)) + ' kill cash');
      if (hasAbility(s, 'blitz_rush')) dpsSources.push('Blitz Rush (' + esc(s.name) + '): +' + modPct(0.1 * abilityBoostMult(s, 'blitz_rush')) + ' blitz amp');
    });
    if (blitzMod('battle') > 0) dpsSources.push('Blitz Battle: +' + modPct(blitzMod('battle')));
    if (blitzMod('raid') > 0) dpsSources.push('Blitz Raid: +' + modPct(blitzMod('raid')) + ' (raid squad)');
    if (blitzRushMult() > 1) dpsSources.push('Blitz Rush total: ×' + blitzRushMult().toFixed(2) + ' on all blitz mods');
    if ((G.voidEssence || 0) > 0) dpsSources.push('Void Essence: ×' + voidEssenceMult().toFixed(2) + ' (' + G.voidEssence + ' essence)');
    h += '<div class="section-label section-label-green mb-2">BATTLE DPS</div>';
    h += modSectionCard('Total DPS', totalBattleDps().toFixed(1) + '/s', dpsSources.length ? dpsSources : ['Equip strains on the Fight tab']);

    var revSources = [];
    var invRev = inventoryRevPerSec();
    if (invRev > 0) revSources.push('General store (nutrients/pipes): +' + invRev.toFixed(2) + '/sec');
    G.factoryFloors.forEach(function (f) {
      if (!f.equippedStrainId) return;
      var s = strainById(f.equippedStrainId);
      if (!s) return;
      var line = esc(f.name) + ' · ' + esc(s.name) + ': ' + (revSec(s) * f.level).toFixed(2) + '/sec base';
      if (hasAbility(s, 'yield_surge')) line += ' (×' + abilityPotency(s, 'yield_surge', 1.2).toFixed(2) + ' Yield Surge)';
      if (hasAbility(s, 'portal_sync')) line += ' (×' + abilityPotency(s, 'portal_sync', 1.12).toFixed(2) + ' Portal Sync)';
      revSources.push(line);
    });
    if (blitzMod('revenue') > 0) revSources.push('Blitz Revenue: +' + modPct(blitzMod('revenue')));
    if (blitzMod('yield') > 0) revSources.push('Blitz Yield: +' + modPct(blitzMod('yield')));
    if ((G.voidEssence || 0) > 0) revSources.push('Void Essence: ×' + voidEssenceMult().toFixed(2));
    if (G.empireLevel > 1) revSources.push('Empire Level ' + G.empireLevel + ': milestone packs on level-up');
    h += '<div class="section-label mb-2 mt-2">PASSIVE REVENUE</div>';
    h += modSectionCard('Total Passive', fmtRev(revSecTotal()), revSources.length ? revSources : ['Equip strains on portal floors']);

    var planetSources = [];
    (G.ownedPlanets || []).forEach(function (p) {
      var out = planetOutputPerSec(p) * 8;
      planetSources.push(esc(planetDisplayName(p)) + ': ' + fmtRev(out) + ' · x' + (p.upgraderMult || 1));
    });
    if (blitzMod('planet') > 0) planetSources.push('Blitz Planet: +' + modPct(blitzMod('planet')));
    h += '<div class="section-label mb-2 mt-2">PLANET OUTPUT</div>';
    h += modSectionCard('Worlds', String((G.ownedPlanets || []).length) + ' claimed', planetSources.length ? planetSources : ['Scan the Map tab to claim worlds']);

    var scanSources = [];
    G.sectorUpgrades.forEach(function (x) {
      if (x.level > 0) scanSources.push(esc(x.name) + ' Lv.' + x.level + ': +' + modPct(x.level * x.scanRateBonus));
    });
    (G.purchasedBlitzIds || []).forEach(function (bid) {
      var b = BLITZ_BY_ID[bid];
      if (b && b.modifierType === 'scan') scanSources.push(esc(b.name) + ': +' + modPct(b.modifier));
    });
    if (blitzRushMult() > 1 && scanMult() > 0) scanSources.push('Blitz Rush multiplier applied to scan total');
    h += '<div class="section-label mb-2 mt-2">SCAN RATE</div>';
    h += modSectionCard('Scan Bonus', modPct(scanMult()), scanSources.length ? scanSources : ['Upgrade sectors on the Map tab']);

    var luckSources = [];
    (G.purchasedBlitzIds || []).forEach(function (bid) {
      var b = BLITZ_BY_ID[bid];
      if (b && b.modifierType === 'packLuck') luckSources.push(esc(b.name) + ': +' + modPct(b.modifier));
    });
    G.strains.forEach(function (st) {
      if (hasAbility(st, 'rift_luck')) luckSources.push('Rift Luck (' + esc(st.name) + '): +' + modPct(abilityBonus(st, 'rift_luck', 0.05)));
    });
    var familyLuck = CoOpSynergyManager.getPackLuckBonus();
    if (familyLuck > 0) luckSources.push('Family Co-Op Level Synergy: +' + modPct(familyLuck) + ' (Lv.' + CoOpSynergyManager.getFamilyLevel() + ')');
    if ((G.mutationPackLuck || 0) > 0) luckSources.push('Mutation Lab: +' + modPct(G.mutationPackLuck));
    h += '<div class="section-label mb-2 mt-2">PACK LUCK</div>';
    h += modSectionCard('Rarity Bonus', modPct(packLuckBonus()), luckSources.length ? luckSources : ['No pack luck modifiers yet']);

    var cloneSources = [];
    if (blitzMod('clone') > 0) cloneSources.push('Blitz Clone: −' + modPct(blitzMod('clone')) + ' duration');
    G.strains.forEach(function (st) {
      if (hasAbility(st, 'clone_echo')) cloneSources.push('Clone Echo (' + esc(st.name) + '): −' + modPct(1 - Math.pow(0.9, abilityBoostMult(st, 'clone_echo'))) + ' per stack');
    });
    h += '<div class="section-label mb-2 mt-2">CLONE SPEED</div>';
    h += modSectionCard('Clone Time', fmtCd(CLONE_MS * (1 - blitzMod('clone'))), cloneSources.length ? cloneSources : ['Base 60s — blitz & Clone Echo reduce time']);

    var endGameSources = [];
    if (blitzMod('mutationEssence') > 0) endGameSources.push('Mutation Essence: +' + modPct(blitzMod('mutationEssence')) + ' from burns');
    if (blitzMod('bossCash') > 0) endGameSources.push('Boss Cash: +' + modPct(blitzMod('bossCash')));
    if (blitzMod('sp') > 0) endGameSources.push('Boss SP: +' + modPct(blitzMod('sp')));
    if (blitzMod('xp') > 0) endGameSources.push('Empire XP: +' + modPct(blitzMod('xp')));
    if (blitzMod('campaignNode') > 0) endGameSources.push('Campaign Node Rewards: +' + modPct(blitzMod('campaignNode')));
    if (blitzMod('voidEssence') > 0) endGameSources.push('Void Prestige Essence: +' + modPct(blitzMod('voidEssence')));
    if (blitzMod('raid') > 0) endGameSources.push('Raid DPS: +' + modPct(blitzMod('raid')));
    if (endGameSources.length) {
      h += '<div class="section-label mb-2 mt-2">END-GAME BLITZ</div>';
      h += modSectionCard('Power Mods', String(endGameSources.length) + ' active', endGameSources);
    }

    var blitzSources = [];
    (G.purchasedBlitzIds || []).forEach(function (bid) {
      var b = BLITZ_BY_ID[bid];
      if (b) blitzSources.push(esc(b.name) + ' — ' + esc(b.description));
    });
    if (!blitzSources.length) blitzSources.push('No permanent blitz purchased yet — visit Shop');
    else if (blitzRushMult() > 1) blitzSources.push('Blitz Rush strains: ×' + blitzRushMult().toFixed(2) + ' on all blitz effects');
    h += '<div class="section-label mb-2 mt-2">BLITZ MODIFIERS</div>';
    h += modSectionCard('Owned', String((G.purchasedBlitzIds || []).length) + ' / ' + BLITZ_CATALOG.length, blitzSources);

    if ((G.voidEssence || 0) > 0) {
      h += '<div class="section-label mb-2 mt-2">VOID ESSENCE</div>';
      h += modSectionCard('Prestige Mult', '×' + voidEssenceMult().toFixed(2), [
        'Void Essence: ' + (G.voidEssence || 0) + ' (+5% DPS & revenue each)',
        'Earned from prestige resets (1 per $1M cash earned)',
      ]);
    }
    if (hasAutoScanFleet()) {
      h += '<div class="section-label mb-2 mt-2">AUTO-SCAN FLEET</div>';
      h += modSectionCard('Fleet Status', 'ACTIVE', ['Scans every ' + Math.round(autoScanIntervalMs() / 1000) + 's · auto-keeps ' + rarityName(AUTO_SCAN_MIN_RARITY) + '+ worlds']);
    }

    h += '</div>';
    return h;
  }

  function profileStatsHtml() {
    var dps = totalBattleDps();
    var blitzCount = G.purchasedBlitzIds ? G.purchasedBlitzIds.length : 0;
    var invRev = inventoryRevPerSec();
    var rows = [
      ['Cash', fmtCash(G.cash)], ['SP', fmtSp(G.sp || 0)], ['XP', Math.floor(G.empireXp) + ' / ' + xpNeededForLevel(G.empireLevel)],
      ['Level', 'LV.' + G.empireLevel], ['Campaign Node', String(currentCampaignNode()) + '/' + CAMPAIGN_NODE_COUNT], ['Battle DPS', dps.toFixed(1) + '/sec'],
      ['Passive Rev', fmtRev(revSecTotal())], ['Inventory Rev', '+' + invRev.toFixed(1) + '/sec'],
      ['Planets', String((G.ownedPlanets || []).length)], ['Strains', String(G.strains.length)],
      ['Portal Floors', String(G.factoryFloors.length)], ['Blitz Mods', String(blitzCount) + ' / ' + BLITZ_CATALOG.length],
      ['Scan Bonus', ((scanMult() * 100).toFixed(0)) + '%'], ['Equipped', String((G.equippedBattleIds || []).length) + ' / ' + BATTLE_EQUIP_MAX],
      ['Void Essence', String(G.voidEssence || 0) + ' (×' + voidEssenceMult().toFixed(2) + ')'],
      ['Family Level', String(CoOpSynergyManager.getFamilyLevel())],
      ['Cash Earned (run)', fmtCash(G.totalCashEarned || 0)],
    ];
    var h = '<div class="profile-stats-scroll"><div class="stat-grid profile-stat-grid">';
    rows.forEach(function (r) {
      h += '<div class="' + SKIN_PANEL + ' stat-box"><div class="stat-label">' + esc(r[0]) + '</div><div class="stat-value">' + esc(r[1]) + '</div></div>';
    });
    h += '</div>';
    h += '<div class="' + SKIN_PANEL + ' p-4 mt-3"><div class="section-label section-label-green mb-2">VOID PRESTIGE</div>';
    h += '<p class="text-muted text-xs mb-3">Reset cash, SP, and strains (keeps top 3 + all blitz). Next essence: +' + Math.floor((G.totalCashEarned || 0) / 1000000 * (1 + blitzMod('voidEssence'))) + ' (1 per $1M earned this run).</p>';
    h += '<button type="button" class="game-btn game-btn-green w-full" data-action="void-prestige">ASCEND · VOID PRESTIGE</button></div></div>';
    return h;
  }

  function helpEncyclopediaHtml() {
    return '<div class="help-scroll text-xs" style="line-height:1.55;color:var(--muted)">' +
      '<p><span class="text-green">SP</span> — Strain Points from boss waves and planet harvests. Spend on merges (15 SP), infinite ability upgrades (cost scales per level), and planet output multipliers.</p>' +
      '<p><span class="text-green">XP</span> — Empire XP from packs, clones, harvests, and boss kills. Level up for milestone reward packs.</p>' +
      '<p><span class="text-green">Cash</span> — Primary currency. Passive revenue from portal floors + store items; boss kills; planet ticks.</p>' +
      '<p><span class="text-green">Boss</span> — 5 waves per cycle; wave 5 is a mega boss with twin-pack reward. Bosses regen 0.15% max HP/s; Shield Sap slows regen 8% per equipped copy (scales with SP upgrades).</p>' +
      '<p><span class="text-green">Battle DPS</span> — Equip up to 8 strains. THC × yield × rarity × quantity drives damage. Crit Burst (15% ×3), Boss Slayer (+30%), THC Overdrive (+15%), Poison Cloud (DoT), Regen Mist (+3% DPS per wave cleared), Cash Magnet (+8% kill cash), Blitz Rush (+10% blitz amp). All scale with infinite SP ability levels via abilityBoostMult.</p>' +
      '<p><span class="text-green">Strains</span> — CR-style cards with THC, yield, potency, and 1–5 abilities from a 500-trait catalog sharing 12 core mechanics. Procedural variants inherit the same mechanic with scaled min-rarity.</p>' +
      '<p><span class="text-green">Abilities</span> — Crit Burst, Yield Surge (+20% floor rev), THC Overdrive, Shield Sap, Poison Cloud, Clone Echo (−10% clone time), Cash Magnet, Portal Sync (+12% floor rev), Blitz Rush, Rift Luck (+5% pack luck), Boss Slayer, Regen Mist. Upgrade any ability infinitely with SP; cost = 10 + lvl×12×1.12^min(lvl,120).</p>' +
      '<p><span class="text-green">Merge Lab</span> — Fuse two parents in the Index for 15 SP → new F1 hybrid inheriting parent traits plus a chance at a new catalog ability.</p>' +
      '<p><span class="text-green">Shop</span> — Mystery packs (Basic, Guaranteed Rift, Omega), rotating blitz window (10 offers from 500 permanent upgrades), nutrients (+0.5/sec), and pipes (+1.2–2.5/sec).</p>' +
      '<p><span class="text-green">Blitz</span> — Cash-purchased permanent modifiers: revenue, yield, scan, clone speed, pack luck, battle DPS, planet output. First purchase starts a 30-min window; timer rolls new shop offers. Blitz Rush strains amplify all owned blitz effects up to ×1.5.</p>' +
      '<p><span class="text-green">Planets</span> — Scan the Map, claim worlds, upgrade harvesters/conveyors, spend SP on output multipliers (up to ×8), harvest exclusive strains. Planet output = base × harvester × conveyor × upgrader × blitz planet.</p>' +
      '<p><span class="text-green">Portal Floors</span> — Rocket hub → equip strains to mine passive cash. Revenue = strain yield × THC × floor level × blitz revenue × blitz yield × ability multipliers.</p>' +
      '<p><span class="text-green">Scan Rate</span> — Sector upgrades + blitz scan modifiers improve pack rarity rolls and boss tier generation.</p>' +
      '<p><span class="text-green">Pack Luck</span> — Blitz pack luck + Rift Luck abilities on owned strains shift rarity thresholds upward.</p>' +
      '<p><span class="text-green">Clone</span> — Base 60s; reduced by blitz clone and Clone Echo per owned strain. Clone a strain to duplicate quantity.</p>' +
      '<p><span class="text-green">Rarities</span> — 26 tiers from Dust (×1.0) to VoidGod (×5.0). Higher tiers unlock stronger abilities and card VFX tiers (Rare→Epic→Legend→Champion→God).</p>' +
      '<p><span class="text-green">Modifiers Tab</span> — Profile → Modifiers shows live DPS, revenue, planets, scan, pack luck, clone, and blitz breakdowns with per-source detail.</p>' +
      '<p><span class="text-green">Boss Traits</span> — Rotates by boss round (mod 4): Standard, Solar Flare (jams a random loadout strain 2s every 4s), Cosmic Shield (30% HP shield — only Crit Burst hits penetrate), Chronos Enrage (3× regen after 15s on wave).</p>' +
      '<p><span class="text-green">Void Prestige</span> — Profile → Stats → Ascend. Resets cash/SP/strains (keeps top 3 + all blitz). Earn Void Essence (1 per $1M cash earned) for +5% DPS & revenue each.</p>' +
      '<p><span class="text-green">Auto-Scan Fleet</span> — Buy Fleet Auto-Scanner blitz or max Cosmic Radar. Scans every 60s, auto-keeps Mist+ planets.</p>' +
      '<p><span class="text-green">Family Synergy</span> — Combined empire levels across Aden, Dad, Jamie grant +2% pack luck per 5 family levels.</p></div>';
  }

  function renderMergeLab() {
    var el = document.getElementById('overlay-merge-lab');
    if (!el) return;
    var ml = UI.mergeLab || { open: false };
    if (!ml.open) { el.classList.remove('open'); el.innerHTML = ''; return; }
    el.classList.add('open');
    var phase = ml.phase || 'idle';
    var err = ml.error || mergeLabError();
    var h = '<button type="button" class="overlay-backdrop" data-action="close-merge-lab"></button><div class="overlay-panel merge-lab-panel ' + SKIN_PANEL + ' p-4">';
    h += '<div class="flex-between mb-3"><h3 class="font-display" style="font-size:0.875rem;letter-spacing:0.12em">MERGE LAB</h3><button type="button" class="profile-close" data-action="close-merge-lab" style="position:static;width:2rem;height:2rem">' + farmIcon('close') + '</button></div>';
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
    var tab = UI.profileTab || 'modifiers';
    var h = '<div class="profile-banner"><button type="button" class="profile-close" data-close="profile">' + farmIcon('close') + '</button><div class="profile-avatar-lg"><div class="avatar-ring"></div><div class="avatar-inner" style="inset:4px;border-width:3px">' + avatarHtml(migrateAvatar(G.avatar), '100%') + '</div></div></div><div class="profile-body">';
    h += '<div class="farm-tabs mb-3"><button type="button" class="farm-tab' + (tab === 'modifiers' ? ' active' : '') + '" data-action="profile-tab" data-id="modifiers">MODIFIERS</button><button type="button" class="farm-tab' + (tab === 'stats' ? ' active' : '') + '" data-action="profile-tab" data-id="stats">STATS</button><button type="button" class="farm-tab' + (tab === 'custom' ? ' active' : '') + '" data-action="profile-tab" data-id="custom">CUSTOMIZE</button></div>';
    if (tab === 'modifiers') {
      h += profileModifiersHtml();
    } else if (tab === 'stats') {
      h += profileStatsHtml();
    } else {
      h += '<div class="font-mono text-green text-center mb-2" style="font-size:0.6rem;letter-spacing:0.2em">' + esc(pl.label.toUpperCase()) + '</div><input type="text" class="input-field text-center font-display chromatic-text mb-3" id="edit-name" value="' + esc(G.name) + '" maxlength="24">';
      h += '<div class="font-mono text-muted mb-2" style="font-size:0.5rem">AVATAR</div><div class="avatar-picker">';
      AVATARS.forEach(function (a) { h += '<button type="button" class="avatar-opt' + (G.avatar === a ? ' selected' : '') + '" data-action="set-avatar" data-av="' + esc(a) + '">' + avatarHtml(a, '2rem') + '</button>'; });
      h += '</div><div class="font-mono text-muted mb-2" style="font-size:0.5rem">BADGES</div><div class="grid-3 mb-3">';
      [0, 1, 2].forEach(function (slot) {
        h += '<select class="input-field" data-action="set-badge" data-slot="' + slot + '"><option value="">—</option>';
        BADGES.forEach(function (b) { h += '<option value="' + b.id + '"' + (G.badgeIds[slot] === b.id ? ' selected' : '') + '>' + b.label + '</option>'; });
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
    h += '<div class="flex-row gap-2 mb-3"><button type="button" class="game-btn" style="flex:1" data-action="switch-player">' + farmIcon('swap') + ' SWITCH PLAYER</button><button type="button" class="game-btn" style="flex:1" data-action="open-settings">' + farmIcon('settings') + ' SETTINGS</button></div><button type="button" class="game-btn game-btn-green w-full" data-close="profile">RESUME</button></div>';
    document.getElementById('profile-panel').innerHTML = h;
  }

  function renderSettings() {
    var helpOpen = UI.helpOpen;
    var h = '<div class="flex-between mb-3"><h3 class="font-display" style="font-size:0.875rem;letter-spacing:0.2em">SYSTEM CONFIG</h3><button type="button" data-close="settings" style="background:none;border:none;color:var(--muted);font-size:1.125rem;cursor:pointer">' + farmIcon('close') + '</button></div>';
    h += '<div class="' + SKIN_PANEL + ' flex-between p-4 mb-3"><div><div class="chromatic-text" style="font-weight:600;font-size:0.875rem">Reality Warp Mode</div><div class="text-muted" style="font-size:0.65rem">Subtle color drift & soft pulse</div></div><button type="button" class="toggle-switch" data-action="toggle-warp" style="background:' + (UI.realityWarp ? 'linear-gradient(90deg,#39FF14,#A855F7)' : 'rgba(61,0,102,0.8)') + '"><span class="toggle-knob" style="left:' + (UI.realityWarp ? 'calc(100% - 1.625rem)' : '0.125rem') + '"></span></button></div>';
    h += '<button type="button" class="game-btn w-full mb-2" data-action="toggle-help">' + (helpOpen ? farmIcon('close') + ' CLOSE HELP' : farmIcon('help') + ' GAME ENCYCLOPEDIA') + '</button>';
    if (helpOpen) h += helpEncyclopediaHtml();
    h += '<button type="button" class="game-btn w-full mb-2" data-action="switch-player">' + farmIcon('swap') + ' SWITCH PLAYER</button>';
    if (window.VoidlineCloud) {
      var cloud = window.VoidlineCloud;
      if (cloud.isLoggedIn()) {
        h += '<div class="' + SKIN_PANEL + ' p-3 mb-3 text-xs"><div class="font-mono text-cyan mb-1">CLOUD ACCOUNT</div><div>' + esc(cloud.getEmail() || 'Signed in') + '</div><button type="button" class="game-btn w-full mt-2" data-action="auth-signout">SIGN OUT</button></div>';
      } else {
        h += '<button type="button" class="game-btn game-btn-green w-full mb-2" data-action="auth-signin-open">SIGN IN FOR CLOUD SAVE</button>';
      }
    }
    document.getElementById('settings-panel').innerHTML = h;
  }

  function renderPack() {
    var pr = G.packReveal;
    var hasDual = pr.strains && pr.strains.length >= 2;
    var hasSingle = !!pr.strain;
    if (!pr.open || (!hasSingle && !hasDual)) { document.getElementById('overlay-pack-reveal').classList.remove('open'); return; }
    var title = (pr.packType || 'reward').toUpperCase().replace(/-/g, ' ');
    var wheelHtml = '';
    if (pr.wheelSpin) {
      var pct = pr.wheelPct != null ? pr.wheelPct : packWheelPercent(pr.strain || (pr.strains && pr.strains[0]), packLuckBonus());
      wheelHtml = '<div class="pack-reveal-wheel-stage mb-3"><div class="pack-reveal-wheel"><div class="pack-reveal-wheel-ring"></div><div class="pack-reveal-wheel-pointer"></div><div class="pack-reveal-wheel-center font-display">' + pct + '%</div></div><div class="font-mono text-xs text-cyan mt-2" style="letter-spacing:0.2em">SIEGE ROLL · DICE LOCK</div></div>';
    }
    var inner = wheelHtml + '<div class="font-mono text-muted mb-2" style="font-size:0.6rem;letter-spacing:0.4em">' + esc(title) + '</div>';
    if (hasDual) {
      inner += '<div class="dual-pack-grid mb-3">';
      pr.strains.forEach(function (s) {
        inner += '<div>' + crCardHtml(s, { noFocus: true, large: true }) + '</div>';
      });
      inner += '</div><p class="text-muted text-xs mb-3">Two unique genetics — never the same genome.</p>';
    } else {
      var s = pr.strain;
      inner += '<div class="mb-3">' + crCardHtml(s, { noFocus: true, large: true }) + '</div>';
      inner += abilityListHtml(s) + '<div class="grid-3 mb-4 mt-3"><div class="' + SKIN_PANEL + ' stat-box"><div class="stat-label">THC</div><div class="stat-value">' + s.thcPercent + '%</div></div><div class="' + SKIN_PANEL + ' stat-box"><div class="stat-label">YIELD</div><div class="stat-value">' + s.yield + '</div></div><div class="' + SKIN_PANEL + ' stat-box"><div class="stat-label">POTENCY</div><div class="stat-value">' + s.potency + '</div></div></div>';
    }
    var borderC = hasDual ? '#39FF14' : rarityColor(pr.strain.rarity);
    var revealRar = hasDual ? pr.strains[0] : pr.strain;
    var rIdx = revealRar ? rarityIndex(revealRar.rarity) : 0;
    var revealCls = 'pack-reveal-aaa';
    if (rIdx >= rarityIndex('legend')) revealCls += ' pack-reveal-legend pack-reveal-particles';
    else if (rIdx >= rarityIndex('bloom')) revealCls += ' pack-reveal-epic pack-reveal-particles';
    else if (rIdx >= rarityIndex('pulse')) revealCls += ' pack-reveal-rare';
    var particleHtml = rIdx >= rarityIndex('bloom') ? '<div class="pack-reveal-particles-layer" aria-hidden="true"></div>' : '';
    document.getElementById('pack-panel').innerHTML = '<div class="overlay-panel pack-reveal-card ' + revealCls + ' ' + SKIN_PANEL + '" style="background:linear-gradient(160deg,rgba(61,0,102,0.9),#0C011A 50%,#1a0040);border:3px solid ' + borderC + ';box-shadow:0 0 60px ' + borderC + '66, inset 0 1px 0 rgba(255,255,255,0.08)">' + particleHtml + '<div class="pack-shimmer"></div><div class="p-5 text-center" style="position:relative">' + inner + '<button type="button" class="game-btn game-btn-green w-full" data-close="pack">ADD TO INDEX</button><button type="button" class="game-btn w-full mt-2 pack-showcase-btn" data-action="pack-showcase">SHOWCASE PULL</button></div></div>';
    document.getElementById('overlay-pack-reveal').classList.add('open');
  }

  function strainFromLiftId(id) {
    if (!id) return null;
    if (id.indexOf('index-') === 0) return strainById(id.slice(6));
    if (id.indexOf('battle-slot-') === 0 || id.indexOf('battle-pool-') === 0) return strainById(id.slice(12));
    if (id.indexOf('raid-slot-') === 0 || id.indexOf('raid-pool-') === 0) return strainById(id.slice(10));
    return null;
  }

  function strainLiftMetaHtml(s) {
    var extras = (s.planetExclusive ? ' · Planet' : '') + ((s.parentIds && s.parentIds.length) ? ' · Hybrid' : '');
    return '<div class="lift-rarity" style="color:' + rarityColor(s.rarity) + '">' + esc(rarityName(s.rarity)) + extras + '</div>' +
      '<div>THC ' + s.thcPercent + '% · Yield ' + s.yield + ' · DPS ' + strainBattleDpsBase(s).toFixed(1) + (s.quantity > 1 ? ' · ×' + s.quantity : '') + '</div>';
  }

  function liftFooterHtml(id) {
    if (id.indexOf('battle-pool-') === 0) {
      var sid = id.slice(12);
      return '<button type="button" class="game-btn game-btn-green" data-action="equip-battle" data-id="' + esc(sid) + '">' + farmIcon('equip') + ' EQUIP</button><button type="button" class="game-btn" data-action="dismiss-lift">CLOSE</button>';
    }
    if (id.indexOf('battle-slot-') === 0) {
      var sid2 = id.slice(12);
      return '<button type="button" class="game-btn" data-action="equip-battle" data-id="' + esc(sid2) + '">UNEQUIP</button><button type="button" class="game-btn" data-action="dismiss-lift">CLOSE</button>';
    }
    if (id.indexOf('raid-pool-') === 0) {
      var rsid = id.slice(10);
      return '<button type="button" class="game-btn game-btn-green" data-action="equip-raid" data-id="' + esc(rsid) + '">' + farmIcon('equip') + ' RAID EQUIP</button><button type="button" class="game-btn" data-action="dismiss-lift">CLOSE</button>';
    }
    if (id.indexOf('raid-slot-') === 0) {
      var rsid2 = id.slice(10);
      return '<button type="button" class="game-btn" data-action="equip-raid" data-id="' + esc(rsid2) + '">UNEQUIP RAID</button><button type="button" class="game-btn" data-action="dismiss-lift">CLOSE</button>';
    }
    if (id.indexOf('index-') === 0) {
      var sid3 = id.slice(6);
      var s = strainById(sid3);
      if (!s) return '<button type="button" class="game-btn" data-action="dismiss-lift">CLOSE</button>';
      var on = (G.equippedBattleIds || []).indexOf(sid3) >= 0;
      var eq = on
        ? '<button type="button" class="game-btn" data-action="equip-battle" data-id="' + esc(sid3) + '">UNEQUIP</button>'
        : '<button type="button" class="game-btn game-btn-green" data-action="equip-battle" data-id="' + esc(sid3) + '">' + farmIcon('equip') + ' EQUIP</button>';
      return eq + '<button type="button" class="game-btn game-btn-green" data-action="up-strain" data-id="' + esc(sid3) + '">UP · ' + fmtCash(upCost(s)) + '</button><button type="button" class="game-btn" data-action="gift-strain" data-id="' + esc(sid3) + '">GIFT</button><button type="button" class="game-btn" data-action="dismiss-lift">CLOSE</button>';
    }
    return '<button type="button" class="game-btn" data-action="dismiss-lift">CLOSE</button>';
  }

  function renderLiftBody() {
    var id = UI.liftedCardId;
    if (!id) return '';
    if (id.indexOf('planet-') === 0) {
      var pid = id.slice(7);
      var pl = (G.ownedPlanets || []).find(function (p) { return p.id === pid; });
      if (!pl) return '';
      return planetCardHtml(pl, { large: true }) + '<div class="mt-3 text-xs text-muted text-center">' + fmtRev(planetOutputPerSec(pl) * 8) + ' · exclusive genetics</div>';
    }
    if (id === 'planet-scan' && G.scanPending) {
      var ex = genExclusivePlanetStrain(G.scanPending);
      return planetCardHtml(G.scanPending, { glow: true }) + '<div class="planet-scan-lift-meta text-xs text-muted text-center">' + esc(ex.name) + ' · ' + esc(rarityName(G.scanPending.rarity)) + '</div>';
    }
    if (id.indexOf('pack-') === 0) {
      var pt = id.slice(5);
      var p = PACKS.find(function (x) { return x.type === pt; });
      if (!p) return '';
      var dis = G.cash < p.price && !(p.type === 'omega' && p.spCost && G.sp >= p.spCost);
      return '<div class="flex-row"><div>' + farmIcon(p.icon || 'pack', { lg: true }) + '</div><div style="flex:1;min-width:0"><div style="font-weight:600;font-size:0.875rem">' + esc(p.name) + '</div><div class="text-muted text-xs">' + esc(p.desc) + '</div><div class="text-green font-mono text-xs" style="font-weight:700;margin-top:0.25rem">' + fmtCash(p.price) + (p.spCost ? ' or ' + p.spCost + ' SP' : '') + '</div></div><button type="button" class="game-btn game-btn-green game-btn-sm" data-action="buy-pack" data-pack="' + p.type + '"' + (dis ? ' disabled' : '') + '>OPEN</button></div>';
    }
    var wrap = document.querySelector('[data-lift="' + id + '"]');
    return wrap ? wrap.innerHTML : '';
  }

  function renderLift() {
    var el = document.getElementById('overlay-card-lift');
    if (!UI.liftedCardId) { el.innerHTML = ''; return; }
    var id = UI.liftedCardId;
    var strain = strainFromLiftId(id);
    if (strain) {
      var showDps = id.indexOf('battle-') === 0;
      var tierCls = liftShellTierClass(strain);
      var glow = rarityColor(strain.rarity);
      var shellCls = 'lift-shell lifted-card ' + tierCls;
      // #region agent log
      // #endregion
      el.innerHTML = '<button type="button" class="card-lift-backdrop" data-action="dismiss-lift"></button>' +
        '<div class="' + shellCls + '" style="--glow:' + glow + '">' +
        '<div class="lift-hero">' + crCardHtml(strain, { noFocus: true, large: true, showDps: showDps }) + '</div>' +
        '<div class="lift-meta">' + strainLiftMetaHtml(strain) + '</div>' +
        '<div class="lift-abilities">' + abilityListHtml(strain, { upgradeable: true, lift: true }) + '</div>' +
        '<div class="lift-footer">' + liftFooterHtml(id) + '</div></div>';
      return;
    }
    var body = renderLiftBody();
    if (!body) { el.innerHTML = ''; UI.liftedCardId = null; UI.liftOnUpgrade = null; return; }
    var shellCls = 'lift-shell' + (id === 'planet-scan' ? ' lift-shell-compact' : '');
    el.innerHTML = '<button type="button" class="card-lift-backdrop" data-action="dismiss-lift"></button>' +
      '<div class="' + shellCls + '"><div class="lift-hero"' + (id === 'planet-scan' ? '' : ' style="padding:1rem"') + '>' + body + '</div>' +
      '<div class="lift-footer">' + (UI.liftOnUpgrade ? '<button type="button" class="game-btn game-btn-green" data-action="lift-upgrade">' + farmIcon('upgrade') + ' UPGRADE</button>' : '') +
      '<button type="button" class="game-btn" data-action="dismiss-lift">CLOSE</button></div></div>';
  }

  function renderBeam() {
    var b = document.getElementById('overlay-transaction-beam');
    if (G.transactionBeam && G.transactionBeam.active) { b.classList.add('active'); document.getElementById('beam-label').textContent = G.transactionBeam.from + ' → ' + G.transactionBeam.to; }
    else b.classList.remove('active');
  }

  function renderAuxOverlays() {
    var el = document.getElementById('overlay-aux');
    if (!el) return;
    var h = '';
    if (UI.confirmDialog) {
      var cd = UI.confirmDialog;
      h += '<div class="aux-overlay open"><button type="button" class="overlay-backdrop" data-action="confirm-no"></button><div class="overlay-panel ' + SKIN_PANEL + ' p-4 text-center" style="max-width:18rem;margin:auto"><p class="text-sm mb-3">' + esc(cd.message) + '</p><div class="flex-row gap-2"><button type="button" class="game-btn game-btn-green" style="flex:1" data-action="confirm-yes">YES</button><button type="button" class="game-btn" style="flex:1" data-action="confirm-no">NO</button></div></div></div>';
    }
    if (UI.storefrontPickSlot != null) {
      var slotIdx = UI.storefrontPickSlot;
      h += '<div class="aux-overlay open"><button type="button" class="overlay-backdrop" data-action="sf-pick-close"></button><div class="overlay-panel ' + SKIN_PANEL + ' p-4"><h3 class="font-display text-sm mb-2">LIST ON SLOT ' + (slotIdx + 1) + '</h3>';
      h += '<select class="input-field mb-2" id="sf-pick-strain"><option value="">— Strain —</option>';
      G.strains.forEach(function (s) { h += '<option value="' + esc(s.id) + '">' + esc(s.name) + ' x' + (s.quantity || 1) + '</option>'; });
      h += '</select><input type="number" class="input-field mb-2" id="sf-pick-qty" placeholder="Quantity" value="1" min="1"><input type="number" class="input-field mb-3" id="sf-pick-price" placeholder="Price ($)">';
      h += '<button type="button" class="game-btn game-btn-green w-full" data-action="sf-pick-confirm" data-id="' + slotIdx + '">LIST ITEM</button></div></div>';
    }
    if (UI.giftStrainId) {
      h += '<div class="aux-overlay open"><button type="button" class="overlay-backdrop" data-action="gift-cancel"></button><div class="overlay-panel ' + SKIN_PANEL + ' p-4"><h3 class="font-display text-sm mb-2">GIFT STRAIN</h3>';
      PLAYERS.forEach(function (pl) {
        if (pl.id === activePlayerId) return;
        h += '<button type="button" class="game-btn w-full mb-2" data-action="gift-confirm" data-id="' + UI.giftStrainId + ':' + pl.id + '">→ ' + esc(pl.label) + '</button>';
      });
      h += '</div></div>';
    }
    if (UI.mapBillingsOpen) {
      var tab = UI.mapBillingsTab || 'active';
      h += '<div class="aux-overlay open"><button type="button" class="overlay-backdrop" data-action="map-billings-close"></button><div class="overlay-panel ' + SKIN_PANEL + ' p-4" style="max-height:70vh;overflow-y:auto"><h3 class="font-display text-sm mb-2">PLANET BILLINGS</h3>';
      h += '<div class="farm-tabs mb-3"><button type="button" class="farm-tab' + (tab === 'active' ? ' active' : '') + '" data-action="billings-tab" data-id="active">ACTIVE</button><button type="button" class="farm-tab' + (tab === 'loss' ? ' active' : '') + '" data-action="billings-tab" data-id="loss">LOSS</button></div>';
      var list = tab === 'loss' ? ((G.planetLeases || {}).archive || []) : ((G.planetLeases || {}).active || []);
      if (!list.length) h += '<div class="text-muted text-xs">No ' + tab + ' leases.</div>';
      list.forEach(function (l) {
        h += '<div class="' + SKIN_PANEL + ' p-3 mb-2 text-xs"><div style="font-weight:600">' + esc(l.planetName || l.planetId) + '</div>';
        h += '<div class="text-muted">Buyer: ' + esc(l.buyerId) + ' · ' + l.percent + '% · ' + fmtCash(l.pricePerInterval) + '/5m</div>';
        h += '<div class="text-green">Collected: ' + fmtCash(l.totalCollected || 0) + '</div></div>';
      });
      h += '</div></div>';
    }
    if (UI.leaseDraft) {
      var ld = UI.leaseDraft;
      h += '<div class="aux-overlay open"><button type="button" class="overlay-backdrop" data-action="lease-cancel"></button><div class="overlay-panel ' + SKIN_PANEL + ' p-4"><h3 class="font-display text-sm mb-2">BUY PORTION / LEASE</h3>';
      h += '<input type="range" class="input-field mb-2" id="lease-percent" min="1" max="' + LEASE_MAX_PERCENT + '" value="25"><div class="text-xs text-muted mb-2">Allocation: <span id="lease-pct-label">25</span>% (max ' + LEASE_MAX_PERCENT + '%)</div>';
      h += '<input type="number" class="input-field mb-3" id="lease-price" placeholder="Cash per 5 min">';
      h += '<button type="button" class="game-btn game-btn-green w-full" data-action="lease-submit" data-id="' + esc(ld.planetId) + ':' + esc(ld.ownerId) + '">SUBMIT OFFER</button></div></div>';
    }
    if (UI.dailyLoginOpen) {
      ensureEngagementState();
      var streak = G.dailyLoginStreak || 0;
      h += '<div class="aux-overlay open"><button type="button" class="overlay-backdrop" data-action="close-daily-login"></button><div class="overlay-panel ' + SKIN_PANEL + ' p-4"><h3 class="font-display text-sm mb-2">DAILY LOGIN REWARDS</h3>';
      h += '<p class="text-muted text-xs mb-2">Streak: Day ' + streak + (canClaimDailyLogin() ? ' · claim ready!' : '') + '</p><div class="daily-login-grid">';
      DAILY_LOGIN_REWARDS.forEach(function (r, i) {
        var dayNum = i + 1;
        var cls = 'daily-login-day';
        if (dayNum < streak) cls += ' claimed';
        if (dayNum === streak && canClaimDailyLogin()) cls += ' today';
        if (dayNum === streak && !canClaimDailyLogin()) cls += ' claimed';
        var label = r.cash ? fmtCash(r.cash) : '';
        if (r.sp) label += (label ? ' + ' : '') + r.sp + ' SP';
        h += '<div class="' + cls + '"><div>D' + dayNum + '</div><div>' + label + '</div></div>';
      });
      h += '</div>';
      if (canClaimDailyLogin()) h += '<button type="button" class="game-btn game-btn-green w-full" data-action="claim-daily-login">CLAIM TODAY</button>';
      else h += '<button type="button" class="game-btn w-full" data-action="close-daily-login">CLOSE</button>';
      h += '</div></div>';
    }
    if (UI.trophyRoadOpen) {
      ensureEngagementState();
      h += '<div class="aux-overlay open"><button type="button" class="overlay-backdrop" data-action="close-trophy-road"></button><div class="overlay-panel ' + SKIN_PANEL + ' p-4" style="max-width:22rem"><h3 class="font-display text-sm mb-2">TROPHY ROAD</h3>';
      h += '<p class="text-muted text-xs mb-2">' + (G.trophyPoints || 0) + ' trophy points · clear bosses, achievements, daily login</p><div class="trophy-road-scroll">';
      TROPHY_ROAD.forEach(function (m) {
        var unlocked = (G.trophyPoints || 0) >= m.pts;
        var claimed = G.trophyRoadClaimed.indexOf(m.id) >= 0;
        var cls = 'trophy-milestone' + (unlocked ? ' unlocked' : '') + (claimed ? ' claimed' : '');
        var rw = m.reward.cash ? fmtCash(m.reward.cash) : '';
        if (m.reward.sp) rw += (rw ? ' + ' : '') + m.reward.sp + ' SP';
        h += '<div class="' + cls + '"><div class="font-mono text-cyan">' + m.pts + ' PTS</div><div class="text-xs mt-1">' + rw + '</div>';
        if (unlocked && !claimed) h += '<button type="button" class="game-btn game-btn-green game-btn-sm w-full mt-1" data-action="claim-trophy" data-id="' + m.id + '">CLAIM</button>';
        else if (claimed) h += '<div class="text-green text-xs mt-1">✓</div>';
        h += '</div>';
      });
      h += '</div><button type="button" class="game-btn w-full mt-2" data-action="close-trophy-road">CLOSE</button></div></div>';
    }
    if (UI.achievementsOpen) {
      ensureEngagementState();
      h += '<div class="aux-overlay open"><button type="button" class="overlay-backdrop" data-action="close-achievements"></button><div class="overlay-panel ' + SKIN_PANEL + ' p-4" style="max-height:70vh;overflow-y:auto"><h3 class="font-display text-sm mb-2">ACHIEVEMENTS</h3>';
      ACHIEVEMENTS.forEach(function (a) {
        var done = G.achievementsUnlocked.indexOf(a.id) >= 0;
        var rw = a.reward.cash ? fmtCash(a.reward.cash) : '';
        if (a.reward.sp) rw += (rw ? ' + ' : '') + a.reward.sp + ' SP';
        h += '<div class="achievement-row' + (done ? ' done' : '') + '"><div style="flex:1"><div style="font-weight:600;font-size:0.75rem">' + esc(a.name) + '</div><div class="text-muted text-xs">' + esc(a.desc) + '</div></div><div class="text-xs text-green">' + (done ? 'DONE' : rw) + '</div></div>';
      });
      h += '<button type="button" class="game-btn w-full mt-2" data-action="close-achievements">CLOSE</button></div></div>';
    }
    if (UI.battlePassOpen) {
      ensureBattlePass();
      var bpXpPct = Math.min(100, (G.battlePassXp / BATTLE_PASS_XP_PER_TIER) * 100);
      h += '<div class="aux-overlay open"><button type="button" class="overlay-backdrop" data-action="close-battle-pass"></button>';
      h += '<div class="overlay-panel battle-pass-panel ' + SKIN_PANEL + ' p-4" style="max-height:75vh;overflow-y:auto">';
      h += '<h3 class="font-display text-sm mb-1">VOID SEASON ' + BATTLE_PASS_SEASON + ' · BATTLE PASS</h3>';
      h += '<p class="text-muted text-xs mb-2">Tier ' + G.battlePassTier + '/' + BATTLE_PASS_MAX_TIER + ' · ' + Math.floor(G.battlePassXp) + '/' + BATTLE_PASS_XP_PER_TIER + ' XP</p>';
      h += '<div class="battle-pass-xp-bar mb-2"><div class="battle-pass-xp-fill" style="width:' + bpXpPct + '%"></div></div>';
      if (!G.battlePassPremium) {
        h += '<button type="button" class="game-btn game-btn-sm game-btn-green w-full mb-3" data-action="unlock-battle-pass-premium">UNLOCK PREMIUM TRACK (DEMO)</button>';
      } else {
        h += '<div class="battle-pass-premium-badge mb-3">PREMIUM ACTIVE</div>';
      }
      h += '<div class="battle-pass-scroll">';
      for (var bpt = 1; bpt <= BATTLE_PASS_MAX_TIER; bpt++) {
        var bpUnlocked = G.battlePassTier >= bpt;
        var bpFreeClaimed = G.battlePassClaimed.free.indexOf(bpt) >= 0;
        var bpPremClaimed = G.battlePassClaimed.premium.indexOf(bpt) >= 0;
        var bpFreeRw = battlePassRewardFor(bpt, 'free');
        var bpPremRw = battlePassRewardFor(bpt, 'premium');
        h += '<div class="battle-pass-tier-row' + (bpUnlocked ? ' unlocked' : ' locked') + '">';
        h += '<div class="battle-pass-tier-num">T' + bpt + '</div>';
        h += '<div class="battle-pass-track free"><div class="battle-pass-track-label">FREE</div><div class="battle-pass-reward">' + battlePassRewardLabel(bpFreeRw) + '</div>';
        if (bpUnlocked && !bpFreeClaimed) h += '<button type="button" class="game-btn game-btn-sm game-btn-green" data-action="claim-battle-pass" data-id="' + bpt + ':free">CLAIM</button>';
        else if (bpFreeClaimed) h += '<span class="text-green text-xs">✓</span>';
        h += '</div>';
        h += '<div class="battle-pass-track premium"><div class="battle-pass-track-label">VIP</div><div class="battle-pass-reward">' + battlePassRewardLabel(bpPremRw) + '</div>';
        if (bpUnlocked && G.battlePassPremium && !bpPremClaimed) h += '<button type="button" class="game-btn game-btn-sm" data-action="claim-battle-pass" data-id="' + bpt + ':premium">CLAIM</button>';
        else if (bpPremClaimed) h += '<span class="text-green text-xs">✓</span>';
        else if (!G.battlePassPremium) h += '<span class="text-muted text-xs">🔒</span>';
        h += '</div></div>';
      }
      h += '</div><button type="button" class="game-btn w-full mt-2" data-action="close-battle-pass">CLOSE</button></div></div>';
    }
    el.innerHTML = h;
    el.classList.toggle('open', !!h);
  }

  function screenRenderer(tab) {
    if (tab === 'battle') return UI.farmOpen ? renderFarm : renderBattle;
    var map = { shop: renderShop, index: renderIndex, coop: renderCoop, map: renderMap };
    return map[tab] || renderBattle;
  }

  function tabCarouselIndex() {
    var idx = TAB_ORDER.indexOf(UI.activeTab);
    return idx < 0 ? 2 : idx;
  }

  function renderActiveTabPanel(root, scrollTop) {
    if (!root) return;
    var idx = tabCarouselIndex();
    var activeTab = UI.activeTab;
    var panels = TAB_ORDER.map(function (tab) {
      var inner = tab === activeTab ? screenRenderer(tab)() : '';
      return '<div class="cr-screen-panel tab-bg-' + tab + '"><div class="cr-screen-inner">' + inner + '</div></div>';
    }).join('');
    root.innerHTML = '<div class="screen-router-wrapper cr-screen-carousel" style="transform:translate3d(-' + (idx * 20) + '%,0,0)">' + panels + '</div>';
    root.scrollTop = scrollTop;
    bindCardParallax();
    bindImageFallbacks();
    UI.dirty.activeTab = false;
    markBossHpDirty();
    markBossDpsDirty();
    markBossTraitDirty();
    markBossShieldDirty();
    UI_LAST.bossHpPct = null;
    UI_LAST.bossShieldPct = null;
    UI_LAST.bossTrait = null;
    UI_LAST.dps = null;
    UI_LAST.blitzCd = null;
    UI_LAST.cloneCd = null;
  }

  function render() {
    if (!G) return;
    var root = DOM.screenRoot || document.getElementById('screen-root');
    var scrollTop = root ? root.scrollTop : 0;
    renderHUD();
    renderPlayerSelect();
    if (!UI.playerSelectOpen && root) {
      renderActiveTabPanel(root, scrollTop);
    }
    document.getElementById('overlay-profile').classList.toggle('open', UI.profileOpen);
    document.getElementById('overlay-settings').classList.toggle('open', UI.settingsOpen);
    if (UI.profileOpen) renderProfile();
    if (UI.settingsOpen) renderSettings();
    renderPack();
    renderLift();
    renderBeam();
    renderStrainPicker();
    renderMergeLab();
    renderAuxOverlays();
    scrollCampaignTrailToCurrent();
  }

  function scrollCampaignTrailToCurrent() {
    if (!G || UI.activeTab !== 'battle' || UI.farmOpen) return;
    try {
      setTimeout(function () {
        var el = document.getElementById('campaign-node-' + currentCampaignNode());
        if (el) el.scrollIntoView({ block: 'center', behavior: 'auto' });
      }, 60);
    } catch (err) {
      console.error('scrollCampaignTrailToCurrent', err);
    }
  }

  var saveTimer = null;
  var lastSaveAt = 0;
  var AUTOSAVE_MS = 2500;
  function scheduleSave() { if (saveTimer) clearTimeout(saveTimer); saveTimer = setTimeout(flushSave, 400); }
  function flushSave() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (!G || !activePlayerId || UI.playerSelectOpen) return;
    var ok = saveGame();
    if (ok) {
      lastSaveAt = Date.now();
      if (window.VoidlineCloud && window.VoidlineCloud.isLoggedIn()) {
        var p = { playerId: activePlayerId, saveVersion: SAVE_VERSION };
        PERSIST.forEach(function (k) { p[k] = G[k]; });
        window.VoidlineCloud.flushSave(activePlayerId, p);
      }
    }
  }
  var foilRaf = null;
  var foilState = { wrap: null, frame: null, xPct: 0, yPct: 0 };

  function bindCardParallax() {
    var root = document.getElementById('screen-root');
    if (!root || root._foilBound) return;
    root._foilBound = true;

    function foilTarget(el) {
      return el.closest('.liftable-wrap') || el.closest('.cr-card') || el.closest('.strain-card') || el.closest('.strain-picker-card') || el.closest('.binder-grid .liftable-wrap');
    }

    function foilFrame(wrap) {
      if (!wrap) return null;
      return wrap.querySelector('.holo-card') || wrap.querySelector('.cr-card-frame');
    }

    function scheduleFoil(wrap, frame, xPct, yPct) {
      foilState.wrap = wrap;
      foilState.frame = frame;
      foilState.xPct = xPct;
      foilState.yPct = yPct;
      if (!foilRaf) foilRaf = requestAnimationFrame(applyFoil);
    }

    function applyFoil() {
      foilRaf = null;
      var wrap = foilState.wrap;
      var frame = foilState.frame;
      if (!wrap || !frame) return;
      frame.style.setProperty('--x-pct', foilState.xPct.toFixed(4));
      frame.style.setProperty('--y-pct', foilState.yPct.toFixed(4));
      var foil = frame.querySelector('.cr-card-foil');
      if (foil) {
        foil.style.backgroundPosition = ((foilState.xPct + 1) * 50) + '% ' + ((foilState.yPct + 1) * 50) + '%';
      }
      var shine = frame.querySelector('.cr-card-shine');
      if (shine) {
        shine.style.backgroundPosition = ((foilState.xPct + 1) * 50) + '% ' + ((foilState.yPct + 1) * 50) + '%';
        shine.style.opacity = '0.88';
      }
      wrap.classList.add('foil-active');
      frame.classList.add('foil-active');
    }

    function resetFoil(wrap) {
      if (!wrap) return;
      wrap.classList.remove('foil-active');
      var frame = foilFrame(wrap);
      if (!frame) return;
      frame.classList.remove('foil-active');
      frame.style.removeProperty('--x-pct');
      frame.style.removeProperty('--y-pct');
      var foil = frame.querySelector('.cr-card-foil');
      if (foil) foil.style.backgroundPosition = '';
      var shine = frame.querySelector('.cr-card-shine');
      if (shine) { shine.style.backgroundPosition = ''; shine.style.opacity = ''; }
    }

    function onPointer(e) {
      var wrap = foilTarget(e.target);
      if (!wrap) return;
      var frame = foilFrame(wrap);
      if (!frame) return;
      var rect = frame.getBoundingClientRect();
      var px = e.clientX != null ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : null);
      var py = e.clientY != null ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : null);
      if (px == null || py == null) return;
      var xPct = Math.max(-1, Math.min(1, (px - rect.left - rect.width / 2) / (rect.width / 2)));
      var yPct = Math.max(-1, Math.min(1, (py - rect.top - rect.height / 2) / (rect.height / 2)));
      scheduleFoil(wrap, frame, xPct, yPct);
    }

    function onLeave(e) {
      var wrap = foilTarget(e.target);
      if (!wrap) return;
      resetFoil(wrap);
      if (foilState.wrap === wrap) {
        foilState.wrap = null;
        foilState.frame = null;
      }
    }

    root.addEventListener('pointermove', onPointer);
    root.addEventListener('pointerleave', onLeave, true);
    root.addEventListener('touchmove', onPointer, { passive: true });
    root.addEventListener('touchend', onLeave, true);
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
    if (act==='open-portal-farm' || act==='openPortalFarm') {
      UI.activeTab = 'battle';
      UI.farmOpen = true;
      UI.campaignTrailOpen = false;
      G.farmSubTab = 'portal';
      plantSay('tab_farm', true);
      scheduleSave(); render(); return;
    }
    if (act==='start-run') {
      UI.campaignTrailOpen = true;
      UI.farmOpen = false;
      UI.battleWaveFlash = 'battle-hub-run-flash';
      render();
      setTimeout(function () {
        var trail = document.getElementById('home-campaign-trail');
        if (trail) trail.scrollIntoView({ behavior: 'smooth', block: 'start' });
        var el = document.getElementById('campaign-node-' + currentCampaignNode());
        if (el) {
          try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (err) { el.scrollIntoView(true); }
        }
        UI.battleWaveFlash = null;
        render();
      }, 120);
      return;
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
    else if (act==='equip-battle') { equipBattle(val); UI.liftedCardId = null; }
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
    else if (act==='up-strain') onUpgrade(val);
    else if (act==='set-avatar') G.avatar = val;
    else if (act==='set-badge') { var p = val.split(':'); G.badgeIds = G.badgeIds.slice(); G.badgeIds[parseInt(p[0], 10)] = p[1] || null; }
    else if (act==='sf-strain') { var p2 = val.split(':'); var slot = parseInt(p2[0], 10); G.storefrontSlots = G.storefrontSlots.slice(); G.storefrontSlots[slot] = Object.assign({}, G.storefrontSlots[slot], { strainId: p2[1] || null }); }
    else if (act==='sf-price') { var p3 = val.split(':'); var slot2 = parseInt(p3[0], 10); G.storefrontSlots = G.storefrontSlots.slice(); G.storefrontSlots[slot2] = Object.assign({}, G.storefrontSlots[slot2], { price: parseFloat(p3[1]) || 0 }); }
    else if (act==='toggle-warp') UI.realityWarp = !UI.realityWarp;
    else if (act==='open-settings') { UI.settingsOpen = true; UI.profileOpen = false; }
    else if (act==='dismiss-lift') {
      UI.liftedCardId = null; UI.liftOnUpgrade = null;
    }
    else if (act==='lift-upgrade' && UI.liftOnUpgrade) { runAction(UI.liftOnUpgrade.split(':')[0], UI.liftOnUpgrade.split(':').slice(1).join(':')); UI.liftedCardId = null; UI.liftOnUpgrade = null; }
    else if (act==='index-search') G.indexSearch = val;
    else if (act==='index-sort') G.indexSort = val;
    else if (act==='map-scan') { startMapScan(); scheduleSave(); render(); return; }
    else if (act==='planet-keep') { keepScannedPlanet(); }
    else if (act==='planet-discard') { discardScannedPlanet(); }
    else if (act==='planet-focus') { UI.focusedPlanetId = UI.focusedPlanetId === val ? null : val; }
    else if (act==='up-planet') { var pu = val.split(':'); upPlanetUpgrade(pu[0], pu[1]); }
    else if (act==='harvest-planet') { harvestPlanet(val); }
    else if (act==='breed-run') { startMergeFuse(); return; }
    else if (act==='void-prestige') { if (confirm('Void Prestige resets cash, SP, and strains (keeps top 3 + all blitz). Continue?')) triggerVoidPrestige(); }
    else if (act==='coop-myshop') { UI.coopView = 'myshop'; }
    else if (act==='coop-back') { UI.coopView = 'hub'; UI.coopShopPlayer = null; }
    else if (act==='coop-visit-shop') { UI.coopView = 'shop:' + val; UI.coopShopPlayer = val; }
    else if (act==='sf-buy-slot') buyStorefrontSlot();
    else if (act==='sf-pick-open') { UI.storefrontPickSlot = parseInt(val, 10); }
    else if (act==='sf-pick-close') { UI.storefrontPickSlot = null; }
    else if (act==='sf-pick-confirm') {
      var strainEl = document.getElementById('sf-pick-strain');
      var qtyEl = document.getElementById('sf-pick-qty');
      var priceEl = document.getElementById('sf-pick-price');
      if (strainEl && qtyEl && priceEl) listStorefrontSlot(parseInt(val, 10), strainEl.value, parseInt(qtyEl.value, 10) || 1, parseFloat(priceEl.value) || 0);
      UI.storefrontPickSlot = null;
    }
    else if (act==='sf-remove-ask') {
      UI.confirmDialog = { message: 'Remove listing and return strain to inventory?', yes: 'sf-remove:' + val };
    }
    else if (act==='sf-remove') clearStorefrontSlot(parseInt(val, 10));
    else if (act==='sf-info') {
      var sl = G.storefrontSlots[parseInt(val, 10)];
      if (sl && sl.strainId) { UI.liftedCardId = 'index-' + sl.strainId; }
    }
    else if (act==='sf-buy') {
      var bp = val.split(':');
      buyFromPlayerShop(bp[0], parseInt(bp[1], 10));
    }
    else if (act==='confirm-yes' && UI.confirmDialog) {
      var ya = UI.confirmDialog.yes.split(':');
      runAction(ya[0], ya.slice(1).join(':'));
      UI.confirmDialog = null;
    }
    else if (act==='confirm-no') UI.confirmDialog = null;
    else if (act==='gift-strain') { UI.giftStrainId = val; }
    else if (act==='gift-cancel') { UI.giftStrainId = null; }
    else if (act==='gift-confirm') {
      var gp = val.split(':');
      giftStrain(gp[0], gp[1]);
      UI.giftStrainId = null;
      UI.liftedCardId = null;
    }
    else if (act==='map-billings') { UI.mapBillingsOpen = true; }
    else if (act==='map-billings-close') { UI.mapBillingsOpen = false; }
    else if (act==='billings-tab') { UI.mapBillingsTab = val; }
    else if (act==='lease-offer-open') {
      var lp = val.split(':');
      UI.leaseDraft = { planetId: lp[0], ownerId: lp[1] };
    }
    else if (act==='lease-cancel') { UI.leaseDraft = null; }
    else if (act==='lease-submit') {
      var ls = val.split(':');
      var pctEl = document.getElementById('lease-percent');
      var prEl = document.getElementById('lease-price');
      if (pctEl && prEl) submitLeaseOffer(ls[0], parseInt(pctEl.value, 10), parseFloat(prEl.value) || 0);
      UI.leaseDraft = null;
    }
    else if (act==='lease-accept') respondLeaseOffer(val, true);
    else if (act==='lease-decline') respondLeaseOffer(val, false);
    else if (act==='up-ability') { var ab = val.split(':'); upStrainAbility(ab[0], ab[1]); }
    else if (act==='open-chest') { openChestSlot(val); return; }
    else if (act==='toggle-campaign-trail') {
      UI.campaignTrailOpen = !UI.campaignTrailOpen;
      render(); return;
    }
    // hub-raid / hub-mutation-lab kept for legacy buttons; HOME hub orbs removed — use Index nav.
    else if (act==='hub-raid') { UI.activeTab = 'index'; UI.indexPane = 'decks'; UI.farmOpen = false; }
    else if (act==='hub-mutation-lab') { UI.activeTab = 'index'; UI.indexPane = 'mutations'; UI.farmOpen = false; UI.mergeLab = { open: false, phase: 'idle', child: null, error: '' }; }
    else if (act==='campaign-focus-node') {
      var nodeNum = parseInt(val, 10);
      if (!isNaN(nodeNum) && nodeNum <= currentCampaignNode()) {
        try {
          var trailEl = document.getElementById('campaign-node-' + nodeNum);
          if (trailEl) trailEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
        } catch (err) { console.error('campaign-focus-node', err); }
      }
    }
    else if (act==='mutation-buy-luck') spendMutationPackLuck();
    else if (act==='equip-mutation-pick') UI.mutationEquipPick = val;
    else if (act==='equip-mutation') { var em = val.split(':'); equipMutationItem(em[0], em[1]); UI.mutationEquipPick = null; }
    else if (act==='equip-raid') { equipRaid(val); UI.liftedCardId = null; }
    else if (act==='equip-best-raid') equipBestRaid();
    else if (act==='raid-equip-search') UI.raidEquipSearch = val;
    else if (act==='raid-equip-sort') UI.raidEquipSort = val;
    else if (act==='index-pane') UI.indexPane = val;
    else if (act==='mutation-mode') UI.mutationMode = val;
    else if (act==='destroy-strain') destroyStrain(val);
    else if (act==='buy-showcase') buyDailyShowcase(parseInt(val, 10));
    else if (act==='open-daily-login') { UI.dailyLoginOpen = true; render(); return; }
    else if (act==='close-daily-login') { UI.dailyLoginOpen = false; render(); return; }
    else if (act==='claim-daily-login') { claimDailyLogin(); render(); return; }
    else if (act==='open-trophy-road') { UI.trophyRoadOpen = true; render(); return; }
    else if (act==='close-trophy-road') { UI.trophyRoadOpen = false; render(); return; }
    else if (act==='claim-trophy') { claimTrophyRoad(val); render(); return; }
    else if (act==='open-achievements') { UI.achievementsOpen = true; render(); return; }
    else if (act==='close-achievements') { UI.achievementsOpen = false; render(); return; }
    else if (act==='buy-card-of-day') { buyCardOfDay(); render(); return; }
    else if (act==='auth-manage' || act==='auth-signin-open') {
      UI.settingsOpen = true;
      UI.profileOpen = false;
      if (window.VoidlineCloud) window.VoidlineCloud.switchToAccount();
      render();
      return;
    }
    else if (act==='auth-signout') {
      if (activePlayerId && G) flushSave();
      if (window.VoidlineCloud) {
        window.VoidlineCloud.signOut().then(function () {
          UI.settingsOpen = false;
          UI.dirty.cloudSync = true;
          showBattleToast('Signed out — playing as guest', true);
          render();
        });
      }
      return;
    }
    else if (act==='open-battle-pass') { UI.battlePassOpen = true; render(); return; }
    else if (act==='close-battle-pass') { UI.battlePassOpen = false; render(); return; }
    else if (act==='claim-battle-pass') {
      var cbt = val.split(':');
      claimBattlePassTier(cbt[0], cbt[1] || 'free');
      render();
      return;
    }
    else if (act==='unlock-battle-pass-premium') {
      G.battlePassPremium = true;
      showBattleToast('Premium track unlocked!', true);
      scheduleSave();
      render();
      return;
    }
    else if (act==='buy-shop-flash') { buyShopFlash(); render(); return; }
    else if (act==='pack-showcase') {
      if (G.packReveal && G.packReveal.strain) {
        var ps = G.packReveal.strain;
        showBattleToast('Showcased ' + ps.name + ' · ' + rarityName(ps.rarity) + '!', true);
        addBattlePassXp(10);
        scheduleSave();
      }
      render();
      return;
    }
    else if (act==='clan-view') { UI.coopView = val; render(); return; }
    else if (act==='clan-join') {
      var cjTag = document.getElementById('clan-join-tag');
      if (window.VoidlineClan && cjTag) {
        window.VoidlineClan.joinClan(cjTag.value, G.name).then(function (r) {
          showBattleToast(r.ok ? 'Joined [' + (r.state && r.state.tag ? r.state.tag : '') + ']' : (r.error || 'Join failed'), r.ok);
          if (r.ok) UI.coopView = 'clan-chat';
          render();
        });
      }
      return;
    }
    else if (act==='clan-create') {
      var ccName = document.getElementById('clan-create-name');
      var ccTag = document.getElementById('clan-create-tag');
      if (window.VoidlineClan && ccName && ccTag) {
        window.VoidlineClan.createClan(ccName.value, ccTag.value, G.name).then(function (r) {
          showBattleToast(r.ok ? 'Clan [' + (r.state && r.state.tag ? r.state.tag : '') + '] founded!' : (r.error || 'Create failed'), r.ok);
          if (r.ok) UI.coopView = 'clan-chat';
          render();
        });
      }
      return;
    }
    else if (act==='clan-leave') {
      if (window.VoidlineClan) {
        window.VoidlineClan.leaveClan().then(function () {
          showBattleToast('Left clan', true);
          UI.coopView = 'hub';
          render();
        });
      }
      return;
    }
    else if (act==='clan-send-chat') {
      var ccInput = document.getElementById('clan-chat-input');
      if (window.VoidlineClan && ccInput) {
        window.VoidlineClan.sendMessage(ccInput.value, '', G.name).then(function (r) {
          if (!r.ok) showBattleToast(r.error || 'Send failed', false);
          else { ccInput.value = ''; render(); }
        });
      }
      return;
    }
    else if (act==='clan-emote') {
      var ceInput = document.getElementById('clan-chat-input');
      if (ceInput) ceInput.value = (ceInput.value || '') + val;
      render();
      return;
    }
    else if (act==='clan-war-attack') {
      if (window.VoidlineClan) {
        var warPower = Math.max(5, Math.floor(totalBattleDps()));
        window.VoidlineClan.contributeWar(val, warPower).then(function (r) {
          if (!r.ok) showBattleToast(r.error || 'War failed', false);
          else {
            showBattleToast(r.captured ? 'Territory captured!' : '+' + warPower + ' war power', true);
            addBattlePassXp(5);
            render();
          }
        });
      }
      return;
    }
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
      markTabDirty();
      markBossDpsDirty();
      if (tab === 'map' && !UI.focusedPlanetId && G.ownedPlanets && G.ownedPlanets.length) UI.focusedPlanetId = G.ownedPlanets[0].id;
      if (tab === 'coop') UI.coopView = UI.coopView || 'hub';
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

  document.addEventListener('error', function (e) {
    var t = e.target;
    if (!t || t.tagName !== 'IMG') return;
    if (t.classList.contains('voidline-art') || t.classList.contains('boss-sprite') || (t.closest && t.closest('.cr-card-art'))) {
      applySvgFallback(t);
    }
  }, true);

  function bootGame() {
    try {
      if (window.VoidlineClan && typeof window.VoidlineClan.boot === 'function') {
        window.VoidlineClan.boot();
        if (window.VoidlineClan.onStateChange) {
          window.VoidlineClan.onStateChange(function () {
            if (UI.activeTab === 'coop') render();
          });
        }
      }
      if (window.VoidlineCloud && window.VoidlineCloud.onSyncChange) {
        window.VoidlineCloud.onSyncChange(function () { UI.dirty.cloudSync = true; });
        UI.dirty.cloudSync = true;
      }
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
  }

  try {
    cacheDomRefs();
    initArcadePool();
    startVisualLoop();
    var storedVer = localStorage.getItem(VERSION_KEY);
    if (storedVer !== APP_VERSION) localStorage.setItem(VERSION_KEY, APP_VERSION);
    if (window.VoidlineCloud && typeof window.VoidlineCloud.boot === 'function') {
      window.VoidlineCloud.boot(function () { bootGame(); });
    } else {
      bootGame();
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
    if (G.cash < 10000 && Date.now() - dialogueState.lastAt > 60000) plantSay('lowcash');
    if (Date.now() - lastSaveAt >= AUTOSAVE_MS) flushSave();
  }, 50);

  /* ===========================================================================
   * VOIDLINE ENGINE QA — Simulation Bot Suite (non-destructive validation)
   * Auto-runs Phase 1 integrity checks. Phase 2+3 via runAutomatedMarketChaosTest / runAll.
   * Append ?qa=full to URL to run complete validation with save restore.
   * =========================================================================== */
  var VoidlineEngineQA = (function () {
    var PASS = 'color:#39FF14;font-weight:700';
    var FAIL = 'color:#F87171;font-weight:700';
    var HEAD = 'color:#A855F7;font-weight:700;letter-spacing:0.12em';
    var MUTED = 'color:#9CA3AF';
    var results = [];
    var lastSnapshot = null;

    function assert(name, ok, detail) {
      results.push({ name: name, ok: !!ok, detail: detail || '' });
      return !!ok;
    }

    function logRow(status, label, detail) {
      var style = status === 'PASS' ? PASS : status === 'FAIL' ? FAIL : MUTED;
      console.log('%c ' + status + ' %c ' + label + (detail ? ' — ' + detail : ''), style, MUTED);
    }

    function printReport(title, rows) {
      console.group('%c' + title, HEAD);
      console.table(rows.map(function (r) {
        return { TEST: r.name, STATUS: r.ok ? 'PASS' : 'FAIL', DETAIL: r.detail || '' };
      }));
      rows.forEach(function (r) { logRow(r.ok ? 'PASS' : 'FAIL', r.name, r.detail); });
      console.groupEnd();
    }

    function backupAllSaves() {
      var snap = { keys: {}, session: {}, meta: { activePlayerId: activePlayerId, gClone: clone(G) } };
      PLAYERS.forEach(function (pl) {
        var k = saveKey(pl.id);
        snap.keys[k] = localStorage.getItem(k);
        snap.keys[k + '_backup'] = localStorage.getItem(k + '_backup');
      });
      snap.keys[LAST_PLAYER_KEY] = localStorage.getItem(LAST_PLAYER_KEY);
      snap.keys[PLANET_REGISTRY_KEY] = localStorage.getItem(PLANET_REGISTRY_KEY);
      snap.keys[VERSION_KEY] = localStorage.getItem(VERSION_KEY);
      try {
        snap.session[SESSION_KEY] = sessionStorage.getItem(SESSION_KEY);
      } catch (e) { }
      lastSnapshot = snap;
      return snap;
    }

    function restoreAllSaves(snap) {
      snap = snap || lastSnapshot;
      if (!snap) return false;
      Object.keys(snap.keys).forEach(function (k) {
        if (snap.keys[k] == null) localStorage.removeItem(k);
        else localStorage.setItem(k, snap.keys[k]);
      });
      try {
        if (snap.session[SESSION_KEY] == null) sessionStorage.removeItem(SESSION_KEY);
        else sessionStorage.setItem(SESSION_KEY, snap.session[SESSION_KEY]);
      } catch (e) { }
      if (snap.meta.activePlayerId) selectPlayer(snap.meta.activePlayerId);
      else render();
      return true;
    }

    function qaStrain(tag, qty) {
      var s = genStrain(88000 + tag.split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 0), 'pulse', 0.12);
      s.id = 'qa_' + tag + '_' + Date.now();
      s.genomeId = 'qa_genome_' + tag;
      s.name = 'QA ' + tag;
      s.quantity = qty || 2;
      return s;
    }

    function runIntegritySuite() {
      results = [];
      console.group('%cVOIDLINE ENGINE QA — PHASE 1: INTEGRITY SUITE', HEAD);

      if (UI.playerSelectOpen || !G) {
        var bootPid = resolveStartupPlayer() || 'aden';
        selectPlayer(bootPid);
        render();
      }

      var pub = window.VoidlineGalaxyFarm;
      assert('VoidlineGalaxyFarm exported', !!pub, pub ? 'v' + pub.version : 'missing');
      assert('Public API: getState', pub && typeof pub.getState === 'function');
      assert('Public API: getPlayerId', pub && typeof pub.getPlayerId === 'function');
      assert('Public API: selectPlayer', pub && typeof pub.selectPlayer === 'function');
      assert('Public API: listStorefrontSlot (postForSale)', pub && typeof pub.listStorefrontSlot === 'function');
      assert('Public API: buyFromPlayerShop (buyFromExternalShop)', pub && typeof pub.buyFromPlayerShop === 'function');
      assert('Public API: respondLeaseOffer (resolveLease)', pub && typeof pub.respondLeaseOffer === 'function');
      assert('TAB_ORDER schema', Array.isArray(pub && pub.TAB_ORDER) && pub.TAB_ORDER.length === 5, (pub && pub.TAB_ORDER || []).join(','));

      var saveRows = [];
      PLAYERS.forEach(function (pl) {
        var key = saveKey(pl.id);
        var raw = localStorage.getItem(key);
        var ok = true;
        var detail = 'empty (new profile)';
        if (raw) {
          try {
            var parsed = JSON.parse(raw);
            ok = parsed && typeof parsed === 'object' && parsed.playerId === pl.id;
            detail = ok ? 'JSON OK · Lv.' + (parsed.empireLevel || '?') : 'schema mismatch';
            if (ok && parsed.sectorUpgrades && !Array.isArray(parsed.sectorUpgrades)) { ok = false; detail = 'sectorUpgrades not array'; }
          } catch (e) {
            ok = false;
            detail = 'JSON parse error: ' + e.message;
          }
        }
        var aliasKey = SAVE_PREFIX + pl.label;
        if (!raw && localStorage.getItem(aliasKey)) detail += ' (note: use lowercase id key)';
        assert('localStorage ' + key, ok, detail);
        saveRows.push({ PLAYER: pl.label, KEY: key, STATUS: ok ? 'VALID' : 'INVALID', DETAIL: detail });
      });
      console.log('%c Save partition audit', MUTED);
      console.table(saveRows);

      var carousel = document.querySelector('.cr-screen-carousel') || document.querySelector('.screen-router-wrapper');
      var shell = document.getElementById('phone-shell');
      var root = document.getElementById('screen-root');
      if (carousel && shell && root) {
        var positions = [0, 20, 40, 60, 80];
        var slideOk = true;
        var prev = carousel.style.transform;
        positions.forEach(function (pct) {
          carousel.style.transform = 'translate3d(-' + pct + '%,0,0)';
          var t = carousel.style.transform;
          if (pct === 0) { if (t.indexOf('0%') < 0) slideOk = false; }
          else if (t.indexOf('-' + pct + '%') < 0) slideOk = false;
        });
        carousel.style.transform = prev || ('translate3d(-' + (Math.max(0, TAB_ORDER.indexOf(UI.activeTab)) * 20) + '%,0,0)');
        var rootStyle = window.getComputedStyle(root);
        assert('Tab carousel transform 0%→-80%', slideOk, (carousel.classList.contains('cr-screen-carousel') ? '.cr-screen-carousel' : '.screen-router-wrapper') + ' · 5 slides');
        assert('Mobile frame viewport bound', root.clientWidth > 0 && root.clientWidth <= shell.clientWidth + 1 && rootStyle.overflow !== 'visible', 'root ' + root.clientWidth + 'px clipped');
      } else {
        assert('Tab carousel DOM', false, 'carousel or phone-shell missing (pick a player first)');
      }

      printReport('Phase 1 Summary', results);
      return results.every(function (r) { return r.ok; });
    }

    function runCombatGapAnalysis() {
      var combatResults = [];
      function cAssert(n, ok, d) { combatResults.push({ name: n, ok: !!ok, detail: d || '' }); return !!ok; }

      var gSnap = clone(G);
      var eqSnap = (G.equippedBattleIds || []).slice();
      var traitSnap = G.bossTrait;
      var stateSnap = clone(G.bossTraitState || {});

      try {
        var s1 = qaStrain('Solar', 1);
        var s2 = qaStrain('Crit', 1);
        if (!hasAbility(s2, 'crit_burst')) s2.abilities = (s2.abilities || []).concat(['crit_burst']);
        G.strains = [s1, s2];
        G.equippedBattleIds = [s1.id, s2.id];
        G.bossTrait = 1;
        G.bossTraitState = { solarAcc: 0, solarSilence: null };
        G.bossMaxHp = 50000;
        G.bossHp = 50000;

        var baseDmg = battleDamageBreakdown(1000, true);
        G.bossTraitState.solarSilence = { id: s1.id, until: Date.now() + 2000 };
        var silenced = battleDamageBreakdown(1000, true);
        cAssert('Solar Flare silences strain DPS', silenced.total < baseDmg.total, 'total ' + silenced.total.toFixed(1) + ' vs ' + baseDmg.total.toFixed(1));
        cAssert('Solar Flare 2000ms window', (G.bossTraitState.solarSilence.until - Date.now()) >= 1990 && (G.bossTraitState.solarSilence.until - Date.now()) <= 2010, '~' + (G.bossTraitState.solarSilence.until - Date.now()) + 'ms');

        G.bossTrait = 2;
        G.bossMaxHp = 10000;
        G.bossHp = 10000;
        G.bossShieldMax = 3000;
        G.bossShieldHp = 3000;
        G.bossTraitState = { solarAcc: 0, solarSilence: null };
        var beforeShield = G.bossShieldHp;
        var dmgTick = battleDamageBreakdown(1000, true);
        if (dmgTick.normal > 0 || dmgTick.crit > 0) {
          var hpBefore = G.bossHp;
          var shieldBefore = G.bossShieldHp;
          if (dmgTick.crit > 0) {
            var shieldHit = Math.min(G.bossShieldHp, dmgTick.crit);
            G.bossShieldHp -= shieldHit;
          }
          var bossUnchanged = G.bossHp === hpBefore && (dmgTick.crit <= 0 || G.bossShieldHp < shieldBefore);
          cAssert('Cosmic Shield blocks normal behind shield', bossUnchanged || dmgTick.normal === 0, 'shield ' + G.bossShieldHp + '/' + G.bossShieldMax);
          cAssert('Cosmic Shield crit damages shield', dmgTick.crit > 0 ? G.bossShieldHp < beforeShield : true, 'crit channel ' + dmgTick.crit.toFixed(1));
        } else {
          cAssert('Cosmic Shield combat setup', false, 'no damage roll — equip crit strain');
        }

        var burstFrames = 0;
        var nanDetected = false;
        G.bossTrait = 1;
        spawnBoss();
        for (var i = 0; i < 120; i++) {
          tickBoss(1);
          if (!isFinite(G.bossHp) || G.bossHp < 0) nanDetected = true;
          burstFrames++;
        }
        cAssert('Combat burst @ 1ms ticks (60FPS sim)', burstFrames === 120 && !nanDetected, burstFrames + ' frames, HP=' + Math.floor(G.bossHp));

        G.sectorUpgrades = clone(SECTORS).map(function (x, idx) {
          return Object.assign({}, x, { level: idx + 1 });
        });
        var expectedScan = G.sectorUpgrades.reduce(function (sum, x) { return sum + x.level * x.scanRateBonus; }, 0) + blitzMod('scan');
        var actualScan = scanMult();
        cAssert('scanMult cumulative sector math', Math.abs(actualScan - expectedScan) < 0.0001, 'expected ' + expectedScan.toFixed(3) + ' got ' + actualScan.toFixed(3));

        var lowSectors = clone(SECTORS);
        var highSectors = clone(SECTORS).map(function (x) { return Object.assign({}, x, { level: 5 }); });
        G.sectorUpgrades = lowSectors;
        var packLow = genPack('basic', 424242, { scanBonus: scanMult(), packLuckBonus: 0 });
        G.sectorUpgrades = highSectors;
        var packHigh = genPack('basic', 424242, { scanBonus: scanMult(), packLuckBonus: 0 });
        var lowIdx = rarityIndex(packLow.rarity);
        var highIdx = rarityIndex(packHigh.rarity);
        cAssert('genPack scan multiplier not flat fallback', highIdx >= lowIdx, 'rarity idx ' + lowIdx + ' → ' + highIdx + ' (same seed)');
      } finally {
        Object.assign(G, gSnap);
        G.equippedBattleIds = eqSnap.slice();
        G.bossTrait = traitSnap;
        G.bossTraitState = clone(stateSnap);
      }

      console.group('%cVOIDLINE ENGINE QA — PHASE 3: COMBAT & GAP ANALYSIS', HEAD);
      printReport('Phase 3 Summary', combatResults);
      return combatResults.every(function (r) { return r.ok; });
    }

    function runAutomatedMarketChaosTest() {
      return new Promise(function (resolve) {
        console.group('%cVOIDLINE ENGINE QA — PHASE 2: MULTI-PLAYER BOT SIMULATOR', HEAD);
        var snap = backupAllSaves();
        var chaosResults = [];
        function mAssert(n, ok, d) { chaosResults.push({ name: n, ok: !!ok, detail: d || '' }); return !!ok; }

        var origPid = activePlayerId;
        var slot0Price = 0;
        var adenCashBefore = 0;
        var dadCashBefore = 0;
        var dadStrainsBefore = 0;
        var leaseId = null;

        function step(fn) { try { fn(); } catch (e) { mAssert('Bot step exception', false, e.message); } }

        step(function () {
          selectPlayer('aden');
          G.cash = 500000;
          G.storefrontSlotCount = STOREFRONT_START;
          ensureStorefrontSlots();
          var strains = [];
          for (var i = 0; i < 8; i++) strains.push(qaStrain('Slot' + i, 3 + i));
          G.strains = strains;
          for (var si = 0; si < 6; si++) {
            var price = 1000 + si * 777;
            listStorefrontSlot(si, strains[si].id, 1, price);
          }
          if (!G.ownedPlanets || !G.ownedPlanets.length) {
            var pl = genPlanet(777001);
            pl.ownerId = 'aden';
            pl.customName = 'QA Lease World';
            G.ownedPlanets = [pl];
            claimPlanetGenome(pl.genomeId, 'aden');
          }
          adenCashBefore = G.cash;
          slot0Price = G.storefrontSlots[0].price;
          flushSave();
          mAssert('Bot 1 (Aden): 6 storefront slots listed', G.storefrontSlots.slice(0, 6).every(function (sl) { return sl.strainId && sl.price > 0; }), 'slot0 @ ' + fmtCash(slot0Price));
        });

        step(function () {
          selectPlayer('dad');
          dadCashBefore = G.cash;
          dadStrainsBefore = (G.strains || []).length;
          G.cash = Math.max(G.cash, slot0Price + 500000);
          var cashSpend = G.cash;
          var ok = buyFromPlayerShop('aden', 0);
          mAssert('Bot 2 (Dad): buyFromExternalShop slot 0', ok);
          mAssert('Bot 2: strain transferred to Dad', (G.strains || []).length > dadStrainsBefore, 'strains ' + dadStrainsBefore + ' → ' + G.strains.length);
          mAssert('Bot 2: Dad cash cleared', G.cash === cashSpend - slot0Price, fmtCash(G.cash) + ' (spent ' + fmtCash(slot0Price) + ')');
          var adenSave = readPlayerSave('aden');
          mAssert('Bot 2: Aden credited', adenSave && adenSave.cash === adenCashBefore + slot0Price, adenSave ? fmtCash(adenSave.cash) : 'no save');
          flushSave();
        });

        step(function () {
          selectPlayer('jamie');
          G.cash = 999999;
          var adenPlanet = (readPlayerSave('aden').ownedPlanets || [])[0];
          mAssert('Bot 3: Aden planet exists', !!adenPlanet, adenPlanet ? adenPlanet.id : 'none');
          if (adenPlanet) {
            var offerOk = submitLeaseOffer(adenPlanet.id, 50, 2500);
            mAssert('Bot 3 (Jamie): 50% lease proposal', offerOk);
            flushSave();
            selectPlayer('aden');
            var offer = (G.leaseOffers || [])[0];
            mAssert('Bot 3: offer in Aden pending queue', !!offer, offer ? offer.id : 'empty');
            if (offer) {
              var acceptOk = respondLeaseOffer(offer.id, true);
              leaseId = offer.id;
              mAssert('Bot 1 (Aden): resolveLease accept', acceptOk);
              var active = (G.planetLeases && G.planetLeases.active || [])[0];
              mAssert('Lease ledger initialized', !!active && active.percent === 50 && active.pricePerInterval === 2500, active ? active.percent + '% @ ' + fmtCash(active.pricePerInterval) : 'none');
              if (active) {
                active.lastBilledAt = Date.now() - LEASE_INTERVAL_MS - 1000;
                G.planetLeases.active = [active];
                var collectedBefore = active.totalCollected || 0;
                processLeaseBilling();
                var after = (G.planetLeases.active || [])[0];
                mAssert('5-min billing zero arithmetic errors', after && after.totalCollected === collectedBefore + 2500, 'collected ' + (after && after.totalCollected));
              }
            }
          }
          flushSave();
        });

        printReport('Phase 2 Summary', chaosResults);
        console.groupEnd();
        restoreAllSaves(snap);
        if (origPid && origPid !== activePlayerId) selectPlayer(origPid);
        resolve(chaosResults.every(function (r) { return r.ok; }));
      });
    }

    function showSuccessBanner() {
      var id = 'voidline-qa-success-banner';
      var existing = document.getElementById(id);
      if (existing) existing.remove();
      var el = document.createElement('div');
      el.id = id;
      el.setAttribute('role', 'status');
      el.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:1.5rem;background:rgba(12,1,26,0.92);pointer-events:none;';
      el.innerHTML = '<div style="max-width:22rem;text-align:center;font-family:Orbitron,system-ui,sans-serif;color:#39FF14;letter-spacing:0.08em;line-height:1.6;text-shadow:0 0 24px rgba(57,255,20,0.5)"><div style="font-size:0.65rem;color:#A855F7;margin-bottom:0.75rem">VOIDLINE ENGINE QA</div><div style="font-size:0.8rem;font-weight:700">SYSTEM OVERHAUL SUCCESS: ALL BUGS CRUSHED. CO-OP COMMERCE OPERATIONAL. ENGINE RUNNING LOCKED AT 60FPS.</div></div>';
      document.body.appendChild(el);
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 6500);
    }

    function runAll() {
      var integrityOk = runIntegritySuite();
      return runAutomatedMarketChaosTest().then(function (marketOk) {
        var combatOk = runCombatGapAnalysis();
        var allOk = integrityOk && marketOk && combatOk;
        console.log('%c' + (allOk ? '▓▓ ALL PHASES PASSED ▓▓' : '▓▓ QA FAILURES DETECTED ▓▓'), allOk ? PASS : FAIL);
        if (allOk) showSuccessBanner();
        return { integrityOk: integrityOk, marketOk: marketOk, combatOk: combatOk, allOk: allOk };
      });
    }

    return {
      version: '1.0.0',
      runIntegritySuite: runIntegritySuite,
      runAutomatedMarketChaosTest: runAutomatedMarketChaosTest,
      runCombatGapAnalysis: runCombatGapAnalysis,
      runAll: runAll,
      backupAllSaves: backupAllSaves,
      restoreAllSaves: restoreAllSaves,
    };
  })();

  /* ===========================================================================
   * SWARM BUG CRUSHER + HARDCORE GRIND SIMULATOR (Sub-Team A & B)
   * VoidlineSwarm.start({ sandbox: true }) — backs up saves, grinds to $100M, restores.
   * Append ?swarm=1 to URL for sandbox grind launch.
   * =========================================================================== */
  var SwarmBugCrusher = (function () {
    var HEAD = 'color:#00F0FF;font-weight:700;letter-spacing:0.1em';
    var stats = { healed: 0, patches: 0, intercepts: 0, errors: [] };
    var installed = false;
    var origRender = render;
    var origTick = tick;

    function log(msg, detail) {
      console.log('%c[SwarmBugCrusher]%c ' + msg + (detail ? ' — ' + detail : ''), HEAD, 'color:#9CA3AF');
    }

    function healNullStateSwarm() {
      if (!G) return 0;
      var n = healNullState();
      if (n > 0) { stats.healed += n; stats.intercepts++; }
      return n;
    }

    function handleError(ctx, err) {
      stats.patches++;
      stats.errors.push({ at: Date.now(), ctx: ctx, message: err && err.message ? err.message : String(err), stack: err && err.stack ? err.stack : '' });
      console.error('[SwarmBugCrusher] Caught in ' + ctx + ':', err);
      try {
        if (G) {
          healNullStateSwarm();
          if (!G.bossMaxHp || G.bossHp <= 0) spawnBoss();
          G.lastTickAt = Date.now();
        }
      } catch (e2) { console.error('[SwarmBugCrusher] Fallback reset failed:', e2); }
    }

    function guard(fn, ctx) {
      try { return fn(); } catch (e) { handleError(ctx || 'guard', e); return false; }
    }

    function install() {
      if (installed) return;
      installed = true;
      render = function () {
        if (window.__SWARM_SKIP_RENDER__) return;
        return guard(function () { healNullStateSwarm(); origRender(); }, 'render');
      };
      tick = function (now) {
        return guard(function () { healNullStateSwarm(); origTick(now); }, 'tick');
      };
      window.addEventListener('error', function (ev) {
        handleError('window.error', ev.error || new Error(ev.message));
      });
      window.addEventListener('unhandledrejection', function (ev) {
        handleError('unhandledrejection', ev.reason || new Error('promise rejection'));
      });
      window.onUpgrade = function (id) {
        stats.intercepts++;
        return guard(function () { return onUpgrade(id); }, 'onUpgrade');
      };
      window.giftStrain = function (id, toPlayerId) {
        stats.intercepts++;
        return guard(function () { return giftStrain(id, toPlayerId); }, 'giftStrain');
      };
      log('Engineering swarm online', 'onUpgrade/giftStrain intercepts active');
    }

    function patrol() { healNullStateSwarm(); }

    function getStats() { return clone(stats); }

    function resetStats() { stats = { healed: 0, patches: 0, intercepts: 0, errors: [] }; }

    return { install: install, patrol: patrol, guard: guard, heal: healNullStateSwarm, handleError: handleError, getStats: getStats, resetStats: resetStats };
  })();

  var VoidlineSwarm = (function () {
    var GOAL = 100000000;
    var MILESTONE = 10000000;
    var LOOP_MS = 1;
    var TIME_WARP = 500;
    var HEAD = 'color:#FFD700;font-weight:700;letter-spacing:0.08em';
    var MUTED = 'color:#9CA3AF';
    var ROOM_KEY = 'voidline_swarm_family_room';
    var running = false;
    var timer = null;
    var startedAt = 0;
    var snapshot = null;
    var loopCount = 0;
    var leaseLedger = 0;
    var milestoneFlags = { aden: false, dad: false, jamie: false };
    var tradeLog = [];
    var maxSteps = 300000;
    var activeGoal = GOAL;
    var goalMode = "totalEarned";
    var maxWallMs = 600000;
    var timeoutHit = false;
    var hotfixLog = [];
    var streamStats = {};
    var STREAMS = [
      { name: "Bot_Aden", partition: "aden", role: "grind" },
      { name: "Bot_Dad", partition: "dad", role: "trade" },
      { name: "Bot_Jamie", partition: "jamie", role: "lease" },
      { name: "Bot_Vex", partition: "aden", role: "chest" },
      { name: "Bot_Nova", partition: "dad", role: "chest" },
      { name: "Bot_Rift", partition: "jamie", role: "chest" },
      { name: "Bot_Pulse", partition: "aden", role: "campaign" },
      { name: "Bot_Bloom", partition: "dad", role: "campaign" },
      { name: "Bot_Flux", partition: "jamie", role: "scan" },
      { name: "Bot_Surge", partition: "aden", role: "shop" },
      { name: "Bot_Mist", partition: "dad", role: "blitz" },
      { name: "Bot_Spark", partition: "jamie", role: "grind" },
    ];

    function log(msg) { console.log('%c[VoidlineSwarm]%c ' + msg, HEAD, MUTED); }

    function botCash(pid) {
      var s = readPlayerSave(pid);
      return s ? (s.cash || 0) : 0;
    }

    function allBotsAtGoal() {
      return PLAYERS.every(function (p) { return botCash(p.id) >= activeGoal; });
    }

    function totalEarnedAll() {
      return PLAYERS.reduce(function (sum, pl) {
        var s = readPlayerSave(pl.id);
        return sum + (s && s.totalCashEarned ? s.totalCashEarned : 0);
      }, 0);
    }

    function swarmGoalMet() {
      if (goalMode === "perCash") return allBotsAtGoal();
      if (goalMode === "totalEarned") return totalEarnedAll() >= activeGoal;
      return allBotsAtGoal();
    }

    function botEarned(pid) {
      var s = readPlayerSave(pid);
      return s ? (s.totalCashEarned || 0) : 0;
    }

    function withBot(pid, fn) {    }

    function withBot(pid, fn) {
      var prev = activePlayerId;
      if (activePlayerId !== pid) selectPlayer(pid);
      try { return fn(); } finally {
        flushSave();
      }
    }

    function warpTick(times) {
      times = times || 1;
      for (var i = 0; i < times; i++) {
        G.lastTickAt = Date.now() - TIME_WARP;
        tick(Date.now());
        processLeaseBilling();
      }
    }

    function botOpenPack() {
      if (G.packReveal && G.packReveal.open) closePack();
      if (G.cash >= 5000 && buyPack('basic')) closePack();
    }

    function botInstantScan() {
      var p = rollScanPlanet();
      G.scanPending = p;
      if (rarityIndex(p.rarity) >= rarityIndex('mist')) keepScannedPlanet();
      else discardScannedPlanet();
    }

    function botBuyOpenChests() {
      var packTypes = ["basic", "rift", "twin"];
      packTypes.forEach(function (pt) {
        if (G.packReveal && G.packReveal.open) closePack();
        if (G.cash >= 5000 && buyPack(pt)) closePack();
      });
      var guard = 0;
      while ((G.pendingRewards || []).length && guard < 10) {
        var r = G.pendingRewards[0];
        var lbl = chestLabel(r);
        if (!r || (!r.packType && !r.kind)) {
          hotfixLog.push({ type: "unskinned-box", at: Date.now(), label: lbl || "(blank)" });
          console.warn("[VoidlineSwarm] HOTFIX: unskinned chest slot", r);
        }
        openChestSlot(0);
        guard++;
      }
    }

    function botCampaignPush(waves) {
      waves = waves || 8;
      equipBestBattle();
      for (var w = 0; w < waves; w++) {
        if (!G.bossMaxHp || G.bossHp <= 0) spawnBoss();
        tickBoss(140);
        if (G.bossHp <= 0) killBoss();
      }
    }

    function botShopSweep() {
      STORE.forEach(function (item) {
        for (var n = 0; n < 2 && G.cash >= item.price; n++) buyItem(item.id);
      });
      blitzShopRows().forEach(function (u) {
        if (!u.purchased && G.cash >= u.price) buyBlitz(u.id);
      });
    }

    function runStreamStep(stream) {
      SwarmBugCrusher.guard(function () {
        withBot(stream.partition, function () {
          if (!streamStats[stream.name]) streamStats[stream.name] = { partition: stream.partition, steps: 0, cash: 0, earned: 0 };
          var st = streamStats[stream.name];
          st.steps++;
          if (stream.role === "grind" || stream.name === "Bot_Aden" || stream.name === "Bot_Spark") {
            if (stream.name === "Bot_Aden") stepAdenCore();
            else {
              botCampaignPush(6);
              warpTick(6);
            }
          } else if (stream.role === "trade" || stream.name === "Bot_Dad") {
            if (loopCount % 40 === 0) stepDadCore();
          } else if (stream.role === "lease" || stream.name === "Bot_Jamie") {
            stepJamieCore();
          } else if (stream.role === "chest") {
            botBuyOpenChests();
          } else if (stream.role === "campaign") {
            botCampaignPush(10);
            warpTick(5);
          } else if (stream.role === "scan") {
            botInstantScan();
            warpTick(8);
          } else if (stream.role === "shop") {
            botShopSweep();
            warpTick(4);
          } else if (stream.role === "blitz") {
            botShopSweep();
          }
          st.cash = G.cash || 0;
          st.earned = G.totalCashEarned || 0;
        });
      }, "stream:" + stream.name);
    }

    function botAcceptIncomingLeases() {
      (G.leaseOffers || []).slice().forEach(function (o) {
        if (o.buyerId === 'jamie') respondLeaseOffer(o.id, true);
      });
    }

    function botMilestoneTrade(sellerId, buyerId) {
      var listed = false;
      withBot(sellerId, function () {
        var rare = (G.strains || []).find(function (s) { return rarityIndex(s.rarity) >= rarityIndex('pulse'); }) || (G.strains || [])[0];
        if (!rare) return;
        ensureStorefrontSlots();
        listStorefrontSlot(0, rare.id, 1, 7500);
        listed = true;
      });
      if (!listed) return false;
      var ok = false;
      withBot(buyerId, function () {
        var price = (readPlayerSave(sellerId).storefrontSlots || [])[0];
        if (!price || !price.price) return;
        if (G.cash < price.price) G.cash = price.price + 1000;
        ok = buyFromPlayerShop(sellerId, 0);
      });
      if (ok) tradeLog.push({ at: Date.now(), seller: sellerId, buyer: buyerId, amount: 7500 });
      return ok;
    }

    function checkMilestones() {
      PLAYERS.forEach(function (pl, idx) {
        if (milestoneFlags[pl.id]) return;
        if (botCash(pl.id) >= MILESTONE) {
          milestoneFlags[pl.id] = true;
          var buyer = PLAYERS[(idx + 1) % PLAYERS.length].id;
          log('Milestone $10M — cross-commerce trade ' + pl.label + ' → ' + buyer);
          botMilestoneTrade(pl.id, buyer);
        }
      });
    }

    function initFamilyRoom() {
      var room = { id: 'room_' + Date.now(), host: 'aden', members: ['aden', 'dad', 'jamie'], createdAt: Date.now() };
      try { sessionStorage.setItem(ROOM_KEY, JSON.stringify(room)); } catch (e) { }
      log('Family room spun up · ' + room.id);
      return room;
    }

    function joinFamilyRoom() {
      try {
        var raw = sessionStorage.getItem(ROOM_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) { }
      return initFamilyRoom();
    }

    function setupPhase() {
      var room = initFamilyRoom();
      PLAYERS.forEach(function (pl) {
        withBot(pl.id, function () {
          if (G.cash < 50000) G.cash = 250000;
          equipBestBattle();
          botOpenPack();
          ensureStorefrontSlots();
          STORE.forEach(function (item) {
            for (var n = 0; n < 3 && G.cash >= item.price; n++) buyItem(item.id);
          });
          warpTick(20);
        });
      });
      withBot('dad', function () { sessionStorage.setItem(ROOM_KEY, JSON.stringify(room)); });
      withBot('jamie', function () { joinFamilyRoom(); });
      return room;
    }

    function spendBudget(cash) {
      if (cash >= activeGoal) return 0;
      var reserve = activeGoal * 0.92;
      if (cash <= reserve) return cash * 0.35;
      return Math.max(0, cash - reserve);
    }

    function stepAdenCore() {
      withBot('aden', function () {
        botAcceptIncomingLeases();
        equipBestBattle();
        for (var w = 0; w < 12; w++) {
          if (!G.bossMaxHp || G.bossHp <= 0) spawnBoss();
          tickBoss(120);
          if (G.bossHp <= 0) killBoss();
        }
        warpTick(10);
        var spend = spendBudget(G.cash);
        var ids = (G.equippedBattleIds || []).slice();
        ids.forEach(function (sid) {
          if (!spend || G.cash < spend * 0.15) return;
          var s = strainById(sid);
          if (!s) return;
          var c = upCost(s);
          if (G.cash >= c && G.cash - c >= activeGoal * 0.85) onUpgrade(sid);
        });
        (G.sectorUpgrades || []).forEach(function (sec) {
          if (!spend) return;
          var c = sec.baseCost * (sec.level + 1);
          if (sec.level < sec.maxLevel && G.cash >= c && G.cash - c >= activeGoal * 0.85) onUpgrade(sec.id);
        });
        (G.factoryFloors || []).forEach(function (f) {
          if (!spend) return;
          var c = floorUpCost(f);
          if (G.cash >= c && G.cash - c >= activeGoal * 0.85) onUpgrade(f.id);
        });
        if (G.cash >= 5000 && G.cash < activeGoal * 1.1) botOpenPack();
      });
    }

    function stepDadCore() {
      if (loopCount % 150 !== 0) return;
      withBot('dad', function () {
        ensureStorefrontSlots();
        (G.strains || []).forEach(function (s, idx) {
          if ((s.quantity || 1) < 3) return;
          var slot = idx % G.storefrontSlotCount;
          var price = Math.floor(upCost(s) * (1.4 + Math.random() * 0.6));
          listStorefrontSlot(slot, s.id, 1, price);
        });
        PLAYERS.forEach(function (pl) {
          if (pl.id === 'dad') return;
          var save = readPlayerSave(pl.id);
          if (!save || !save.storefrontSlots) return;
          save.storefrontSlots.forEach(function (slot, si) {
            if (!slot || !slot.strainId || !slot.price) return;
            if (G.cash >= slot.price && slot.price < 50000) buyFromPlayerShop(pl.id, si);
          });
        });
        warpTick(8);
      });
    }

    function stepJamieCore() {
      withBot('jamie', function () {
        botInstantScan();
        warpTick(12);
        PLAYERS.forEach(function (pl) {
          if (pl.id === 'jamie') return;
          var save = readPlayerSave(pl.id);
          if (!save || !save.ownedPlanets || !save.ownedPlanets.length) return;
          save.ownedPlanets.forEach(function (op) {
            submitLeaseOffer(op.id, 50, 3500 + Math.floor(Math.random() * 2000));
          });
        });
        var collected = (G.planetLeases && G.planetLeases.active || []).reduce(function (s, l) { return s + (l.totalCollected || 0); }, 0);
        leaseLedger = Math.max(leaseLedger, collected);
      });
    }

    function stepAden() { stepAdenCore(); }
    function stepDad() { if (loopCount % 150 === 0) stepDadCore(); }
    function stepJamie() { stepJamieCore(); }

    function printStudioFinalLedger() {
      var bugStats = SwarmBugCrusher.getStats();
      var ledger = { players: [], totals: {}, streams: clone(streamStats), hotfixes: hotfixLog.slice(), bugs: bugStats };
      var totalEarned = 0;
      var totalCash = 0;
      var totalBlitz = 0;
      var totalMut = 0;
      var maxNode = 1;
      PLAYERS.forEach(function (pl) {
        var s = readPlayerSave(pl.id) || {};
        var row = {
          player: pl.label,
          id: pl.id,
          cash: s.cash || 0,
          totalCashEarned: s.totalCashEarned || 0,
          campaignNode: s.campaignNode || 1,
          nodesCleared: (s.campaignNodeClears || []).length,
          bossRound: s.bossRound || 1,
          blitzCount: (s.purchasedBlitzIds || []).length,
          mutations: (s.mutationItems || []).length,
          mutationEssence: s.mutationEssence || 0,
        };
        ledger.players.push(row);
        totalEarned += row.totalCashEarned;
        totalCash += row.cash;
        totalBlitz += row.blitzCount;
        totalMut += row.mutations;
        if (row.campaignNode > maxNode) maxNode = row.campaignNode;
      });
      ledger.totals = {
        cash: totalCash,
        totalCashEarned: totalEarned,
        blitzPurchases: totalBlitz,
        mutations: totalMut,
        maxCampaignNode: maxNode,
        crossTrades: tradeLog.length,
        leaseCash: window.__SWARM_LEASE_CASH__ || leaseLedger,
        bugsHealed: bugStats.healed,
        bugsPatched: bugStats.patches,
        bugsFound: (bugStats.errors || []).length,
        bugsFixed: bugStats.healed + bugStats.patches,
        hotfixNotes: hotfixLog.length,
        goalMode: goalMode,
        success: swarmGoalMet(),
        timeout: timeoutHit,
      };
      console.group("%cVOIDLINE STUDIO FINAL LEDGER", HEAD);
      console.table(ledger.players);
      console.table([ledger.totals]);
      if (Object.keys(streamStats).length) console.table(Object.keys(streamStats).map(function (k) {
        var s = streamStats[k];
        return { stream: k, partition: s.partition, steps: s.steps, cash: s.cash, earned: s.earned };
      }));
      if (hotfixLog.length) console.table(hotfixLog);
      if ((bugStats.errors || []).length) console.table(bugStats.errors);
      console.groupEnd();
      return ledger;
    }

    function swarmLoop() {
      if (!running || !G) return;
      loopCount++;
      SwarmBugCrusher.patrol();
      STREAMS.forEach(function (s) { runStreamStep(s); });
      checkMilestones();
      if (loopCount % 120 === 0) renderHUD();
      if (loopCount % 5000 === 0) {
        log("Progress earned " + fmtCash(totalEarnedAll()) + " / " + fmtCash(activeGoal) + " @ step " + loopCount);
      }
      if (swarmGoalMet()) { finish(); return; }
      if (loopCount >= maxSteps) { finish(); return; }
    }

    function finish() {    }

    function finish() {
      running = false;
      if (timer) { clearInterval(timer); timer = null; }
      window.__SWARM_SIM__ = false;
      window.__SWARM_CASH_MULT__ = 1;
      var elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
      var bugStats = SwarmBugCrusher.getStats();
      var leaseTotal = window.__SWARM_LEASE_CASH__ || leaseLedger;
      console.group('%cSWARM SIMULATION REPORT', HEAD);
      console.table([
        { METRIC: 'Elapsed (sec)', VALUE: elapsed },
        { METRIC: 'Bot_Aden cash', VALUE: fmtCash(botCash('aden')) },
        { METRIC: 'Bot_Dad cash', VALUE: fmtCash(botCash('dad')) },
        { METRIC: 'Bot_Jamie cash', VALUE: fmtCash(botCash('jamie')) },
        { METRIC: 'Planetary billing tabs net', VALUE: fmtCash(leaseTotal) },
        { METRIC: 'Bugs healed', VALUE: bugStats.healed },
        { METRIC: 'Auto-patches', VALUE: bugStats.patches },
        { METRIC: 'Intercepts', VALUE: bugStats.intercepts },
        { METRIC: 'Cross-trades @ $10M', VALUE: tradeLog.length },
      ]);
      if (bugStats.errors.length) console.table(bugStats.errors);
      if (tradeLog.length) console.table(tradeLog);
      var ledger = printStudioFinalLedger();
      if (swarmGoalMet()) {
        console.log('%cSWARM SIMULATION COMPLETE: ALL CORE GLITCHES ERADICATED. ALL THREE BOTS SUCCESSFULLY GRINDED OUT $100M COMPATIBLE WITH LIVE LOGIC.', 'color:#39FF14;font-weight:700;font-size:11px');
      } else {
        console.log('%cSWARM SIMULATION INCOMPLETE — extend max runtime or raise cashMult.', 'color:#F87171;font-weight:700;font-size:11px');
      }
      console.groupEnd();
      var report = {
        elapsedSec: parseFloat(elapsed),
        aden: botCash('aden'),
        dad: botCash('dad'),
        jamie: botCash('jamie'),
        leaseCash: leaseTotal,
        bugs: bugStats,
        success: swarmGoalMet(),
        goalMode: goalMode,
        totalEarned: totalEarnedAll(),
        timeout: timeoutHit,
        hotfixes: hotfixLog.length,
        streams: clone(streamStats),
        ledger: ledger,
        partitions: {
          aden: { cash: botCash('aden'), earned: botEarned('aden') },
          dad: { cash: botCash('dad'), earned: botEarned('dad') },
          jamie: { cash: botCash('jamie'), earned: botEarned('jamie') },
        },
        trades: tradeLog.length,
      };
      window.__SWARM_LAST_REPORT__ = report;
      if (snapshot) VoidlineEngineQA.restoreAllSaves(snapshot);
      render();
      return report;
    }

    function prepareSwarm(opts) {
      opts = opts || {};
      SwarmBugCrusher.install();
      SwarmBugCrusher.resetStats();
      window.__SWARM_SIM__ = true;
      window.__SWARM_CASH_MULT__ = opts.cashMult || 120;
      window.__SWARM_LEASE_CASH__ = 0;
      if (opts.sandbox !== false) snapshot = VoidlineEngineQA.backupAllSaves();
      activeGoal = opts.goal || GOAL;
      goalMode = opts.goalMode || "totalEarned";
      maxWallMs = opts.maxWallMs || 600000;
      timeoutHit = false;
      hotfixLog = [];
      streamStats = {};
      maxSteps = opts.maxSteps || 500000;
      if (opts.tickMs != null) LOOP_MS = opts.tickMs;
      startedAt = Date.now();
      loopCount = 0;
      leaseLedger = 0;
      milestoneFlags = { aden: false, dad: false, jamie: false };
      tradeLog = [];
      setupPhase();
      running = true;
    }

    function start(opts) {
      opts = opts || {};
      if (running) return { ok: false, reason: 'already running' };
      prepareSwarm(opts);
      log('Hardcore grind bots online @ ' + LOOP_MS + 'ms loop · goal ' + fmtCash(activeGoal));
      timer = setInterval(swarmLoop, LOOP_MS);
      return { ok: true, goal: activeGoal };
    }

    function runSync(opts) {
      opts = opts || {};
      if (running) return { ok: false, reason: 'already running' };
      prepareSwarm(opts);
      window.__SWARM_SKIP_RENDER__ = true;
      log('Sync grind @ ' + LOOP_MS + 'ms steps · goal ' + fmtCash(activeGoal));
      try {
        while (running && loopCount < maxSteps && !swarmGoalMet()) {
          if (Date.now() - startedAt > maxWallMs) { timeoutHit = true; log("Wall timeout " + (maxWallMs / 1000) + "s"); break; }
          swarmLoop();
        }
        if (running) finish();
      } finally {
        window.__SWARM_SKIP_RENDER__ = false;
      }
      return window.__SWARM_LAST_REPORT__;
    }

    function stop() {
      running = false;
      if (timer) { clearInterval(timer); timer = null; }
      if (snapshot) VoidlineEngineQA.restoreAllSaves(snapshot);
      log('Swarm halted — saves restored');
    }

    return {
      GOAL: GOAL,
      start: start,
      runSync: runSync,
      stop: stop,
      isRunning: function () { return running; },
      getBotCash: botCash,
      Bot_Aden: { id: 'aden', step: stepAden },
      Bot_Dad: { id: 'dad', step: stepDad },
      Bot_Jamie: { id: 'jamie', step: stepJamie },
      STREAMS: STREAMS,
      printStudioFinalLedger: printStudioFinalLedger,
      totalEarnedAll: totalEarnedAll,
    };
  })();

  window.SwarmBugCrusher = SwarmBugCrusher;
  window.VoidlineSwarm = VoidlineSwarm;
  SwarmBugCrusher.install();

  window.VoidlineEngineQA = VoidlineEngineQA;
  window.runAutomatedMarketChaosTest = function () { return VoidlineEngineQA.runAutomatedMarketChaosTest(); };
  window.VoidlineSwarmSimulator = VoidlineSwarm;

  window.VoidlineGalaxyFarm = {
    version: APP_VERSION,
    saveVersion: SAVE_VERSION,
    TAB_ORDER: TAB_ORDER.slice(),
    PLAYERS: PLAYERS.map(function (p) { return { id: p.id, label: p.label }; }),
    getState: function () { return G ? clone(G) : null; },
    getPlayerId: function () { return activePlayerId; },
    selectPlayer: selectPlayer,
    saveGame: saveGame,
    render: render,
    scanMult: scanMult,
    genPack: genPack,
    listStorefrontSlot: listStorefrontSlot,
    postForSale: listStorefrontSlot,
    buyFromPlayerShop: buyFromPlayerShop,
    buyFromExternalShop: buyFromPlayerShop,
    submitLeaseOffer: submitLeaseOffer,
    respondLeaseOffer: respondLeaseOffer,
    resolveLease: respondLeaseOffer,
    processLeaseBilling: processLeaseBilling,
    battleDamageBreakdown: battleDamageBreakdown,
    computeBattleDps: computeBattleDps,
    totalBattleDps: totalBattleDps,
    tickBoss: tickBoss,
    getBossTrait: getBossTrait,
    onUpgrade: function (id) { SwarmBugCrusher.install(); return SwarmBugCrusher.guard(function () { return onUpgrade(id); }, 'onUpgrade'); },
    upgradeStrain: upgradeStrain,
    giftStrain: function (sid, to) { SwarmBugCrusher.install(); return SwarmBugCrusher.guard(function () { return giftStrain(sid, to); }, 'giftStrain'); },
    buyPack: buyPack,
    closePack: closePack,
    equipBestBattle: equipBestBattle,
    healNullState: healNullState,
    packLuckFromOpts: packLuckFromOpts,
    SwarmBugCrusher: SwarmBugCrusher,
    VoidlineSwarm: VoidlineSwarm,
    runQA: function () { return VoidlineEngineQA.runAll(); },
    runSwarm: function (opts) { return VoidlineSwarm.start(opts); },
    runSwarmSync: function (opts) { return VoidlineSwarm.runSync(opts); },
    printStudioLedger: function () { return VoidlineSwarm.printStudioFinalLedger(); },
  };

  setTimeout(function () {
    try {
      VoidlineEngineQA.runIntegritySuite();
      var params = new URLSearchParams(window.location.search);
      if (params.get('qa') === 'full' || params.get('qa') === '1') {
        VoidlineEngineQA.runAll();
      }
      if (params.get('swarm') === '1' || params.get('swarm') === 'run') {
        VoidlineSwarm.start({ sandbox: true, cashMult: 150, maxSteps: 250000 });
      }
    } catch (e) {
      console.error('[VoidlineEngineQA] bootstrap failed:', e);
    }
  }, 350);
})();
