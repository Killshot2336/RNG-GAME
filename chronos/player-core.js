/* Voidline Galaxy Farm — unique player ID core, legacy migration, rival linking */
(function () {
  'use strict';

  var REGISTRY_KEY = 'voidline_player_registry';
  var ACTIVE_KEY = 'voidline_active_player';
  var LINKS_KEY = 'voidline_player_links';
  var SAVE_PREFIX = 'voidline_galaxy_farm_v2_';
  var LEGACY_SLUGS = [
    { slug: 'aden', theme: 'aden', label: 'Aden', portrait: '/public/art/portraits/aden.svg', defaultName: 'Aden' },
    { slug: 'dad', theme: 'edward', label: 'Edward', portrait: '/public/art/portraits/dad.svg', defaultName: 'Edward' },
    { slug: 'jamie', theme: 'jamie', label: 'Jamie', portrait: '/public/art/portraits/jamie.svg', defaultName: 'Jamie' },
  ];

  function readJson(key, fallback) {
    try {
      var r = localStorage.getItem(key);
      return r ? JSON.parse(r) : fallback;
    } catch (e) { return fallback; }
  }

  function writeJson(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; } catch (e) { return false; }
  }

  function randomSegment(len, alphabet) {
    var out = '';
    for (var i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
  }

  function generateTag() {
    return '#V0ID-' + randomSegment(6, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
  }

  function saveKey(pid) { return SAVE_PREFIX + pid; }

  function readLegacySave(slug) {
    try {
      var r = localStorage.getItem(saveKey(slug)) || localStorage.getItem(saveKey(slug) + '_backup');
      return r ? JSON.parse(r) : null;
    } catch (e) { return null; }
  }

  function copySaveToId(fromSlug, newId, meta) {
    var data = readLegacySave(fromSlug);
    if (!data) return false;
    data.playerId = newId;
    data.uniqueTag = meta.tag;
    data.profileTheme = meta.theme;
    data.legacySlug = fromSlug;
    if (!data.name || data.name === meta.label) data.name = meta.defaultName || meta.label;
    var blob = JSON.stringify(data);
    localStorage.setItem(saveKey(newId), blob);
    localStorage.setItem(saveKey(newId) + '_backup', blob);
    return true;
  }

  function freshRegistryEntry(themeMeta) {
    var id = 'p_' + Date.now().toString(36) + randomSegment(4, 'abcdefghijklmnopqrstuvwxyz0123456789');
    var tag = generateTag();
    while (getRegistry().some(function (e) { return e.tag === tag; })) tag = generateTag();
    return {
      id: id,
      tag: tag,
      label: themeMeta ? themeMeta.defaultName : 'Pilot',
      theme: themeMeta ? themeMeta.theme : 'aden',
      portrait: themeMeta ? themeMeta.portrait : '/public/art/portraits/aden.svg',
      legacySlug: themeMeta ? themeMeta.slug : null,
      createdAt: Date.now(),
    };
  }

  function getRegistry() {
    var reg = readJson(REGISTRY_KEY, []);
    return Array.isArray(reg) ? reg : [];
  }

  function setRegistry(reg) {
    writeJson(REGISTRY_KEY, reg);
  }

  function findById(id) {
    return getRegistry().find(function (e) { return e.id === id; }) || null;
  }

  function findByTag(tag) {
    tag = String(tag || '').trim().toUpperCase();
    if (!tag) return null;
    if (tag.indexOf('#') !== 0) tag = '#' + tag.replace(/^V0ID-?/i, 'V0ID-');
    return getRegistry().find(function (e) { return e.tag.toUpperCase() === tag; }) || null;
  }

  function migrateLegacySaves() {
    var reg = getRegistry();
    var changed = false;
    LEGACY_SLUGS.forEach(function (meta) {
      if (reg.some(function (e) { return e.legacySlug === meta.slug; })) return;
      var legacy = readLegacySave(meta.slug);
      if (!legacy) return;
      var entry = freshRegistryEntry(meta);
      entry.label = legacy.name || meta.defaultName;
      if (copySaveToId(meta.slug, entry.id, entry)) {
        reg.push(entry);
        changed = true;
      }
    });
    if (!reg.length) {
      var first = freshRegistryEntry(LEGACY_SLUGS[0]);
      reg.push(first);
      changed = true;
    }
    if (changed) setRegistry(reg);
    return reg;
  }

  function getActiveId() {
    try {
      return sessionStorage.getItem(ACTIVE_KEY) || localStorage.getItem(ACTIVE_KEY) || null;
    } catch (e) { return localStorage.getItem(ACTIVE_KEY) || null; }
  }

  function setActiveId(id) {
    try {
      sessionStorage.setItem(ACTIVE_KEY, id);
      localStorage.setItem(ACTIVE_KEY, id);
      localStorage.setItem('voidline_last_player', id);
    } catch (e) { }
  }

  function getProfile(id) {
    var entry = findById(id);
    if (entry) {
      return {
        id: entry.id,
        tag: entry.tag,
        label: entry.label,
        theme: entry.theme,
        portrait: entry.portrait,
        legacySlug: entry.legacySlug,
        defaultName: entry.label,
      };
    }
    var leg = LEGACY_SLUGS.find(function (m) { return m.slug === id; });
    if (leg) {
      return { id: leg.slug, tag: null, label: leg.label, theme: leg.theme, portrait: leg.portrait, legacySlug: leg.slug, defaultName: leg.defaultName };
    }
    return { id: id, tag: null, label: 'Pilot', theme: 'aden', portrait: '/public/art/portraits/aden.svg', legacySlug: null, defaultName: 'Pilot' };
  }

  function listProfiles() {
    return getRegistry().map(getProfile);
  }

  function getLinks() {
    var links = readJson(LINKS_KEY, []);
    return Array.isArray(links) ? links : [];
  }

  function addLink(tag) {
    tag = String(tag || '').trim().toUpperCase();
    if (!tag) return { ok: false, error: 'Enter a player tag.' };
    if (tag.indexOf('#') !== 0) tag = '#' + tag.replace(/^V0ID-?/i, 'V0ID-');
    var self = findById(getActiveId());
    if (self && self.tag.toUpperCase() === tag) return { ok: false, error: 'That is your own tag.' };
    var local = findByTag(tag);
    var links = getLinks();
    if (links.some(function (l) { return l.tag.toUpperCase() === tag; })) return { ok: false, error: 'Already linked.' };
    var entry = {
      tag: tag,
      label: local ? local.label : 'Rival ' + tag.slice(-4),
      addedAt: Date.now(),
      localOnly: !!local,
      playerId: local ? local.id : null,
    };
    links.push(entry);
    writeJson(LINKS_KEY, links.slice(-48));
    return { ok: true, link: entry };
  }

  function removeLink(tag) {
    var links = getLinks().filter(function (l) { return l.tag.toUpperCase() !== String(tag || '').toUpperCase(); });
    writeJson(LINKS_KEY, links);
    return { ok: true };
  }

  function themeClass(theme) {
    if (theme === 'edward' || theme === 'dad') return 'theme-edward';
    if (theme === 'jamie') return 'theme-jamie';
    return 'theme-aden';
  }

  function boot() {
    var reg = migrateLegacySaves();
    var active = getActiveId();
    if (!active || !findById(active)) {
      active = reg[0] && reg[0].id;
      if (active) setActiveId(active);
    }
    return active;
  }

  window.VoidlinePlayerCore = {
    boot: boot,
    SAVE_PREFIX: SAVE_PREFIX,
    LEGACY_SLUGS: LEGACY_SLUGS,
    saveKey: saveKey,
    getRegistry: getRegistry,
    listProfiles: listProfiles,
    getProfile: getProfile,
    getActiveId: getActiveId,
    setActiveId: setActiveId,
    findByTag: findByTag,
    generateTag: generateTag,
    getLinks: getLinks,
    addLink: addLink,
    removeLink: removeLink,
    themeClass: themeClass,
    migrateLegacySaves: migrateLegacySaves,
  };
})();
