import { create } from 'zustand'
import type {
  BlitzUpgrade,
  FactoryFloor,
  GameStore,
  PlanetOffer,
  PlayerProfile,
  SectorUpgrade,
  StorefrontSlot,
  Strain,
} from '@/types/game'
import { STORE_ITEMS, MYSTERY_PACKS } from '@/types/game'
import { generatePackStrain, generateRivalStrains, strainRevenuePerSec } from '@/utils/strainGenerator'

const BLITZ_DURATION_MS = 30 * 60 * 1000
const CLONE_DURATION_MS = 60 * 1000
const EMPIRE_XP_PER_LEVEL = 500

function empireXpForLevel(level: number): number {
  return level * EMPIRE_XP_PER_LEVEL
}

function computeScanRateMultiplier(sectorUpgrades: SectorUpgrade[]): number {
  return sectorUpgrades.reduce((sum, s) => sum + s.level * s.scanRateBonus, 0)
}

function upgradeCostForStrain(strain: Strain): number {
  const rarityMult: Record<string, number> = {
    Common: 1, Rare: 2, Epic: 4, Legendary: 8, Mythic: 15,
  }
  return Math.floor(8000 * (rarityMult[strain.rarity] ?? 1) * (1 + strain.potency / 100))
}

const INITIAL_BLITZ: BlitzUpgrade[] = [
  { id: 'blitz-1', name: 'Hyperdrive Yield', description: '+15% passive revenue', modifier: 0.15, modifierType: 'revenue', price: 50000, purchased: false },
  { id: 'blitz-2', name: 'Rift Amplifier', description: '+20% strain yield', modifier: 0.2, modifierType: 'yield', price: 75000, purchased: false },
  { id: 'blitz-3', name: 'Scan Burst', description: '+25% sector scan rate', modifier: 0.25, modifierType: 'scan', price: 60000, purchased: false },
  { id: 'blitz-4', name: 'Clone Accelerator', description: '-30% clone time', modifier: 0.3, modifierType: 'clone', price: 90000, purchased: false },
  { id: 'blitz-5', name: 'Pack Resonance', description: '+10% pack rarity luck', modifier: 0.1, modifierType: 'packLuck', price: 120000, purchased: false },
]

const INITIAL_SECTORS: SectorUpgrade[] = [
  { id: 'thrusters', name: 'Frictionless Thrusters', level: 0, maxLevel: 10, baseCost: 15000, scanRateBonus: 0.08 },
  { id: 'radar', name: 'Cosmic Radar', level: 0, maxLevel: 10, baseCost: 22000, scanRateBonus: 0.12 },
  { id: 'shield', name: 'Shield Insulation', level: 0, maxLevel: 10, baseCost: 18000, scanRateBonus: 0.06 },
]

const INITIAL_FLOORS: FactoryFloor[] = [
  { id: 'floor-1', name: 'Portal Alpha', equippedStrainId: null, level: 1 },
  { id: 'floor-2', name: 'Portal Beta', equippedStrainId: null, level: 1 },
  { id: 'floor-3', name: 'Portal Gamma', equippedStrainId: null, level: 1 },
]

const DAD_STRAINS = generateRivalStrains(6, 42069)
const CHRIS_STRAINS = generateRivalStrains(4, 1337)

const DAD_STOREFRONT: [StorefrontSlot, StorefrontSlot, StorefrontSlot] = [
  { strainId: DAD_STRAINS[0].id, price: 850000 },
  { strainId: DAD_STRAINS[1].id, price: 1200000 },
  { strainId: DAD_STRAINS[2].id, price: 2500000 },
]

const CHRIS_STOREFRONT: [StorefrontSlot, StorefrontSlot, StorefrontSlot] = [
  { strainId: CHRIS_STRAINS[0].id, price: 45000 },
  { strainId: CHRIS_STRAINS[1].id, price: 78000 },
  { strainId: null, price: 0 },
]

