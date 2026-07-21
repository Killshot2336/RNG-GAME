/**
 * Skyward Skyrim constellation skill injector.
 * Secondary celestial canvas — pan up from battle, spend credits to light nodes.
 */
import * as THREE from 'three'
import { SKILL_NODES, SKILL_EDGES } from '../data/skillConstellation.js'
import { getState } from '../store/gameStore.js'

export function createSkillTreeEngine(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x02010a, 1)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200)
  camera.position.set(0, 0, 14)

  const starField = new THREE.Group()
  scene.add(starField)

  const starGeo = new THREE.BufferGeometry()
  const starCount = 800
  const positions = new Float32Array(starCount * 3)
  for (let i = 0; i < starCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 60
    positions[i * 3 + 1] = (Math.random() - 0.5) * 60
    positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ color: 0xa5f3fc, size: 0.08, transparent: true, opacity: 0.85 })
  )
  starField.add(stars)

  const nebula = new THREE.Mesh(
    new THREE.SphereGeometry(28, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x1e1b4b,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.9,
    })
  )
  scene.add(nebula)

  const nodeMeshes = new Map()
  const edgeLines = []
  const graph = new THREE.Group()
  scene.add(graph)

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  let panX = 0
  let panY = 0
  let targetPanX = 0
  let targetPanY = 0
  let zoom = 14
  let targetZoom = 14
  let dragging = false
  let lastPtr = { x: 0, y: 0 }
  let running = false
  let raf = 0
  let introT = 0
  let introActive = false

  function nodeColor(id, unlocked, available) {
    if (unlocked) return 0xfbbf24
    if (available) return 0x67e8f9
    return 0x334155
  }

  function canUnlock(node) {
    const unlocked = getState().unlockedSkills
    if (unlocked.includes(node.id)) return false
    return node.requires.every((r) => unlocked.includes(r))
  }

  function rebuildGraph() {
    while (graph.children.length) {
      const c = graph.children.pop()
      c.geometry?.dispose?.()
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose())
        else c.material.dispose?.()
      }
    }
    nodeMeshes.clear()
    edgeLines.length = 0

    const unlocked = new Set(getState().unlockedSkills)

    for (const [a, b] of SKILL_EDGES) {
      const na = SKILL_NODES.find((n) => n.id === a)
      const nb = SKILL_NODES.find((n) => n.id === b)
      if (!na || !nb) continue
      const lit = unlocked.has(a) && unlocked.has(b)
      const points = [
        new THREE.Vector3(na.x, na.y, 0),
        new THREE.Vector3(nb.x, nb.y, 0),
      ]
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({
          color: lit ? 0xfde68a : 0x1e293b,
          transparent: true,
          opacity: lit ? 0.95 : 0.45,
        })
      )
      graph.add(line)
      edgeLines.push(line)
    }

    for (const node of SKILL_NODES) {
      const unlockedNode = unlocked.has(node.id)
      const available = canUnlock(node)
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(unlockedNode ? 0.28 : 0.22, 20, 20),
        new THREE.MeshStandardMaterial({
          color: nodeColor(node.id, unlockedNode, available),
          emissive: nodeColor(node.id, unlockedNode, available),
          emissiveIntensity: unlockedNode ? 0.85 : available ? 0.45 : 0.1,
          metalness: 0.4,
          roughness: 0.3,
        })
      )
      mesh.position.set(node.x, node.y, 0)
      mesh.userData.nodeId = node.id
      graph.add(mesh)

      if (unlockedNode || available) {
        const glow = new THREE.Mesh(
          new THREE.SphereGeometry(0.45, 16, 16),
          new THREE.MeshBasicMaterial({
            color: unlockedNode ? 0xfbbf24 : 0x22d3ee,
            transparent: true,
            opacity: 0.15,
          })
        )
        glow.position.copy(mesh.position)
        graph.add(glow)
      }

      nodeMeshes.set(node.id, mesh)
    }

    const light = new THREE.PointLight(0xfef3c7, 1.2, 40)
    light.position.set(0, 2, 6)
    graph.add(light)
    graph.add(new THREE.AmbientLight(0x94a3b8, 0.55))
  }

  function resize() {
    const parent = canvas.parentElement
    const w = parent?.clientWidth || window.innerWidth
    const h = parent?.clientHeight || window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }

  function screenToNdc(clientX, clientY) {
    const rect = canvas.getBoundingClientRect()
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1
  }

  function trySelectNode(clientX, clientY) {
    screenToNdc(clientX, clientY)
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects([...nodeMeshes.values()], false)
    if (!hits.length) return
    const id = hits[0].object.userData.nodeId
    const node = SKILL_NODES.find((n) => n.id === id)
    if (!node) return
    if (!canUnlock(node) && !getState().unlockedSkills.includes(node.id)) {
      getState().toast('Requires linked stars')
      return
    }
    if (getState().unlockedSkills.includes(node.id)) {
      getState().toast(node.name)
      return
    }
    const ok = getState().unlockSkill(node.id, node.cost)
    if (ok) rebuildGraph()
  }

  function onPointerDown(e) {
    dragging = true
    lastPtr = { x: e.clientX, y: e.clientY }
  }

  function onPointerMove(e) {
    if (!dragging) return
    const dx = e.clientX - lastPtr.x
    const dy = e.clientY - lastPtr.y
    lastPtr = { x: e.clientX, y: e.clientY }
    targetPanX -= dx * 0.012 * (zoom / 14)
    targetPanY += dy * 0.012 * (zoom / 14)
  }

  function onPointerUp(e) {
    const moved = Math.hypot(e.clientX - lastPtr.x, e.clientY - lastPtr.y)
    dragging = false
    if (moved < 4) trySelectNode(e.clientX, e.clientY)
  }

  function onWheel(e) {
    e.preventDefault()
    targetZoom = Math.max(6, Math.min(28, targetZoom + e.deltaY * 0.015))
  }

  let touchMode = null
  function onTouchStart(e) {
    if (e.touches.length === 1) {
      touchMode = 'pan'
      lastPtr = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      dragging = true
    } else if (e.touches.length === 2) {
      touchMode = 'pinch'
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      lastPtr = { pinch: d }
    }
  }

  function onTouchMove(e) {
    e.preventDefault()
    if (touchMode === 'pan' && e.touches.length === 1) {
      const t = e.touches[0]
      const dx = t.clientX - lastPtr.x
      const dy = t.clientY - lastPtr.y
      lastPtr = { x: t.clientX, y: t.clientY }
      targetPanX -= dx * 0.012 * (zoom / 14)
      targetPanY += dy * 0.012 * (zoom / 14)
    } else if (touchMode === 'pinch' && e.touches.length === 2) {
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const delta = lastPtr.pinch - d
      lastPtr = { pinch: d }
      targetZoom = Math.max(6, Math.min(28, targetZoom + delta * 0.02))
    }
  }

  function onTouchEnd(e) {
    if (e.touches.length === 0) {
      if (touchMode === 'pan') {
        /* tap handled via click fallback on some devices */
      }
      dragging = false
      touchMode = null
    }
  }

  function loop() {
    if (!running) return
    panX += (targetPanX - panX) * 0.12
    panY += (targetPanY - panY) * 0.12
    zoom += (targetZoom - zoom) * 0.12

    if (introActive) {
      introT += 0.016
      const k = Math.min(1, introT / 1.1)
      const ease = 1 - Math.pow(1 - k, 3)
      camera.position.set(panX, -8 + ease * (panY + 8), 22 - ease * (22 - zoom))
      camera.lookAt(panX, panY + ease * 1.5, 0)
      if (k >= 1) introActive = false
    } else {
      camera.position.set(panX, panY, zoom)
      camera.lookAt(panX, panY, 0)
    }

    starField.rotation.y += 0.0004
    renderer.render(scene, camera)
    raf = requestAnimationFrame(loop)
  }

  return {
    mount() {
      rebuildGraph()
      resize()
      window.addEventListener('resize', resize)
      canvas.addEventListener('pointerdown', onPointerDown)
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerup', onPointerUp)
      canvas.addEventListener('wheel', onWheel, { passive: false })
      canvas.addEventListener('touchstart', onTouchStart, { passive: false })
      canvas.addEventListener('touchmove', onTouchMove, { passive: false })
      canvas.addEventListener('touchend', onTouchEnd)
    },
    open() {
      getState().setSkillView(true)
      rebuildGraph()
      introT = 0
      introActive = true
      targetPanX = 0
      targetPanY = 2
      targetZoom = 14
      cancelAnimationFrame(raf)
      running = true
      raf = requestAnimationFrame(loop)
      resize()
    },
    close() {
      getState().setSkillView(false)
      running = false
      cancelAnimationFrame(raf)
      raf = 0
    },
    isOpen() {
      return getState().skillViewOpen
    },
    refresh() {
      rebuildGraph()
    },
    resize,
    destroy() {
      this.close()
      window.removeEventListener('resize', resize)
      renderer.dispose()
    },
  }
}

export default createSkillTreeEngine
