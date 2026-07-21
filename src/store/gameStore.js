import { createStore } from 'zustand/vanilla'
import { computeSkillMods } from '../data/skillConstellation.js'
import { buildTimedSlots, MARKET_REFRESH_MS } from '../data/gearCatalog.js'
import { CLAN_MEMBERS } from '../data/clanRoster.js'

const SAVE_KEY = 'dungeon_grinder_v1'

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function defaultState() {
  const now = Date.now()
  return {
    activeSeat: 'aden',
    panel: 'hub', // market | hub | clan
    credits: 350,
    kills: 0,
    wave: 1,
    inMatch: false,
    downed: false,
    skillViewOpen: false,
    unlockedSkills: ['core'],
    eraId: 'stone',
    research: null, // { targetEraId, endsAt, startedAt }
    inventory: [],
    equipped: {
      aden: { weapon: null, armor: null, boots: null, trinket: null },
      edward: { weapon: null, armor: null, boots: null, trinket: null },
      jamie: { weapon: null, armor: null, boots: null, trinket: null },
    },
    market: {
      refreshedAt: now,
      nextRefreshAt: now + MARKET_REFRESH_MS,
      slots: buildTimedSlots(now),
    },
    tradeStand: {
      open: false,
      sellerId: null,
      listings: [],
    },
    inviteOverlay: null, // { from, roomId, at }
    presence: Object.fromEntries(CLAN_MEMBERS.map((m) => [m.id, { online: false, inMatch: false, lastSeen: 0 }])),
    uid: null,
    displayName: null,
    toastNotice: null,
  }
}

export const gameStore = createStore((set, get) => {
  const saved = loadSave()
  const initial = saved
    ? { ...defaultState(), ...saved, inviteOverlay: null, toastNotice: null }
    : defaultState()

  return {
    ...initial,

    persist() {
      const s = get()
      const payload = {
        activeSeat: s.activeSeat,
        credits: s.credits,
        kills: s.kills,
        wave: s.wave,
        unlockedSkills: s.unlockedSkills,
        eraId: s.eraId,
        research: s.research,
        inventory: s.inventory,
        equipped: s.equipped,
        market: s.market,
        tradeStand: s.tradeStand,
      }
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(payload))
      } catch { /* ignore */ }
    },

    setPanel(panel) {
      set({ panel })
    },

    setSeat(id) {
      if (!['aden', 'edward', 'jamie'].includes(id)) return
      set({ activeSeat: id })
      get().persist()
    },

    addCredits(n) {
      set({ credits: Math.max(0, get().credits + n) })
      get().persist()
    },

    spendCredits(n) {
      if (get().credits < n) return false
      set({ credits: get().credits - n })
      get().persist()
      return true
    },

    toast(msg) {
      set({ toastNotice: { msg, at: Date.now() } })
    },

    skillMods() {
      return computeSkillMods(get().unlockedSkills)
    },

    unlockSkill(nodeId, cost) {
      if (get().unlockedSkills.includes(nodeId)) return false
      if (!get().spendCredits(cost)) {
        get().toast('Need more credits')
        return false
      }
      set({ unlockedSkills: [...get().unlockedSkills, nodeId] })
      get().persist()
      get().toast('Constellation lit')
      return true
    },

    setSkillView(open) {
      set({ skillViewOpen: open })
    },

    setEra(eraId) {
      set({ eraId })
      get().persist()
    },

    setResearch(research) {
      set({ research })
      get().persist()
    },

    refreshMarketIfNeeded(now = Date.now()) {
      const m = get().market
      if (now < m.nextRefreshAt) return
      const slots = buildTimedSlots(now)
      set({
        market: {
          refreshedAt: now,
          nextRefreshAt: now + MARKET_REFRESH_MS,
          slots,
        },
      })
      get().persist()
    },

    buyMarketSlot(slotIndex) {
      get().refreshMarketIfNeeded()
      const slots = get().market.slots.map((s) => ({ ...s }))
      const slot = slots[slotIndex]
      if (!slot || slot.purchased) return false
      if (!get().spendCredits(slot.price)) {
        get().toast('Not enough credits')
        return false
      }
      slot.purchased = true
      set({
        market: { ...get().market, slots },
        inventory: [...get().inventory, slot.item],
      })
      get().persist()
      get().toast(`Acquired ${slot.item.name}`)
      return true
    },

    buyChest(offer, rollFn) {
      if (!get().spendCredits(offer.cost)) {
        get().toast('Not enough credits')
        return null
      }
      const item = rollFn(offer.rarityBias)
      set({ inventory: [...get().inventory, item] })
      get().persist()
      get().toast(`${offer.name}: ${item.name}`)
      return item
    },

    equipItem(seatId, itemId) {
      const item = get().inventory.find((i) => i.id === itemId)
      if (!item) return
      const equipped = structuredClone(get().equipped)
      equipped[seatId] = { ...equipped[seatId], [item.slot]: item }
      set({ equipped })
      get().persist()
      get().toast(`Equipped ${item.name}`)
    },

    openTradeStand(sellerId) {
      set({
        tradeStand: {
          open: true,
          sellerId,
          listings: get().inventory.slice(0, 6).map((item) => ({
            item,
            price: 50 + Math.round(Math.random() * 150),
          })),
        },
      })
    },

    closeTradeStand() {
      set({ tradeStand: { open: false, sellerId: null, listings: [] } })
    },

    buyFromTrade(listingIndex) {
      const stand = get().tradeStand
      const listing = stand.listings[listingIndex]
      if (!listing) return false
      if (!get().spendCredits(listing.price)) {
        get().toast('Not enough credits')
        return false
      }
      const listings = stand.listings.filter((_, i) => i !== listingIndex)
      set({
        inventory: [...get().inventory, { ...listing.item, id: listing.item.id + '_trade_' + Date.now() }],
        tradeStand: { ...stand, listings },
      })
      get().persist()
      get().toast(`Traded for ${listing.item.name}`)
      return true
    },

    setMatch(flags) {
      set(flags)
    },

    setInvite(invite) {
      set({ inviteOverlay: invite })
    },

    clearInvite() {
      set({ inviteOverlay: null })
    },

    setPresence(map) {
      set({ presence: { ...get().presence, ...map } })
    },

    setAuth(uid, displayName) {
      set({ uid, displayName })
    },

    bumpKill() {
      set({ kills: get().kills + 1 })
    },

    setWave(wave) {
      set({ wave })
      get().persist()
    },
  }
})

export function getState() {
  return gameStore.getState()
}

export function subscribe(fn) {
  return gameStore.subscribe(fn)
}