const INITIAL_OFFERS: PlanetOffer[] = [
  { id: 'offer-1', strainName: 'Nebula Kush #442', thcPercent: 24.5, yield: 88, offerPrice: 950000, sellerName: 'Player_Dad_99' },
  { id: 'offer-2', strainName: 'Void Haze #117', thcPercent: 19.2, yield: 72, offerPrice: 620000, sellerName: 'Player_Dad_99' },
  { id: 'offer-3', strainName: 'Cosmic Bloom #891', thcPercent: 28.1, yield: 95, offerPrice: 1400000, sellerName: 'Player_Dad_99' },
]

function emptyStorefront(): [StorefrontSlot, StorefrontSlot, StorefrontSlot] {
  return [
    { strainId: null, price: 0 },
    { strainId: null, price: 0 },
    { strainId: null, price: 0 },
  ]
}

function addOrMergeStrain(strains: Strain[], incoming: Strain): Strain[] {
  const idx = strains.findIndex((s) => s.seed === incoming.seed || s.name === incoming.name)
  if (idx >= 0) {
    const updated = [...strains]
    updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 }
    return updated
  }
  return [...strains, incoming]
}

function getBlitzModifier(get: () => GameStore, type: BlitzUpgrade['modifierType']): number {
  const state = get()
  return state.blitzUpgrades
    .filter((b) => b.purchased && b.modifierType === type)
    .reduce((sum, b) => sum + b.modifier, 0)
}

function computeRevenuePerMs(get: () => GameStore): number {
  const state = get()
  const revenueMod = 1 + getBlitzModifier(get, 'revenue')
  const yieldMod = 1 + getBlitzModifier(get, 'yield')
  let total = 0

  for (const floor of state.factoryFloors) {
    if (!floor.equippedStrainId) continue
    const strain = state.strains.find((s) => s.id === floor.equippedStrainId)
    if (!strain) continue
    const base = strainRevenuePerSec(strain) * floor.level
    total += base * revenueMod * yieldMod
  }

  for (const item of state.inventory) {
    if (item.type === 'nutrient' && item.owned > 0) {
      total += item.owned * 0.5
    }
  }

  return total / 1000
}

function rivalProfile(
  id: string,
  name: string,
  empireLevel: number,
  revenuePerSec: number,
  avatar: string,
  strains: Strain[],
  storefront: [StorefrontSlot, StorefrontSlot, StorefrontSlot],
): PlayerProfile {
  return {
    id,
    name,
    avatar,
    empireLevel,
    cash: revenuePerSec * 3600,
    sp: empireLevel * 120,
    revenuePerSec,
    badgeIds: ['harvester', 'rift', 'omega'],
    storefrontSlots: storefront,
    strains,
    isSelf: false,
  }
}

const RIVAL_PROFILES: PlayerProfile[] = [
  rivalProfile('dad', 'Player_Dad_99', 45, 8.2e9, '🛸', DAD_STRAINS, DAD_STOREFRONT),
  rivalProfile('chris', 'Cousin_Chris', 22, 450e6, '👾', CHRIS_STRAINS, CHRIS_STOREFRONT),
]

