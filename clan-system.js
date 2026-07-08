/* Voidline Galaxy Farm — Clan / multiplayer foundation (local-first + Supabase) */
(function () {
  'use strict';

  var MAX_MEMBERS = 50;
  var WAR_ZONES = ['rift_gate', 'nebula_core', 'void_spire', 'cosmic_harvest', 'dark_matter', 'stellar_forge', 'quantum_bloom', 'omega_citadel'];
  var EMOTES = ['🔥', '⚔️', '👑', '💎', '🌌', '✨', '🎯', '💀'];

  var client = null;
  var cloudReady = false;
  var session = null;
  var localKey = 'voidline_clan_local';
  var listeners = [];

  function notify() {
    listeners.forEach(function (fn) { try { fn(getState()); } catch (e) { } });
  }

  function readLocal() {
    try {
      var r = localStorage.getItem(localKey);
      return r ? JSON.parse(r) : null;
    } catch (e) { return null; }
  }

  function writeLocal(data) {
    try { localStorage.setItem(localKey, JSON.stringify(data)); } catch (e) { }
    notify();
  }

  function defaultLocal() {
    return {
      clanId: null,
      name: null,
      tag: null,
      role: null,
      trophies: 0,
      warPoints: 0,
      territories: [],
      members: [],
      messages: [],
    };
  }

  function ensureLocal() {
    var d = readLocal();
    if (!d || typeof d !== 'object') {
      d = defaultLocal();
      writeLocal(d);
    }
    if (!Array.isArray(d.messages)) d.messages = [];
    if (!Array.isArray(d.territories)) d.territories = [];
    if (!Array.isArray(d.members)) d.members = [];
    return d;
  }

  function ensureClient() {
    if (!window.VoidlineCloud || !window.VoidlineCloud.cloudEnabled || !window.VoidlineCloud.cloudEnabled()) return null;
    if (client) return client;
    var cfg = null;
    if (window.__VOIDLINE_SUPABASE__) cfg = window.__VOIDLINE_SUPABASE__;
    if (!cfg && window.supabase && window.supabase.createClient) {
      return fetch('/api/supabase-config').then(function (r) { return r.json(); }).then(function (j) {
        if (!j.url || !j.anonKey) return null;
        window.__VOIDLINE_SUPABASE__ = j;
        client = window.supabase.createClient(j.url, j.anonKey);
        cloudReady = true;
        return client;
      }).catch(function () { return null; });
    }
    return client;
  }

  function getSession() {
    if (window.VoidlineCloud && window.VoidlineCloud.isLoggedIn()) return { user: { id: 'cloud', email: window.VoidlineCloud.getEmail() } };
    return null;
  }

  function getState() {
    var d = ensureLocal();
    return {
      inClan: !!d.clanId,
      clanId: d.clanId,
      name: d.name,
      tag: d.tag,
      role: d.role,
      trophies: d.trophies || 0,
      warPoints: d.warPoints || 0,
      territories: (d.territories || []).slice(),
      memberCount: (d.members || []).length || (d.clanId ? 1 : 0),
      members: (d.members || []).slice(0, MAX_MEMBERS),
      messages: (d.messages || []).slice(-40),
      warZones: WAR_ZONES.map(function (z) {
        return { id: z, label: z.replace(/_/g, ' ').toUpperCase(), ownerTag: d.territories.indexOf(z) >= 0 ? d.tag : null };
      }),
      emotes: EMOTES,
      cloudLinked: !!(window.VoidlineCloud && window.VoidlineCloud.isLoggedIn()),
    };
  }

  function createClan(name, tag, displayName) {
    name = String(name || '').trim().slice(0, 24);
    tag = String(tag || '').trim().toUpperCase().slice(0, 5);
    if (!name || tag.length < 2) return Promise.resolve({ ok: false, error: 'Name and 2–5 char tag required.' });
    var d = ensureLocal();
    if (d.clanId) return Promise.resolve({ ok: false, error: 'Leave current clan first.' });
    var id = 'local_' + Date.now();
    d.clanId = id;
    d.name = name;
    d.tag = tag;
    d.role = 'leader';
    d.trophies = 0;
    d.warPoints = 0;
    d.territories = [];
    d.members = [{ id: 'self', name: displayName || 'You', role: 'leader', trophies: 0 }];
    d.messages = [{ id: 'sys_' + Date.now(), user: 'SYSTEM', body: 'Clan founded. Recruit up to ' + MAX_MEMBERS + ' members!', emote: '👑', at: Date.now() }];
    writeLocal(d);
    return Promise.resolve({ ok: true, state: getState() });
  }

  function joinClan(tag, displayName) {
    tag = String(tag || '').trim().toUpperCase();
    if (tag.length < 2) return Promise.resolve({ ok: false, error: 'Enter a clan tag.' });
    var d = ensureLocal();
    if (d.clanId) return Promise.resolve({ ok: false, error: 'Already in a clan.' });
    d.clanId = 'joined_' + tag;
    d.name = tag + ' Syndicate';
    d.tag = tag;
    d.role = 'member';
    d.members = [{ id: 'self', name: displayName || 'You', role: 'member', trophies: 0 }];
    d.messages = [{ id: 'sys_' + Date.now(), user: 'SYSTEM', body: 'Welcome to [' + tag + ']!', emote: '✨', at: Date.now() }];
    writeLocal(d);
    return Promise.resolve({ ok: true, state: getState() });
  }

  function leaveClan() {
    writeLocal(defaultLocal());
    return Promise.resolve({ ok: true, state: getState() });
  }

  function sendMessage(body, emote, displayName) {
    body = String(body || '').trim().slice(0, 500);
    if (!body) return Promise.resolve({ ok: false, error: 'Empty message.' });
    var d = ensureLocal();
    if (!d.clanId) return Promise.resolve({ ok: false, error: 'Join a clan first.' });
    d.messages = (d.messages || []).concat([{
      id: 'm_' + Date.now(),
      user: displayName || 'You',
      body: body,
      emote: emote || '',
      at: Date.now(),
    }]).slice(-80);
    writeLocal(d);
    return Promise.resolve({ ok: true, state: getState() });
  }

  function contributeWar(zoneId, power) {
    var d = ensureLocal();
    if (!d.clanId) return Promise.resolve({ ok: false, error: 'Join a clan first.' });
    if (WAR_ZONES.indexOf(zoneId) < 0) return Promise.resolve({ ok: false, error: 'Invalid zone.' });
    power = Math.max(1, Math.floor(power || 1));
    d.warPoints = (d.warPoints || 0) + power;
    if (d.warPoints >= 100 && d.territories.indexOf(zoneId) < 0) {
      d.territories = (d.territories || []).concat([zoneId]);
      d.warPoints = 0;
      d.messages = (d.messages || []).concat([{
        id: 'war_' + Date.now(),
        user: 'WAR',
        body: 'Territory captured: ' + zoneId.replace(/_/g, ' ').toUpperCase(),
        emote: '⚔️',
        at: Date.now(),
      }]).slice(-80);
    }
    writeLocal(d);
    return Promise.resolve({ ok: true, state: getState(), captured: d.territories.indexOf(zoneId) >= 0 });
  }

  function addTrophies(n) {
    var d = ensureLocal();
    if (!d.clanId) return;
    d.trophies = (d.trophies || 0) + (n || 0);
    var self = (d.members || []).find(function (m) { return m.id === 'self'; });
    if (self) self.trophies = (self.trophies || 0) + (n || 0);
    writeLocal(d);
  }

  function getLeaderboard() {
    var d = ensureLocal();
    var rows = [
      { tag: d.tag || '---', name: d.name || 'Your Clan', trophies: d.trophies || 0, territories: (d.territories || []).length },
      { tag: 'VOID', name: 'Void Reapers', trophies: 8420, territories: 5 },
      { tag: 'RIFT', name: 'Rift Lords', trophies: 7190, territories: 4 },
      { tag: 'NEBU', name: 'Nebula Cartel', trophies: 6550, territories: 3 },
    ];
    rows.sort(function (a, b) { return b.trophies - a.trophies; });
    return rows;
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
    sendMessage: sendMessage,
    contributeWar: contributeWar,
    addTrophies: addTrophies,
    getLeaderboard: getLeaderboard,
    onStateChange: onStateChange,
    MAX_MEMBERS: MAX_MEMBERS,
    WAR_ZONES: WAR_ZONES,
  };
})();
