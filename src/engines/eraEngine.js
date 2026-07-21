/**
 * Era progression & research timers.
 * Stone → Bronze → Iron → Cyber → God with background countdowns.
 */
import { ERAS, eraById, nextEra } from '../data/eras.js'
import { getState, subscribe } from '../store/gameStore.js'

let tickHandle = null
let listeners = new Set()

function emit(event, payload) {
  listeners.forEach((fn) => fn(event, payload))
}

export const eraEngine = {
  list() {
    return ERAS.slice()
  },

  current() {
    return eraById(getState().eraId)
  },

  next() {
    return nextEra(getState().eraId)
  },

  researchRemainingMs(now = Date.now()) {
    const r = getState().research
    if (!r) return 0
    return Math.max(0, r.endsAt - now)
  },

  researchProgress(now = Date.now()) {
    const r = getState().research
    if (!r) return 0
    const total = r.endsAt - r.startedAt
    if (total <= 0) return 1
    return Math.min(1, (now - r.startedAt) / total)
  },

  /** Start researching the next age (ticks during matches). */
  startResearch() {
    const state = getState()
    if (state.research) {
      state.toast('Research already running')
      return false
    }
    const nxt = nextEra(state.eraId)
    if (!nxt) {
      state.toast('God Age achieved')
      return false
    }
    if (!state.spendCredits(nxt.researchCost)) {
      state.toast(`Need ${nxt.researchCost}¤`)
      return false
    }
    const startedAt = Date.now()
    const endsAt = startedAt + nxt.researchSeconds * 1000
    state.setResearch({
      targetEraId: nxt.id,
      targetName: nxt.name,
      startedAt,
      endsAt,
      cost: nxt.researchCost,
    })
    state.toast(`Researching ${nxt.name}`)
    emit('research-start', state.research)
    return true
  },

  cancelResearch() {
    const state = getState()
    if (!state.research) return
    state.setResearch(null)
    state.toast('Research cancelled')
    emit('research-cancel', null)
  },

  /** Called every second — completes unlocks and notifies combat visuals. */
  tick(now = Date.now()) {
    const state = getState()
    const r = state.research
    if (!r) {
      emit('tick', { remaining: 0, eraId: state.eraId })
      return
    }
    if (now >= r.endsAt) {
      state.setEra(r.targetEraId)
      state.setResearch(null)
      state.toast(`${eraById(r.targetEraId).name} unlocked`)
      emit('era-unlocked', { eraId: r.targetEraId })
      return
    }
    emit('tick', {
      remaining: r.endsAt - now,
      progress: this.researchProgress(now),
      eraId: state.eraId,
      targetEraId: r.targetEraId,
    })
  },

  start() {
    if (tickHandle) return
    tickHandle = setInterval(() => this.tick(), 1000)
    this.tick()
  },

  stop() {
    if (tickHandle) clearInterval(tickHandle)
    tickHandle = null
  },

  on(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },

  /** Texture / palette transform descriptor for combat engine. */
  visualProfile() {
    const era = this.current()
    return {
      eraId: era.id,
      name: era.name,
      palette: era.palette,
      enemyName: era.enemyName,
      weaponName: era.weaponName,
      projectile: era.projectile,
      enemyScale: era.enemyScale,
      order: era.order,
    }
  },

  formatCountdown(ms) {
    const s = Math.ceil(ms / 1000)
    const m = Math.floor(s / 60)
    const r = s % 60
    return `${m}:${String(r).padStart(2, '0')}`
  },
}

// Keep market refresh alive alongside era ticks when store hydrates
subscribe(() => {
  /* store changes observed by UI; era engine remains authoritative for timers */
})

export default eraEngine