export const useGameStore = create<GameStore>((set, get) => ({
  cash: 250000,
  sp: 340,
  empireLevel: 12,
  name: 'VoidPilot_Aden',
  avatar: '🌌',
  badgeIds: [null, null, null],
  storefrontSlots: emptyStorefront(),
  strains: [],
  inventory: STORE_ITEMS.map((item) => ({ ...item, owned: 0 })),
  factoryFloors: INITIAL_FLOORS,
  sectorUpgrades: INITIAL_SECTORS,
  blitzUpgrades: INITIAL_BLITZ,
  blitzEndsAt: Date.now() + BLITZ_DURATION_MS,
  purchasedBlitzIds: [],
  planetOffers: INITIAL_OFFERS,
  counterPrices: {},
  cloneJob: null,
  focusedStrainId: null,
  packReveal: { open: false, packType: null, strain: null, animating: false },
  profileViewIndex: 0,
  farmSubTab: 'portal',
  transactionBeam: null,
  lastTickAt: Date.now(),
  empireXp: 0,

  tick: (now) => {
    const state = get()
    const delta = now - state.lastTickAt
    if (delta <= 0) return

    const revenuePerMs = computeRevenuePerMs(get)
    const earned = revenuePerMs * delta

    let cloneJob = state.cloneJob
    if (cloneJob && now >= cloneJob.startedAt + cloneJob.durationMs) {
      get().completeClone()
      cloneJob = get().cloneJob
    }

    set({
      cash: state.cash + earned,
      lastTickAt: now,
      cloneJob,
    })
  },

  getRevenuePerMs: () => computeRevenuePerMs(get),
  getRevenuePerSec: () => computeRevenuePerMs(get) * 1000,

  buyMysteryPack: (packType) => {
    const state = get()
    const packDef = MYSTERY_PACKS.find((p) => p.type === packType)
    if (!packDef) return false

    const price = packDef.price
    const spCost = packDef.spCost ?? 0
    let newCash = state.cash
    let newSp = state.sp

    if (packType === 'omega' && state.cash < price && spCost > 0 && state.sp >= spCost) {
      newSp -= spCost
    } else if (state.cash < price) {
      return false
    } else {
      newCash -= price
      newSp += Math.floor(price / 500)
    }

    const scanBonus = computeScanRateMultiplier(state.sectorUpgrades) + getBlitzModifier(get, 'scan')
    const packLuck = getBlitzModifier(get, 'packLuck')
    const seed = Date.now() + Math.floor(Math.random() * 99999)
    const strain = generatePackStrain(packType, seed, { scanBonus, packLuckBonus: packLuck })

    set({
      cash: newCash,
      sp: newSp,
      packReveal: { open: true, packType, strain, animating: true },
    })
    return true
  },

  closePackReveal: () => {
    const { packReveal, strains } = get()
    if (packReveal.strain) {
      set({
        strains: addOrMergeStrain(strains, packReveal.strain),
        packReveal: { open: false, packType: null, strain: null, animating: false },
      })
      get().addEmpireXp(25)
    } else {
      set({ packReveal: { open: false, packType: null, strain: null, animating: false } })
    }
  },

  buyBlitzUpgrade: (id) => {
    const state = get()
    const upgrade = state.blitzUpgrades.find((b) => b.id === id)
    if (!upgrade || upgrade.purchased || state.cash < upgrade.price) return false

    const isFirstBlitzPurchase = state.purchasedBlitzIds.length === 0

    set({
      cash: state.cash - upgrade.price,
      blitzUpgrades: state.blitzUpgrades.map((b) =>
        b.id === id ? { ...b, purchased: true } : b,
      ),
      purchasedBlitzIds: [...state.purchasedBlitzIds, id],
      blitzEndsAt: isFirstBlitzPurchase ? Date.now() + BLITZ_DURATION_MS : state.blitzEndsAt,
    })
    return true
  },

  buyStoreItem: (id) => {
    const state = get()
    const item = state.inventory.find((i) => i.id === id)
    if (!item || state.cash < item.price) return false

    set({
      cash: state.cash - item.price,
      inventory: state.inventory.map((i) =>
        i.id === id ? { ...i, owned: i.owned + 1 } : i,
      ),
    })
    return true
  },

  upgradeSector: (id) => {
    const state = get()
    const sector = state.sectorUpgrades.find((s) => s.id === id)
    if (!sector || sector.level >= sector.maxLevel) return false
    const cost = sector.baseCost * (sector.level + 1)
    if (state.cash < cost) return false

    set({
      cash: state.cash - cost,
      sectorUpgrades: state.sectorUpgrades.map((s) =>
        s.id === id ? { ...s, level: s.level + 1 } : s,
      ),
    })
    return true
  },

  acceptOffer: (offerId) => {
    const state = get()
    const offer = state.planetOffers.find((o) => o.id === offerId)
    if (!offer || state.cash < offer.offerPrice) return false

    const strain = generatePackStrain('guaranteed', offerId.split('').reduce((a, c) => a + c.charCodeAt(0), 0))
    strain.name = offer.strainName
    strain.thcPercent = offer.thcPercent
    strain.yield = offer.yield

    set({
      cash: state.cash - offer.offerPrice,
      strains: addOrMergeStrain(state.strains, strain),
      planetOffers: state.planetOffers.filter((o) => o.id !== offerId),
    })
    return true
  },

  setCounterPrice: (offerId, price) => {
    set({ counterPrices: { ...get().counterPrices, [offerId]: price } })
  },

  counterOffer: (offerId) => {
    const state = get()
    const offer = state.planetOffers.find((o) => o.id === offerId)
    const counter = state.counterPrices[offerId]
    if (!offer || !counter || counter <= 0 || state.cash < counter) return false

    const accepted = counter >= offer.offerPrice * 0.85
    if (!accepted) return false

    const strain = generatePackStrain('basic', counter)
    strain.name = offer.strainName
    strain.thcPercent = offer.thcPercent
    strain.yield = offer.yield

    set({
      cash: state.cash - counter,
      strains: addOrMergeStrain(state.strains, strain),
      planetOffers: state.planetOffers.filter((o) => o.id !== offerId),
    })
    return true
  },

  equipFloor: (floorId, strainId) => {
    set({
      factoryFloors: get().factoryFloors.map((f) =>
        f.id === floorId ? { ...f, equippedStrainId: strainId } : f,
      ),
    })
  },

  startClone: (strainId) => {
    const state = get()
    if (state.cloneJob) return false
    const strain = state.strains.find((s) => s.id === strainId)
    if (!strain) return false

    const cloneMod = getBlitzModifier(get, 'clone')
    const duration = CLONE_DURATION_MS * (1 - cloneMod)

    set({
      cloneJob: { strainId, startedAt: Date.now(), durationMs: duration },
    })
    return true
  },

  completeClone: () => {
    const state = get()
    if (!state.cloneJob) return
    const strain = state.strains.find((s) => s.id === state.cloneJob!.strainId)
    if (!strain) {
      set({ cloneJob: null })
      return
    }
    const updated = state.strains.map((s) =>
      s.id === strain.id ? { ...s, quantity: s.quantity + 1 } : s,
    )
    set({ strains: updated, cloneJob: null })
  },

  buyClanItem: (sellerId, slotIndex) => {
    const profileIdx = sellerId === 'dad' ? 1 : sellerId === 'chris' ? 2 : 0
    if (profileIdx === 0) return false

    const profile = RIVAL_PROFILES[profileIdx - 1]
    const slot = profile.storefrontSlots[slotIndex]
    if (!slot.strainId) return false

    const strain = profile.strains.find((s) => s.id === slot.strainId)
    if (!strain) return false

    const state = get()
    if (state.cash < slot.price) return false

    const copy: Strain = {
      ...strain,
      id: `bought_${strain.id}_${Date.now()}`,
      discoveredAt: Date.now(),
      quantity: 1,
    }

    set({
      cash: state.cash - slot.price,
      strains: addOrMergeStrain(state.strains, copy),
      transactionBeam: { from: profile.name, to: state.name, active: true },
    })

    setTimeout(() => {
      set({ transactionBeam: null })
    }, 1800)

    return true
  },

  setName: (name) => set({ name }),
  setAvatar: (avatar) => set({ avatar }),
  setBadge: (slot, badgeId) => {
    const badges = [...get().badgeIds] as [string | null, string | null, string | null]
    badges[slot] = badgeId
    set({ badgeIds: badges })
  },

  setStorefrontSlot: (slot, strainId, price) => {
    const slots = [...get().storefrontSlots] as [StorefrontSlot, StorefrontSlot, StorefrontSlot]
    slots[slot] = { strainId, price }
    set({ storefrontSlots: slots })
  },

  setProfileViewIndex: (index) => set({ profileViewIndex: Math.max(0, Math.min(2, index)) }),

  cycleProfileView: (direction) => {
    const cur = get().profileViewIndex
    if (direction === 'back') {
      set({ profileViewIndex: 0 })
      return
    }
    const delta = direction === 'next' ? 1 : -1
    set({ profileViewIndex: (cur + delta + 3) % 3 })
  },

  setFocusedStrain: (id) => set({ focusedStrainId: id }),
  setFarmSubTab: (tab) => set({ farmSubTab: tab }),

  addStrain: (strain) => set({ strains: addOrMergeStrain(get().strains, strain) }),

  getBlitzRemainingMs: () => Math.max(0, get().blitzEndsAt - Date.now()),

  getCloneRemainingMs: () => {
    const job = get().cloneJob
    if (!job) return 0
    return Math.max(0, job.startedAt + job.durationMs - Date.now())
  },

  getProfileByIndex: (index) => {
    const state = get()
    if (index === 0) {
      return {
        id: 'self',
        name: state.name,
        avatar: state.avatar,
        empireLevel: state.empireLevel,
        cash: state.cash,
        sp: state.sp,
        revenuePerSec: get().getRevenuePerSec(),
        badgeIds: state.badgeIds,
        storefrontSlots: state.storefrontSlots,
        strains: state.strains,
        isSelf: true,
      }
    }
    return RIVAL_PROFILES[index - 1]
  },

  getScanRateMultiplier: () => {
    const state = get()
    return computeScanRateMultiplier(state.sectorUpgrades) + getBlitzModifier(get, 'scan')
  },

  upgradeStrain: (strainId) => {
    const state = get()
    const idx = state.strains.findIndex((s) => s.id === strainId)
    if (idx < 0) return false
    const strain = state.strains[idx]
    const cost = upgradeCostForStrain(strain)
    if (state.cash < cost) return false

    const updated = [...state.strains]
    updated[idx] = {
      ...strain,
      yield: Math.round(strain.yield * 1.12),
      potency: Math.min(100, strain.potency + 5),
      thcPercent: parseFloat(Math.min(35, strain.thcPercent + 0.8).toFixed(1)),
    }
    set({ cash: state.cash - cost, strains: updated })
    get().addEmpireXp(10)
    return true
  },

  giftStrain: (strainId, targetPlayerId) => {
    const state = get()
    const idx = state.strains.findIndex((s) => s.id === strainId)
    if (idx < 0) return false
    const strain = state.strains[idx]
    if (strain.quantity <= 1) return false

    const targetName = targetPlayerId === 'dad'
      ? 'Player_Dad_99'
      : targetPlayerId === 'chris'
        ? 'Cousin_Chris'
        : null
    if (!targetName) return false

    const updated = [...state.strains]
    updated[idx] = { ...strain, quantity: strain.quantity - 1 }

    set({
      strains: updated,
      transactionBeam: { from: state.name, to: targetName, active: true },
    })
    setTimeout(() => set({ transactionBeam: null }), 1800)
    get().addEmpireXp(5)
    return true
  },

  addEmpireXp: (amount) => {
    const state = get()
    let xp = state.empireXp + amount
    let level = state.empireLevel
    while (xp >= empireXpForLevel(level + 1)) {
      xp -= empireXpForLevel(level + 1)
      level += 1
    }
    set({ empireXp: xp, empireLevel: level })
  },

  hydrateState: (partial) => {
    set(partial)
  },
}))

export { RIVAL_PROFILES, DAD_STRAINS, CHRIS_STRAINS }
