/**
 * High-fidelity 3D isometric combat field (Three.js WebGL).
 * Orthographic iso camera, metallic dungeon grid, Vector3 proximity targeting,
 * box-mesh death bursts, and camera jolt on heavy impacts.
 */
import * as THREE from 'three'
import { getState } from '../store/gameStore.js'
import { eraById } from '../data/eras.js'
import { multiplayerEngine } from './multiplayerEngine.js'

const FRUSTUM = 12
const PLAYER_BODY_Y = 0.42
/** Roblox-style iso rig — equal offset on all axes, 45° high angle. */
const CAM_ISO_X = 60
const CAM_ISO_Y = 60
const CAM_ISO_Z = 60
/** Keyboard movement iso projection (unchanged from prior loop). */
const ISO_YAW = Math.PI / 4
/** Glowing cyan vector combat grid (world units). */
const GRID_EXTENT = 120
const GRID_DIVISIONS = 40
const GRID_COLOR_MAIN = 0x00ffff
const GRID_COLOR_SUB = 0x0a3d52
const SCENE_BG = 0x02050f
const FOG_DENSITY = 0.012
const BURST_COUNT = 14
const BURST_POOL_CAP = BURST_COUNT * 12

/** Reusable math scratch — avoids per-frame allocations. */
const _v3A = new THREE.Vector3()
const _v3B = new THREE.Vector3()
const _v3Dir = new THREE.Vector3()
const _v3Up = new THREE.Vector3(0, 1, 0)

function createRenderer(canvas) {
  // WebGL pipeline bound to #combat-canvas — no 2D ctx drawing on the battle surface.
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  return renderer
}

function makeFloatingText() {
  return {
    items: [],
    spawn(x, y, z, text, color = '#fff') {
      this.items.push({ x, y, z, text, color, life: 0, max: 1.1, vy: 1.8 })
    },
    update(dt, project, draw) {
      for (let i = this.items.length - 1; i >= 0; i--) {
        const t = this.items[i]
        t.life += dt
        t.y += t.vy * dt
        t.vy *= 0.98
        if (t.life >= t.max) {
          this.items.splice(i, 1)
          continue
        }
        const p = project(t.x, t.y, t.z)
        if (p) draw(p.x, p.y, t.text, t.color, 1 - t.life / t.max)
      }
    },
  }
}

function disposeMesh(mesh) {
  if (!mesh) return
  mesh.traverse((child) => {
    if (child.geometry && child.geometry.userData?.owned) child.geometry.dispose()
    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      mats.forEach((m) => {
        if (m.userData?.owned) m.dispose()
      })
    }
  })
}

function markOwned(geoOrMat) {
  if (geoOrMat) geoOrMat.userData = { ...geoOrMat.userData, owned: true }
  return geoOrMat
}

function styleCombatGrid(grid) {
  const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material]
  gridMats.forEach((m, i) => {
    m.transparent = true
    m.opacity = 0.6
    m.depthWrite = false
    m.blending = THREE.AdditiveBlending
    m.color.setHex(i === 0 ? GRID_COLOR_MAIN : GRID_COLOR_SUB)
  })
  grid.position.y = 0.015
  grid.renderOrder = 2
}

function createPlayerRig() {
  const rig = new THREE.Group()

  const core = new THREE.Mesh(
    markOwned(new THREE.SphereGeometry(0.42, 32, 32)),
    markOwned(new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false }))
  )
  rig.add(core)

  const wireShell = new THREE.Mesh(
    markOwned(new THREE.SphereGeometry(0.52, 20, 20)),
    markOwned(new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true }))
  )
  rig.add(wireShell)

  const ring = new THREE.Mesh(
    markOwned(new THREE.TorusGeometry(0.58, 0.045, 16, 64)),
    markOwned(new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true }))
  )
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.04
  rig.add(ring)

  const weaponMount = new THREE.Group()
  weaponMount.position.set(0, 0.02, 0.38)
  const barrel = new THREE.Mesh(
    markOwned(new THREE.CylinderGeometry(0.045, 0.07, 0.38, 10)),
    markOwned(new THREE.MeshBasicMaterial({ color: 0x22d3ee }))
  )
  barrel.rotation.x = Math.PI / 2
  weaponMount.add(barrel)
  rig.add(weaponMount)

  rig.userData.weaponMount = weaponMount
  rig.userData.neonRing = ring
  return rig
}

