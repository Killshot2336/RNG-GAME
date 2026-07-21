/**
 * 3D isometric dungeon combat engine (Three.js WebGL).
 * Auto proximal targeting, cylindrical projectiles, spark bursts, coin magnets.
 */
import * as THREE from 'three'
import { getState } from '../store/gameStore.js'
import { eraById } from '../data/eras.js'
import { multiplayerEngine } from './multiplayerEngine.js'

const ISO_YAW = Math.PI / 4
const ISO_PITCH = Math.atan(1 / Math.sqrt(2))

function createRenderer(canvas) {
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
  return renderer
}

function makeFloatingText() {
  return {
    items: [],
    spawn(x, y, z, text, color = '#fff') {
      this.items.push({
        x, y, z, text, color,
        life: 0,
        max: 1.1,
        vy: 1.8,
      })
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

export function createCombatEngine(canvas, hudCanvas) {
  const renderer = createRenderer(canvas)
  const scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x070b14, 0.035)

  const aspect = 1
  const frustum = 12
  const camera = new THREE.OrthographicCamera(
    -frustum * aspect,
    frustum * aspect,
    frustum,
    -frustum,
    0.1,
    200
  )
  camera.position.set(18, 18, 18)
  camera.lookAt(0, 0, 0)
  camera.rotation.order = 'YXZ'

  const hemi = new THREE.HemisphereLight(0xb1e1ff, 0x1a1208, 0.85)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xfff2d9, 1.15)
  sun.position.set(12, 22, 8)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.left = -20
  sun.shadow.camera.right = 20
  sun.shadow.camera.top = 20
  sun.shadow.camera.bottom = -20
  scene.add(sun)

  const ambientPulse = new THREE.PointLight(0x22d3ee, 0.4, 40)
  ambientPulse.position.set(0, 6, 0)
  scene.add(ambientPulse)

  let ground = null
  let arenaGroup = new THREE.Group()
  scene.add(arenaGroup)

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
  /** Active plasma sparks only — expired entries are spliced instantly. */
  const particles = []
  /** Pre-allocated pool backing 14-spark bursts without GC thrash. */
  const particlePool = []
  const SPARK_BURST = 14
  const SPARK_POOL_CAP = SPARK_BURST * 12
  let sparkGeo = null

  const remotePlayers = new Map()
  const keys = Object.create(null)
  const floating = makeFloatingText()

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

  function ensureSparkPool() {
    if (sparkGeo) return
    sparkGeo = new THREE.SphereGeometry(0.08, 6, 6)
    for (let i = 0; i < SPARK_POOL_CAP; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
      const mesh = new THREE.Mesh(sparkGeo, mat)
      mesh.visible = false
      mesh.frustumCulled = false
      scene.add(mesh)
      particlePool.push({
        mesh,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        alpha: 0,
        inUse: false,
      })
    }
  }

  function acquireParticle() {
    for (let i = 0; i < particlePool.length; i++) {
      if (!particlePool[i].inUse) return particlePool[i]
    }
    return null
  }

  function releaseParticle(p) {
    p.inUse = false
    p.alpha = 0
    p.life = 0
    p.mesh.visible = false
    p.mesh.material.opacity = 0
  }

  function disposeObject(obj) {
    obj.traverse?.((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose())
        else child.material.dispose()
      }
    })
  }

  function rebuildArena() {
    while (arenaGroup.children.length) {
      const c = arenaGroup.children.pop()
      disposeObject(c)
    }
    const era = eraById(getState().eraId)
    scene.background = new THREE.Color(era.palette.ground).multiplyScalar(0.25)
    scene.fog.color = new THREE.Color(era.palette.ground).multiplyScalar(0.2)

    const floorMat = new THREE.MeshStandardMaterial({
      color: era.palette.ground,
      roughness: 0.92,
      metalness: 0.08,
    })
    ground = new THREE.Mesh(new THREE.CircleGeometry(16, 64), floorMat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    arenaGroup.add(ground)

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(15.2, 15.8, 64),
      new THREE.MeshStandardMaterial({
        color: era.palette.accent,
        emissive: era.palette.accent,
        emissiveIntensity: 0.35,
        side: THREE.DoubleSide,
      })
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.02
    arenaGroup.add(ring)

    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 2.2, 8),
        new THREE.MeshStandardMaterial({
          color: era.palette.accent,
          roughness: 0.7,
          metalness: 0.35,
        })
      )
      pillar.position.set(Math.cos(a) * 13.5, 1.1, Math.sin(a) * 13.5)
      pillar.castShadow = true
      arenaGroup.add(pillar)
    }

    if (!player.mesh) {
      const body = new THREE.Group()
      const torso = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.45, 0.9, 6, 12),
        new THREE.MeshStandardMaterial({
          color: 0xe2e8f0,
          emissive: 0x0e7490,
          emissiveIntensity: 0.25,
          metalness: 0.4,
          roughness: 0.35,
        })
      )
      torso.castShadow = true
      body.add(torso)
      const helm = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0891b2, emissiveIntensity: 0.5 })
      )
      helm.position.y = 1.05
      body.add(helm)
      player.mesh = body
      scene.add(player.mesh)
    }
  }

  function spawnEnemy() {
    const era = eraById(getState().eraId)
    const angle = Math.random() * Math.PI * 2
    const dist = 10 + Math.random() * 4
    const geo = new THREE.DodecahedronGeometry(0.55 * era.enemyScale, 0)
    const mat = new THREE.MeshStandardMaterial({
      color: era.palette.enemy,
      emissive: era.palette.enemy,
      emissiveIntensity: 0.35,
      roughness: 0.45,
      metalness: 0.3,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = true
    const x = Math.cos(angle) * dist
    const z = Math.sin(angle) * dist
    mesh.position.set(x, 0.7 * era.enemyScale, z)
    scene.add(mesh)
    const id = nextEnemyId++
    enemies.push({
      id,
      mesh,
      hp: 2 + Math.floor(wave * 0.6) + era.order,
      maxHp: 2 + Math.floor(wave * 0.6) + era.order,
      speed: 1.6 + wave * 0.05 + era.order * 0.12,
      radius: 0.55 * era.enemyScale,
    })
  }

  function ensureWave() {
    if (enemies.length) return
    wave += 1
    getState().setWave(wave)
    const count = 5 + wave * 2
    for (let i = 0; i < count; i++) spawnEnemy()
  }

  function spawnSparks(x, y, z, color) {
    ensureSparkPool()
    for (let i = 0; i < SPARK_BURST; i++) {
      const p = acquireParticle()
      if (!p) break
      p.inUse = true
      p.mesh.visible = true
      p.mesh.material.color.setHex(typeof color === 'number' ? color : 0x22d3ee)
      p.mesh.material.opacity = 1
      p.alpha = 1
      p.mesh.position.set(x, y, z)
      const angle = Math.random() * Math.PI * 2
      const elev = Math.random() * 1.2
      const force = 4 + Math.random() * 6
      const cosE = Math.cos(elev)
      p.vx = Math.cos(angle) * cosE * force
      p.vy = Math.sin(elev) * force + 1.2
      p.vz = Math.sin(angle) * cosE * force
      p.life = 0.55 + Math.random() * 0.35
      particles.push(p)
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const s = particles[i]
      s.life -= dt
      s.vy -= 9 * dt
      s.mesh.position.x += s.vx * dt
      s.mesh.position.y += s.vy * dt
      s.mesh.position.z += s.vz * dt
      s.alpha = Math.max(0, s.life * 2)
      s.mesh.material.opacity = s.alpha
      if (s.alpha <= 0 || s.life <= 0 || s.mesh.position.y < 0) {
        releaseParticle(s)
        particles.splice(i, 1)
      }
    }
  }

  function spawnCoin(x, z) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.08, 20),
      new THREE.MeshStandardMaterial({
        color: 0xf5c542,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.65,
        metalness: 0.9,
        roughness: 0.25,
      })
    )
    mesh.rotation.x = Math.PI / 2
    mesh.position.set(x, 0.35, z)
    mesh.castShadow = true
    scene.add(mesh)
    coins.push({ mesh, value: 5 + Math.floor(Math.random() * 8), spin: Math.random() })
  }

  function fireAt(target) {
    const era = eraById(getState().eraId)
    const mods = getState().skillMods()
    const origin = new THREE.Vector3(player.x, 0.9, player.z)
    const dest = target.mesh.position.clone()
    const dir = dest.sub(origin).normalize()

    const makeBolt = (yawOffset) => {
      const geo = new THREE.CylinderGeometry(
        era.projectile.radius,
        era.projectile.radius * 0.7,
        era.projectile.length,
        10
      )
      const mat = new THREE.MeshStandardMaterial({
        color: era.projectile.color,
        emissive: era.projectile.color,
        emissiveIntensity: 0.9,
        metalness: 0.2,
        roughness: 0.2,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yawOffset))
      mesh.position.copy(origin)
      scene.add(mesh)
      const d = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), yawOffset)
      projectiles.push({
        mesh,
        vx: d.x * era.projectile.speed,
        vy: d.y * era.projectile.speed,
        vz: d.z * era.projectile.speed,
        dmg: 1 * mods.damage,
        life: 1.4,
      })
    }

    makeBolt(0)
    if (mods.multishot) {
      makeBolt(0.18)
      makeBolt(-0.18)
    }
  }

  /**
   * Euclidean closeness cache — squared distances only, refresh every 3 frames.
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
        const dx = e.mesh.position.x - px
        const dz = e.mesh.position.z - pz
        const d2 = dx * dx + dz * dz
        if (d2 < bestD2) {
          bestD2 = d2
          best = e
        }
      }
      cachedTarget = best
      cachedTargetId = best ? best.id : -1
    } else if (cachedTargetId >= 0) {
      // Validate cache still points at a live enemy without full scan
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
    player.fireCd = (0.38 * mods.fireRate) * (18 / era.projectile.speed)
  }

  function projectToHud(x, y, z) {
    const v = new THREE.Vector3(x, y, z).project(camera)
    const w = hudCanvas.width
    const h = hudCanvas.height
    return {
      x: (v.x * 0.5 + 0.5) * w,
      y: (-v.y * 0.5 + 0.5) * h,
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
    camera.left = -frustum * a
    camera.right = frustum * a
    camera.top = frustum
    camera.bottom = -frustum
    camera.updateProjectionMatrix()
  }

  function applyCamera() {
    const dist = 22
    camera.position.set(
      player.x + dist * Math.sin(ISO_YAW),
      dist * Math.sin(ISO_PITCH) * 1.35,
      player.z + dist * Math.cos(ISO_YAW)
    )
    camera.lookAt(player.x, 0.5, player.z)
  }

  function update(dt) {
    const state = getState()
    if (state.skillViewOpen || state.panel !== 'hub') return
    if (player.downed) {
      updateParticles(dt)
      updateRemotePlayers(dt)
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
      player.mesh.position.set(player.x, 0.85, player.z)
      player.mesh.rotation.y = player.yaw
    }

    ensureWave()

    player.fireCd -= dt
    fireAtNearest()

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i]
      p.mesh.position.x += p.vx * dt
      p.mesh.position.y += p.vy * dt
      p.mesh.position.z += p.vz * dt
      p.life -= dt
      let hit = false
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const e = enemies[ei]
        const dx = e.mesh.position.x - p.mesh.position.x
        const dy = e.mesh.position.y - p.mesh.position.y
        const dz = e.mesh.position.z - p.mesh.position.z
        const rad = e.radius + 0.25
        if (dx * dx + dy * dy + dz * dz < rad * rad) {
          e.hp -= p.dmg
          floating.spawn(e.mesh.position.x, e.mesh.position.y + 0.8, e.mesh.position.z, `-${Math.round(p.dmg * 10)}`, '#f472b6')
          hit = true
          if (e.hp <= 0) {
            if (cachedTargetId === e.id) {
              cachedTarget = null
              cachedTargetId = -1
            }
            spawnSparks(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z, eraById(state.eraId).palette.accent)
            spawnCoin(e.mesh.position.x, e.mesh.position.z)
            if (Math.random() < 0.35) spawnCoin(e.mesh.position.x + 0.4, e.mesh.position.z - 0.3)
            floating.spawn(e.mesh.position.x, e.mesh.position.y + 1.2, e.mesh.position.z, 'BLOWN', '#fb7185')
            scene.remove(e.mesh)
            disposeObject(e.mesh)
            enemies.splice(ei, 1)
            state.bumpKill()
            state.addCredits(3)
          }
          break
        }
      }
      if (hit || p.life <= 0) {
        scene.remove(p.mesh)
        disposeObject(p.mesh)
        projectiles.splice(i, 1)
      }
    }

    const contactR = 0.55
    for (let ei = 0; ei < enemies.length; ei++) {
      const e = enemies[ei]
      const dx = player.x - e.mesh.position.x
      const dz = player.z - e.mesh.position.z
      const d2 = dx * dx + dz * dz
      const contact = e.radius + contactR
      if (d2 > 0.0001) {
        const inv = 1 / Math.sqrt(d2)
        e.mesh.position.x += dx * inv * e.speed * dt
        e.mesh.position.z += dz * inv * e.speed * dt
      }
      e.mesh.rotation.y += dt * 2
      if (d2 < contact * contact) {
        player.hp -= 18 * dt
        if (player.hp <= 0 && !player.downed) {
          player.downed = true
          player.hp = 0
          state.setMatch({ downed: true })
          multiplayerEngine.publishCombatState({
            x: player.x,
            y: 0.2,
            z: player.z,
            vx: 0,
            vz: 0,
            downed: true,
            hp: 0,
          }, { force: true })
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
        scene.remove(c.mesh)
        disposeObject(c.mesh)
        coins.splice(i, 1)
      }
    }

    updateParticles(dt)
    updateRemotePlayers(dt)

    ambientPulse.intensity = 0.35 + Math.sin(performance.now() * 0.004) * 0.15
    applyCamera()

    syncAccum += dt
    if (syncAccum > 0.1) {
      syncAccum = 0
      if (state.inMatch) {
        multiplayerEngine.publishCombatState({
          x: player.x,
          y: 0.85,
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
        new THREE.CapsuleGeometry(0.4, 0.8, 4, 8),
        new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xb45309,
          emissiveIntensity: 0.3,
          transparent: true,
        })
      )
      mesh.castShadow = true
      scene.add(mesh)
      entry = {
        mesh,
        downed: false,
        targetX: payload.x || 0,
        targetY: payload.downed ? 0.2 : (payload.y ?? 0.85),
        targetZ: payload.z || 0,
        targetYaw: payload.aimYaw || 0,
      }
      mesh.position.set(entry.targetX, entry.targetY, entry.targetZ)
      remotePlayers.set(payload.seat, entry)
    }
    entry.targetX = payload.x
    entry.targetZ = payload.z
    entry.targetY = payload.downed ? 0.2 : (payload.y ?? 0.85)
    entry.targetYaw = payload.aimYaw || 0
    entry.mesh.material.opacity = payload.downed ? 0.35 : 1
    entry.downed = !!payload.downed
  }

  function renderFrame() {
    renderer.render(scene, camera)
    if (hudCtx && hudCanvas) {
      hudCtx.clearRect(0, 0, hudCanvas.width, hudCanvas.height)
      floating.update(1 / 60, projectToHud, drawHudText)
      const s = getState()
      hudCtx.fillStyle = 'rgba(245,197,66,0.95)'
      hudCtx.font = '800 12px Segoe UI, sans-serif'
      hudCtx.textAlign = 'left'
      hudCtx.fillText(`WAVE ${wave}  ·  ${eraById(s.eraId).name}`, 16, 28)
      hudCtx.fillText(`HP ${Math.ceil(player.hp)}`, 16, 48)
      if (player.downed) {
        hudCtx.fillStyle = 'rgba(239,68,68,0.9)'
        hudCtx.font = '900 28px Segoe UI, sans-serif'
        hudCtx.textAlign = 'center'
        hudCtx.fillText('DOWNED', hudCanvas.width / 2, hudCanvas.height / 2)
      }
    }
  }

  function loop(now) {
    if (!running) return
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
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
      ensureSparkPool()
      raf = requestAnimationFrame(loop)
    },
    /** Freeze combat RAF so skyward constellation owns the frame budget. */
    pauseLoop() {
      running = false
      cancelAnimationFrame(raf)
      raf = 0
    },
    /** Resume combat RAF after skyward closes. */
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
      renderer.dispose()
    },
  }
}

export default createCombatEngine
