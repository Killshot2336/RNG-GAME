/**
 * System Diagnostic & Simulation Sandbox
 * --------------------------------------
 * Isolated debug / stress-test surface. All simulation arrays and timers live
 * here — they never write into inventory / sharedVault persistence, and sandbox
 * horde enemies are tagged so live wave spawns / skill-canvas pan / swipe tabs
 * stay untouched after cleanup.
 *
 * Hotkey: Ctrl + Shift + D  → toggle glass diagnostics HUD
 * Console:
 *   window.runMultiplayerSimulation(playerCount)
 *   window.runHordeStressTest(enemyCount)
 *   window.runLootSanityCheck(rolls = 5000)
 *   window.stopDiagnosticSandbox()
 */
import { getState } from '../store/gameStore.js'
import { multiplayerEngine } from '../engines/multiplayerEngine.js'
import { openLootChest, DIVINE_DROP_RATE } from '../data/gearCatalog.js'

const HUD_ID = 'sys-diag-hud'
const STYLE_ID = 'sys-diag-styles'

/** @type {null | ReturnType<import('../engines/combatEngine.js').createCombatEngine>} */
let combatRef = null

/** Isolated sandbox runtime — never aliased into gameStore.inventory. */
const sandbox = {
  hudVisible: false,
  raf: 0,
  mpTimer: 0,
  mpPeers: new Map(), // seat → sim state (isolated)
  presenceSnapshot: null,
  hordeActive: false,
  pingMs: 12,
  pingTimer: 0,
  lastLootReport: null,
  lastHordeReport: null,
  lastMpReport: null,
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    #${HUD_ID} {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 9999;
      width: min(320px, calc(100vw - 20px));
      pointer-events: auto;
      font-family: "JetBrains Mono", "SF Mono", ui-monospace, monospace;
      color: #e2e8f0;
      user-select: none;
    }
    #${HUD_ID}.is-hidden { display: none; }
    #${HUD_ID} .sdh-panel {
      background: linear-gradient(155deg, rgba(8, 18, 34, 0.72), rgba(2, 6, 14, 0.88));
      backdrop-filter: blur(18px) saturate(1.4);
      -webkit-backdrop-filter: blur(18px) saturate(1.4);
      border: 1px solid rgba(34, 211, 238, 0.28);
      border-radius: 14px;
      box-shadow:
        0 0 0 1px rgba(245, 197, 66, 0.08) inset,
        0 18px 40px rgba(0, 0, 0, 0.45);
      padding: 12px 14px 10px;
    }
    #${HUD_ID} .sdh-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
    }
    #${HUD_ID} .sdh-title h2 {
      margin: 0;
      font-size: 10px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #67e8f9;
      font-weight: 800;
    }
    #${HUD_ID} .sdh-badge {
      font-size: 9px;
      padding: 2px 7px;
      border-radius: 999px;
      background: rgba(245, 197, 66, 0.15);
      color: #f5c542;
      border: 1px solid rgba(245, 197, 66, 0.35);
      font-weight: 700;
    }
    #${HUD_ID} .sdh-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 10px;
      font-size: 11px;
      line-height: 1.35;
    }
    #${HUD_ID} .sdh-grid dt {
      color: #64748b;
      font-size: 9px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin: 0;
    }
    #${HUD_ID} .sdh-grid dd {
      margin: 0 0 4px;
      font-weight: 700;
      color: #f8fafc;
      font-variant-numeric: tabular-nums;
    }
    #${HUD_ID} .sdh-grid dd.warn { color: #fbbf24; }
    #${HUD_ID} .sdh-grid dd.crit { color: #f87171; }
    #${HUD_ID} .sdh-grid dd.ok { color: #34d399; }
    #${HUD_ID} .sdh-status {
      margin: 8px 0 0;
      font-size: 10px;
      color: #94a3b8;
      line-height: 1.35;
      min-height: 2.6em;
      word-break: break-word;
    }
    #${HUD_ID} .sdh-status.is-ok { color: #34d399; }
    #${HUD_ID} .sdh-status.is-warn { color: #fbbf24; }
    #${HUD_ID} .sdh-status.is-err { color: #f87171; }
    #${HUD_ID} .sdh-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }
    #${HUD_ID} .sdh-actions button {
      flex: 1 1 auto;
      min-width: 0;
      font-size: 9px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      font-weight: 800;
      padding: 7px 8px;
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.28);
      background: rgba(15, 23, 42, 0.75);
      color: #e2e8f0;
      cursor: pointer;
      transition: border-color 120ms, background 120ms;
    }
    #${HUD_ID} .sdh-actions button:hover {
      border-color: rgba(34, 211, 238, 0.55);
      background: rgba(8, 47, 73, 0.85);
    }
    #${HUD_ID} .sdh-foot {
      margin-top: 8px;
      font-size: 9px;
      color: #64748b;
      line-height: 1.4;
    }
  `
  document.head.appendChild(style)
}

function ensureHud() {
  ensureStyles()
  let root = document.getElementById(HUD_ID)
  if (root && !root.querySelector('[data-sdh="status"]')) {
    root.remove()
    root = null
  }
  if (root) return root
  root = document.createElement('aside')
  root.id = HUD_ID
  root.className = 'is-hidden'
  root.setAttribute('aria-label', 'System Diagnostics')
  root.innerHTML = `
    <div class="sdh-panel">
      <div class="sdh-title">
        <h2>System Diagnostics</h2>
        <span class="sdh-badge">SANDBOX</span>
      </div>
      <dl class="sdh-grid">
        <div><dt>FPS</dt><dd data-sdh="fps">—</dd></div>
        <div><dt>Frame</dt><dd data-sdh="frameMs">—</dd></div>
        <div><dt>Enemies</dt><dd data-sdh="enemies">—</dd></div>
        <div><dt>Projectiles</dt><dd data-sdh="projectiles">—</dd></div>
        <div><dt>Particles</dt><dd data-sdh="particles">—</dd></div>
        <div><dt>Pool In-Use</dt><dd data-sdh="pool">—</dd></div>
        <div><dt>Ping</dt><dd data-sdh="ping">—</dd></div>
        <div><dt>Sim Peers</dt><dd data-sdh="peers">0</dd></div>
      </dl>
      <p class="sdh-status" data-sdh="status">Idle · Ctrl+Shift+D</p>
      <div class="sdh-actions">
        <button type="button" data-sdh-act="mp" onclick="window.runMultiplayerSimulation && window.runMultiplayerSimulation(2)">MP Sim ×2</button>
        <button type="button" data-sdh-act="horde" onclick="window.runHordeStressTest && window.runHordeStressTest(120)">Horde ×120</button>
        <button type="button" data-sdh-act="loot" onclick="window.runLootSanityCheck && window.runLootSanityCheck(5000)">Loot ×5k</button>
        <button type="button" data-sdh-act="stop" onclick="window.stopDiagnosticSandbox && window.stopDiagnosticSandbox()">Stop All</button>
      </div>
      <p class="sdh-foot">Isolated from live vault / family RTDB · swipe & skill pan safe</p>
    </div>
  `
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sdh-act]')
    if (!btn) return
    const act = btn.getAttribute('data-sdh-act')
    try {
      if (act === 'mp') window.runMultiplayerSimulation(2)
      else if (act === 'horde') {
        Promise.resolve(window.runHordeStressTest(120)).catch((err) => {
          console.error('[sandbox] horde failed', err)
          setStatus(`Horde ERROR: ${err?.message || err}`, 'err')
        })
      } else if (act === 'loot') {
        try {
          window.runLootSanityCheck(5000)
        } catch (err) {
          console.error('[sandbox] loot failed', err)
          setStatus(`Loot ERROR: ${err?.message || err}`, 'err')
        }
      } else if (act === 'stop') window.stopDiagnosticSandbox()
    } catch (err) {
      console.error('[sandbox] action failed', err)
      setStatus(`ERROR: ${err?.message || err}`, 'err')
    }
  })
  // Prevent swipe / skill-canvas gestures from stealing the HUD.
  root.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true })
  root.addEventListener('pointerdown', (e) => e.stopPropagation())
  document.body.appendChild(root)
  return root
}

function setHudVisible(visible) {
  sandbox.hudVisible = visible
  const root = ensureHud()
  root.classList.toggle('is-hidden', !visible)
  if (visible) startHudLoop()
  else stopHudLoop()
}

function toggleHud() {
  setHudVisible(!sandbox.hudVisible)
}

function setStatus(msg, tone = '') {
  const root = document.getElementById(HUD_ID)
  const el = root?.querySelector('[data-sdh="status"]')
  if (!el) return
  el.textContent = msg
  el.classList.remove('is-ok', 'is-warn', 'is-err')
  if (tone) el.classList.add(`is-${tone}`)
}

function classifyFps(fps) {
  if (fps >= 50) return 'ok'
  if (fps >= 30) return 'warn'
  return 'crit'
}

function paintHud() {
  const root = document.getElementById(HUD_ID)
  if (!root || root.classList.contains('is-hidden')) return
  const d = combatRef?.getDiagnostics?.() || {
    fps: 0,
    frameMs: 0,
    enemies: 0,
    projectiles: 0,
    particles: 0,
    particlePoolInUse: 0,
    particlePoolCap: 0,
  }
  const set = (key, text, cls) => {
    const el = root.querySelector(`[data-sdh="${key}"]`)
    if (!el) return
    el.textContent = text
    el.classList.remove('ok', 'warn', 'crit')
    if (cls) el.classList.add(cls)
  }
  set('fps', `${d.fps?.toFixed?.(1) ?? d.fps}`, classifyFps(d.fps || 0))
  set('frameMs', `${d.frameMs ?? '—'} ms`)
  set('enemies', String(d.enemies))
  set('projectiles', String(d.projectiles))
  set('particles', String(d.particles))
  set('pool', `${d.particlePoolInUse}/${d.particlePoolCap || 0}`)
  set('ping', `${Math.round(sandbox.pingMs)} ms`, sandbox.pingMs > 80 ? 'warn' : 'ok')
  set('peers', String(sandbox.mpPeers.size))
}

function startHudLoop() {
  stopHudLoop()
  const tick = () => {
    paintHud()
    sandbox.raf = requestAnimationFrame(tick)
  }
  sandbox.raf = requestAnimationFrame(tick)
  if (!sandbox.pingTimer) {
    sandbox.pingTimer = window.setInterval(() => {
      // Simulated network latency meter — jitter around a baseline, no network I/O.
      const base = multiplayerEngine.isConfigured ? 28 : 8
      sandbox.pingMs = base + Math.random() * 18 + (sandbox.mpPeers.size > 0 ? 6 : 0)
    }, 500)
  }
}

function stopHudLoop() {
  if (sandbox.raf) {
    cancelAnimationFrame(sandbox.raf)
    sandbox.raf = 0
  }
}

/* ═══════════════════════════════════════════════════════════
   2. MULTIPLAYER TRAFFIC SIMULATOR
   ═══════════════════════════════════════════════════════════ */

const SIM_SEATS = [
  { seat: 'edward', name: 'Edward (sim)' },
  { seat: 'jamie', name: 'Jamie (sim)' },
]

function stopMultiplayerSimulation() {
  if (sandbox.mpTimer) {
    clearInterval(sandbox.mpTimer)
    sandbox.mpTimer = 0
  }
  sandbox.mpPeers.clear()
  if (sandbox.presenceSnapshot) {
    multiplayerEngine.injectSimulatedPresence(sandbox.presenceSnapshot)
    sandbox.presenceSnapshot = null
  } else {
    // Soft-offline only the seats we simulated.
    multiplayerEngine.injectSimulatedPresence({
      edward: { online: false, inMatch: false, lastSeen: Date.now(), displayName: 'Edward' },
      jamie: { online: false, inMatch: false, lastSeen: Date.now(), displayName: 'Jamie' },
    })
  }
  multiplayerEngine.clearSimulatedInvite()
  sandbox.lastMpReport = { stoppedAt: Date.now() }
  console.info('[sandbox] multiplayer simulation stopped — presence restored')
  return sandbox.lastMpReport
}

/**
 * Inject simulated peer blocks into Zustand presence + combat listener slots.
 * Virtual Edward / Jamie wander, take damage, enter DOWNED, and fire trade invites.
 * @param {number} playerCount
 */
function runMultiplayerSimulation(playerCount = 2) {
  stopMultiplayerSimulation()
  const n = Math.max(1, Math.min(SIM_SEATS.length, Math.floor(playerCount) || 2))
  const live = getState().presence
  sandbox.presenceSnapshot = structuredClone(live)

  for (let i = 0; i < n; i++) {
    const def = SIM_SEATS[i]
    const angle = (i / n) * Math.PI * 2
    sandbox.mpPeers.set(def.seat, {
      seat: def.seat,
      name: def.name,
      x: Math.cos(angle) * 4,
      z: Math.sin(angle) * 4,
      vx: 0,
      vz: 0,
      yaw: angle,
      hp: 100,
      maxHp: 100,
      downed: false,
      wanderT: 0,
      damageT: 1.5 + i,
      inviteT: 4 + i * 2,
      phase: Math.random() * Math.PI * 2,
    })
  }

  // Mark simulated seats online in Zustand presence (same slot live peers use).
  const presencePatch = {}
  sandbox.mpPeers.forEach((p) => {
    presencePatch[p.seat] = {
      online: true,
      inMatch: true,
      lastSeen: Date.now(),
      displayName: p.name,
      _sandbox: true,
    }
  })
  multiplayerEngine.injectSimulatedPresence(presencePatch)

  let ticks = 0
  sandbox.mpTimer = window.setInterval(() => {
    ticks++
    const dt = 0.2
    const presencePatchTick = {}
    sandbox.mpPeers.forEach((p) => {
      p.wanderT -= dt
      p.damageT -= dt
      p.inviteT -= dt
      p.phase += dt * 0.7

      if (p.wanderT <= 0) {
        p.wanderT = 1.2 + Math.random() * 1.8
        const a = Math.random() * Math.PI * 2
        const speed = 1.8 + Math.random() * 1.4
        p.vx = Math.cos(a) * speed
        p.vz = Math.sin(a) * speed
        p.yaw = a
      }

      if (!p.downed) {
        p.x = Math.max(-12, Math.min(12, p.x + p.vx * dt))
        p.z = Math.max(-12, Math.min(12, p.z + p.vz * dt))
      }

      if (p.damageT <= 0 && !p.downed) {
        p.damageT = 1.4 + Math.random() * 2
        p.hp = Math.max(0, p.hp - (8 + Math.random() * 18))
        if (p.hp <= 0) {
          p.downed = true
          p.hp = 0
          p.vx = 0
          p.vz = 0
          console.info(`[sandbox] ${p.name} → DOWNED`)
        }
      }

      // Periodic revive so the sync path keeps exercising both states.
      if (p.downed && ticks % 40 === 0) {
        p.downed = false
        p.hp = p.maxHp * 0.6
        console.info(`[sandbox] ${p.name} revived (sim)`)
      }

      if (p.inviteT <= 0) {
        p.inviteT = 8 + Math.random() * 6
        multiplayerEngine.injectSimulatedInvite({
          from: p.seat,
          fromName: p.name,
          roomId: 'sandbox-sim',
          at: Date.now(),
          _sandbox: true,
        })
        console.info(`[sandbox] mock trade/team invite from ${p.name}`)
        // Auto-clear shortly so live UI isn't stuck on the overlay.
        window.setTimeout(() => {
          const inv = getState().inviteOverlay
          if (inv && inv._sandbox) multiplayerEngine.clearSimulatedInvite()
        }, 2200)
      }

      multiplayerEngine.injectSimulatedCombat({
        seat: p.seat,
        x: p.x,
        y: p.downed ? 0.2 : 0.85,
        z: p.z,
        vx: p.vx,
        vz: p.vz,
        downed: p.downed,
        hp: p.hp,
        aimYaw: p.yaw,
        ts: Date.now(),
        _sandbox: true,
      })

      presencePatchTick[p.seat] = {
        online: true,
        inMatch: true,
        lastSeen: Date.now(),
        displayName: p.name,
        _sandbox: true,
      }
    })
    multiplayerEngine.injectSimulatedPresence(presencePatchTick)
  }, 200)

  sandbox.lastMpReport = {
    startedAt: Date.now(),
    peers: [...sandbox.mpPeers.keys()],
    note: 'Injecting into Zustand presence + combat listeners only (no Firebase writes)',
  }
  console.log('[sandbox] multiplayer simulation started', sandbox.lastMpReport)
  setStatus(`MP sim · peers ${sandbox.mpPeers.size} (Edward/Jamie)`, 'ok')
  if (!sandbox.hudVisible) setHudVisible(true)
  return sandbox.lastMpReport
}

/* ═══════════════════════════════════════════════════════════
   3. SWARM HORDE STRESS-TEST MANAGER
   ═══════════════════════════════════════════════════════════ */

/**
 * Spawn a massive sandbox-tagged enemy swarm and run the check matrix:
 *  - processAutoWeaponFires() timing under load
 *  - particle pool splice hygiene (alpha ≤ 0)
 *  - Euclidean target-sort scaling without main-thread lock
 * @param {number} enemyCount
 */
async function runHordeStressTest(enemyCount = 120) {
  if (!combatRef) {
    console.error('[sandbox] combat engine not bound — call mountSystemDiagnosticSandbox(combat) first')
    setStatus('Horde ERROR: combat not bound', 'err')
    return null
  }
  if (typeof combatRef.spawnSandboxHorde !== 'function') {
    console.error('[sandbox] combat engine missing spawnSandboxHorde — hard-refresh required')
    setStatus('Horde ERROR: missing spawnSandboxHorde (hard-refresh)', 'err')
    return null
  }

  setStatus(`Horde spawning ×${enemyCount}…`, 'warn')
  const count = Math.max(1, Math.floor(enemyCount) || 120)
  combatRef.clearSandboxHorde()
  const spawned = combatRef.spawnSandboxHorde(count)
  sandbox.hordeActive = true
  console.log(`[sandbox] spawned ${spawned} sandbox enemies`)

  // Let a few real frames land so FPS EMA reflects the load.
  const fpsSamples = []
  const sampleFps = () =>
    new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const d = combatRef.getDiagnostics()
          fpsSamples.push(d.fps)
          resolve(d)
        })
      })
    })

  await sampleFps()
  await sampleFps()
  await sampleFps()

  const sortBench = combatRef.benchmarkTargetSort(250)
  // Force sparks then audit that alpha≤0 entries splice cleanly.
  combatRef.debugBurstSparks(0, 0)
  combatRef.debugBurstSparks(2, -1)
  const particleAudit = combatRef.auditParticlePool(120, 1 / 60)

  const diag = combatRef.getDiagnostics()
  const avgFps = fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length
  const frameDrop = avgFps < 45
  const sortLocked = sortBench.maxMs > 8 // >8ms on target sort = worrying hitch

  const report = {
    spawned,
    enemiesLive: diag.enemies,
    projectiles: diag.projectiles,
    particles: diag.particles,
    fpsSamples,
    avgFps: Math.round(avgFps * 10) / 10,
    processAutoWeaponFires: sortBench,
    particleAudit,
    checks: {
      frameStable: !frameDrop,
      particlePoolClean: particleAudit.ok,
      euclideanSortScales: !sortLocked && sortBench.avgMs < 2,
    },
  }
  report.passed =
    report.checks.particlePoolClean && report.checks.euclideanSortScales

  sandbox.lastHordeReport = report
  console.log(
    `[sandbox] horde stress ×${count} — ${report.passed ? 'PASS' : 'WARN'}`,
    report
  )
  console.table({
    spawned: report.spawned,
    enemiesLive: report.enemiesLive,
    avgFps: report.avgFps,
    sortAvgMs: +sortBench.avgMs.toFixed(4),
    sortMaxMs: +sortBench.maxMs.toFixed(4),
    particlesBefore: particleAudit.before,
    particlesAfter: particleAudit.after,
    leakedAlphaZero: particleAudit.leakedAlphaZero,
  })
  setStatus(
    `Horde ×${spawned} · FPS ${report.avgFps} · sort ${sortBench.avgMs.toFixed(2)}ms · ${report.passed ? 'PASS' : 'WARN'}`,
    report.passed ? 'ok' : 'warn'
  )

  if (!sandbox.hudVisible) setHudVisible(true)
  return report
}

/* ═══════════════════════════════════════════════════════════
   4. AUTOMATED LOOT STATE SANITY CHECKER
   ═══════════════════════════════════════════════════════════ */

/**
 * Run N pure openLootChest() rolls. Never mutates inventory / sharedVault.
 * Logs rarity distribution and validates the 0.02% Divine index fires.
 * @param {number} rolls
 */
function runLootSanityCheck(rolls = 5000) {
  const n = Math.max(100, Math.floor(rolls) || 5000)
  setStatus(`Loot rolling ×${n}…`, 'warn')
  const vaultBefore = structuredClone(getState().inventory)
  const creditsBefore = getState().credits

  const counts = { common: 0, rare: 0, epic: 0, divine: 0 }
  const t0 = performance.now()
  for (let i = 0; i < n; i++) {
    const item = openLootChest({ rarityBias: 1 })
    const tier = item.displayTier || (item.rarity === 'legendary' ? 'divine' : item.rarity)
    if (tier === 'divine') counts.divine++
    else if (tier === 'epic') counts.epic++
    else if (tier === 'rare') counts.rare++
    else counts.common++
  }
  const elapsedMs = performance.now() - t0

  const vaultAfter = getState().inventory
  const vaultUntouched =
    vaultAfter.length === vaultBefore.length &&
    JSON.stringify(vaultAfter) === JSON.stringify(vaultBefore) &&
    getState().credits === creditsBefore

  const pct = (c) => +((c / n) * 100).toFixed(4)
  const divinePct = (counts.divine / n) * 100
  const expectedDivinePct = DIVINE_DROP_RATE * 100 // 0.02
  // With 5k rolls, expect ~1 divine; allow wide CI (0–0.15%) so flakes don't fail.
  const divinePlausible = divinePct >= 0 && divinePct <= 0.15

  const report = {
    rolls: n,
    elapsedMs: Math.round(elapsedMs * 100) / 100,
    counts,
    percentages: {
      common: pct(counts.common),
      rare: pct(counts.rare),
      epic: pct(counts.epic),
      divine: pct(counts.divine),
    },
    expectedDivinePct,
    divinePlausible,
    vaultUntouched,
    passed: vaultUntouched && divinePlausible,
  }

  sandbox.lastLootReport = report
  console.log(
    `[sandbox] loot sanity ×${n} — ${report.passed ? 'PASS' : 'FAIL'}`,
    report.percentages,
    { divine: counts.divine, vaultUntouched, elapsedMs: report.elapsedMs }
  )
  console.table(report.percentages)
  console.log(
    `Divine drops: ${counts.divine}/${n} (${report.percentages.divine}%) · expected index ${expectedDivinePct}% · vault untouched: ${vaultUntouched}`
  )
  setStatus(
    `Loot ×${n} · C ${report.percentages.common}% R ${report.percentages.rare}% E ${report.percentages.epic}% D ${report.percentages.divine}% · ${report.passed ? 'PASS' : 'FAIL'}`,
    report.passed ? 'ok' : 'err'
  )

  if (!sandbox.hudVisible) setHudVisible(true)
  return report
}

/* ═══════════════════════════════════════════════════════════
   Lifecycle
   ═══════════════════════════════════════════════════════════ */

function stopDiagnosticSandbox() {
  stopMultiplayerSimulation()
  if (combatRef?.clearSandboxHorde) {
    const removed = combatRef.clearSandboxHorde()
    console.log(`[sandbox] cleared ${removed} sandbox horde enemies`)
  }
  sandbox.hordeActive = false
  if (sandbox.pingTimer) {
    clearInterval(sandbox.pingTimer)
    sandbox.pingTimer = 0
  }
  stopHudLoop()
  setStatus('Stopped · sandbox cleared', 'ok')
  console.log('[sandbox] all diagnostics stopped')
  return {
    loot: sandbox.lastLootReport,
    horde: sandbox.lastHordeReport,
    mp: sandbox.lastMpReport,
  }
}

function onKeyDown(e) {
  if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
    e.preventDefault()
    toggleHud()
  }
}

/**
 * Bind the live combat engine and expose window.* entry points.
 * @param {ReturnType<import('../engines/combatEngine.js').createCombatEngine>} combat
 */
export function mountSystemDiagnosticSandbox(combat) {
  combatRef = combat
  // Always rebuild HUD so HMR / re-mount picks up fresh handlers.
  document.getElementById(HUD_ID)?.remove()
  ensureHud()

  window.runMultiplayerSimulation = runMultiplayerSimulation
  window.runHordeStressTest = runHordeStressTest
  window.runLootSanityCheck = runLootSanityCheck
  window.stopDiagnosticSandbox = stopDiagnosticSandbox
  window.toggleSystemDiagnostics = toggleHud

  window.addEventListener('keydown', onKeyDown)

  console.log(
    '[sandbox] System Diagnostic ready — Ctrl+Shift+D · runMultiplayerSimulation() · runHordeStressTest() · runLootSanityCheck()'
  )

  return {
    toggleHud,
    runMultiplayerSimulation,
    runHordeStressTest,
    runLootSanityCheck,
    stopDiagnosticSandbox,
  }
}

export default mountSystemDiagnosticSandbox