export function createCombatEngine(canvas, hudCanvas) {
  const canvasEl = canvas
  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: false })
  renderer.setSize(canvasEl.clientWidth || 640, canvasEl.clientHeight || 480)
  renderer.setPixelRatio(window.devicePixelRatio || 1)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x02050c)
  scene.fog = new THREE.FogExp2(0x02050c, 0.01)

  const camera = new THREE.OrthographicCamera(-FRUSTUM, FRUSTUM, FRUSTUM, -FRUSTUM, 0.01, 500)
  camera.position.set(CAM_ISO_X, CAM_ISO_Y, CAM_ISO_Z)
  camera.lookAt(0, 0, 0)

  const floorGeo = new THREE.PlaneGeometry(300, 300)
  // MeshStandardMaterial can fail or look near-black under software WebGL fallback.
  // MeshBasicMaterial is self-lit and guarantees visible floor geometry.
  const floorMat = new THREE.MeshBasicMaterial({
    color: 0x0b2a55,
    side: THREE.DoubleSide,
  })
  const floorMesh = new THREE.Mesh(floorGeo, floorMat)
  floorMesh.rotation.x = -Math.PI / 2
  floorMesh.position.y = 0
  floorMesh.receiveShadow = false
  scene.add(floorMesh)

  const globalAmbient = new THREE.AmbientLight(0xffffff, 0.55)
  scene.add(globalAmbient)

  const directionalSpot = new THREE.DirectionalLight(0x22d3ee, 1.8)
  directionalSpot.position.set(50, 120, 50)
  directionalSpot.castShadow = false
  scene.add(directionalSpot)

  const playerPointLight = new THREE.PointLight(0xffaa00, 2.5, 30)
  scene.add(playerPointLight)

  const arenaGroup = new THREE.Group()
  scene.add(arenaGroup)

  const neonGrid = new THREE.GridHelper(300, 60, 0x00ffff, 0x1e293b)
  neonGrid.position.y = 0.02 // Elevated minutely above floor to prevent z-fighting flicker
  const neonGridMats = Array.isArray(neonGrid.material) ? neonGrid.material : [neonGrid.material]
  neonGridMats.forEach((m) => {
    m.transparent = true
    m.opacity = 1.0
    m.depthWrite = false
    if ('blending' in m) m.blending = THREE.AdditiveBlending
    if (m.color) m.color.setHex(0x00ffff)
    if ('emissive' in m && m.emissive) m.emissive.setHex(0x00ffff)
    if ('emissiveIntensity' in m) m.emissiveIntensity = 1.0
  })
  scene.add(neonGrid)

  const player = {
    mesh: null,
    x: 0,
    z: 0,
    yaw: 0,
    speed: 5.5,
    hp: 100,
    maxHp: 100,
    fireCd: 0,
    downed: false,
  }

  const enemies = []
  const projectiles = []
  const coins = []
  const particles = []
  const particlePool = []
  let burstBoxGeo = null

  const remotePlayers = new Map()
  const keys = Object.create(null)
  const floating = makeFloatingText()

  const cameraJolt = { x: 0, y: 0, z: 0, strength: 0 }

  let wave = 1
  let running = false
  let raf = 0
  let last = performance.now()
  let syncAccum = 0
  let frameCounter = 0
  let cachedTarget = null
  let cachedTargetId = -1
  let nextEnemyId = 1
  let hudCtx = hudCanvas ? hudCanvas.getContext('2d') : null
  let fpsEma = 60
  let lastFrameMs = 16.67
  const sandboxEnemyIds = new Set()

  let sharedIcosaGeo = null
  let sharedLaserGeo = null

  function ensureBurstPool() {
    if (burstBoxGeo) return
    burstBoxGeo = new THREE.BoxGeometry(0.07, 0.07, 0.07)
    for (let i = 0; i < BURST_POOL_CAP; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xff66cc,
        transparent: true,
        opacity: 0,
      })
      const mesh = new THREE.Mesh(burstBoxGeo, mat)
      mesh.visible = false
      mesh.frustumCulled = false
      mesh.castShadow = false
      scene.add(mesh)
      particlePool.push({
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0,
        alpha: 0,
        spin: 0,
        inUse: false,
      })
    }
  }

  function acquireBurst() {
    for (let i = 0; i < particlePool.length; i++) {
      if (!particlePool[i].inUse) return particlePool[i]
    }
    return null
  }

  function releaseBurst(p) {
    p.inUse = false
    p.alpha = 0
    p.life = 0
    p.mesh.visible = false
    p.mesh.material.opacity = 0
  }

  function removeFromScene(mesh) {
    if (mesh?.parent) mesh.parent.remove(mesh)
    else scene.remove(mesh)
  }

  function rebuildArena() {
    const era = eraById(getState().eraId)
    if (player.mesh?.userData?.neonRing) {
      player.mesh.userData.neonRing.material.color.set(era.palette.accent)
    }
  }

  function ensurePlayerMesh() {
    if (player.mesh) return
    player.mesh = createPlayerRig()
    scene.add(player.mesh)
  }

  function spawnEnemy(opts = {}) {
    const era = eraById(getState().eraId)
    const scale = 0.5 * era.enemyScale
    if (!sharedIcosaGeo) sharedIcosaGeo = new THREE.IcosahedronGeometry(1, 0)

    const mesh = new THREE.Mesh(
      sharedIcosaGeo,
      markOwned(new THREE.MeshBasicMaterial({ color: 0xff3333 }))
    )
    mesh.castShadow = true
    const angle = opts.angle ?? Math.random() * Math.PI * 2
    const dist = opts.dist ?? 10 + Math.random() * 4
    const x = opts.x ?? Math.cos(angle) * dist
    const z = opts.z ?? Math.sin(angle) * dist
    mesh.position.set(x, scale * 0.85, z)
    mesh.scale.setScalar(scale)
    scene.add(mesh)

    const id = nextEnemyId++
    const enemy = {
      id,
      mesh,
      baseScale: scale,
      breathePhase: Math.random() * Math.PI * 2,
      hp: opts.hp ?? 2 + Math.floor(wave * 0.6) + era.order,
      maxHp: opts.hp ?? 2 + Math.floor(wave * 0.6) + era.order,
      speed: opts.speed ?? 1.6 + wave * 0.05 + era.order * 0.12,
      radius: scale,
      sandbox: !!opts.sandbox,
    }
    enemies.push(enemy)
    if (enemy.sandbox) sandboxEnemyIds.add(id)
    return enemy
  }

  function ensureWave() {
    if (enemies.length) return
    wave += 1
    getState().setWave(wave)
    const count = 5 + wave * 2
    for (let i = 0; i < count; i++) spawnEnemy()
  }

  function triggerCameraJolt(intensity = 0.42) {
    cameraJolt.x = (Math.random() - 0.5) * intensity
    cameraJolt.y = (Math.random() - 0.5) * intensity * 0.55
    cameraJolt.z = (Math.random() - 0.5) * intensity
    cameraJolt.strength = 1
  }

  function updateCameraJolt(dt) {
    if (cameraJolt.strength <= 0) return
    cameraJolt.strength = Math.max(0, cameraJolt.strength - dt * 5.5)
  }

  function spawnDeathBurst(x, y, z, colorHex = 0xfb7185) {
    ensureBurstPool()
    for (let i = 0; i < BURST_COUNT; i++) {
      const p = acquireBurst()
      if (!p) break
      p.inUse = true
      p.mesh.visible = true
      p.mesh.material.color.setHex(colorHex)
      p.mesh.material.opacity = 1
      p.alpha = 1
      p.mesh.position.set(x, y, z)
      p.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI)
      p.spin = (Math.random() - 0.5) * 14

      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const force = 3.5 + Math.random() * 7
      p.vx = Math.sin(phi) * Math.cos(theta) * force
      p.vy = Math.abs(Math.cos(phi)) * force + 1.4
      p.vz = Math.sin(phi) * Math.sin(theta) * force
      p.maxLife = 0.5 + Math.random() * 0.4
      p.life = p.maxLife
      particles.push(p)
    }
    triggerCameraJolt(0.38)
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const s = particles[i]
      s.life -= dt
      s.vy -= 11 * dt
      s.mesh.position.x += s.vx * dt
      s.mesh.position.y += s.vy * dt
      s.mesh.position.z += s.vz * dt
      s.mesh.rotation.x += s.spin * dt
      s.mesh.rotation.y += s.spin * dt * 0.7
      s.alpha = Math.max(0, s.life / s.maxLife)
      s.mesh.material.opacity = s.alpha
      if (s.alpha <= 0 || s.life <= 0 || s.mesh.position.y < -0.2) {
        releaseBurst(s)
        particles.splice(i, 1)
      }
    }
  }

  function spawnCoin(x, z) {
    const mesh = new THREE.Mesh(
      markOwned(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 20)),
      markOwned(new THREE.MeshBasicMaterial({ color: 0xffdd57 }))
    )
    mesh.rotation.x = Math.PI / 2
    mesh.position.set(x, 0.35, z)
    mesh.castShadow = true
    scene.add(mesh)
    coins.push({ mesh, value: 5 + Math.floor(Math.random() * 8), spin: Math.random() })
  }

  function aimWeaponAt(targetPos) {
    const mount = player.mesh?.userData?.weaponMount
    if (!mount || !targetPos) return
    mount.lookAt(targetPos.x, targetPos.y, targetPos.z)
  }

  function orientLaser(mesh, dir, speed) {
    _v3Dir.copy(dir).normalize()
    mesh.quaternion.setFromUnitVectors(_v3Up, _v3Dir)
    const stretch = 2.2 + Math.min(speed, 24) * 0.18
    mesh.scale.set(1, stretch, 1)
  }

  function fireAt(target) {
    const era = eraById(getState().eraId)
    const mods = getState().skillMods()
    const originY = PLAYER_BODY_Y
    _v3A.set(player.x, originY, player.z)
    _v3B.copy(target.mesh.position)
    aimWeaponAt(_v3B)

    const dir = _v3Dir.subVectors(_v3B, _v3A).normalize()
    if (!sharedLaserGeo) {
      // Thicker than before so lasers remain visible under degraded/software WebGL rendering.
      sharedLaserGeo = new THREE.CylinderGeometry(0.06, 0.04, 2.5, 10)
    }

    const makeBolt = (yawOffset) => {
      const d = dir.clone().applyAxisAngle(_v3Up, yawOffset)
      const speed = era.projectile.speed
      const mat = markOwned(new THREE.MeshBasicMaterial({ color: 0x22d3ee }))
      const mesh = new THREE.Mesh(sharedLaserGeo, mat)
      mesh.position.copy(_v3A)
      orientLaser(mesh, d, speed)
      scene.add(mesh)
      projectiles.push({
        mesh,
        vx: d.x * speed,
        vy: d.y * speed,
        vz: d.z * speed,
        dmg: 1 * mods.damage,
        life: 1.5,
        speed,
      })
    }

    makeBolt(0)
    if (mods.multishot) {
      makeBolt(0.16)
      makeBolt(-0.16)
    }
  }

  /**
   * Auto-shoot target sort — squared horizontal distance (dx² + dy²) on the arena plane.
   * dy maps to depth (world Z) so the closest enemy node is picked every refresh tick.
   */
  function processAutoWeaponFires() {
    frameCounter++
    if (frameCounter % 3 === 0 || !cachedTarget || cachedTarget.hp <= 0) {
      let best = null
      let bestD2 = Infinity
      const px = player.x
      const pz = player.z
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i]
        const p = e.mesh.position
        const dx = p.x - px
        const dy = p.z - pz
        const d2 = dx * dx + dy * dy
        if (d2 < bestD2) {
          bestD2 = d2
          best = e
        }
      }
      cachedTarget = best
      cachedTargetId = best ? best.id : -1
    } else if (cachedTargetId >= 0) {
      let alive = false
      for (let i = 0; i < enemies.length; i++) {
        if (enemies[i].id === cachedTargetId) {
          cachedTarget = enemies[i]
          alive = true
          break
        }
      }
      if (!alive) {
        cachedTarget = null
        cachedTargetId = -1
      }
    }
    return cachedTarget
  }

  function fireAtNearest() {
    const target = processAutoWeaponFires()
    if (!target || player.fireCd > 0) return
    fireAt(target)
    const era = eraById(getState().eraId)
    const mods = getState().skillMods()
    player.fireCd = 0.38 * mods.fireRate * (18 / era.projectile.speed)
  }

  function projectToHud(x, y, z) {
    const v = _v3A.set(x, y, z).project(camera)
    return {
      x: (v.x * 0.5 + 0.5) * hudCanvas.width,
      y: (-v.y * 0.5 + 0.5) * hudCanvas.height,
    }
  }

  function drawHudText(x, y, text, color, alpha) {
    if (!hudCtx) return
    hudCtx.save()
    hudCtx.globalAlpha = alpha
    hudCtx.font = '900 16px Segoe UI, sans-serif'
    hudCtx.textAlign = 'center'
    hudCtx.fillStyle = color
    hudCtx.shadowColor = color
    hudCtx.shadowBlur = 12
    hudCtx.fillText(text, x, y)
    hudCtx.restore()
  }

  function resize() {
    const parent = canvas.parentElement
    const w = parent.clientWidth || 640
    const h = parent.clientHeight || 480
    renderer.setSize(w, h, false)
    canvas.width = w
    canvas.height = h
    if (hudCanvas) {
      hudCanvas.width = w
      hudCanvas.height = h
    }
    const a = w / h
    camera.left = -FRUSTUM * a
    camera.right = FRUSTUM * a
    camera.top = FRUSTUM
    camera.bottom = -FRUSTUM
    camera.updateProjectionMatrix()
  }

  function syncPlayerPointLight() {
    if (player.mesh) playerPointLight.position.copy(player.mesh.position)
  }

  function applyCamera() {
    const shake = cameraJolt.strength
    const jx = cameraJolt.x * shake
    const jy = cameraJolt.y * shake
    const jz = cameraJolt.z * shake
    camera.position.set(player.x + CAM_ISO_X, CAM_ISO_Y, player.z + CAM_ISO_Z)
    camera.lookAt(player.x + jx, jy, player.z + jz)
  }

  function killEnemy(e, state, ei) {
    if (cachedTargetId === e.id) {
      cachedTarget = null
      cachedTargetId = -1
    }
    const pos = e.mesh.position
    spawnDeathBurst(pos.x, pos.y, pos.z, eraById(state.eraId).palette.accent)
    spawnCoin(pos.x, pos.z)
    if (Math.random() < 0.35) spawnCoin(pos.x + 0.4, pos.z - 0.3)
    floating.spawn(pos.x, pos.y + 0.6, pos.z, 'BLOWN', '#fb7185')
    removeFromScene(e.mesh)
    disposeMesh(e.mesh)
    sandboxEnemyIds.delete(e.id)
    enemies.splice(ei, 1)
    state.bumpKill()
    state.addCredits(3)
  }

  function update(dt) {
    const state = getState()
    if (state.skillViewOpen || state.panel !== 'hub') return

    updateCameraJolt(dt)

    if (player.downed) {
      updateParticles(dt)
      updateRemotePlayers(dt)
      syncPlayerPointLight()
      applyCamera()
      return
    }

    const mods = state.skillMods()
    let mx = 0
    let mz = 0
    if (keys.w || keys.arrowup) mz -= 1
    if (keys.s || keys.arrowdown) mz += 1
    if (keys.a || keys.arrowleft) mx -= 1
    if (keys.d || keys.arrowright) mx += 1
    if (mx || mz) {
      const lenSq = mx * mx + mz * mz
      const invLen = lenSq > 0 ? 1 / Math.sqrt(lenSq) : 1
      mx *= invLen
      mz *= invLen
      const ang = -ISO_YAW
      const rx = mx * Math.cos(ang) - mz * Math.sin(ang)
      const rz = mx * Math.sin(ang) + mz * Math.cos(ang)
      player.x += rx * player.speed * dt
      player.z += rz * player.speed * dt
      const lim = 14
      player.x = Math.max(-lim, Math.min(lim, player.x))
      player.z = Math.max(-lim, Math.min(lim, player.z))
      player.yaw = Math.atan2(rx, rz)
    }

    if (player.mesh) {
      player.mesh.position.set(player.x, PLAYER_BODY_Y, player.z)
      player.mesh.rotation.y = player.yaw
    }

    syncPlayerPointLight()

    ensureWave()

    player.fireCd -= dt
    fireAtNearest()

    const now = performance.now()
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]
      p.mesh.position.x += p.vx * dt
      p.mesh.position.y += p.vy * dt
      p.mesh.position.z += p.vz * dt
      orientLaser(p.mesh, _v3Dir.set(p.vx, p.vy, p.vz), p.speed)
      p.life -= dt
      let hit = false
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const e = enemies[ei]
        const ep = e.mesh.position
        const dx = ep.x - p.mesh.position.x
        const dy = ep.y - p.mesh.position.y
        const dz = ep.z - p.mesh.position.z
        const rad = e.radius + 0.22
        if (dx * dx + dy * dy + dz * dz < rad * rad) {
          e.hp -= p.dmg
          floating.spawn(ep.x, ep.y + 0.5, ep.z, `-${Math.round(p.dmg * 10)}`, '#f472b6')
          hit = true
          if (e.hp <= 0) killEnemy(e, state, ei)
          break
        }
      }
      if (hit || p.life <= 0) {
        removeFromScene(p.mesh)
        disposeMesh(p.mesh)
        projectiles.splice(i, 1)
      }
    }

    const contactR = 0.42
    for (let ei = 0; ei < enemies.length; ei++) {
      const e = enemies[ei]
      const ep = e.mesh.position
      const dx = player.x - ep.x
      const dz = player.z - ep.z
      const d2 = dx * dx + dz * dz
      const contact = e.radius + contactR
      if (d2 > 0.0001) {
        const inv = 1 / Math.sqrt(d2)
        ep.x += dx * inv * e.speed * dt
        ep.z += dz * inv * e.speed * dt
      }
      const breath = 1 + Math.sin(now * 0.006 + e.breathePhase) * 0.12
      e.mesh.scale.setScalar(e.baseScale * breath)
      e.mesh.rotation.y += dt * 2.2
      e.mesh.rotation.x = Math.sin(now * 0.004 + e.breathePhase) * 0.15

      if (d2 < contact * contact) {
        player.hp -= 18 * dt
        if (player.hp <= 0 && !player.downed) {
          player.downed = true
          player.hp = 0
          state.setMatch({ downed: true })
          triggerCameraJolt(0.65)
          multiplayerEngine.publishCombatState(
            { x: player.x, y: 0.2, z: player.z, vx: 0, vz: 0, downed: true, hp: 0 },
            { force: true }
          )
          floating.spawn(player.x, 1.5, player.z, 'DOWNED', '#ef4444')
          state.toast('You are down — wait for revive or re-enter')
        }
      }
    }

    const magnet = 2.8 * mods.magnet
    const magnetSq = magnet * magnet
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i]
      c.spin += dt * 4
      c.mesh.rotation.z = c.spin
      const dx = player.x - c.mesh.position.x
      const dz = player.z - c.mesh.position.z
      const d2 = dx * dx + dz * dz
      if (d2 < magnetSq && d2 > 0.0001) {
        const inv = 1 / Math.sqrt(d2)
        c.mesh.position.x += dx * inv * 10 * dt
        c.mesh.position.z += dz * inv * 10 * dt
      }
      if (d2 < 0.3025) {
        state.addCredits(c.value)
        floating.spawn(c.mesh.position.x, 1, c.mesh.position.z, `+${c.value}¤`, '#fbbf24')
        removeFromScene(c.mesh)
        disposeMesh(c.mesh)
        coins.splice(i, 1)
      }
    }

    updateParticles(dt)
    updateRemotePlayers(dt)
    applyCamera()

    syncAccum += dt
    if (syncAccum > 0.1) {
      syncAccum = 0
      if (state.inMatch) {
        multiplayerEngine.publishCombatState({
          x: player.x,
          y: PLAYER_BODY_Y,
          z: player.z,
          vx: mx,
          vz: mz,
          downed: player.downed,
          hp: player.hp,
          aimYaw: player.yaw,
        })
      }
    }
  }

  function updateRemotePlayers(dt) {
    const lerp = Math.min(1, 14 * dt)
    remotePlayers.forEach((entry) => {
      entry.mesh.position.x += (entry.targetX - entry.mesh.position.x) * lerp
      entry.mesh.position.y += (entry.targetY - entry.mesh.position.y) * lerp
      entry.mesh.position.z += (entry.targetZ - entry.mesh.position.z) * lerp
      let yawDiff = entry.targetYaw - entry.mesh.rotation.y
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2
      entry.mesh.rotation.y += yawDiff * lerp
    })
  }

  function upsertRemote(payload) {
    if (!payload || !payload.seat) return
    let entry = remotePlayers.get(payload.seat)
    if (!entry) {
      const mesh = new THREE.Mesh(
        markOwned(new THREE.SphereGeometry(0.38, 20, 20)),
        markOwned(
          new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 1,
          })
        )
      )
      mesh.castShadow = true
      scene.add(mesh)
      entry = {
        mesh,
        downed: false,
        targetX: payload.x || 0,
        targetY: payload.downed ? 0.2 : (payload.y ?? PLAYER_BODY_Y),
        targetZ: payload.z || 0,
        targetYaw: payload.aimYaw || 0,
      }
      mesh.position.set(entry.targetX, entry.targetY, entry.targetZ)
      remotePlayers.set(payload.seat, entry)
    }
    entry.targetX = payload.x
    entry.targetZ = payload.z
    entry.targetY = payload.downed ? 0.2 : (payload.y ?? PLAYER_BODY_Y)
    entry.targetYaw = payload.aimYaw || 0
    entry.mesh.material.opacity = payload.downed ? 0.35 : 1
    entry.downed = !!payload.downed
  }

  function renderFrame() {
    syncPlayerPointLight()
    renderer.render(scene, camera)
  }

  function loop(now) {
    if (!running) return
    const dt = Math.min(0.05, (now - last) / 1000)
    lastFrameMs = now - last
    last = now
    if (lastFrameMs > 0) fpsEma = fpsEma * 0.9 + (1000 / lastFrameMs) * 0.1
    update(dt)
    renderFrame()
    raf = requestAnimationFrame(loop)
  }

  function onKey(e, down) {
    keys[e.key.toLowerCase()] = down
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
      e.preventDefault()
    }
  }

  const unsubCombat = multiplayerEngine.onCombatSync(upsertRemote)

  return {
    mount() {
      ensurePlayerMesh()
      rebuildArena()
      resize()
      window.addEventListener('resize', resize)
      window.addEventListener('keydown', (e) => onKey(e, true))
      window.addEventListener('keyup', (e) => onKey(e, false))
      multiplayerEngine.bindCombatRoom()
    },
    start() {
      if (running) return
      running = true
      last = performance.now()
      getState().setMatch({ inMatch: true, downed: false })
      player.downed = false
      player.hp = 100 * getState().skillMods().hp
      player.maxHp = player.hp
      multiplayerEngine.setInMatch(true)
      ensureBurstPool()
      raf = requestAnimationFrame(loop)
    },
    pauseLoop() {
      running = false
      cancelAnimationFrame(raf)
      raf = 0
    },
    resumeLoop() {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(loop)
    },
    stop() {
      running = false
      cancelAnimationFrame(raf)
      raf = 0
      multiplayerEngine.setInMatch(false)
      getState().setMatch({ inMatch: false })
    },
    revive() {
      player.downed = false
      player.hp = player.maxHp
      getState().setMatch({ downed: false })
    },
    refreshEraVisuals() {
      rebuildArena()
    },
    resize,
    destroy() {
      this.stop()
      unsubCombat()
      window.removeEventListener('resize', resize)
      ;[...enemies, ...projectiles.map((p) => p.mesh), ...coins.map((c) => c.mesh)].forEach(disposeMesh)
      enemies.length = 0
      projectiles.length = 0
      coins.length = 0
      particles.forEach(releaseBurst)
      particles.length = 0
      renderer.dispose()
    },

    getDiagnostics() {
      let poolInUse = 0
      for (let i = 0; i < particlePool.length; i++) {
        if (particlePool[i].inUse) poolInUse++
      }
      return {
        fps: Math.round(fpsEma * 10) / 10,
        frameMs: Math.round(lastFrameMs * 100) / 100,
        enemies: enemies.length,
        projectiles: projectiles.length,
        particles: particles.length,
        particlePoolCap: particlePool.length,
        particlePoolInUse: poolInUse,
        coins: coins.length,
        sandboxEnemies: sandboxEnemyIds.size,
        wave,
        playerHp: player.hp,
        playerDowned: player.downed,
        running,
      }
    },

    processAutoWeaponFires,

    spawnSandboxHorde(count = 100) {
      ensureBurstPool()
      const n = Math.max(0, Math.floor(count))
      for (let i = 0; i < n; i++) {
        const angle = (i / Math.max(1, n)) * Math.PI * 2 + Math.random() * 0.2
        const dist = 3 + (i % 12) * 0.85 + Math.random() * 0.4
        spawnEnemy({
          sandbox: true,
          angle,
          dist,
          x: Math.cos(angle) * dist,
          z: Math.sin(angle) * dist,
          hp: 8,
          speed: 0.9 + Math.random() * 0.6,
        })
      }
      return n
    },

    clearSandboxHorde() {
      let removed = 0
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i]
        if (!e.sandbox && !sandboxEnemyIds.has(e.id)) continue
        if (cachedTargetId === e.id) {
          cachedTarget = null
          cachedTargetId = -1
        }
        removeFromScene(e.mesh)
        disposeMesh(e.mesh)
        sandboxEnemyIds.delete(e.id)
        enemies.splice(i, 1)
        removed++
      }
      return removed
    },

    debugBurstSparks(x = 0, z = 0) {
      spawnDeathBurst(x, PLAYER_BODY_Y, z, 0x22d3ee)
      return { active: particles.length, alphas: particles.map((p) => p.alpha) }
    },

    auditParticlePool(steps = 90, stepDt = 1 / 60) {
      const before = particles.length
      for (let s = 0; s < steps; s++) updateParticles(stepDt)
      let leaked = 0
      for (let i = 0; i < particles.length; i++) {
        if (particles[i].alpha <= 0) leaked++
      }
      let poolOrphans = 0
      for (let i = 0; i < particlePool.length; i++) {
        const p = particlePool[i]
        if (p.inUse && p.alpha <= 0) poolOrphans++
      }
      return {
        before,
        after: particles.length,
        leakedAlphaZero: leaked,
        poolOrphans,
        poolInUse: particlePool.filter((p) => p.inUse).length,
        ok: leaked === 0 && poolOrphans === 0,
      }
    },

    benchmarkTargetSort(iterations = 200) {
      const samples = []
      for (let i = 0; i < iterations; i++) {
        const t0 = performance.now()
        processAutoWeaponFires()
        samples.push(performance.now() - t0)
      }
      const sum = samples.reduce((a, b) => a + b, 0)
      return {
        iterations,
        enemies: enemies.length,
        avgMs: sum / samples.length,
        maxMs: Math.max(...samples),
        minMs: Math.min(...samples),
      }
    },
  }
}

export default createCombatEngine
