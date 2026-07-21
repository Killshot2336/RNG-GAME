/* VOIDLINE CHRONOS — canvas game client */
(function () {
  'use strict';

  var D = window.ChronosData;
  if (!D) {
    console.error('ChronosData missing');
    return;
  }

  var SAVE_PREFIX = 'voidline_chronos_v2_';
  var WORLD_KEY = 'voidline_chronos_world_v2';
  var INTRO_KEY = 'voidline_chronos_intro_v1';
  var ROOM = D.ROOM_ID || 'voidline-chronos';
  var SAVE_VERSION = 2;

  var WARBAND = D.WARBAND;
  var ERAS = D.ERAS;
  var PLANETS = D.PLANETS;
  var SHARDS = D.SHARDS;
  var RECIPES = D.RECIPES;
  var RELICS = D.RELICS;
  var TREE = D.TREE;
  var TOWER_UPS = D.TOWER_UPS;
  var STORY = D.STORY;
  var FISH = D.FISH;
  var ART = D.ART || {};

  /* ── Game state ── */
  var G = {
    scene: 'boot',
    activeId: null,
    P: null,
    WORLD: null,
    toast: '',
    toastT: 0,
    shake: 0,
    syncLabel: 'LOCAL',
    hits: [],
    particles: [],
    flash: 0,
    storyOpen: null,
    forge: [null, null],
    selNode: 'root',
    tower: null,
    extract: null,
    fishCast: false,
    time: 0,
    whoIndex: 0,
    chronoDisp: 0,
    embers: [],
    pointer: { x: 0, y: 0, down: false, sx: 0, sy: 0, moved: false },
    remoteVersion: 0,
    fade: 1,
    fadeTarget: 0,
    fadeScene: null,
    whoSlide: 0,
    whoSlideDir: 0,
    whoPrevIndex: 0,
    ctaSquash: 1,
    enterPop: 0,
    bootPulse: 0,
    hubCamX: 0,
    hubCamY: 0,
    hubVelX: 0,
    hubVelY: 0,
    hubFocus: null,
    hitstop: 0,
    camKickX: 0,
    camKickY: 0,
    camZoom: 1,
    introT: 0,
    introDone: false,
    hoverKey: null,
    pressKey: null,
    hoverSfxKey: null,
    ripples: [],
    scenePop: 1
  };

  var canvas, ctx, W = 390, H = 844, dpr = 1;
  var images = {};
  var lastTs = 0;
  var bc = null;
  var audioCtx = null;
  var ambientNodes = null;

  /* Art bible — ash / copper / chronolith cyan. One lighting language. */
  var INK = '#060508';
  var PANEL = 'rgba(12,10,14,0.78)';
  var COPPER = '#d4a05a';
  var COPPER_DIM = 'rgba(212,160,90,0.45)';
  var CORE = '#5ee0d0';
  var CORE_DIM = 'rgba(94,224,208,0.4)';
  var TEXT = '#f2ebe0';
  var TEXT_DIM = '#9a9080';
  var FONT_UI = 'Rajdhani, "Segoe UI", sans-serif';
  var FONT_DISPLAY = 'Cinzel, "Palatino Linotype", serif';

  /* Places in the hub world — props in the vista, not labeled buttons */
  var HUB_PLACES = [
    { id: 'tower', label: 'The Hold', hint: 'Enter the Chronolith', wx: 0.50, wy: 0.38, r: 72, primary: true, prop: 'chronolith' },
    { id: 'forge', label: 'Forge', hint: 'Feed the crucible', wx: 0.15, wy: 0.58, r: 54, prop: 'anvil' },
    { id: 'tree', label: 'Constellation', hint: 'Spend skill', wx: 0.85, wy: 0.50, r: 54, prop: 'stars' },
    { id: 'gate', label: 'Gate', hint: 'Extract exotics', wx: 0.82, wy: 0.72, r: 52, prop: 'arch' },
    { id: 'era', label: 'Ages', hint: 'Timeline', wx: 0.18, wy: 0.44, r: 48, prop: 'dial' },
    { id: 'life', label: 'Shore', hint: 'Fish & garden', wx: 0.30, wy: 0.82, r: 50, prop: 'reeds' },
    { id: 'story', label: 'Lore', hint: 'Transmissions', wx: 0.70, wy: 0.82, r: 48, prop: 'tablet' }
  ];

  /* ── Animation engine ── */
  var tweens = [];

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  function easeOutBack(t) {
    var c = 1.70158;
    return 1 + c * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function approach(cur, target, speed, dt) {
    if (cur < target) return Math.min(target, cur + speed * dt);
    if (cur > target) return Math.max(target, cur - speed * dt);
    return target;
  }

  function tweenTo(obj, key, to, dur, ease, onDone) {
    tweens.push({
      obj: obj, key: key, from: obj[key], to: to,
      t: 0, dur: dur || 0.35,
      ease: ease || easeOutCubic,
      onDone: onDone || null
    });
  }

  function updateTweens(dt) {
    var alive = [];
    for (var i = 0; i < tweens.length; i++) {
      var tw = tweens[i];
      tw.t += dt;
      var u = Math.min(1, tw.t / tw.dur);
      tw.obj[tw.key] = lerp(tw.from, tw.to, tw.ease(u));
      if (u < 1) alive.push(tw);
      else {
        tw.obj[tw.key] = tw.to;
        if (tw.onDone) tw.onDone();
      }
    }
    tweens = alive;
  }

  function transitionTo(scene) {
    if (G.fadeScene === scene && G.fadeTarget === 1) return;
    if (G.scene === scene && G.fade < 0.05 && !G.fadeScene) {
      // still allow re-entry juice for hub
      if (scene === 'hub') G.enterPop = 0;
    }
    G.fadeScene = scene;
    G.fadeTarget = 1;
    beep(220, 0.04);
  }

  function finishTransition() {
    if (!G.fadeScene) return;
    var scene = G.fadeScene;
    if (scene === 'hub' && G.tower) {
      // endTower sets scene; avoid double
    }
    if (scene === 'hub' && G.tower) endTower(false);
    G.scene = scene;
    G.forge = [null, null];
    if (scene === 'hub') {
      G.enterPop = 0;
      G.hubCamX = 0;
      G.hubCamY = 0;
      G.hubVelX = 0;
      G.hubVelY = 0;
      G.hubFocus = null;
      tweenTo(G, 'enterPop', 1, 0.45, easeOutBack);
      if (G.P) G.chronoDisp = G.P.chrono;
    }
    if (scene === 'who') {
      G.whoSlide = 0;
    }
    G.fadeScene = null;
    G.fadeTarget = 0;
    G.scenePop = 0.86;
    tweenTo(G, 'scenePop', 1, 0.4, easeOutBack);
    spawnParts(W * 0.5, H * 0.15, 8, COPPER);
    spawnRipple(W * 0.5, H * 0.2, COPPER);
  }

  function slideWho(dir) {
    if (Math.abs(G.whoSlide) > 0.05) return;
    G.whoPrevIndex = G.whoIndex;
    G.whoSlideDir = dir;
    G.whoIndex = (G.whoIndex + dir + WARBAND.length) % WARBAND.length;
    G.whoSlide = dir;
    tweenTo(G, 'whoSlide', 0, 0.32, easeOutCubic);
    beep(dir > 0 ? 260 : 240, 0.05);
    buzz(8);
  }

  /* ── Utils ── */
  function daySeed() { return Math.floor(Date.now() / 86400000); }

  function warband(id) {
    return WARBAND.find(function (w) { return w.id === id; }) || WARBAND[0];
  }

  function toast(msg) {
    G.toast = String(msg || '');
    G.toastT = 1.4;
  }

  function buzz(p) {
    try { if (navigator.vibrate) navigator.vibrate(p == null ? 16 : p); } catch (e) {}
  }

  function ensureAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) {}
    return audioCtx;
  }

  function beep(freq, dur, type) {
    try {
      var ctxA = ensureAudio();
      if (!ctxA) return;
      var o = ctxA.createOscillator();
      var g = ctxA.createGain();
      o.type = type || 'square';
      o.frequency.value = freq;
      g.gain.value = 0.045;
      o.connect(g); g.connect(ctxA.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctxA.currentTime + (dur || 0.08));
      o.stop(ctxA.currentTime + (dur || 0.08));
    } catch (e) {}
  }

  function sfx(kind) {
    try {
      var ctxA = ensureAudio();
      if (!ctxA) return;
      var t0 = ctxA.currentTime;
      function tone(freq, dur, type, vol, delay) {
        var o = ctxA.createOscillator();
        var g = ctxA.createGain();
        o.type = type || 'square';
        o.frequency.setValueAtTime(freq, t0 + (delay || 0));
        g.gain.setValueAtTime(vol || 0.05, t0 + (delay || 0));
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + (delay || 0) + dur);
        o.connect(g); g.connect(ctxA.destination);
        o.start(t0 + (delay || 0));
        o.stop(t0 + (delay || 0) + dur + 0.02);
      }
      if (kind === 'hit') { tone(180, 0.06, 'sawtooth', 0.05); tone(420, 0.04, 'square', 0.03, 0.02); }
      else if (kind === 'crit') { tone(520, 0.08, 'triangle', 0.06); tone(780, 0.1, 'sine', 0.04, 0.04); }
      else if (kind === 'kill') { tone(90, 0.14, 'sawtooth', 0.07); tone(60, 0.18, 'triangle', 0.04, 0.05); }
      else if (kind === 'boss') { tone(55, 0.28, 'sawtooth', 0.09); tone(110, 0.2, 'square', 0.05, 0.08); }
      else if (kind === 'ability') { tone(280, 0.1, 'triangle', 0.06); tone(440, 0.12, 'sine', 0.04, 0.05); }
      else if (kind === 'ult') { tone(70, 0.22, 'sawtooth', 0.08); tone(140, 0.18, 'square', 0.05, 0.06); tone(560, 0.1, 'sine', 0.04, 0.12); }
      else if (kind === 'wave') { tone(500, 0.1, 'triangle', 0.05); tone(660, 0.08, 'sine', 0.03, 0.06); }
      else if (kind === 'intro') { tone(80, 0.4, 'sine', 0.05); tone(160, 0.5, 'triangle', 0.03, 0.15); }
      else if (kind === 'ui') { tone(360, 0.07, 'triangle', 0.04); }
      else beep(320, 0.08);
    } catch (e) {}
  }

  function startAmbient() {
    try {
      var ctxA = ensureAudio();
      if (!ctxA || ambientNodes) return;
      var master = ctxA.createGain();
      master.gain.value = 0.018;
      master.connect(ctxA.destination);
      var drone = ctxA.createOscillator();
      drone.type = 'sine';
      drone.frequency.value = 55;
      var droneG = ctxA.createGain();
      droneG.gain.value = 0.7;
      drone.connect(droneG); droneG.connect(master);
      var pulse = ctxA.createOscillator();
      pulse.type = 'triangle';
      pulse.frequency.value = 110;
      var pulseG = ctxA.createGain();
      pulseG.gain.value = 0.25;
      pulse.connect(pulseG); pulseG.connect(master);
      var lfo = ctxA.createOscillator();
      lfo.frequency.value = 0.08;
      var lfoG = ctxA.createGain();
      lfoG.gain.value = 0.012;
      lfo.connect(lfoG); lfoG.connect(master.gain);
      drone.start(); pulse.start(); lfo.start();
      ambientNodes = { master: master, drone: drone, pulse: pulse, lfo: lfo };
    } catch (e) {}
  }

  function setAmbientGain(v) {
    if (!ambientNodes || !ambientNodes.master) return;
    try {
      ambientNodes.master.gain.setTargetAtTime(v, audioCtx.currentTime, 0.4);
    } catch (e) {}
  }

  function shake(ms) { G.shake = Math.max(G.shake, (ms || 200) / 1000); }

  function punchCam(dx, dy, zoom) {
    G.camKickX = (dx || 0) + (Math.random() - 0.5) * 4;
    G.camKickY = (dy || 0) + (Math.random() - 0.5) * 4;
    if (zoom) G.camZoom = Math.max(G.camZoom, zoom);
  }

  function hitstop(ms) {
    G.hitstop = Math.max(G.hitstop, (ms || 40) / 1000);
  }

  function spawnParts(x, y, n, color) {
    for (var i = 0; i < n; i++) {
      G.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 220,
        vy: (Math.random() - 0.5) * 220 - 40,
        life: 0.35 + Math.random() * 0.35,
        max: 0.7,
        color: color || '#ffd36a',
        r: 2 + Math.random() * 3
      });
    }
  }

  function hit(id, x, y, w, h, data) {
    G.hits.push({ id: id, x: x, y: y, w: w, h: h, data: data || null });
  }

  function hitAt(x, y) {
    for (var i = G.hits.length - 1; i >= 0; i--) {
      var h = G.hits[i];
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h;
    }
    return null;
  }

  function hitKey(id, data) {
    return id + ':' + (data == null ? '' : String(data));
  }

  function pointerIn(x, y, w, h) {
    return G.pointer.x >= x && G.pointer.x <= x + w && G.pointer.y >= y && G.pointer.y <= y + h;
  }

  function pointerInCircle(cx, cy, r) {
    return Math.hypot(G.pointer.x - cx, G.pointer.y - cy) <= r;
  }

  function isHot(id, data) {
    return G.hoverKey === hitKey(id, data);
  }

  function isPressed(id, data) {
    return G.pointer.down && G.pressKey === hitKey(id, data);
  }

  function interactScale(id, data) {
    if (isPressed(id, data)) return 0.9;
    if (isHot(id, data)) return 1.07 + Math.sin(G.time * 6) * 0.012;
    return 1;
  }

  function refreshHover() {
    var h = hitAt(G.pointer.x, G.pointer.y);
    var next = h ? hitKey(h.id, h.data) : null;
    if (next && next !== G.hoverSfxKey && !G.pointer.down) {
      sfx('ui');
      buzz(4);
    }
    G.hoverSfxKey = next;
    G.hoverKey = next;
  }

  function spawnRipple(x, y, color) {
    G.ripples.push({
      x: x, y: y,
      life: 0.45,
      max: 0.45,
      color: color || CORE
    });
  }

  function updateRipples(dt) {
    G.ripples = G.ripples.filter(function (r) {
      r.life -= dt;
      return r.life > 0;
    });
  }

  function drawRipples() {
    G.ripples.forEach(function (r) {
      var u = 1 - r.life / r.max;
      var a = (1 - u) * 0.7;
      var rad = 8 + u * 52;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2.5 - u * 1.5;
      ctx.beginPath();
      ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = a * 0.35;
      ctx.fillStyle = r.color;
      ctx.beginPath();
      ctx.arc(r.x, r.y, rad * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function beginInteract(cx, cy, scale) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
  }

  function endInteract() {
    ctx.restore();
  }

  function drawFocusAura(cx, cy, r, hot, accent) {
    if (!hot && !accent) return;
    var pulse = 1 + Math.sin(G.time * 5) * 0.08;
    var rad = r * pulse;
    var grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad);
    grd.addColorStop(0, hot ? 'rgba(94,224,208,0.35)' : 'rgba(212,160,90,0.2)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
    if (hot) {
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(94,224,208,' + (0.45 + Math.sin(G.time * 7) * 0.2) + ')';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function tapFeedback(h) {
    if (!h) return;
    spawnRipple(h.x + h.w / 2, h.y + h.h / 2, CORE);
    sfx('ui');
    buzz(10);
    G.flash = Math.max(G.flash, 0.08);
  }

  function img(key) { return images[key] || null; }

  function drawImg(key, x, y, w, h, alpha) {
    var im = img(key);
    if (!im || !im.complete || !im.naturalWidth) {
      ctx.fillStyle = 'rgba(20,16,14,0.9)';
      ctx.fillRect(x, y, w, h);
      return;
    }
    ctx.save();
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.drawImage(im, x, y, w, h);
    ctx.restore();
  }

  function coverImg(key, x, y, w, h, ox, oy) {
    var im = img(key);
    if (!im || !im.complete || !im.naturalWidth) {
      ctx.fillStyle = '#08060a';
      ctx.fillRect(x, y, w, h);
      return;
    }
    ox = ox == null ? 0.5 : ox;
    oy = oy == null ? 0.4 : oy;
    var ir = im.naturalWidth / im.naturalHeight;
    var rr = w / h;
    var dw, dh, dx, dy;
    if (ir > rr) { dh = h; dw = h * ir; } else { dw = w; dh = w / ir; }
    dx = x + (w - dw) * ox;
    dy = y + (h - dh) * oy;
    ctx.drawImage(im, dx, dy, dw, dh);
  }

  function text(str, x, y, opts) {
    opts = opts || {};
    ctx.save();
    var face = opts.display ? FONT_DISPLAY : FONT_UI;
    ctx.font = (opts.weight || (opts.display ? '700' : '600')) + ' ' + (opts.size || 18) + 'px ' + face;
    ctx.fillStyle = opts.color || TEXT;
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = opts.base || 'alphabetic';
    if (opts.shadow !== false) {
      ctx.shadowColor = opts.glow ? (opts.glowColor || CORE_DIM) : 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = opts.blur != null ? opts.blur : (opts.glow ? 14 : 8);
      ctx.shadowOffsetY = opts.glow ? 0 : 2;
    }
    ctx.fillText(str, x, y);
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    r = Math.min(r || 8, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function softPlate(x, y, w, h, r) {
    /* mist band — no web card border */
    r = r == null ? 14 : r;
    roundRect(x, y, w, h, r);
    var g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(8,6,10,0.55)');
    g.addColorStop(1, 'rgba(8,6,10,0.78)');
    ctx.fillStyle = g;
    ctx.fill();
  }

  function closeSeal(x, y) {
    var hot = pointerInCircle(x, y, 22);
    var press = G.pointer.down && hot && (G.pressKey === 'hub:' || G.pressKey === 'flee:');
    var sc = press ? 0.88 : hot ? 1.1 : 1;
    beginInteract(x, y, sc);
    if (hot) drawFocusAura(x, y, 26, true);
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6,5,8,0.65)';
    ctx.fill();
    ctx.strokeStyle = hot ? CORE : 'rgba(212,160,90,0.5)';
    ctx.lineWidth = hot ? 2.2 : 1.5;
    ctx.stroke();
    text('✕', x, y + 6, { align: 'center', size: 15, color: TEXT, shadow: false });
    endInteract();
  }

  function drawBattleCta(x, y, w, h, label, hitId, hitData) {
    var hot = hitId ? isHot(hitId, hitData) : pointerIn(x, y, w, h);
    var press = hitId ? isPressed(hitId, hitData) : (G.pointer.down && pointerIn(x, y, w, h));
    var pulse = 1 + Math.sin(G.time * 2.6) * 0.018;
    var squash = (G.ctaSquash || 1) * (press ? 0.92 : hot ? 1.05 : 1);
    var scale = pulse * squash;
    var cx = x + w / 2, cy = y + h / 2;
    beginInteract(cx, cy, scale);
    if (hot) drawFocusAura(cx, cy, Math.max(w, h) * 0.55, true);
    var im = img('uiBtn');
    if (im && im.complete && im.naturalWidth) {
      ctx.drawImage(im, x, y, w, h);
    } else {
      var g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, '#ffe2a8');
      g.addColorStop(0.45, '#d4a05a');
      g.addColorStop(1, '#8a5a28');
      roundRect(x, y, w, h, 8);
      ctx.fillStyle = g;
      ctx.fill();
    }
    var shx = x + ((G.time * 90) % (w + 80)) - 40;
    ctx.fillStyle = 'rgba(255,255,255,' + (hot ? 0.2 : 0.12) + ')';
    ctx.fillRect(shx, y + 6, 28, h - 12);
    text(label, x + w / 2, y + h * 0.58, {
      align: 'center', size: Math.min(26, Math.floor(h * 0.38)), color: '#1a1008',
      shadow: false, weight: '800', display: true
    });
    endInteract();
  }

  function drawPlateBtn(x, y, w, h, label, opts) {
    opts = opts || {};
    var hot = pointerIn(x, y, w, h);
    var sc = (G.pointer.down && hot) ? 0.94 : hot ? 1.05 : 1;
    beginInteract(x + w / 2, y + h / 2, sc);
    if (hot) drawFocusAura(x + w / 2, y + h / 2, Math.max(w, h) * 0.5, true);
    softPlate(x, y, w, h, opts.r == null ? 12 : opts.r);
    text(label, x + w / 2, y + h * 0.62, {
      align: 'center',
      size: opts.size || 14,
      color: opts.color || COPPER,
      glow: !!opts.glow || hot,
      glowColor: COPPER_DIM,
      weight: '700'
    });
    endInteract();
  }

  function runeChip(x, y, s, label, accent, hot) {
    var sc = hot ? 1.08 + Math.sin(G.time * 6) * 0.02 : 1;
    if (hot && G.pointer.down) sc = 0.9;
    beginInteract(x, y, sc);
    if (hot) drawFocusAura(x, y, s * 0.75, true, accent);
    ctx.beginPath();
    ctx.arc(x, y, s / 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8,6,10,0.7)';
    ctx.fill();
    ctx.strokeStyle = hot ? CORE : (accent || COPPER);
    ctx.lineWidth = hot ? 2.8 : 2;
    ctx.shadowColor = hot ? CORE_DIM : (accent || COPPER_DIM);
    ctx.shadowBlur = hot ? 14 : 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    if (label) {
      text(label, x, y + 5, { align: 'center', size: Math.max(10, s * 0.22), color: TEXT, shadow: false });
    }
    endInteract();
  }

  function fillPanel(x, y, w, h) { softPlate(x, y, w, h, 14); }
  function drawTacticalBtn(x, y, w, h, label, opts) {
    opts = opts || {};
    if (opts.hot) drawBattleCta(x, y, w, h, label);
    else drawPlateBtn(x, y, w, h, label, { size: opts.size || 14, glow: true });
  }

  /* ── Save / player ── */
  function freshPlayer(id) {
    var shards = {};
    SHARDS.forEach(function (s) { shards[s.id] = 0; });
    shards.bone = 8; shards.ore = 6;
    return {
      v: SAVE_VERSION, id: id, chrono: 160, essence: 0, skillPoints: 4,
      unlocked: ['root'],
      loadout: id === 'jamie' ? 'bulwark' : id === 'edward' ? 'warden' : 'rift',
      relics: [], shards: shards, exotics: {},
      towerUp: { damage: 0, rate: 0, core: 0, range: 0, luck: 0 },
      wavesBest: 0, bossesKilled: 0, totalMerged: 0, fishCaught: 0,
      garden: [0, 0, 0, 0], gardenPlanted: [0, 0, 0, 0],
      dailyClaimed: 0, streak: 0, lastSeen: Date.now(), _introSeen: false
    };
  }

  function freshWorld() {
    return {
      v: SAVE_VERSION, eraIndex: 0, erasCleared: [], planetsUnlocked: ['cinder'],
      sharedBank: {}, presence: {}, storyChapter: 0, dailySeed: daySeed(),
      coop: null,
      quest: { id: 'hold5', name: 'Hold wave 5', prog: 0, target: 5, reward: 40 },
      updatedAt: Date.now()
    };
  }

  function migratePlayer(data, id) {
    var base = freshPlayer(id);
    var p = Object.assign(base, data || {});
    p.shards = Object.assign(base.shards, (data && data.shards) || {});
    p.towerUp = Object.assign(base.towerUp, (data && data.towerUp) || {});
    p.exotics = Object.assign({}, (data && data.exotics) || {});
    return p;
  }

  function loadWorld() {
    try {
      var raw = localStorage.getItem(WORLD_KEY);
      if (raw) return Object.assign(freshWorld(), JSON.parse(raw));
    } catch (e) {}
    return freshWorld();
  }

  function saveWorld() {
    if (!G.WORLD) return;
    G.WORLD.updatedAt = Date.now();
    try { localStorage.setItem(WORLD_KEY, JSON.stringify(G.WORLD)); } catch (e) {}
    if (bc) {
      try { bc.postMessage({ type: 'world', world: G.WORLD }); } catch (e) {}
    }
  }

  function loadPlayer(id) {
    try {
      var raw = localStorage.getItem(SAVE_PREFIX + id) || localStorage.getItem('voidline_chronos_v1_' + id);
      if (raw) { G.P = migratePlayer(JSON.parse(raw), id); return; }
    } catch (e) {}
    G.P = freshPlayer(id);
  }

  function savePlayer() {
    if (!G.P || !G.activeId) return;
    G.P.lastSeen = Date.now();
    try { localStorage.setItem(SAVE_PREFIX + G.activeId, JSON.stringify(G.P)); } catch (e) {}
    if (G.WORLD) {
      G.WORLD.presence[G.activeId] = Date.now();
      saveWorld();
    }
  }

  function claimDaily() {
    var d = daySeed();
    if (G.P.dailyClaimed === d) return;
    if (G.P.dailyClaimed === d - 1) G.P.streak = (G.P.streak || 0) + 1;
    else G.P.streak = 1;
    G.P.dailyClaimed = d;
    G.P.chrono += 40 + G.P.streak * 8;
    G.P.skillPoints += 1;
  }

  function hasNode(id) { return G.P && G.P.unlocked.indexOf(id) >= 0; }
  function nodeById(id) { return TREE.find(function (n) { return n.id === id; }); }
  function canUnlock(node) {
    if (!G.P || !node || hasNode(node.id)) return false;
    if (G.P.skillPoints < node.cost) return false;
    return node.req.every(function (r) { return hasNode(r); });
  }

  function aggregateStats() {
    var stats = { dmg: 0, armor: 0, crit: 0, chain: 0, regen: 0, shield: 0, slow: 0, heal: 0, bossDmg: 0, mergeLuck: 0, extract: 0, chronoGain: 0, lifeYield: 0, aura: 0, coopPower: 0, coreMult: 0, phoenix: 0, quake: 0, freeze: 0, nova: 0, gateBreak: 0 };
    (G.P.unlocked || []).forEach(function (id) {
      var n = nodeById(id);
      if (!n || !n.stats) return;
      Object.keys(n.stats).forEach(function (k) { stats[k] = (stats[k] || 0) + n.stats[k]; });
    });
    (G.P.relics || []).forEach(function (rid) {
      var b = RELICS[rid];
      if (!b) return;
      Object.keys(b).forEach(function (k) {
        if (k === 'label') return;
        stats[k] = (stats[k] || 0) + b[k];
      });
    });
    return stats;
  }

  /* ── Tower combat (canvas) ── */
  function towerDps() {
    var s = aggregateStats();
    var up = G.P.towerUp.damage || 0;
    var base = 16 + up * 5;
    var role = G.P.loadout === 'rift' ? 1.2 : G.P.loadout === 'bulwark' ? 0.85 : 0.9;
    return base * (1 + s.dmg) * role * (1 + (s.coopPower || 0));
  }
  function towerFireRate() { return Math.max(0.16, 0.52 - (G.P.towerUp.rate || 0) * 0.028); }
  function towerMaxHp() {
    var s = aggregateStats();
    return Math.floor((260 + (G.P.towerUp.core || 0) * 45) * (1 + s.armor) * (1 + (s.coreMult || 0)));
  }

  function startTower(coop) {
    var s = aggregateStats();
    G.tower = {
      running: true, coop: !!coop, t: 0, wave: 1, spawnAcc: 0, fireAcc: 0,
      coreHp: towerMaxHp(), coreMax: towerMaxHp(),
      enemies: [], fx: [],
      cds: { primary: 0, secondary: 0, ultimate: 0 },
      frozen: 0, phoenixUsed: false, kills: 0, chronoEarned: 0,
      shield: s.shield || 0,
      gates: { bulwark: 0, rift: 0, warden: 0 },
      combo: 0
    };
    G.scene = 'tower';
    G.fade = 0;
    G.fadeTarget = 0;
    G.fadeScene = null;
    G.flash = 0.4;
    G.camZoom = 1.08;
    shake(220);
    punchCam(0, 6, 1.1);
    sfx('wave');
    buzz(20);
    spawnParts(W * 0.5, H * 0.52, 18, CORE);
    setAmbientGain(0.028);
  }

  function endTower(won) {
    if (!G.tower) return;
    var t = G.tower;
    var s = aggregateStats();
    var gain = Math.floor(t.chronoEarned * (1 + (s.chronoGain || 0)));
    G.P.chrono += gain;
    G.P.essence += Math.floor(t.wave / 2);
    if (t.wave > G.P.wavesBest) G.P.wavesBest = t.wave;
    if (G.WORLD.quest && G.WORLD.quest.id === 'hold5') {
      G.WORLD.quest.prog = Math.max(G.WORLD.quest.prog || 0, t.wave);
      if (G.WORLD.quest.prog >= G.WORLD.quest.target && !G.WORLD.quest.done) {
        G.WORLD.quest.done = true;
        G.P.chrono += G.WORLD.quest.reward;
        toast('QUEST CLEAR');
      }
    }
    if (t.wave >= 6) {
      var era = ERAS[G.WORLD.eraIndex];
      if (era && G.WORLD.erasCleared.indexOf(era.id) < 0) {
        G.WORLD.erasCleared.push(era.id);
        if (G.WORLD.eraIndex < ERAS.length - 1) {
          G.WORLD.eraIndex++;
          G.WORLD.storyChapter = Math.min(STORY.length - 1, G.WORLD.eraIndex + 1);
          G.storyOpen = G.WORLD.storyChapter;
        }
        G.P.skillPoints += 2;
        toast('ERA STABILIZED');
        PLANETS.forEach(function (pl) {
          if (pl.eraNeed <= G.WORLD.eraIndex && G.WORLD.planetsUnlocked.indexOf(pl.id) < 0) {
            G.WORLD.planetsUnlocked.push(pl.id);
          }
        });
      }
    }
    toast((won ? 'HOLD' : 'BREACH') + ' +' + gain);
    sfx(won ? 'wave' : 'boss');
    G.tower = null;
    G.camKickX = 0;
    G.camKickY = 0;
    G.camZoom = 1;
    G.scene = 'hub';
    setAmbientGain(0.018);
    savePlayer();
  }

  function spawnEnemy(wave) {
    var roll = Math.random();
    var type = 'swarm';
    if (wave % 5 === 0) type = 'boss';
    else if (wave >= 4 && roll > 0.8) type = 'brute';
    else if (wave >= 3 && roll > 0.62) type = 'flyer';
    var side = Math.floor(Math.random() * 4);
    var x = W * 0.5, y = H * 0.35;
    if (side === 0) { x = Math.random() * W; y = -20; }
    if (side === 1) { x = W + 20; y = Math.random() * H * 0.7; }
    if (side === 2) { x = Math.random() * W; y = H * 0.75; }
    if (side === 3) { x = -20; y = Math.random() * H * 0.7; }
    var hp = type === 'boss' ? 220 + wave * 55 : type === 'brute' ? 60 + wave * 12 : type === 'flyer' ? 24 + wave * 5 : 18 + wave * 6;
    var spd = type === 'flyer' ? 90 + wave * 4 : type === 'brute' ? 36 + wave : type === 'boss' ? 28 : 55 + wave * 2;
    var accent = (ERAS[G.WORLD.eraIndex] && ERAS[G.WORLD.eraIndex].accent) || '#ff6a3d';
    G.tower.enemies.push({
      id: Math.random().toString(36).slice(2, 7),
      type: type, x: x, y: y, hp: hp, max: hp, spd: spd, tint: accent, hit: 0,
      phase: Math.random() * Math.PI * 2, wobble: 0.6 + Math.random() * 0.8
    });
  }

  function damageEnemy(e, amt, tag) {
    var s = aggregateStats();
    var dmg = amt;
    if (e.type === 'boss') dmg *= 1 + (s.bossDmg || 0);
    var crit = Math.random() < (0.08 + (s.crit || 0));
    if (crit) dmg *= 2;
    dmg = Math.max(1, Math.floor(dmg));
    e.hp -= dmg;
    e.hit = crit ? 0.18 : 0.12;
    G.tower.fx.push({ kind: 'dmg', x: e.x, y: e.y - 16, life: 0.7, text: String(dmg), crit: crit });
    G.tower.fx.push({ kind: 'spark', x: e.x, y: e.y, life: 0.28 });
    G.tower.fx.push({ kind: 'slash', x: e.x, y: e.y, life: 0.18, ang: Math.random() * Math.PI, crit: crit });
    G.tower.combo++;
    if (tag) G.tower.gates[tag] = (G.tower.gates[tag] || 0) + 1;
    hitstop(crit ? 55 : 28);
    punchCam((e.x - W * 0.5) * 0.02, (e.y - H * 0.52) * 0.02, crit ? 1.06 : 1.03);
    if (crit) sfx('crit'); else sfx('hit');
    if (e.hp <= 0) {
      G.tower.kills++;
      G.tower.chronoEarned += e.type === 'boss' ? 50 : e.type === 'brute' ? 9 : 3;
      spawnParts(e.x, e.y, e.type === 'boss' ? 22 : 10, e.tint);
      G.tower.fx.push({ kind: 'burst', x: e.x, y: e.y, life: 0.4, r: e.type === 'boss' ? 70 : 36, color: e.tint });
      if (e.type === 'boss') {
        G.P.bossesKilled++;
        G.P.skillPoints += 1;
        shake(320);
        hitstop(120);
        punchCam(0, 10, 1.14);
        sfx('boss');
      } else {
        sfx('kill');
        hitstop(45);
      }
      return true;
    }
    return false;
  }

  function fireAtNearest() {
    var t = G.tower;
    if (!t.enemies.length) return;
    var cx = W * 0.5, cy = H * 0.52;
    var range = 120 + (G.P.towerUp.range || 0) * 14;
    var best = null, bestD = 1e9;
    t.enemies.forEach(function (e) {
      var d = Math.hypot(e.x - cx, e.y - cy);
      if (d < bestD && d <= range) { bestD = d; best = e; }
    });
    if (!best) return;
    var dmg = towerDps() * 0.38;
    t.fx.push({ kind: 'beam', x1: cx, y1: cy, x2: best.x, y2: best.y, life: 0.16 });
    t.fx.push({ kind: 'muzzle', x: cx, y: cy, life: 0.2 });
    spawnParts(best.x, best.y, 3, CORE);
    damageEnemy(best, dmg, G.P.loadout === 'rift' ? 'rift' : null);
    var s = aggregateStats();
    if (s.chain > 0) {
      var chained = 0;
      t.enemies.forEach(function (e) {
        if (e === best || chained >= s.chain) return;
        if (Math.hypot(e.x - best.x, e.y - best.y) < 90) {
          t.fx.push({ kind: 'beam', x1: best.x, y1: best.y, x2: e.x, y2: e.y, life: 0.1 });
          damageEnemy(e, dmg * 0.55, 'rift');
          chained++;
        }
      });
    }
    t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
  }

  function useAbility(slot) {
    var t = G.tower;
    if (!t || !t.running) return;
    var s = aggregateStats();
    var cx = W * 0.5, cy = H * 0.52;
    if (slot === 'primary') {
      if (t.cds.primary > 0) return;
      t.cds.primary = 2;
      if (G.P.loadout === 'bulwark') {
        t.enemies.forEach(function (e) {
          e.x += (cx - e.x) * 0.4;
          e.y += (cy - e.y) * 0.4;
        });
        t.gates.bulwark++;
        t.fx.push({ kind: 'ring', x: cx, y: cy, life: 0.45, r: 40, color: COPPER });
        toast('TAUNT');
      } else if (G.P.loadout === 'warden') {
        t.coreHp = Math.min(t.coreMax, t.coreHp + 40 + (s.heal || 0) * 80);
        t.gates.warden++;
        t.fx.push({ kind: 'ring', x: cx, y: cy, life: 0.5, r: 50, color: CORE });
        toast('MEND');
      } else {
        t.enemies.forEach(function (e) { damageEnemy(e, towerDps(), 'rift'); });
        t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
        t.fx.push({ kind: 'nova', x: cx, y: cy, life: 0.4, r: 120, color: CORE });
        toast('ARC');
      }
      sfx('ability'); buzz(12); hitstop(40); punchCam(0, 4, 1.05);
    } else if (slot === 'secondary') {
      if (t.cds.secondary > 0) return;
      t.cds.secondary = 5;
      if (s.quake || G.P.loadout === 'bulwark') {
        t.enemies.forEach(function (e) {
          if (Math.hypot(e.x - cx, e.y - cy) < 160) {
            e.spd *= 0.15;
            damageEnemy(e, 50, 'bulwark');
          }
        });
        t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
        t.fx.push({ kind: 'quake', x: cx, y: cy, life: 0.5, r: 160 });
        shake(200); toast('QUAKE');
      } else if (s.freeze || G.P.loadout === 'rift') {
        t.frozen = s.freeze || 1.2;
        t.gates.rift++;
        t.fx.push({ kind: 'freeze', x: cx, y: cy, life: 0.6, r: 180 });
        toast('TIMELINE');
      } else {
        t.shield += 55;
        t.gates.warden++;
        t.fx.push({ kind: 'ring', x: cx, y: cy, life: 0.55, r: 70, color: CORE });
        toast('WARD');
      }
      sfx('ability'); buzz(18); hitstop(50); punchCam(0, 6, 1.07);
    } else if (slot === 'ultimate') {
      if (t.cds.ultimate > 0) return;
      t.cds.ultimate = 12;
      var ult = towerDps() * 2.4;
      if (s.nova) t.enemies.forEach(function (e) { damageEnemy(e, ult, 'rift'); });
      else t.enemies.slice(0, 6).forEach(function (e) { damageEnemy(e, ult, G.P.loadout); });
      t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
      t.fx.push({ kind: 'nova', x: cx, y: cy, life: 0.55, r: 200, color: COPPER });
      t.fx.push({ kind: 'burst', x: cx, y: cy, life: 0.45, r: 90, color: CORE });
      G.flash = 0.35;
      shake(280);
      hitstop(90);
      punchCam(0, 12, 1.16);
      toast('OVERLOAD');
      sfx('ult');
      buzz([30, 40, 30]);
    }
  }

  function updateTower(dt) {
    var t = G.tower;
    if (!t || !t.running) return;
    if (G.hitstop > 0) {
      G.hitstop -= dt;
      // still tick light fx during hitstop for juice
      t.fx = t.fx.map(function (f) { f.life -= dt * 0.35; return f; }).filter(function (f) { return f.life > 0; });
      return;
    }
    var s = aggregateStats();
    t.t += dt;
    if (t.frozen > 0) t.frozen -= dt;
    Object.keys(t.cds).forEach(function (k) {
      if (t.cds[k] > 0) t.cds[k] = Math.max(0, t.cds[k] - dt);
    });
    t.spawnAcc += dt;
    if (t.spawnAcc >= Math.max(0.4, 1.35 - t.wave * 0.055)) {
      t.spawnAcc = 0;
      spawnEnemy(t.wave);
    }
    if (t.t > t.wave * 11.5) {
      t.wave++; t.t = 0; t.chronoEarned += 6;
      toast('WAVE ' + t.wave);
      sfx('wave');
      G.flash = 0.2;
      punchCam(0, 4, 1.05);
      if (t.wave > 14) { endTower(true); return; }
    }
    if (s.regen > 0) t.coreHp = Math.min(t.coreMax, t.coreHp + s.regen * dt * 0.3);
    t.fireAcc += dt;
    if (t.fireAcc >= towerFireRate()) { t.fireAcc = 0; fireAtNearest(); }
    var slow = 1 - Math.min(0.55, s.slow || 0);
    if (t.frozen > 0) slow *= 0.12;
    var cx = W * 0.5, cy = H * 0.52;
    t.enemies.forEach(function (e) {
      if (e.hit > 0) e.hit -= dt;
      e.phase = (e.phase || 0) + dt * (e.type === 'flyer' ? 8 : 4);
      var dx = cx - e.x, dy = cy - e.y;
      var len = Math.hypot(dx, dy) || 1;
      e.x += (dx / len) * e.spd * slow * dt;
      e.y += (dy / len) * e.spd * slow * dt;
      if (e.type === 'flyer') {
        e.x += Math.sin(e.phase) * 18 * dt;
        e.y += Math.cos(e.phase * 0.7) * 10 * dt;
      }
      if (Math.hypot(e.x - cx, e.y - cy) < 28) {
        var hitAmt = e.type === 'boss' ? 32 : e.type === 'brute' ? 15 : 8;
        hitAmt *= (1 - Math.min(0.55, s.armor || 0));
        if (t.shield > 0) {
          t.shield -= hitAmt;
          if (t.shield < 0) { t.coreHp += t.shield; t.shield = 0; }
        } else t.coreHp -= hitAmt;
        e.hp = 0;
        t.fx.push({ kind: 'burst', x: e.x, y: e.y, life: 0.3, r: 28, color: e.tint });
        shake(120); buzz(25); hitstop(35); punchCam(0, 5, 1.04);
      }
    });
    t.enemies = t.enemies.filter(function (e) { return e.hp > 0; });
    t.fx = t.fx.map(function (f) { f.life -= dt; return f; }).filter(function (f) { return f.life > 0; });
    if (t.coreHp <= 0) {
      if ((s.phoenix || 0) && !t.phoenixUsed) {
        t.phoenixUsed = true;
        t.coreHp = t.coreMax * 0.45;
        t.fx.push({ kind: 'nova', x: cx, y: cy, life: 0.5, r: 140, color: COPPER });
        toast('PHOENIX');
        sfx('ult');
      } else endTower(false);
    }
  }

  /* ── Scene actions ── */
  function pickPlayer(id) {
    G.activeId = id;
    loadPlayer(id);
    G.WORLD = loadWorld();
    claimDaily();
    G.WORLD.presence[id] = Date.now();
    saveWorld();
    if (G.WORLD.storyChapter === 0 && !G.P._introSeen) {
      G.storyOpen = 0;
      G.P._introSeen = true;
    }
    G.chronoDisp = G.P.chrono;
    beep(360, 0.1);
    sfx('ui');
    buzz([16, 24, 16]);
    spawnParts(W * 0.5, H * 0.5, 22, warband(id).accent);
    savePlayer();
    G.flash = 0.35;
    shake(180);
    startAmbient();
    setAmbientGain(0.018);
    transitionTo('hub');
  }

  function go(scene) {
    if (!scene) return;
    if (scene === G.scene && G.fadeTarget === 0 && !G.fadeScene) {
      if (scene === 'hub') tweenTo(G, 'enterPop', 1, 0.35, easeOutBack);
      return;
    }
    transitionTo(scene);
  }

  function tryMerge() {
    var a = G.forge[0], b = G.forge[1];
    if (!a || !b) { toast('NEED TWO'); return; }
    function hasMat(id) { return (G.P.shards[id] || 0) >= 1 || (G.P.exotics[id] || 0) >= 1; }
    function take(id) {
      if ((G.P.shards[id] || 0) >= 1) G.P.shards[id]--;
      else if ((G.P.exotics[id] || 0) >= 1) G.P.exotics[id]--;
    }
    if (!hasMat(a) || !hasMat(b)) { toast('MISSING'); return; }
    take(a); take(b);
    var recipe = RECIPES.find(function (r) {
      return (r.a === a && r.b === b) || (r.a === b && r.b === a);
    });
    if (!recipe) {
      G.P.chrono += 10;
      toast('SCRAP +10');
    } else if (recipe.relic) {
      if (G.P.relics.indexOf(recipe.out) < 0) G.P.relics.push(recipe.out);
      toast(recipe.name.toUpperCase());
      shake(220);
    } else {
      G.P.shards[recipe.out] = (G.P.shards[recipe.out] || 0) + 1;
      toast('FORGED ' + recipe.name);
    }
    G.P.totalMerged++;
    G.P.essence += 1;
    if (G.P.totalMerged % 3 === 0) G.P.skillPoints += 1;
    G.forge = [null, null];
    G.flash = 0.4;
    beep(200, 0.12, 'triangle');
    savePlayer();
  }

  /* ── Draw scenes ── */
  function drawBoot() {
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H);
    coverImg('hub', 0, 0, W, H, 0.5, 0.4);
    ctx.fillStyle = 'rgba(6,5,8,0.55)';
    ctx.fillRect(0, 0, W, H);
    text('Voidline', W / 2, H * 0.42, {
      align: 'center', size: 15, color: COPPER, display: true, glow: true, glowColor: COPPER_DIM
    });
    text('Chronos', W / 2, H * 0.5, {
      align: 'center', size: 48, color: TEXT, display: true, glow: true, glowColor: CORE_DIM, blur: 18
    });
    text('Waking the Chronolith…', W / 2, H * 0.58, {
      align: 'center', size: 14, color: TEXT_DIM, shadow: false
    });
  }

  function introSeen() {
    try { return localStorage.getItem(INTRO_KEY) === '1'; } catch (e) { return false; }
  }

  function markIntroSeen() {
    try { localStorage.setItem(INTRO_KEY, '1'); } catch (e) {}
    G.introDone = true;
  }

  function finishIntro() {
    if (G.scene !== 'intro') return;
    markIntroSeen();
    G.flash = 0.25;
    transitionTo('who');
  }

  function drawIntro() {
    var t = G.introT || 0;
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H);
    coverImg('tower', 0, 0, W, H, 0.5, 0.42);
    var veil = 0.75 - Math.min(0.35, t * 0.08);
    ctx.fillStyle = 'rgba(6,5,8,' + veil + ')';
    ctx.fillRect(0, 0, W, H);

    // chronolith heartbeat
    var cx = W / 2, cy = H * 0.42;
    var pulse = 1 + Math.sin(t * 3.2) * 0.08;
    var glowR = 40 + Math.min(80, t * 22) * pulse;
    var grd = ctx.createRadialGradient(cx, cy, 4, cx, cy, glowR);
    grd.addColorStop(0, 'rgba(223,255,234,0.95)');
    grd.addColorStop(0.35, 'rgba(94,224,208,0.55)');
    grd.addColorStop(1, 'rgba(6,5,8,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(cx, cy, glowR, 0, Math.PI * 2); ctx.fill();

    // swarm shadows closing in after beat 1
    if (t > 1.1) {
      var swarmA = Math.min(1, (t - 1.1) / 0.8);
      for (var i = 0; i < 9; i++) {
        var ang = (i / 9) * Math.PI * 2 + t * 0.6;
        var dist = 160 - swarmA * 90 + Math.sin(t * 4 + i) * 8;
        var ex = cx + Math.cos(ang) * dist;
        var ey = cy + Math.sin(ang) * dist * 0.7;
        ctx.globalAlpha = swarmA * 0.85;
        ctx.fillStyle = (ERAS[0] && ERAS[0].accent) || '#ff6a3d';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.ellipse(ex, ey, 10 + (i % 3) * 3, 6 + (i % 2) * 2, ang, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    var line1 = t < 1.2 ? 'The Chronolith wakes' : t < 2.6 ? 'The swarm smells time' : 'Three operatives. One hold.';
    var line2 = t < 1.2 ? '' : t < 2.6 ? 'Hold the core — or lose the age.' : 'Choose who stands the timeline.';
    text('VOIDLINE', W / 2, H * 0.18, {
      align: 'center', size: 14, color: COPPER, display: true, glow: true, glowColor: COPPER_DIM
    });
    text(line1, W / 2, H * 0.68, {
      align: 'center', size: 22, color: TEXT, display: true, glow: true, glowColor: CORE_DIM
    });
    if (line2) {
      text(line2, W / 2, H * 0.68 + 28, {
        align: 'center', size: 14, color: TEXT_DIM, shadow: false
      });
    }
    var skipA = 0.35 + Math.sin(G.time * 2.5) * 0.15;
    text('Tap to continue', W / 2, H - 48, {
      align: 'center', size: 12, color: 'rgba(154,144,128,' + skipA + ')', shadow: false
    });
    hit('intro-skip', 0, 0, W, H);
    drawEmbers(0.35);
  }

  function drawWhoPortrait(w, offsetX, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    var breathe = 1 + Math.sin(G.time * 0.25) * 0.012;
    ctx.translate(W / 2 + offsetX, H / 2);
    ctx.scale(breathe, breathe);
    ctx.translate(-W / 2, -H / 2);
    coverImg('portrait-' + w.id, 0, 0, W, H, 0.5, 0.22);
    ctx.restore();
  }

  function drawWho() {
    var t = G.time;
    var idx = ((G.whoIndex % WARBAND.length) + WARBAND.length) % WARBAND.length;
    G.whoIndex = idx;
    var w = WARBAND[idx];
    var slide = G.whoSlide || 0;

    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, W, H);

    // sliding carousel portraits
    if (Math.abs(slide) > 0.02) {
      var prev = WARBAND[((G.whoPrevIndex % WARBAND.length) + WARBAND.length) % WARBAND.length];
      drawWhoPortrait(prev, -slide * W, 0.45);
      drawWhoPortrait(w, (slide > 0 ? 1 : -1) * (1 - Math.abs(slide)) * W * 0.35 - slide * W * 0.2, 1);
    } else {
      drawWhoPortrait(w, Math.sin(t * 0.4) * 4, 1);
    }

    var bot = ctx.createLinearGradient(0, H * 0.55, 0, H);
    bot.addColorStop(0, 'rgba(6,5,8,0)');
    bot.addColorStop(0.45, 'rgba(6,5,8,0.35)');
    bot.addColorStop(1, 'rgba(6,5,8,0.92)');
    ctx.fillStyle = bot;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);

    var top = ctx.createLinearGradient(0, 0, 0, H * 0.22);
    top.addColorStop(0, 'rgba(6,5,8,0.7)');
    top.addColorStop(1, 'rgba(6,5,8,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, H * 0.22);

    var titleY = 36 + Math.sin(t * 1.2) * 1.5;
    text('Voidline', W / 2, titleY, {
      align: 'center', size: 14, color: COPPER, display: true, glow: true, glowColor: COPPER_DIM
    });
    text('Chronos', W / 2, titleY + 34, {
      align: 'center', size: 38, color: TEXT, display: true
    });

    var cueA = 0.35 + Math.sin(t * 3) * 0.2;
    var prevHot = isHot('who-prev') || pointerIn(0, H * 0.2, W * 0.28, H * 0.45);
    var nextHot = isHot('who-next') || pointerIn(W * 0.72, H * 0.2, W * 0.28, H * 0.45);
    text('‹', 28, H * 0.5, {
      align: 'center', size: prevHot ? 48 : 42,
      color: 'rgba(242,235,224,' + (prevHot ? 0.9 : cueA) + ')', shadow: false
    });
    text('›', W - 28, H * 0.5, {
      align: 'center', size: nextHot ? 48 : 42,
      color: 'rgba(242,235,224,' + (nextHot ? 0.9 : cueA) + ')', shadow: false
    });
    hit('who-prev', 0, H * 0.2, W * 0.28, H * 0.45);
    hit('who-next', W * 0.72, H * 0.2, W * 0.28, H * 0.45);

    var nameX = W / 2 - slide * 40;
    text(w.name.toUpperCase(), nameX, H * 0.72, {
      align: 'center', size: 36, color: TEXT, display: true
    });
    ctx.fillStyle = w.accent || COPPER;
    ctx.fillRect(W * 0.38 - slide * 20, H * 0.72 + 10, W * 0.24, 3);
    text(w.blurb, nameX, H * 0.72 + 34, {
      align: 'center', size: 14, color: TEXT_DIM, shadow: false
    });

    WARBAND.forEach(function (_, i) {
      var dx = W / 2 + (i - 1) * 16;
      var on = i === idx;
      var r = on ? 4.5 + Math.sin(t * 4) * 0.8 : 3;
      ctx.beginPath();
      ctx.arc(dx, H * 0.78, r, 0, Math.PI * 2);
      ctx.fillStyle = on ? COPPER : 'rgba(242,235,224,0.3)';
      ctx.fill();
    });

    var bw = Math.min(W * 0.72, 280), bh = 64;
    var bx = (W - bw) / 2, by = H - 110;
    drawBattleCta(bx, by, bw, bh, 'DEPLOY', 'pick', w.id);
    hit('pick', bx, by, bw, bh, w.id);

    drawEmbers(0.55);
  }

  function ensureEmbers() {
    if (G.embers.length) return;
    for (var i = 0; i < 28; i++) {
      G.embers.push({
        x: Math.random(),
        y: Math.random(),
        s: 0.6 + Math.random() * 1.8,
        sp: 0.04 + Math.random() * 0.1,
        a: 0.15 + Math.random() * 0.35
      });
    }
  }

  function drawEmbers(speed) {
    ensureEmbers();
    speed = speed == null ? 1 : speed;
    G.embers.forEach(function (e) {
      e.y -= e.sp * 0.016 * speed;
      e.x += Math.sin(G.time * 1.2 + e.y * 8) * 0.0004;
      if (e.y < -0.02) { e.y = 1.05; e.x = Math.random(); }
      ctx.globalAlpha = e.a;
      ctx.fillStyle = Math.random() > 0.5 ? COPPER : CORE;
      ctx.beginPath();
      ctx.arc(e.x * W, e.y * H, e.s, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function safeTop() { return 0; }
  function safeBottom() { return 0; }

  function drawStoneCta(x, y, w, h, label, hitId, hitData) {
    var hot = hitId ? isHot(hitId, hitData) : pointerIn(x, y, w, h);
    var press = hitId ? isPressed(hitId, hitData) : (G.pointer.down && pointerIn(x, y, w, h));
    var pulse = 1 + Math.sin(G.time * 2.4) * 0.012;
    var squash = (G.ctaSquash || 1) * (press ? 0.92 : hot ? 1.05 : 1);
    var cx = x + w / 2, cy = y + h / 2;
    beginInteract(cx, cy, pulse * squash);
    if (hot) drawFocusAura(cx, cy, Math.max(w, h) * 0.55, true);
    var g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, '#2a221c');
    g.addColorStop(0.45, '#141014');
    g.addColorStop(1, '#0a080a');
    roundRect(x, y, w, h, 10);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = hot ? CORE : 'rgba(212,160,90,0.65)';
    ctx.lineWidth = hot ? 2.5 : 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(94,224,208,' + (hot ? 0.55 : 0.35) + ')';
    ctx.lineWidth = 1;
    roundRect(x + 5, y + 5, w - 10, h - 10, 7);
    ctx.stroke();
    var cg = ctx.createRadialGradient(cx, cy, 4, cx, cy, w * 0.35);
    cg.addColorStop(0, hot ? 'rgba(94,224,208,0.28)' : 'rgba(94,224,208,0.18)');
    cg.addColorStop(1, 'rgba(94,224,208,0)');
    ctx.fillStyle = cg;
    ctx.fillRect(x, y, w, h);
    text(label, x + w / 2, y + h * 0.62, {
      align: 'center', size: Math.min(22, Math.floor(h * 0.34)), color: TEXT,
      display: true, glow: true, glowColor: CORE_DIM
    });
    endInteract();
  }

  function hubWorldRect() {
    var scale = 1.22;
    var ww = W * scale, wh = H * scale;
    return {
      x: (W - ww) / 2 + G.hubCamX,
      y: (H - wh) / 2 + G.hubCamY,
      w: ww,
      h: wh,
      maxX: (ww - W) / 2,
      maxY: (wh - H) / 2
    };
  }

  function clampHubCam() {
    var wr = hubWorldRect();
    var maxX = Math.max(8, (wr.w - W) / 2);
    var maxY = Math.max(8, (wr.h - H) / 2);
    G.hubCamX = Math.max(-maxX, Math.min(maxX, G.hubCamX));
    G.hubCamY = Math.max(-maxY, Math.min(maxY, G.hubCamY));
  }

  function placeScreenPos(place, wr) {
    return {
      x: wr.x + place.wx * wr.w,
      y: wr.y + place.wy * wr.h
    };
  }

  function drawWorldProp(place, sx, sy, focused) {
    var prop = place.prop || 'stone';
    var press = G.pointer.down && G.pressKey === hitKey('mode', place.id);
    var bob = Math.sin(G.time * 1.8 + place.wx * 9) * (focused ? 2.5 : 1.2);
    sy += bob;
    var sc = press ? 0.9 : focused ? 1.08 : 1;
    beginInteract(sx, sy, sc);

    // ground contact shadow — sells the prop as in-world
    var shadowR = (place.r || 48) * (focused ? 0.55 : 0.4);
    var sg = ctx.createRadialGradient(sx, sy + 18, 2, sx, sy + 18, shadowR);
    sg.addColorStop(0, focused ? 'rgba(94,224,208,0.22)' : 'rgba(0,0,0,0.45)');
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 18, shadowR, shadowR * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    if (focused) drawFocusAura(sx, sy - 8, place.r * 0.55, true);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.shadowColor = focused ? CORE_DIM : 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = focused ? 18 : 8;
    var fill = focused ? 'rgba(20,18,22,0.92)' : 'rgba(12,10,14,0.78)';
    var stroke = focused ? CORE : 'rgba(212,160,90,0.55)';
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = focused ? 2.2 : 1.4;

    if (prop === 'chronolith') {
      // crystal pillar
      ctx.beginPath();
      ctx.moveTo(0, -36);
      ctx.lineTo(14, -8);
      ctx.lineTo(10, 22);
      ctx.lineTo(-10, 22);
      ctx.lineTo(-14, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 22;
      ctx.fillStyle = focused ? 'rgba(94,224,208,0.55)' : 'rgba(94,224,208,0.28)';
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(6, -4);
      ctx.lineTo(0, 12);
      ctx.lineTo(-6, -4);
      ctx.closePath();
      ctx.fill();
      // orbiting motes
      for (var m = 0; m < 3; m++) {
        var ang = G.time * 1.4 + m * 2.1;
        ctx.fillStyle = CORE;
        ctx.globalAlpha = 0.5 + Math.sin(G.time * 3 + m) * 0.3;
        ctx.beginPath();
        ctx.arc(Math.cos(ang) * 26, Math.sin(ang) * 14 - 6, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (prop === 'anvil') {
      ctx.fillRect(-22, -4, 44, 14);
      ctx.strokeRect(-22, -4, 44, 14);
      ctx.fillRect(-10, -18, 20, 16);
      ctx.strokeRect(-10, -18, 20, 16);
      ctx.fillRect(-28, 10, 56, 8);
      // heat glow
      ctx.shadowBlur = 0;
      var heat = ctx.createRadialGradient(0, -8, 2, 0, -8, 22);
      heat.addColorStop(0, 'rgba(255,120,60,' + (focused ? 0.45 : 0.18) + ')');
      heat.addColorStop(1, 'rgba(255,80,20,0)');
      ctx.fillStyle = heat;
      ctx.beginPath(); ctx.arc(0, -8, 22, 0, Math.PI * 2); ctx.fill();
    } else if (prop === 'stars') {
      ctx.shadowBlur = focused ? 16 : 6;
      for (var s = 0; s < 5; s++) {
        var sa = -Math.PI / 2 + s * (Math.PI * 2 / 5);
        var sr = 10 + (s % 2) * 10;
        var sx2 = Math.cos(sa) * sr, sy2 = Math.sin(sa) * sr;
        ctx.beginPath();
        ctx.arc(sx2, sy2, focused ? 3.5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = focused ? CORE : COPPER;
        ctx.fill();
        if (s > 0) {
          ctx.strokeStyle = 'rgba(94,224,208,0.35)';
          ctx.beginPath();
          ctx.moveTo(Math.cos(-Math.PI / 2) * 10, Math.sin(-Math.PI / 2) * 10);
          ctx.lineTo(sx2, sy2);
          ctx.stroke();
        }
      }
    } else if (prop === 'arch') {
      ctx.beginPath();
      ctx.moveTo(-24, 20);
      ctx.lineTo(-24, -6);
      ctx.quadraticCurveTo(-24, -32, 0, -32);
      ctx.quadraticCurveTo(24, -32, 24, -6);
      ctx.lineTo(24, 20);
      ctx.lineTo(16, 20);
      ctx.lineTo(16, -4);
      ctx.quadraticCurveTo(16, -22, 0, -22);
      ctx.quadraticCurveTo(-16, -22, -16, -4);
      ctx.lineTo(-16, 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = focused ? 'rgba(94,224,208,0.2)' : 'rgba(94,224,208,0.08)';
      ctx.fillRect(-12, -8, 24, 28);
    } else if (prop === 'dial') {
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(G.time * 0.4) * 16, Math.sin(G.time * 0.4) * 16);
      ctx.strokeStyle = focused ? CORE : COPPER;
      ctx.lineWidth = 2;
      ctx.stroke();
      for (var t = 0; t < 8; t++) {
        var ta = t * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ta) * 16, Math.sin(ta) * 16);
        ctx.lineTo(Math.cos(ta) * 20, Math.sin(ta) * 20);
        ctx.stroke();
      }
    } else if (prop === 'reeds') {
      ctx.shadowBlur = 0;
      for (var r = -2; r <= 2; r++) {
        ctx.strokeStyle = focused ? CORE : 'rgba(90,140,110,0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(r * 8, 16);
        ctx.quadraticCurveTo(r * 8 + Math.sin(G.time * 2 + r) * 6, -4, r * 8 + 2, -22);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(40,80,90,0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 14, 28, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (prop === 'tablet') {
      roundRect(-16, -24, 32, 40, 3);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = focused ? CORE_DIM : 'rgba(212,160,90,0.35)';
      ctx.lineWidth = 1.5;
      for (var ln = 0; ln < 4; ln++) {
        ctx.beginPath();
        ctx.moveTo(-10, -12 + ln * 8);
        ctx.lineTo(10, -12 + ln * 8);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    // whisper only when focused — never a floating button label
    if (focused) {
      var wa = 0.75 + Math.sin(G.time * 3) * 0.15;
      text(place.label, sx, sy + 44, {
        align: 'center', size: 13, color: 'rgba(242,235,224,' + wa + ')',
        display: true, glow: true, glowColor: CORE_DIM
      });
      text(place.hint, sx, sy + 62, {
        align: 'center', size: 11, color: TEXT_DIM, shadow: false
      });
    }
    endInteract();
  }

  function drawHubMist() {
    var g = ctx.createLinearGradient(0, H * 0.55, 0, H);
    g.addColorStop(0, 'rgba(6,5,8,0)');
    g.addColorStop(0.55, 'rgba(6,5,8,0.25)');
    g.addColorStop(1, 'rgba(6,5,8,0.7)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
    // drifting ash band
    for (var i = 0; i < 6; i++) {
      var ax = ((G.time * 12 + i * 70) % (W + 80)) - 40;
      var ay = H * 0.62 + Math.sin(G.time * 0.7 + i) * 18 + i * 12;
      ctx.globalAlpha = 0.04 + (i % 3) * 0.02;
      ctx.fillStyle = COPPER;
      ctx.beginPath();
      ctx.ellipse(ax, ay, 60 + i * 8, 10, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawHub() {
    var w = warband(G.activeId);
    var wr = hubWorldRect();
    var breathe = 1 + Math.sin(G.time * 0.25) * 0.01;

    // WORLD — oversized vista, camera pans
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(breathe, breathe);
    ctx.translate(-W / 2, -H / 2);
    coverImg('hub', wr.x, wr.y, wr.w, wr.h, 0.5, 0.42);
    ctx.restore();

    drawEmbers(1.15);
    drawHubMist();

    // discover places in the world — props, not buttons
    var focus = null;
    var bestD = 1e9;
    HUB_PLACES.forEach(function (p) {
      var pos = placeScreenPos(p, wr);
      var d = Math.hypot(G.pointer.x - pos.x, G.pointer.y - pos.y);
      if (d < p.r + 12 && d < bestD) { bestD = d; focus = p; }
    });
    G.hubFocus = focus ? focus.id : null;

    HUB_PLACES.forEach(function (p) {
      var pos = placeScreenPos(p, wr);
      var focused = focus && focus.id === p.id;
      drawWorldProp(p, pos.x, pos.y, focused);
      hit('mode', pos.x - p.r, pos.y - p.r, p.r * 2, p.r * 2, p.id);
    });

    // HUD chrome — fade only, no dashboard
    var top = ctx.createLinearGradient(0, 0, 0, 70);
    top.addColorStop(0, 'rgba(6,5,8,0.55)');
    top.addColorStop(1, 'rgba(6,5,8,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, 70);

    var bot = ctx.createLinearGradient(0, H * 0.82, 0, H);
    bot.addColorStop(0, 'rgba(6,5,8,0)');
    bot.addColorStop(1, 'rgba(6,5,8,0.88)');
    ctx.fillStyle = bot;
    ctx.fillRect(0, H * 0.82, W, H * 0.18);

    var px = 14, py = 14, pr = 26;
    var whoHot = isHot('who') || pointerInCircle(px + pr, py + pr, pr + 6);
    var whoSc = isPressed('who') ? 0.9 : whoHot ? 1.08 : 1;
    beginInteract(px + pr, py + pr, whoSc);
    if (whoHot) drawFocusAura(px + pr, py + pr, pr + 10, true);
    var fr = img('uiFrame');
    if (fr && fr.complete && fr.naturalWidth) {
      ctx.drawImage(fr, px - 8, py - 8, pr * 2 + 16, pr * 2 + 16);
    }
    ctx.save();
    ctx.beginPath();
    ctx.arc(px + pr, py + pr, pr, 0, Math.PI * 2);
    ctx.clip();
    coverImg('portrait-' + w.id, px, py, pr * 2, pr * 2, 0.5, 0.15);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(px + pr, py + pr, pr + 2, 0, Math.PI * 2);
    ctx.strokeStyle = whoHot ? CORE : (w.accent || CORE);
    ctx.lineWidth = whoHot ? 3.5 : 2.5;
    ctx.stroke();
    endInteract();
    hit('who', px, py, pr * 2, pr * 2);

    // chrono as etched metal count — not a webpage stat
    text(String(Math.round(G.chronoDisp || G.P.chrono)), W - 18, 42, {
      align: 'right', size: 26, color: COPPER, display: true, glow: true, glowColor: COPPER_DIM
    });

    // one diegetic battle slab
    var bw = Math.min(W * 0.78, 300), bh = 58;
    var bx = (W - bw) / 2, by = H - 96;
    var pop = (G.enterPop > 0 ? G.enterPop : 1) * (G.scenePop || 1);
    ctx.save();
    ctx.translate(W / 2, by + bh / 2);
    ctx.scale(pop, pop);
    ctx.translate(-W / 2, -(by + bh / 2));
    drawStoneCta(bx, by, bw, bh, 'ENTER THE HOLD', 'enter');
    ctx.restore();
    hit('enter', bx, by, bw, bh);

    if (G.storyOpen != null) drawStoryModal();
  }

  function drawStoryModal() {
    var ch = STORY[G.storyOpen] || STORY[0];
    ctx.fillStyle = 'rgba(6,5,8,0.72)';
    ctx.fillRect(0, 0, W, H);
    text('TRANSMISSION', W / 2, H * 0.28, {
      align: 'center', size: 13, color: COPPER, display: true, glow: true, glowColor: COPPER_DIM
    });
    text(ch.title, W / 2, H * 0.36, {
      align: 'center', size: 30, color: TEXT, display: true
    });
    wrapText(ch.body, W / 2, H * 0.42, W * 0.78, 15, TEXT_DIM);
    var bx = (W - 200) / 2, by = H * 0.72;
    drawBattleCta(bx, by, 200, 56, 'CONTINUE', 'dismiss-story');
    hit('dismiss-story', bx, by, 200, 56);
  }

  function wrapText(str, cx, y, maxW, size, color) {
    ctx.save();
    ctx.font = '600 ' + size + 'px ' + FONT_UI;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    var words = String(str).split(' ');
    var line = '';
    var yy = y;
    words.forEach(function (word) {
      var test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxW) {
        ctx.fillText(line, cx, yy);
        line = word;
        yy += size + 6;
      } else line = test;
    });
    if (line) ctx.fillText(line, cx, yy);
    ctx.restore();
  }

  function drawBtn(x, y, w, h, label) {
    if (w >= 140 && h >= 44) drawBattleCta(x, y, w, h, label);
    else drawPlateBtn(x, y, w, h, label, { size: Math.min(15, Math.floor(h * 0.4)) });
  }

  function drawEnemySprite(e) {
    var sz = e.type === 'boss' ? 42 : e.type === 'brute' ? 30 : e.type === 'flyer' ? 20 : 17;
    var tint = e.tint || '#ff6a3d';
    var flash = e.hit > 0;
    ctx.save();
    ctx.translate(e.x, e.y);
    if (flash) ctx.scale(0.86, 0.86);
    var bob = Math.sin((e.phase || 0) * (e.wobble || 1)) * (e.type === 'flyer' ? 3 : 1.2);
    ctx.translate(0, bob);
    ctx.shadowColor = tint;
    ctx.shadowBlur = flash ? 22 : 12;
    ctx.fillStyle = flash ? '#fff8e8' : tint;
    ctx.strokeStyle = 'rgba(6,5,8,0.85)';
    ctx.lineWidth = 1.5;

    if (e.type === 'flyer') {
      var wing = Math.sin((e.phase || 0) * 2) * 10;
      ctx.beginPath();
      ctx.moveTo(-sz * 0.7, wing * 0.2);
      ctx.quadraticCurveTo(-sz * 1.1, -wing, -sz * 0.15, -2);
      ctx.quadraticCurveTo(-sz * 0.5, wing * 0.5, -sz * 0.7, wing * 0.2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sz * 0.7, wing * 0.2);
      ctx.quadraticCurveTo(sz * 1.1, -wing, sz * 0.15, -2);
      ctx.quadraticCurveTo(sz * 0.5, wing * 0.5, sz * 0.7, wing * 0.2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -sz * 0.45);
      ctx.lineTo(sz * 0.35, sz * 0.35);
      ctx.lineTo(0, sz * 0.2);
      ctx.lineTo(-sz * 0.35, sz * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (e.type === 'brute') {
      roundRect(-sz * 0.45, -sz * 0.4, sz * 0.9, sz * 0.85, 4);
      ctx.fill();
      ctx.stroke();
      // horns
      ctx.beginPath();
      ctx.moveTo(-sz * 0.35, -sz * 0.35);
      ctx.lineTo(-sz * 0.55, -sz * 0.75);
      ctx.lineTo(-sz * 0.15, -sz * 0.4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sz * 0.35, -sz * 0.35);
      ctx.lineTo(sz * 0.55, -sz * 0.75);
      ctx.lineTo(sz * 0.15, -sz * 0.4);
      ctx.fill();
      // eyes
      ctx.shadowBlur = 0;
      ctx.fillStyle = CORE;
      ctx.fillRect(-sz * 0.22, -sz * 0.12, 5, 4);
      ctx.fillRect(sz * 0.1, -sz * 0.12, 5, 4);
    } else if (e.type === 'boss') {
      // multi-limb chronolith beast
      ctx.beginPath();
      for (var i = 0; i < 6; i++) {
        var a = (i / 6) * Math.PI * 2 + (e.phase || 0) * 0.3;
        var rr = sz * (0.55 + (i % 2) * 0.2);
        var px = Math.cos(a) * rr, py = Math.sin(a) * rr * 0.85;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, sz * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = flash ? '#fff' : CORE;
      ctx.shadowColor = CORE_DIM;
      ctx.shadowBlur = 16;
      ctx.fill();
      // claws
      ctx.fillStyle = flash ? '#fff8e8' : tint;
      ctx.shadowBlur = 8;
      for (var c = 0; c < 4; c++) {
        var ca = -Math.PI / 2 + c * (Math.PI / 5) - Math.PI * 0.3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ca) * sz * 0.35, Math.sin(ca) * sz * 0.35);
        ctx.lineTo(Math.cos(ca) * sz * 0.85, Math.sin(ca) * sz * 0.85);
        ctx.lineTo(Math.cos(ca + 0.25) * sz * 0.5, Math.sin(ca + 0.25) * sz * 0.5);
        ctx.fill();
      }
    } else {
      // swarm — segmented crawler
      ctx.beginPath();
      ctx.ellipse(0, 2, sz * 0.42, sz * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-sz * 0.35, -2, sz * 0.22, 0, Math.PI * 2);
      ctx.fill();
      // legs
      ctx.strokeStyle = tint;
      ctx.lineWidth = 2;
      for (var L = -1; L <= 1; L += 2) {
        ctx.beginPath();
        ctx.moveTo(L * 4, 4);
        ctx.lineTo(L * (10 + Math.sin((e.phase || 0) * 3) * 3), 12);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.fillStyle = CORE;
      ctx.beginPath();
      ctx.arc(-sz * 0.4, -4, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    // HP bar
    var bw = sz * (e.type === 'boss' ? 1.2 : 1);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(-bw / 2, sz / 2 + 6, bw, 3);
    ctx.fillStyle = COPPER;
    ctx.fillRect(-bw / 2, sz / 2 + 6, bw * Math.max(0, e.hp / e.max), 3);
    ctx.restore();
  }

  function drawCombatFx(f) {
    var a;
    if (f.kind === 'beam') {
      a = Math.min(1, f.life * 8);
      ctx.strokeStyle = 'rgba(94,224,208,' + a + ')';
      ctx.lineWidth = 2.5 + a * 2;
      ctx.shadowColor = CORE_DIM;
      ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(f.x1, f.y1); ctx.lineTo(f.x2, f.y2); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,' + (a * 0.8) + ')';
      ctx.beginPath(); ctx.arc(f.x2, f.y2, 3 + a * 2, 0, Math.PI * 2); ctx.fill();
    } else if (f.kind === 'dmg') {
      text((f.crit ? f.text + '!' : f.text), f.x, f.y - (0.7 - f.life) * 40, {
        align: 'center', size: f.crit ? 22 : 16, color: f.crit ? COPPER : '#fff'
      });
    } else if (f.kind === 'spark') {
      ctx.fillStyle = 'rgba(255,255,255,' + (f.life * 3) + ')';
      ctx.beginPath(); ctx.arc(f.x, f.y, 4 + (0.28 - f.life) * 22, 0, Math.PI * 2); ctx.fill();
    } else if (f.kind === 'slash') {
      a = f.life / 0.18;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.ang || 0);
      ctx.strokeStyle = f.crit ? 'rgba(212,160,90,' + a + ')' : 'rgba(242,235,224,' + a + ')';
      ctx.lineWidth = f.crit ? 3.5 : 2;
      ctx.beginPath();
      ctx.moveTo(-18, -6);
      ctx.quadraticCurveTo(0, -14, 18, 4);
      ctx.stroke();
      ctx.restore();
    } else if (f.kind === 'burst') {
      a = f.life / 0.4;
      var rr = (f.r || 36) * (1.2 - a * 0.5);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = f.color || CORE;
      ctx.beginPath(); ctx.arc(f.x, f.y, rr * 0.35, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = f.color || CORE;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(f.x, f.y, rr, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    } else if (f.kind === 'ring' || f.kind === 'nova' || f.kind === 'quake' || f.kind === 'freeze') {
      var lifeMax = f.kind === 'freeze' ? 0.6 : f.kind === 'quake' ? 0.5 : 0.5;
      a = Math.max(0, f.life / lifeMax);
      var grow = (1 - a) * (f.r || 80);
      ctx.save();
      ctx.globalAlpha = a * 0.85;
      ctx.strokeStyle = f.color || (f.kind === 'freeze' ? CORE : COPPER);
      ctx.lineWidth = f.kind === 'quake' ? 4 : 2.5;
      ctx.beginPath(); ctx.arc(f.x, f.y, grow, 0, Math.PI * 2); ctx.stroke();
      if (f.kind === 'nova') {
        ctx.globalAlpha = a * 0.25;
        ctx.fillStyle = f.color || CORE;
        ctx.beginPath(); ctx.arc(f.x, f.y, grow * 0.7, 0, Math.PI * 2); ctx.fill();
      }
      if (f.kind === 'quake') {
        for (var q = 0; q < 3; q++) {
          ctx.globalAlpha = a * (0.5 - q * 0.12);
          ctx.beginPath(); ctx.arc(f.x, f.y, grow * (0.55 + q * 0.2), 0, Math.PI * 2); ctx.stroke();
        }
      }
      ctx.restore();
    } else if (f.kind === 'muzzle') {
      a = f.life / 0.15;
      ctx.fillStyle = 'rgba(94,224,208,' + a + ')';
      ctx.beginPath(); ctx.arc(f.x, f.y, 6 + (1 - a) * 10, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawTower() {
    var t = G.tower;
    var kickX = t && t.running ? (G.camKickX || 0) : 0;
    var kickY = t && t.running ? (G.camKickY || 0) : 0;
    var zoom = t && t.running ? (G.camZoom || 1) : 1;
    var breathe = 1 + Math.sin(G.time * 0.2) * 0.01;

    ctx.save();
    ctx.translate(W / 2 + kickX, H / 2 + kickY);
    ctx.scale(breathe * zoom, breathe * zoom);
    ctx.translate(-W / 2, -H / 2);
    coverImg('tower', 0, 0, W, H, 0.5, 0.45);
    ctx.restore();
    drawEmbers(0.4);

    if (!t) {
      var top = ctx.createLinearGradient(0, 0, 0, 120);
      top.addColorStop(0, 'rgba(6,5,8,0.65)');
      top.addColorStop(1, 'rgba(6,5,8,0)');
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, W, 120);

      text('CHRONOLITH', W / 2, 48, {
        align: 'center', size: 32, color: TEXT, display: true, glow: true, glowColor: CORE_DIM
      });
      text('Best ' + G.P.wavesBest, W / 2, 74, { align: 'center', size: 13, color: TEXT_DIM, shadow: false });
      closeSeal(W - 28, 28);
      hit('hub', W - 46, 10, 36, 36);

      var ups = TOWER_UPS;
      var ringR = Math.min(W, H) * 0.28;
      ups.forEach(function (u, i) {
        var ang = -Math.PI / 2 + (i / ups.length) * Math.PI * 2;
        var ucx = W / 2 + Math.cos(ang) * ringR;
        var ucy = H * 0.42 + Math.sin(ang) * ringR * 0.85;
        var lv = G.P.towerUp[u.id] || 0;
        var cost = Math.floor(u.base * Math.pow(1.38, lv));
        runeChip(ucx, ucy, 64, String(lv), COPPER, isHot('tower-up', u.id) || pointerInCircle(ucx, ucy, 36));
        text(u.name, ucx, ucy + 48, { align: 'center', size: 11, color: TEXT_DIM, shadow: false });
        text(String(cost), ucx, ucy + 5, { align: 'center', size: 12, color: COPPER, shadow: false });
        hit('tower-up', ucx - 32, ucy - 32, 64, 64, u.id);
      });

      var bw = Math.min(W * 0.84, 340), bh = 70;
      var bx = (W - bw) / 2, by = H - 168;
      drawBattleCta(bx, by, bw, bh, 'DEPLOY', 'start-tower');
      hit('start-tower', bx, by, bw, bh);
      var coopHot = isHot('start-coop') || pointerIn(W / 2 - 80, by + 78, 160, 36);
      text('CO-OP BOSS', W / 2, by + 96, {
        align: 'center', size: 14, color: CORE, glow: true, glowColor: coopHot ? CORE_DIM : undefined
      });
      hit('start-coop', W / 2 - 80, by + 78, 160, 36);
      return;
    }

    // live combat — camera punch applied to battlefield
    ctx.save();
    ctx.translate(kickX, kickY);
    ctx.translate(W / 2, H / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-W / 2, -H / 2);

    text('WAVE ' + t.wave, 18, 36, { size: 18, color: TEXT, display: true });
    text(Math.ceil(t.coreHp) + '/' + t.coreMax, W / 2, 36, {
      align: 'center', size: 18, color: COPPER, glow: true, glowColor: COPPER_DIM
    });
    if (t.combo > 4) text(t.combo + 'x', W - 56, 36, { align: 'right', size: 16, color: CORE, glow: true });
    if (t.frozen > 0) {
      ctx.fillStyle = 'rgba(94,224,208,0.08)';
      ctx.fillRect(0, 0, W, H);
    }
    closeSeal(W - 28, 28);
    hit('flee', W - 46, 10, 36, 36);

    var cx = W * 0.5, cy = H * 0.5;
    var pulse = 1 + Math.sin(G.time * 3) * 0.06;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    var grd = ctx.createRadialGradient(0, 0, 4, 0, 0, 48);
    grd.addColorStop(0, '#dfffea');
    grd.addColorStop(0.35, CORE);
    grd.addColorStop(1, 'rgba(7,7,9,0)');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(0, 0, 44, 0, Math.PI * 2); ctx.fill();
    // crystal facets
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(10, 4); ctx.lineTo(0, 14); ctx.lineTo(-10, 4);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 52, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, t.coreHp / t.coreMax));
    ctx.strokeStyle = COPPER;
    ctx.lineWidth = 4;
    ctx.stroke();
    if (t.shield > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, 58, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(94,224,208,0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();

    t.enemies.forEach(drawEnemySprite);
    t.fx.forEach(drawCombatFx);

    ctx.restore();

    var abl = G.P.loadout === 'bulwark'
      ? ['TAUNT', 'QUAKE', 'OVERLOAD']
      : G.P.loadout === 'warden'
        ? ['MEND', 'WARD', 'OVERLOAD']
        : ['ARC', 'TIMELINE', 'OVERLOAD'];
    var keys = ['primary', 'secondary', 'ultimate'];
    var aw = 70, gap = 22;
    var total = aw * 3 + gap * 2;
    var ax0 = (W - total) / 2;
    var ay = H - 120;
    keys.forEach(function (k, i) {
      var ax = ax0 + i * (aw + gap);
      drawAbilityIcon(i, ax, ay, aw, k);
      var cd = t.cds[k];
      text(abl[i], ax + aw / 2, ay + aw + 14, { align: 'center', size: 11, color: TEXT, shadow: false });
      if (cd > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.beginPath(); ctx.arc(ax + aw / 2, ay + aw / 2, aw / 2, 0, Math.PI * 2); ctx.fill();
        text(cd.toFixed(1), ax + aw / 2, ay + aw / 2 + 5, { align: 'center', size: 14, color: TEXT, shadow: false });
      }
      hit('ability', ax, ay, aw, aw + 28, k);
    });
  }

  function drawAbilityIcon(index, x, y, s, slot) {
    var hot = slot ? (isHot('ability', slot) || pointerIn(x, y, s, s + 28)) : pointerIn(x, y, s, s);
    var press = slot && isPressed('ability', slot);
    var cx = x + s / 2, cy = y + s / 2;
    var sc = press ? 0.88 : hot ? 1.1 : 1;
    beginInteract(cx, cy, sc);
    if (hot) drawFocusAura(cx, cy, s * 0.7, true);
    var im = img('abilities');
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, s / 2, 0, Math.PI * 2);
    ctx.clip();
    if (!im || !im.complete) {
      ctx.fillStyle = '#1a1410';
      ctx.fillRect(x, y, s, s);
    } else {
      var sw = im.naturalWidth / 3;
      ctx.drawImage(im, index * sw, 0, sw, im.naturalHeight, x, y, s, s);
    }
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, s / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = hot ? CORE : 'rgba(212,160,90,0.55)';
    ctx.lineWidth = hot ? 2.8 : 2;
    ctx.stroke();
    endInteract();
  }

  function drawMenuShell(title, sub) {
    var key = G.scene === 'forge' ? 'forge' : G.scene === 'tree' ? 'tree' : G.scene === 'gate' || G.scene === 'extract' ? 'gate' : G.scene === 'life' ? 'life' : 'hub';
    var breathe = 1 + Math.sin(G.time * 0.22) * 0.01;
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(breathe, breathe);
    ctx.translate(-W / 2, -H / 2);
    coverImg(key, 0, 0, W, H, 0.5, 0.4);
    ctx.restore();
    // light mist — keep the art readable, not a webpage overlay
    var veil = ctx.createLinearGradient(0, 0, 0, H);
    veil.addColorStop(0, 'rgba(6,5,8,0.42)');
    veil.addColorStop(0.35, 'rgba(6,5,8,0.12)');
    veil.addColorStop(0.75, 'rgba(6,5,8,0.35)');
    veil.addColorStop(1, 'rgba(6,5,8,0.82)');
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, W, H);
    drawEmbers(0.45);
    // title sits in the mist, not a header bar
    text(title, W / 2, 52, {
      align: 'center', size: 26, color: TEXT, display: true, glow: true, glowColor: 'rgba(0,0,0,0.9)', blur: 10
    });
    if (sub) {
      text(sub, W / 2, 76, {
        align: 'center', size: 12, color: 'rgba(212,160,90,0.85)', shadow: false
      });
    }
    closeSeal(W - 28, 28);
    hit('hub', W - 46, 10, 36, 36);
  }

  function drawForge() {
    drawMenuShell('FORGE', 'Feed the crucible');
    // two crucibles
    for (var i = 0; i < 2; i++) {
      var sx = W * (0.32 + i * 0.36), sy = H * 0.28;
      var slotHot = isHot('clear-forge', String(i)) || pointerInCircle(sx, sy, 50);
      runeChip(sx, sy, 90, G.forge[i] ? '' : '?', G.forge[i] ? CORE : 'rgba(212,160,90,0.35)', slotHot);
      if (G.forge[i]) text(G.forge[i].toUpperCase(), sx, sy + 6, { align: 'center', size: 12, color: CORE, shadow: false });
      hit('clear-forge', sx - 45, sy - 45, 90, 90, String(i));
    }
    text('+', W / 2, H * 0.28 + 8, { align: 'center', size: 28, color: TEXT_DIM, shadow: false });
    var bw = Math.min(W * 0.7, 260), bh = 58;
    drawBattleCta((W - bw) / 2, H * 0.4, bw, bh, 'FUSE', 'merge');
    hit('merge', (W - bw) / 2, H * 0.4, bw, bh);

    var mats = SHARDS.filter(function (sh) { return (G.P.shards[sh.id] || 0) > 0; });
    var cols = Math.min(4, Math.max(1, mats.length));
    mats.forEach(function (sh, i) {
      var col = i % cols;
      var row = Math.floor(i / cols);
      var cx = W * 0.2 + col * (W * 0.6 / Math.max(1, cols - 1 || 1));
      if (cols === 1) cx = W / 2;
      var cy = H * 0.58 + row * 78;
      var q = G.P.shards[sh.id] || 0;
      var matHot = isHot('forge-add', sh.id) || pointerInCircle(cx, cy, 36);
      runeChip(cx, cy, 56, sh.icon, COPPER, matHot);
      text(sh.name, cx, cy + 42, { align: 'center', size: 11, color: TEXT, shadow: false });
      text('x' + q, cx, cy + 56, { align: 'center', size: 11, color: COPPER, shadow: false });
      hit('forge-add', cx - 32, cy - 32, 64, 70, sh.id);
    });
  }

  function drawTree() {
    drawMenuShell('CONSTELLATION', G.P.skillPoints + ' skill');
    ['bulwark', 'rift', 'warden'].forEach(function (r, i) {
      var bx = W * 0.2 + i * W * 0.3;
      var on = G.P.loadout === r;
      var loadHot = isHot('loadout', r) || pointerInCircle(bx, 108, 30);
      runeChip(bx, 108, on ? 52 : 44, r.slice(0, 1).toUpperCase(), on ? CORE : 'rgba(212,160,90,0.35)', loadHot || on);
      text(r.toUpperCase(), bx, 142, { align: 'center', size: 10, color: on || loadHot ? CORE : TEXT_DIM, shadow: false });
      hit('loadout', bx - 30, 80, 60, 70, r);
    });
    ctx.save();
    ctx.translate(20, 160);
    ctx.scale(0.55, 0.55);
    TREE.forEach(function (n) {
      n.req.forEach(function (r) {
        var p = nodeById(r);
        if (!p) return;
        ctx.strokeStyle = 'rgba(94,224,208,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(n.x, n.y); ctx.stroke();
      });
    });
    TREE.forEach(function (n) {
      var owned = hasNode(n.id);
      var can = canUnlock(n);
      var sel = G.selNode === n.id;
      var hx = 20 + n.x * 0.55;
      var hy = 160 + n.y * 0.55;
      var nodeHot = isHot('select-node', n.id) || pointerInCircle(hx, hy, 18);
      var pulse = owned ? 1 + Math.sin(G.time * 2 + n.x) * 0.06 : 1;
      if (nodeHot || sel) pulse *= 1.12;
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.scale(pulse, pulse);
      ctx.beginPath();
      ctx.arc(0, 0, n.keystone ? 17 : 13, 0, Math.PI * 2);
      ctx.fillStyle = owned ? 'rgba(94,224,208,0.4)' : can ? 'rgba(212,160,90,0.25)' : 'rgba(8,6,10,0.9)';
      ctx.fill();
      ctx.strokeStyle = sel || nodeHot ? CORE : owned ? CORE : can ? COPPER : 'rgba(154,144,128,0.35)';
      ctx.lineWidth = sel || nodeHot ? 3 : 2; ctx.stroke();
      ctx.restore();
      hit('select-node', hx - 16, hy - 16, 32, 32, n.id);
    });
    ctx.restore();
    var sel = nodeById(G.selNode) || nodeById('root');
    if (sel) {
      text(sel.name, W / 2, H - 108, { align: 'center', size: 20, color: TEXT, display: true });
      wrapText(sel.desc, W / 2, H - 86, W - 48, 12, TEXT_DIM);
      if (!hasNode(sel.id)) {
        drawBattleCta((W - 180) / 2, H - 58, 180, 44, 'UNLOCK ' + sel.cost, 'unlock', sel.id);
        hit('unlock', (W - 180) / 2, H - 58, 180, 44, sel.id);
      }
    }
  }

  function drawGate() {
    drawMenuShell('STARGATE', 'Reach into the void');
    PLANETS.forEach(function (pl, i) {
      var open = G.WORLD.planetsUnlocked.indexOf(pl.id) >= 0;
      var col = i % 2;
      var row = Math.floor(i / 2);
      var cx = W * (0.3 + col * 0.4);
      var cy = H * 0.28 + row * 140;
      var planetHot = open && (isHot('extract', pl.id) || pointerInCircle(cx, cy, 55));
      runeChip(cx, cy, open ? 88 : 72, '', open ? pl.accent : 'rgba(154,144,128,0.35)', planetHot);
      text(pl.name, cx, cy + 6, { align: 'center', size: 12, color: open ? TEXT : TEXT_DIM, shadow: false });
      text(open ? '35 chrono' : 'Era ' + pl.eraNeed, cx, cy + 58, {
        align: 'center', size: 11, color: open ? COPPER : TEXT_DIM, shadow: false
      });
      if (open) hit('extract', cx - 50, cy - 50, 100, 110, pl.id);
    });
  }

  function drawExtract() {
    var pl = G.extract.planet;
    coverImg('gate', 0, 0, W, H, 0.5, 0.4);
    ctx.fillStyle = 'rgba(6,5,8,0.55)';
    ctx.fillRect(0, 0, W, H);
    drawEmbers(0.8);
    text(pl.name, W / 2, H * 0.36, { align: 'center', size: 28, color: TEXT, display: true, glow: true });
    text(pl.verb, W / 2, H * 0.42, { align: 'center', size: 14, color: TEXT_DIM, shadow: false });
    var barW = W * 0.7, bx = (W - barW) / 2, by = H * 0.52;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(bx, by, barW, 16, 8); ctx.fill();
    ctx.fillStyle = pl.accent || CORE;
    roundRect(bx, by, Math.max(6, barW * (G.extract.progress / 100)), 16, 8); ctx.fill();
    text('Hazards ' + G.extract.hazards + '/4', W / 2, by + 40, { align: 'center', size: 13, color: TEXT });
  }

  function drawEra() {
    drawMenuShell('TIMELINE', 'Hold the Chronolith');
    var y0 = 130;
    ERAS.forEach(function (era, i) {
      var current = G.WORLD.eraIndex === i;
      var cleared = G.WORLD.erasCleared.indexOf(era.id) >= 0;
      var y = y0 + i * 70;
      // spine
      if (i < ERAS.length - 1) {
        ctx.strokeStyle = 'rgba(212,160,90,0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(48, y + 16); ctx.lineTo(48, y + 70); ctx.stroke();
      }
      runeChip(48, y + 8, current ? 36 : 28, '', current ? era.accent : (cleared ? COPPER : 'rgba(154,144,128,0.35)'));
      text(era.name, 80, y + 4, { size: 16, color: current ? TEXT : TEXT_DIM, display: true });
      text(cleared ? 'Stabilized' : current ? 'Active' : 'Sealed', 80, y + 24, {
        size: 12, color: current ? COPPER : TEXT_DIM, shadow: false
      });
    });
  }

  function drawLife() {
    drawMenuShell('SLOW LIFE', 'Fish the ash shores');
    var pondY = H * 0.32;
    ctx.save();
    ctx.translate(W / 2, pondY);
    ctx.scale(1, 0.42);
    ctx.beginPath();
    ctx.arc(0, 0, W * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(40,70,80,0.45)';
    ctx.fill();
    ctx.strokeStyle = CORE_DIM;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
    drawBattleCta((W - 220) / 2, pondY + 40, 220, 56, G.fishCast ? 'WAITING…' : 'CAST', 'fish');
    if (!G.fishCast) hit('fish', (W - 220) / 2, pondY + 40, 220, 56);
    text('Caught ' + G.P.fishCaught, W / 2, pondY + 120, { align: 'center', size: 13, color: TEXT_DIM, shadow: false });

    for (var i = 0; i < 4; i++) {
      var px = W * 0.18 + i * W * 0.22;
      var py = H * 0.68;
      var planted = G.P.gardenPlanted[i];
      var ready = planted && (Date.now() - planted >= 45000);
      var gHot = isHot('garden', String(i)) || pointerInCircle(px, py, 40);
      var gSc = isPressed('garden', String(i)) ? 0.9 : gHot ? 1.08 : 1;
      beginInteract(px, py, gSc);
      if (gHot) drawFocusAura(px, py, 42, true);
      ctx.beginPath();
      ctx.arc(px, py, 34, 0, Math.PI * 2);
      ctx.fillStyle = ready ? 'rgba(60,100,50,0.65)' : 'rgba(40,28,18,0.7)';
      ctx.fill();
      ctx.strokeStyle = gHot || ready ? CORE : COPPER;
      ctx.lineWidth = gHot ? 3 : 2;
      ctx.stroke();
      text(!planted ? 'PLANT' : ready ? 'READY' : '…', px, py + 5, {
        align: 'center', size: 11, color: ready ? CORE : TEXT, shadow: false
      });
      endInteract();
      hit('garden', px - 36, py - 36, 72, 72, String(i));
    }
  }

  function drawStory() {
    drawMenuShell('LORE', 'Chapter ' + G.WORLD.storyChapter);
    var y = 110;
    STORY.forEach(function (ch) {
      var locked = ch.id > G.WORLD.storyChapter;
      var h = locked ? 56 : 100;
      softPlate(24, y, W - 48, h, 16);
      text(ch.title, W / 2, y + 28, {
        align: 'center', size: 16, color: locked ? TEXT_DIM : TEXT, display: true
      });
      if (!locked) wrapText(ch.body, W / 2, y + 52, W - 80, 12, TEXT_DIM);
      y += h + 14;
    });
  }

  /* ── Input ── */
  function onPointer(type, clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    var x = (clientX - rect.left) * (W / rect.width);
    var y = (clientY - rect.top) * (H / rect.height);
    var prevX = G.pointer.x;
    var prevY = G.pointer.y;
    G.pointer.x = x; G.pointer.y = y;
    if (type === 'move' && !G.pointer.down) {
      refreshHover();
    }
    if (type === 'down') {
      G.pointer.down = true;
      G.pointer.sx = x;
      G.pointer.sy = y;
      G.pointer.moved = false;
      G.ctaSquash = 0.94;
      G.hubVelX = 0;
      G.hubVelY = 0;
      var downHit = hitAt(x, y);
      if (downHit) {
        G.pressKey = hitKey(downHit.id, downHit.data);
        spawnRipple(x, y, COPPER);
        sfx('ui');
        buzz(6);
      } else {
        G.pressKey = null;
        spawnRipple(x, y, 'rgba(212,160,90,0.7)');
      }
    }
    if (type === 'move' && G.pointer.down && G.scene === 'hub') {
      var mdx = x - prevX;
      var mdy = y - prevY;
      if (Math.abs(x - G.pointer.sx) > 10 || Math.abs(y - G.pointer.sy) > 10) G.pointer.moved = true;
      G.hubCamX += mdx;
      G.hubCamY += mdy;
      G.hubVelX = mdx * 18;
      G.hubVelY = mdy * 18;
      clampHubCam();
    }
    if (type === 'up') {
      G.pointer.down = false;
      tweenTo(G, 'ctaSquash', 1, 0.18, easeOutBack);
      var dx = x - G.pointer.sx;
      var dy = y - G.pointer.sy;
      if (G.scene === 'who' && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        slideWho(dx < 0 ? 1 : -1);
        G.pressKey = null;
        return;
      }
      if (G.scene === 'hub' && G.pointer.moved) {
        G.pressKey = null;
        return;
      }
      var h = hitAt(x, y);
      if (h) {
        tapFeedback(h);
        handleHit(h);
      }
      G.pressKey = null;
      refreshHover();
    }
  }

  function handleHit(h) {
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    startAmbient();
    var id = h.id, d = h.data;
    if (id === 'intro-skip') { finishIntro(); return; }
    if (id === 'who-prev') { slideWho(-1); return; }
    if (id === 'who-next') { slideWho(1); return; }
    if (id === 'pick') pickPlayer(d);
    else if (id === 'who') {
      savePlayer();
      G.activeId = null;
      G.P = null;
      transitionTo('who');
    }
    else if (id === 'enter' || (id === 'mode' && d === 'tower')) go('tower');
    else if (id === 'mode') go(d);
    else if (id === 'hub') go('hub');
    else if (id === 'dismiss-story') { G.storyOpen = null; savePlayer(); }
    else if (id === 'start-tower') startTower(false);
    else if (id === 'start-coop') startTower(true);
    else if (id === 'flee') endTower(false);
    else if (id === 'ability') useAbility(d);
    else if (id === 'tower-up') {
      var def = TOWER_UPS.find(function (u) { return u.id === d; });
      if (!def) return;
      var lv = G.P.towerUp[d] || 0;
      var cost = Math.floor(def.base * Math.pow(1.38, lv));
      if (G.P.chrono < cost) { toast('NEED CHRONO'); return; }
      G.P.chrono -= cost;
      G.P.towerUp[d] = lv + 1;
      toast(def.name + ' ' + (lv + 1));
      savePlayer();
    } else if (id === 'forge-add') {
      var slot = G.forge[0] ? (G.forge[1] ? -1 : 1) : 0;
      if (slot < 0) { toast('FULL'); return; }
      if (!((G.P.shards[d] || 0) >= 1 || (G.P.exotics[d] || 0) >= 1)) { toast('NONE'); return; }
      G.forge[slot] = d;
    } else if (id === 'clear-forge') G.forge[+d] = null;
    else if (id === 'merge') tryMerge();
    else if (id === 'select-node') G.selNode = d;
    else if (id === 'unlock') {
      var node = nodeById(d);
      if (!canUnlock(node)) { toast('LOCKED'); return; }
      G.P.skillPoints -= node.cost;
      G.P.unlocked.push(node.id);
      toast(node.name);
      beep(400, 0.1);
      savePlayer();
    } else if (id === 'loadout') { G.P.loadout = d; savePlayer(); toast(d.toUpperCase()); }
    else if (id === 'extract') {
      var pl = PLANETS.find(function (p) { return p.id === d; });
      if (!pl || G.WORLD.planetsUnlocked.indexOf(d) < 0) return;
      if (G.P.chrono < 35) { toast('NEED 35'); return; }
      G.P.chrono -= 35;
      G.extract = { planet: pl, progress: 0, hazards: 0 };
      G.scene = 'extract';
      savePlayer();
    } else if (id === 'fish') {
      if (G.fishCast) return;
      G.fishCast = true;
      setTimeout(function () {
        G.fishCast = false;
        var catch_ = FISH[Math.floor(Math.random() * FISH.length)];
        if (catch_.chrono) G.P.chrono += catch_.chrono;
        if (catch_.essence) G.P.essence += catch_.essence;
        if (catch_.shard) G.P.shards[catch_.shard] = (G.P.shards[catch_.shard] || 0) + 1;
        G.P.fishCaught++;
        toast(catch_.name.toUpperCase());
        savePlayer();
      }, 900);
    } else if (id === 'garden') {
      var i = +d;
      var now = Date.now();
      if (!G.P.gardenPlanted[i]) {
        if (G.P.chrono < 15) { toast('NEED 15'); return; }
        G.P.chrono -= 15;
        G.P.gardenPlanted[i] = now;
        toast('PLANTED');
      } else if (now - G.P.gardenPlanted[i] >= 45000) {
        G.P.shards.bone = (G.P.shards.bone || 0) + 1;
        G.P.chrono += 12;
        G.P.gardenPlanted[i] = 0;
        toast('HARVEST');
      } else toast('GROWING…');
      savePlayer();
    }
  }

  /* ── Loop ── */
  function update(dt) {
    G.time += dt;
    updateTweens(dt);

    // scene fade machine
    if (G.fadeTarget > G.fade) G.fade = Math.min(G.fadeTarget, G.fade + dt * 4.2);
    else if (G.fadeTarget < G.fade) G.fade = Math.max(G.fadeTarget, G.fade - dt * 3.2);
    if (G.fadeScene && G.fade >= 0.98) finishTransition();

    if (G.scene === 'hub' && !G.pointer.down) {
      G.hubCamX += G.hubVelX * dt;
      G.hubCamY += G.hubVelY * dt;
      G.hubVelX *= Math.pow(0.05, dt);
      G.hubVelY *= Math.pow(0.05, dt);
      if (Math.abs(G.hubVelX) < 2) G.hubVelX = 0;
      if (Math.abs(G.hubVelY) < 2) G.hubVelY = 0;
      clampHubCam();
    }
    if (G.P) G.chronoDisp = approach(G.chronoDisp || 0, G.P.chrono, 120, dt);
    if (!G.pointer.down) G.ctaSquash = approach(G.ctaSquash || 1, 1, 8, dt);
    G.scenePop = approach(G.scenePop == null ? 1 : G.scenePop, 1, 2.5, dt);
    updateRipples(dt);
    // keep hover live even without move events (touch linger / idle)
    if (!G.pointer.down && G.hits.length) refreshHover();

    if (G.toastT > 0) G.toastT -= dt;
    if (G.shake > 0) G.shake -= dt;
    if (G.flash > 0) G.flash -= dt;
    if (G.hitstop > 0 && G.scene !== 'tower') G.hitstop = Math.max(0, G.hitstop - dt);
    G.camKickX = approach(G.camKickX || 0, 0, 55, dt);
    G.camKickY = approach(G.camKickY || 0, 0, 55, dt);
    G.camZoom = approach(G.camZoom || 1, 1, 1.8, dt);

    if (G.scene === 'intro') {
      G.introT = (G.introT || 0) + dt;
      if (G.introT > 5.2) finishIntro();
    }

    G.particles = G.particles.filter(function (p) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      return p.life > 0;
    });
    // ambient sparks on hub/who/intro
    if ((G.scene === 'hub' || G.scene === 'who' || G.scene === 'intro') && Math.random() < dt * 2.2) {
      spawnParts(Math.random() * W, H * (0.55 + Math.random() * 0.4), 1, Math.random() > 0.5 ? COPPER : CORE);
    }
    if (G.scene === 'tower' && G.tower && G.tower.running) updateTower(dt);
    if (G.scene === 'extract' && G.extract) {
      G.extract.progress += (8 + (aggregateStats().extract || 0) * 10) * dt * 4;
      if (Math.random() < dt * 0.9) G.extract.hazards++;
      if (G.extract.progress >= 100) {
        var pl = G.extract.planet;
        var fail = G.extract.hazards >= 4 && Math.random() < 0.35;
        if (!fail) {
          G.P.exotics[pl.exotic] = (G.P.exotics[pl.exotic] || 0) + 1;
          toast(pl.exoticName.toUpperCase());
          spawnParts(W / 2, H / 2, 24, pl.accent || CORE);
          shake(200);
        } else {
          G.P.chrono += 10;
          toast('EXTRACT FAILED');
        }
        G.extract = null;
        transitionTo('gate');
        savePlayer();
      }
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    G.hits = [];

    var sx = 0, sy = 0;
    if (G.shake > 0) {
      sx = (Math.random() - 0.5) * 10;
      sy = (Math.random() - 0.5) * 10;
    }
    var pop = G.scenePop == null ? 1 : G.scenePop;
    ctx.save();
    ctx.translate(sx + W / 2, sy + H / 2);
    ctx.scale(pop, pop);
    ctx.translate(-W / 2, -H / 2);

    if (G.scene === 'boot') drawBoot();
    else if (G.scene === 'intro') drawIntro();
    else if (G.scene === 'who') drawWho();
    else if (G.scene === 'hub') drawHub();
    else if (G.scene === 'tower') drawTower();
    else if (G.scene === 'forge') drawForge();
    else if (G.scene === 'tree') drawTree();
    else if (G.scene === 'gate') drawGate();
    else if (G.scene === 'extract') drawExtract();
    else if (G.scene === 'era') drawEra();
    else if (G.scene === 'life') drawLife();
    else if (G.scene === 'story') drawStory();
    else drawHub();

    G.particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    });

    drawRipples();

    if (G.flash > 0) {
      ctx.fillStyle = 'rgba(94,224,208,' + (G.flash * 0.3) + ')';
      ctx.fillRect(-20, -20, W + 40, H + 40);
    }

    if (G.toastT > 0 && G.toast) {
      var tw = Math.min(W * 0.84, 300);
      var ty = H * 0.16 - (1.4 - G.toastT) * 8;
      ctx.globalAlpha = Math.min(1, G.toastT * 2);
      fillPanel((W - tw) / 2, ty, tw, 40, 10);
      text(G.toast, W / 2, ty + 26, { align: 'center', size: 13, color: CORE, glow: true });
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // cinematic fade / wipe between scenes
    if (G.fade > 0.001) {
      ctx.fillStyle = 'rgba(6,5,8,' + Math.min(1, G.fade) + ')';
      ctx.fillRect(0, 0, W, H);
      if (G.fade > 0.4) {
        ctx.globalAlpha = (G.fade - 0.4) / 0.6;
        text('CHRONOS', W / 2, H / 2, {
          align: 'center', size: 22, color: COPPER, display: true, shadow: false
        });
        ctx.globalAlpha = 1;
      }
    }
  }

  function frame(ts) {
    var dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function resize() {
    var parent = canvas.parentElement || document.body;
    var rw = parent.clientWidth || window.innerWidth;
    var rh = parent.clientHeight || window.innerHeight;
    W = Math.max(320, Math.floor(rw));
    H = Math.max(480, Math.floor(rh));
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function loadImage(key, src) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () { images[key] = im; resolve(); };
      im.onerror = function () { resolve(); };
      im.src = src;
    });
  }

  function boot() {
    canvas = document.getElementById('game');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'game';
      document.body.appendChild(canvas);
    }
    ctx = canvas.getContext('2d', { alpha: false });
    resize();
    window.addEventListener('resize', resize);

    canvas.addEventListener('pointerdown', function (e) { onPointer('down', e.clientX, e.clientY); });
    canvas.addEventListener('pointermove', function (e) { onPointer('move', e.clientX, e.clientY); });
    canvas.addEventListener('pointerup', function (e) { onPointer('up', e.clientX, e.clientY); });
    canvas.addEventListener('pointercancel', function () { G.pointer.down = false; });

    G.WORLD = loadWorld();
    G.scene = 'boot';

    var jobs = [
      loadImage('who', ART.who),
      loadImage('hub', ART.hub),
      loadImage('tower', ART.tower),
      loadImage('forge', ART.forge),
      loadImage('gate', ART.gate),
      loadImage('life', ART.life),
      loadImage('tree', ART.tree),
      loadImage('uiBtn', ART.uiBtn),
      loadImage('uiHud', ART.uiHud),
      loadImage('uiFrame', ART.uiFrame),
      loadImage('dock', '/public/art/chronos/dock-medallions.png'),
      loadImage('abilities', ART.uiAbilities)
    ];
    WARBAND.forEach(function (w) {
      jobs.push(loadImage('portrait-' + w.id, w.portrait));
    });

    var frameStarted = false;
    Promise.all(jobs).then(function () {
      if (G.scene === 'boot') {
        G.introT = 0;
        if (introSeen()) {
          G.scene = 'who';
        } else {
          G.scene = 'intro';
          sfx('intro');
          G.flash = 0.2;
        }
      }
      if (!frameStarted) {
        frameStarted = true;
        lastTs = performance.now();
        requestAnimationFrame(frame);
      }
    });

    try {
      bc = new BroadcastChannel('voidline-chronos');
    } catch (e) { bc = null; }

    // light presence ping
    setInterval(function () {
      if (!G.activeId || !G.WORLD) return;
      G.WORLD.presence[G.activeId] = Date.now();
      saveWorld();
      fetch('/api/chronos/' + encodeURIComponent(ROOM), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'presence', player: G.activeId })
      }).catch(function () {});
    }, 20000);
  }

  function snapScene(scene) {
    G.fade = 0;
    G.fadeTarget = 0;
    G.fadeScene = null;
    if (scene === 'hub' && G.tower) endTower(false);
    G.scene = scene;
    G.forge = [null, null];
    if (scene === 'hub') {
      G.enterPop = 1;
      G.hubCamX = 0;
      G.hubCamY = 0;
      G.hubFocus = null;
    }
  }

  window.VoidlineChronos = {
    getScene: function () { return G.scene; },
    getPlayer: function () { return G.P; },
    getWorld: function () { return G.WORLD; },
    pick: function (id) {
      G.activeId = id;
      loadPlayer(id);
      G.WORLD = loadWorld();
      claimDaily();
      G.WORLD.presence[id] = Date.now();
      saveWorld();
      if (G.WORLD.storyChapter === 0 && !G.P._introSeen) {
        G.storyOpen = 0;
        G.P._introSeen = true;
      }
      G.chronoDisp = G.P.chrono;
      savePlayer();
      snapScene('hub');
    },
    go: function (s) { snapScene(s); },
    startTower: function (coop) { snapScene('tower'); startTower(!!coop); },
    towerLive: function () { return !!(G.tower && G.tower.running); },
    seats: function () { return WARBAND.length; },
    dismissStory: function () { G.storyOpen = null; if (G.P) savePlayer(); },
    skipIntro: function () {
      markIntroSeen();
      snapScene('who');
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
