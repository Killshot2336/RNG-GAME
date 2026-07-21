/**
 * Application entry — Clash Royale 3-panel chassis + engine orchestration.
 */
import './style.css'
import { getState, subscribe } from './store/gameStore.js'
import { multiplayerEngine } from './engines/multiplayerEngine.js'
import { createCombatEngine } from './engines/combatEngine.js'
import { createSkillTreeEngine } from './engines/skillTreeEngine.js'
import { eraEngine } from './engines/eraEngine.js'
import {
  renderMarket,
  marketTick,
  renderClan,
  renderHubChrome,
  renderTradeModal,
  renderInviteOverlay,
  renderToast,
} from './ui/panels.js'

const PANEL_ORDER = ['market', 'hub', 'clan']

const track = document.getElementById('panel-track')
const marketRoot = document.getElementById('panel-market')
const clanRoot = document.getElementById('panel-clan')
const hubChrome = document.getElementById('hub-chrome')
const tradeModal = document.getElementById('trade-modal')
const inviteOverlay = document.getElementById('invite-overlay')
const toastEl = document.getElementById('toast')
const skillOverlay = document.getElementById('skill-overlay')
const authBtn = document.getElementById('btn-auth')
const authLabel = document.getElementById('auth-label')

const combatCanvas = document.getElementById('combat-canvas')
const combatHud = document.getElementById('combat-hud')
const skillCanvas = document.getElementById('skill-canvas')

const combat = createCombatEngine(combatCanvas, combatHud)
const skills = createSkillTreeEngine(skillCanvas)

let panelIndex = 1
let swipeStartX = 0
let swipeStartY = 0
let swipeDeltaX = 0
let swiping = false

function setPanelByIndex(index, { syncStore = true } = {}) {
  panelIndex = Math.max(0, Math.min(2, index))
  track.dataset.index = String(panelIndex)
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    const go = btn.getAttribute('data-go')
    btn.classList.toggle('tab-btn-active', go === PANEL_ORDER[panelIndex])
  })
  if (syncStore) getState().setPanel(PANEL_ORDER[panelIndex])
  if (PANEL_ORDER[panelIndex] === 'hub') {
    requestAnimationFrame(() => combat.resize())
  }
}

function setPanelByName(name) {
  const idx = PANEL_ORDER.indexOf(name)
  if (idx >= 0) setPanelByIndex(idx)
}

function paint() {
  const s = getState()
  renderMarket(marketRoot)
  renderClan(clanRoot)
  renderHubChrome(hubChrome)
  renderTradeModal(tradeModal)
  renderInviteOverlay(inviteOverlay)
  renderToast(toastEl)

  if (s.displayName) {
    authLabel.textContent = s.displayName
    authBtn.textContent = 'Sign Out'
  } else {
    authLabel.textContent = s.uid ? 'Device' : 'Guest'
    authBtn.textContent = 'Google Sign-In'
  }

  if (s.skillViewOpen) {
    skillOverlay.classList.remove('hidden')
  } else {
    skillOverlay.classList.add('hidden')
  }
}

function bindSwipe() {
  const chassis = document.getElementById('chassis')

  chassis.addEventListener(
    'touchstart',
    (e) => {
      if (getState().skillViewOpen) return
      if (e.touches.length !== 1) return
      swiping = true
      swipeStartX = e.touches[0].clientX
      swipeStartY = e.touches[0].clientY
      swipeDeltaX = 0
    },
    { passive: true }
  )

  chassis.addEventListener(
    'touchmove',
    (e) => {
      if (!swiping) return
      const dx = e.touches[0].clientX - swipeStartX
      const dy = e.touches[0].clientY - swipeStartY
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
        swiping = false
        return
      }
      swipeDeltaX = dx
    },
    { passive: true }
  )

  chassis.addEventListener('touchend', () => {
    if (!swiping) return
    swiping = false
    if (Math.abs(swipeDeltaX) > 56) {
      if (swipeDeltaX < 0) setPanelByIndex(panelIndex + 1)
      else setPanelByIndex(panelIndex - 1)
    }
    swipeDeltaX = 0
  })
}

async function boot() {
  await multiplayerEngine.init()
  eraEngine.start()
  combat.mount()
  skills.mount()
  combat.start()

  setPanelByIndex(1)
  paint()

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => setPanelByName(btn.getAttribute('data-go')))
  })

  bindSwipe()

  authBtn.addEventListener('click', async () => {
    if (getState().uid && multiplayerEngine.isConfigured) {
      await multiplayerEngine.signOutUser()
      paint()
      return
    }
    await multiplayerEngine.signInGoogle()
    paint()
  })

  hubChrome.addEventListener('open-skills', () => {
    skills.open()
    paint()
  })

  document.getElementById('btn-close-skills').addEventListener('click', () => {
    skills.close()
    paint()
    combat.resize()
  })

  multiplayerEngine.onInvite(() => paint())

  eraEngine.on((event) => {
    if (event === 'era-unlocked') {
      combat.refreshEraVisuals()
      getState().toast('Arena textures transformed')
    }
    // live research chip
    const chip = document.querySelector('[data-research-chip]')
    if (chip) {
      const remain = eraEngine.researchRemainingMs()
      chip.textContent = getState().research ? eraEngine.formatCountdown(remain) : 'IDLE'
    }
  })

  subscribe(() => {
    paint()
  })

  setInterval(() => {
    marketTick(marketRoot)
    renderToast(toastEl)
  }, 1000)

  window.addEventListener('resize', () => {
    combat.resize()
    skills.resize()
  })
}

boot().catch((err) => {
  console.error(err)
  getState().toast('Boot failure — check console')
})
