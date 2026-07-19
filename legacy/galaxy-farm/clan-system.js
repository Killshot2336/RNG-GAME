/* Voidline Galaxy Farm — clan matrix (stats-only sync, no chat channels) */
(function () {
  'use strict';

  var CLAN_STORE_KEY = 'voidline_clan_matrix_v2';
  var CLAN_DIRECTORY_KEY = 'voidline_clan_directory';
  var CLAN_TYPES = {
    family: { id: 'family', label: 'Family Crew', max: 5, cashCost: 25000, spCost: 15 },
    friends: { id: 'friends', label: 'Friends Syndicate', max: 50, cashCost: 120000, spCost: 40 },
    wars: { id: 'wars', label: 'Clan Wars Legion', max: 100, cashCost: 500000, spCost: 120 },
  };
  var EMBLEMS = ['rift', 'crown', 'skull', 'nova', 'vault', 'pipe', 'portal', 'strains', 'mega', 'equip'];
  var WAR_ZONES = ['rift_gate', 'nebula_core', 'void_spire', 'cosmic_harvest', 'dark_matter', 'stellar_forge', 'quantum_bloom', 'omega_citadel'];
  var listeners = [];

  function notify() {
    listeners.forEach(function (fn) { try { fn(getState()); } catch (e) { } });
  }

  function readJson(key, fallback) {
    try {
      var r = localStorage.getItem(key);
      return r ? JSON.parse(r) : fallback;
    } catch (e) { return fallback; }
  }

  function writeJson(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; } catch (e) { return false; }
  }

  function randomHash() {
    var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var seg = function (n) {
      var s = '';
      for (var i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)];
      return s;
    };
    return 'VOID-' + seg(4) + '-' + seg(4);
  }

  function defaultMember(displayName, tag, dps) {
    return {
      id: 'self',
      name: displayName || 'You',
      tag: tag || null,
      role: 'leader',
      trophies: 0,
      dps: dps || 0,
      strainSales: 0,
      placement: 0,
      joinedAt: Date.now(),
    };
  }

  function defaultClanState() {
    return {
      clanId: null,
      hash: null,
      name: null,
      emblem: 'rift',
      type: null,
      maxMembers: 0,
      role: null,
      trophies: 0,
      warPoints: 0,
      territories: [],
      members: [],
      marketSlots: [],
      statLedger: [],
    };
  }

  function ensureLocal() {
    var d = readJson(CLAN_STORE_KEY, null);
    if (!d || typeof d !== 'object') {
      d = defaultClanState();
      writeJson(CLAN_STORE_KEY, d);
    }
    if (!Array.isArray(d.members)) d.members = [];
    if (!Array.isArray(d.territories)) d.territories = [];
    if (!Array.isArray(d.marketSlots)) d.marketSlots = [];
    if (!Array.isArray(d.statLedger)) d.statLedger = [];
    return d;
  }

  function readDirectory() {
    var dir = readJson(CLAN_DIRECTORY_KEY, {});
    return dir && typeof dir === 'object' ? dir : {};
  }

  function writeDirectory(dir) {
    writeJson(CLAN_DIRECTORY_KEY, dir);
  }

  function getState() {
    var d = ensureLocal();
    var typeDef = d.type ? CLAN_TYPES[d.type] : null;
    return {
      inClan: !!d.clanId,
      clanId: d.clanId,
      hash: d.hash,
      name: d.name,
      emblem: d.emblem,
      type: d.type,
      typeLabel: typeDef ? typeDef.label : null,
      maxMembers: d.maxMembers || (typeDef ? typeDef.max : 0),
      role: d.role,
      trophies: d.trophies || 0,
      warPoints: d.warPoints || 0,
      territories: (d.territories || []).slice(),
      memberCount: (d.members || []).length,
      members: (d.members || []).slice(),
      marketSlots: (d.marketSlots || []).slice(),
      statLedger: (d.statLedger || []).slice(-24),
      warZones: WAR_ZONES.map(function (z) {
        return { id: z, label: z.replace(/_/g, ' ').toUpperCase(), ownerHash: d.territories.indexOf(z) >= 0 ? d.hash : null };
      }),
      emblems: EMBLEMS.slice(),
      clanTypes: Object.keys(CLAN_TYPES).map(function (k) { return CLAN_TYPES[k]; }),
      cloudLinked: !!(window.VoidlineCloud && window.VoidlineCloud.isLoggedIn()),
    };
  }

  function publishClan(d) {
    if (!d.hash) return;
    var dir = readDirectory();
    dir[d.hash] = {
      hash: d.hash,
      name: d.name,
      emblem: d.emblem,
      type: d.type,
      maxMembers: d.maxMembers,
      memberCount: (d.members || []).length,
      trophies: d.trophies || 0,
      updatedAt: Date.now(),
    };
    writeDirectory(dir);
  }

  function createClan(opts) {
    opts = opts || {};
    var name = String(opts.name || '').trim().slice(0, 24);
    var type = opts.type || 'family';
    var emblem = EMBLEMS.indexOf(opts.emblem) >= 0 ? opts.emblem : 'rift';
    var typeDef = CLAN_TYPES[type];
    if (!name || name.length < 2) return Promise.resolve({ ok: false, error: 'Clan name required (2+ chars).' });
    if (!typeDef) return Promise.resolve({ ok: false, error: 'Invalid clan type.' });
    var d = ensureLocal();
    if (d.clanId) return Promise.resolve({ ok: false, error: 'Leave your current clan first.' });
    var hash = randomHash();
    while (readDirectory()[hash]) hash = randomHash();
    d.clanId = 'clan_' + Date.now();
    d.hash = hash;
    d.name = name;
    d.emblem = emblem;
    d.type = type;
    d.maxMembers = typeDef.max;
    d.role = 'leader';
    d.trophies = 0;
    d.warPoints = 0;
    d.territories = [];
    d.marketSlots = [];
    d.statLedger = [];
    d.members = [defaultMember(opts.displayName, opts.playerTag, opts.dps || 0)];
    writeJson(CLAN_STORE_KEY, d);
    publishClan(d);
    notify();
    return Promise.resolve({ ok: true, state: getState(), cost: { cash: typeDef.cashCost, sp: typeDef.spCost } });
  }

  function lookupClan(hash) {
    hash = String(hash || '').trim().toUpperCase();
    if (!hash) return null;
    var dir = readDirectory();
    return dir[hash] || null;
  }

  function joinClan(hash, displayName, playerTag, dps) {
    hash = String(hash || '').trim().toUpperCase();
    if (!hash) return Promise.resolve({ ok: false, error: 'Enter a clan access hash.' });
    var d = ensureLocal();
    if (d.clanId) return Promise.resolve({ ok: false, error: 'Already in a clan.' });
    var profile = lookupClan(hash);
    if (!profile) return Promise.resolve({ ok: false, error: 'No clan found for that hash.' });
    if (profile.memberCount >= profile.maxMembers) return Promise.resolve({ ok: false, error: 'Clan roster is full.' });
    d.clanId = 'joined_' + hash;
    d.hash = hash;
    d.name = profile.name;
    d.emblem = profile.emblem || 'rift';
    d.type = profile.type;
    d.maxMembers = profile.maxMembers;
    d.role = 'member';
    d.members = [defaultMember(displayName, playerTag, dps || 0)];
    d.territories = [];
    d.warPoints = 0;
    d.trophies = profile.trophies || 0;
    d.marketSlots = [];
    d.statLedger = [];
    writeJson(CLAN_STORE_KEY, d);
    profile.memberCount = (profile.memberCount || 0) + 1;
    var dir = readDirectory();
    dir[hash] = profile;
    writeDirectory(dir);
    notify();
    return Promise.resolve({ ok: true, state: getState() });
  }

  function leaveClan() {
    var d = ensureLocal();
    if (d.hash) {
      var dir = readDirectory();
      if (dir[d.hash]) {
        dir[d.hash].memberCount = Math.max(0, (dir[d.hash].memberCount || 1) - 1);
        writeDirectory(dir);
      }
    }
    writeJson(CLAN_STORE_KEY, defaultClanState());
    notify();
    return Promise.resolve({ ok: true, state: getState() });
  }

  function pushStatEvent(kind, payload) {
    var d = ensureLocal();
    if (!d.clanId) return Promise.resolve({ ok: false, error: 'Not in a clan.' });
    d.statLedger = (d.statLedger || []).concat([{
      kind: kind,
      payload: payload || {},
      at: Date.now(),
    }]).slice(-64);
    var self = (d.members || []).find(function (m) { return m.id === 'self'; });
    if (self && payload) {
      if (payload.dps != null) self.dps = payload.dps;
      if (payload.strainSales) self.strainSales = (self.strainSales || 0) + payload.strainSales;
      if (payload.placement != null) self.placement = payload.placement;
    }
    writeJson(CLAN_STORE_KEY, d);
    notify();
    return Promise.resolve({ ok: true, state: getState() });
  }

  function contributeWar(zoneId, power) {
    var d = ensureLocal();
    if (!d.clanId) return Promise.resolve({ ok: false, error: 'Join a clan first.' });
    if (WAR_ZONES.indexOf(zoneId) < 0) return Promise.resolve({ ok: false, error: 'Invalid war zone.' });
    power = Math.max(1, Math.floor(power || 1));
    d.warPoints = (d.warPoints || 0) + power;
    var captured = false;
    if (d.warPoints >= 100 && d.territories.indexOf(zoneId) < 0) {
      d.territories = (d.territories || []).concat([zoneId]);
      d.warPoints = 0;
      captured = true;
      pushStatEvent('territory', { zoneId: zoneId });
    }
    writeJson(CLAN_STORE_KEY, d);
    notify();
    return Promise.resolve({ ok: true, state: getState(), captured: captured });
  }

  function addTrophies(n) {
    var d = ensureLocal();
    if (!d.clanId) return;
    d.trophies = (d.trophies || 0) + (n || 0);
    var self = (d.members || []).find(function (m) { return m.id === 'self'; });
    if (self) self.trophies = (self.trophies || 0) + (n || 0);
    writeJson(CLAN_STORE_KEY, d);
    if (d.hash) publishClan(d);
    notify();
  }

  function listMarketSlot(slot) {
    var d = ensureLocal();
    if (!d.clanId) return Promise.resolve({ ok: false, error: 'Join a clan first.' });
    d.marketSlots = (d.marketSlots || []).concat([Object.assign({ id: 'slot_' + Date.now(), listedAt: Date.now() }, slot)]).slice(-CLAN_TYPES[d.type || 'family'].max * 2);
    writeJson(CLAN_STORE_KEY, d);
    pushStatEvent('market_list', { strainName: slot.strainName, price: slot.price });
    notify();
    return Promise.resolve({ ok: true, state: getState() });
  }

  function removeMarketSlot(slotId) {
    var d = ensureLocal();
    d.marketSlots = (d.marketSlots || []).filter(function (s) { return s.id !== slotId; });
    writeJson(CLAN_STORE_KEY, d);
    notify();
    return Promise.resolve({ ok: true, state: getState() });
  }

  function getLeaderboard() {
    var d = ensureLocal();
    var dir = readDirectory();
    var rows = Object.keys(dir).map(function (k) {
      var c = dir[k];
      return { hash: c.hash, name: c.name, trophies: c.trophies || 0, members: c.memberCount || 0, type: c.type };
    });
    if (d.hash && !dir[d.hash]) {
      rows.push({ hash: d.hash, name: d.name, trophies: d.trophies || 0, members: (d.members || []).length, type: d.type });
    }
    rows.sort(function (a, b) { return b.trophies - a.trophies; });
    return rows.slice(0, 12);
  }

  function onStateChange(fn) {
    if (typeof fn === 'function') listeners.push(fn);
  }

  function boot() {
    ensureLocal();
    notify();
  }

  window.VoidlineClan = {
    boot: boot,
    getState: getState,
    createClan: createClan,
    joinClan: joinClan,
    leaveClan: leaveClan,
    lookupClan: lookupClan,
    contributeWar: contributeWar,
    addTrophies: addTrophies,
    pushStatEvent: pushStatEvent,
    listMarketSlot: listMarketSlot,
    removeMarketSlot: removeMarketSlot,
    getLeaderboard: getLeaderboard,
    onStateChange: onStateChange,
    CLAN_TYPES: CLAN_TYPES,
    EMBLEMS: EMBLEMS,
    WAR_ZONES: WAR_ZONES,
  };
})();
