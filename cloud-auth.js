/* Voidline Galaxy Farm — Supabase auth + cloud save (client, anon key + RLS) */
(function () {
  'use strict';

  var AUTH_MODE_KEY = 'voidline_auth_mode';
  var PLAYER_IDS = ['aden', 'dad', 'jamie'];
  var CLOUD_DEBOUNCE_MS = 2000;
  var SAVE_PREFIX = 'voidline_galaxy_farm_v2_';

  var client = null;
  var config = null;
  var session = null;
  var mode = null;
  var ready = false;
  var onReadyCb = null;
  var conflicts = [];
  var conflictIdx = 0;
  var cloudTimers = {};
  var cloudEnabled = false;
  var booted = false;
  var syncState = 'offline';
  var syncListeners = [];

  function setSyncState(s) {
    if (syncState === s) return;
    syncState = s;
    syncListeners.forEach(function (fn) { try { fn(getSyncStatus()); } catch (e) { } });
  }

  function getSyncStatus() {
    return {
      state: syncState,
      email: session && session.user ? session.user.email : null,
      enabled: cloudEnabled,
      mode: mode,
    };
  }

  function onSyncChange(fn) {
    if (typeof fn === 'function') syncListeners.push(fn);
  }

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function saveKey(pid) { return SAVE_PREFIX + pid; }

  function readLocalSave(pid) {
    try {
      var r = localStorage.getItem(saveKey(pid));
      if (!r) r = localStorage.getItem(saveKey(pid) + '_backup');
      if (!r) return null;
      return JSON.parse(r);
    } catch (e) { return null; }
  }

  function writeLocalSave(pid, data) {
    try {
      var blob = JSON.stringify(data);
      localStorage.setItem(saveKey(pid), blob);
      localStorage.setItem(saveKey(pid) + '_backup', blob);
      return true;
    } catch (e) { return false; }
  }

  function localTs(save) {
    if (!save) return 0;
    return save.lastTickAt || save.updated_at || 0;
  }

  function cloudTs(row) {
    if (!row) return 0;
    if (row.updated_at) return new Date(row.updated_at).getTime();
    return localTs(row.save_json);
  }

  function fetchConfig() {
    return fetch('/api/supabase-config')
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.body.url || !res.body.anonKey) {
          cloudEnabled = false;
          setSyncState('offline');
          return null;
        }
        config = res.body;
        cloudEnabled = true;
        return config;
      })
      .catch(function () {
        cloudEnabled = false;
        setSyncState('offline');
        return null;
      });
  }

  function ensureClient() {
    if (!cloudEnabled || !config) return null;
    if (client) return client;
    if (!window.supabase || !window.supabase.createClient) return null;
    client = window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return client;
  }

  function setMode(m) {
    mode = m;
    try { localStorage.setItem(AUTH_MODE_KEY, m); } catch (e) { }
  }

  function getOverlay() {
    return document.getElementById('overlay-auth-gate');
  }

  function hideGate() {
    var el = getOverlay();
    if (el) { el.classList.remove('open'); el.innerHTML = ''; }
  }

  function showGate(html) {
    var el = getOverlay();
    if (!el) return;
    el.innerHTML = html;
    el.classList.add('open');
  }

  function authShell(inner) {
    return '<div class="overlay-panel auth-gate-panel halftone-panel glass-panel ink-border p-5">' + inner + '</div>';
  }

  function renderGuestProminent() {
    return '<button type="button" class="game-btn auth-guest-btn w-full mb-3" data-cloud-action="guest">CONTINUE AS GUEST</button>';
  }

  function renderAuthForm(tab) {
    tab = tab || 'signin';
    var h = '<div class="text-center mb-4">';
    h += '<div class="brand-sub">Voidline</div>';
    h += '<h2 class="font-display chromatic-text auth-gate-title">GALAXY FARM</h2>';
    h += '<p class="text-muted text-xs mt-2">Play locally or sync progress to the cloud.</p></div>';
    h += renderGuestProminent();
    h += '<div class="auth-divider"><span>or cloud account</span></div>';
    h += '<div class="farm-tabs mb-3 auth-tabs">';
    h += '<button type="button" class="farm-tab' + (tab === 'signin' ? ' active' : '') + '" data-cloud-action="tab" data-id="signin">SIGN IN</button>';
    h += '<button type="button" class="farm-tab' + (tab === 'signup' ? ' active' : '') + '" data-cloud-action="tab" data-id="signup">SIGN UP</button>';
    h += '</div>';
    h += '<div id="auth-msg" class="auth-msg" role="alert"></div>';
    if (tab === 'signup') {
      h += '<input type="email" class="input-field mb-2" id="auth-email" placeholder="Email" autocomplete="email">';
      h += '<input type="password" class="input-field mb-2" id="auth-password" placeholder="Password (6+ chars)" autocomplete="new-password">';
      h += '<button type="button" class="game-btn game-btn-green w-full mb-2" data-cloud-action="signup">CREATE ACCOUNT</button>';
    } else {
      h += '<input type="email" class="input-field mb-2" id="auth-email" placeholder="Email" autocomplete="email">';
      h += '<input type="password" class="input-field mb-2" id="auth-password" placeholder="Password" autocomplete="current-password">';
      h += '<button type="button" class="game-btn game-btn-green w-full mb-2" data-cloud-action="signin">SIGN IN</button>';
      h += '<button type="button" class="auth-link-btn" data-cloud-action="forgot">Forgot password?</button>';
    }
    if (!cloudEnabled) {
      h += '<p class="text-muted text-xs text-center mt-3">Cloud sync unavailable — Supabase not configured. Guest play works offline.</p>';
    }
    return authShell(h);
  }

  function renderForgotForm() {
    var h = '<div class="text-center mb-4"><h2 class="font-display chromatic-text" style="font-size:0.9rem;letter-spacing:0.15em">RESET PASSWORD</h2></div>';
    h += '<div id="auth-msg" class="auth-msg" role="alert"></div>';
    h += '<input type="email" class="input-field mb-3" id="auth-email" placeholder="Account email" autocomplete="email">';
    h += '<button type="button" class="game-btn game-btn-green w-full mb-2" data-cloud-action="send-reset">SEND RESET LINK</button>';
    h += '<button type="button" class="auth-link-btn w-full" data-cloud-action="tab" data-id="signin">← Back to sign in</button>';
    return authShell(h);
  }

  function setAuthMsg(text, ok) {
    var el = document.getElementById('auth-msg');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'auth-msg' + (text ? (ok ? ' auth-msg-ok' : ' auth-msg-err') : '');
  }

  function renderConflictStep() {
    if (conflictIdx >= conflicts.length) {
      hideGate();
      finishBoot();
      return;
    }
    var c = conflicts[conflictIdx];
    var localDate = c.local ? new Date(localTs(c.local)).toLocaleString() : 'none';
    var cloudDate = c.cloud ? new Date(cloudTs(c.cloud)).toLocaleString() : 'none';
    var label = c.playerId.toUpperCase();
    var h = '<div class="text-center mb-3">';
    h += '<h2 class="font-display chromatic-text" style="font-size:0.85rem;letter-spacing:0.12em">SAVE CONFLICT</h2>';
    h += '<p class="text-muted text-xs mt-2">Profile <strong>' + esc(label) + '</strong> has different local and cloud data.</p></div>';
    h += '<div class="auth-conflict-grid mb-3">';
    h += '<div class="auth-conflict-card halftone-panel"><div class="font-mono text-green text-xs">LOCAL</div><div class="text-xs text-muted">Lv.' + (c.local ? (c.local.empireLevel || 1) : 1) + ' · ' + esc(localDate) + '</div></div>';
    h += '<div class="auth-conflict-card halftone-panel"><div class="font-mono text-cyan text-xs">CLOUD</div><div class="text-xs text-muted">Lv.' + (c.cloud && c.cloud.save_json ? (c.cloud.save_json.empireLevel || 1) : 1) + ' · ' + esc(cloudDate) + '</div></div>';
    h += '</div>';
    h += '<div class="flex-col gap-2">';
    h += '<button type="button" class="game-btn w-full" data-cloud-action="conflict" data-id="local">KEEP LOCAL</button>';
    h += '<button type="button" class="game-btn w-full" data-cloud-action="conflict" data-id="cloud">KEEP CLOUD</button>';
    h += '<button type="button" class="game-btn game-btn-green w-full" data-cloud-action="conflict" data-id="newest">MERGE NEWEST</button>';
    h += '</div>';
    h += '<p class="text-muted text-xs text-center mt-3">' + (conflictIdx + 1) + ' / ' + conflicts.length + ' profiles</p>';
    showGate(authShell(h));
  }

  function applyConflictChoice(choice) {
    var c = conflicts[conflictIdx];
    if (!c) return;
    var local = c.local;
    var cloudData = c.cloud && c.cloud.save_json ? c.cloud.save_json : null;
    var pick = null;
    if (choice === 'local') pick = local;
    else if (choice === 'cloud') pick = cloudData;
    else {
      var lt = localTs(local);
      var ct = cloudTs(c.cloud);
      pick = ct > lt ? cloudData : local;
    }
    if (pick) writeLocalSave(c.playerId, pick);
    conflictIdx++;
    if (conflictIdx < conflicts.length) renderConflictStep();
    else {
      hideGate();
      finishBoot();
    }
  }

  function detectConflicts(rows) {
    conflicts = [];
    conflictIdx = 0;
    var byPlayer = {};
    (rows || []).forEach(function (row) { byPlayer[row.player_id] = row; });
    PLAYER_IDS.forEach(function (pid) {
      var local = readLocalSave(pid);
      var cloud = byPlayer[pid] || null;
      var cloudData = cloud && cloud.save_json;
      if (!local && !cloudData) return;
      if (!local && cloudData) {
        writeLocalSave(pid, cloudData);
        return;
      }
      if (local && !cloudData) return;
      var lt = localTs(local);
      var ct = cloudTs(cloud);
      if (Math.abs(lt - ct) < 3000 && JSON.stringify(local) === JSON.stringify(cloudData)) return;
      conflicts.push({ playerId: pid, local: local, cloud: cloud });
    });
  }

  function pullCloudSaves() {
    var c = ensureClient();
    if (!c || !session) return Promise.resolve([]);
    return c.from('cloud_saves')
      .select('player_id, save_json, updated_at')
      .then(function (res) {
        if (res.error) throw res.error;
        return res.data || [];
      });
  }

  function pushCloudSave(playerId, saveJson) {
    var c = ensureClient();
    if (!c || !session || mode !== 'user') return Promise.resolve();
    return c.from('cloud_saves')
      .upsert({
        user_id: session.user.id,
        player_id: playerId,
        save_json: saveJson,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,player_id' })
      .then(function (res) {
        if (res.error) {
          console.warn('[VoidlineCloud] upsert failed', res.error.message);
          throw res.error;
        }
      });
  }

  function scheduleCloudPush(playerId, saveJson) {
    if (mode !== 'user' || !session) return;
    setSyncState('syncing');
    if (cloudTimers[playerId]) clearTimeout(cloudTimers[playerId]);
    cloudTimers[playerId] = setTimeout(function () {
      pushCloudSave(playerId, saveJson)
        .then(function () { setSyncState('synced'); })
        .catch(function () { setSyncState('error'); });
    }, CLOUD_DEBOUNCE_MS);
  }

  function flushCloudPush(playerId, saveJson) {
    if (mode !== 'user' || !session) return;
    setSyncState('syncing');
    if (cloudTimers[playerId]) { clearTimeout(cloudTimers[playerId]); cloudTimers[playerId] = null; }
    pushCloudSave(playerId, saveJson)
      .then(function () { setSyncState('synced'); })
      .catch(function () { setSyncState('error'); });
  }

  function afterUserSession() {
    setMode('user');
    setSyncState('synced');
    return pullCloudSaves().then(function (rows) {
      detectConflicts(rows);
      if (conflicts.length) renderConflictStep();
      else { hideGate(); finishBoot(); }
    }).catch(function (err) {
      setAuthMsg('Cloud pull failed: ' + (err.message || 'unknown'), false);
      setSyncState('error');
      hideGate();
      finishBoot();
    });
  }

  function finishBoot() {
    ready = true;
    if (onReadyCb) onReadyCb(mode);
    onReadyCb = null;
  }

  function continueGuest() {
    setMode('guest');
    session = null;
    setSyncState('guest');
    hideGate();
    finishBoot();
  }

  function signIn(email, password) {
    var c = ensureClient();
    if (!c) { setAuthMsg('Cloud not configured.', false); return Promise.resolve(); }
    setAuthMsg('Signing in…', true);
    return c.auth.signInWithPassword({ email: email, password: password })
      .then(function (res) {
        if (res.error) throw res.error;
        session = res.data.session;
        return afterUserSession();
      })
      .catch(function (err) {
        setAuthMsg(err.message || 'Sign in failed.', false);
      });
  }

  function signUp(email, password) {
    var c = ensureClient();
    if (!c) { setAuthMsg('Cloud not configured.', false); return Promise.resolve(); }
    if (!email || !password || password.length < 6) {
      setAuthMsg('Use a valid email and password (6+ chars).', false);
      return Promise.resolve();
    }
    setAuthMsg('Creating account…', true);
    return c.auth.signUp({ email: email, password: password })
      .then(function (res) {
        if (res.error) throw res.error;
        if (res.data.session) {
          session = res.data.session;
          return afterUserSession();
        }
        setAuthMsg('Check your email to confirm, then sign in.', true);
      })
      .catch(function (err) {
        setAuthMsg(err.message || 'Sign up failed.', false);
      });
  }

  function sendReset(email) {
    var c = ensureClient();
    if (!c) { setAuthMsg('Cloud not configured.', false); return Promise.resolve(); }
    if (!email) { setAuthMsg('Enter your email.', false); return Promise.resolve(); }
    setAuthMsg('Sending reset link…', true);
    return c.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname })
      .then(function (res) {
        if (res.error) throw res.error;
        setAuthMsg('Reset link sent — check your inbox.', true);
      })
      .catch(function (err) {
        setAuthMsg(err.message || 'Reset failed.', false);
      });
  }

  function signOut() {
    var c = ensureClient();
    var p = c ? c.auth.signOut() : Promise.resolve();
    return p.then(function () {
      session = null;
      setMode('guest');
      setSyncState('guest');
    });
  }

  function handleCloudAction(act, val) {
    if (act === 'guest') { continueGuest(); return; }
    if (act === 'tab') { showGate(renderAuthForm(val)); return; }
    if (act === 'forgot') { showGate(renderForgotForm()); return; }
    if (act === 'conflict') { applyConflictChoice(val); return; }
    var emailEl = document.getElementById('auth-email');
    var passEl = document.getElementById('auth-password');
    var email = emailEl ? emailEl.value.trim() : '';
    var password = passEl ? passEl.value : '';
    if (act === 'signin') signIn(email, password);
    else if (act === 'signup') signUp(email, password);
    else if (act === 'send-reset') sendReset(email);
  }

  function bindGateEvents() {
    var el = getOverlay();
    if (!el || el._cloudBound) return;
    el._cloudBound = true;
    el.addEventListener('click', function (e) {
      var t = e.target.closest('[data-cloud-action]');
      if (!t) return;
      e.preventDefault();
      handleCloudAction(t.getAttribute('data-cloud-action'), t.getAttribute('data-id') || t.getAttribute('data-cloud-id'));
    });
  }

  function tryRestoreSession() {
    var c = ensureClient();
    if (!c) return Promise.resolve(null);
    return c.auth.getSession().then(function (res) {
      if (res.error || !res.data.session) return null;
      session = res.data.session;
      return session;
    });
  }

  function boot(callback) {
    if (booted) {
      if (ready && callback) callback(mode);
      else onReadyCb = callback;
      return;
    }
    booted = true;
    onReadyCb = callback;
    bindGateEvents();
    try { mode = localStorage.getItem(AUTH_MODE_KEY) || null; } catch (e) { mode = null; }

    fetchConfig().then(function () {
      ensureClient();
      if (mode === 'guest') {
        setSyncState('guest');
        hideGate();
        finishBoot();
        return;
      }
      if (mode === 'user' && cloudEnabled) {
        return tryRestoreSession().then(function (sess) {
          if (sess) return afterUserSession();
          setMode(null);
          showGate(renderAuthForm('signin'));
        });
      }
      showGate(renderAuthForm('signin'));
    });
  }

  window.VoidlineCloud = {
    boot: boot,
    isReady: function () { return ready; },
    isGuest: function () { return mode === 'guest'; },
    isLoggedIn: function () { return mode === 'user' && !!session; },
    getEmail: function () { return session && session.user ? session.user.email : null; },
    getMode: function () { return mode; },
    cloudEnabled: function () { return cloudEnabled; },
    onLocalSave: function (playerId, saveJson) { scheduleCloudPush(playerId, saveJson); },
    flushSave: function (playerId, saveJson) { flushCloudPush(playerId, saveJson); },
    signOut: signOut,
    showAuthGate: function () { showGate(renderAuthForm('signin')); },
    switchToGuest: function () { return signOut().then(function () { continueGuest(); }); },
    switchToAccount: function () { showGate(renderAuthForm('signin')); },
    getSyncStatus: getSyncStatus,
    onSyncChange: onSyncChange,
  };
})();
