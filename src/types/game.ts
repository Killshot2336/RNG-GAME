export type StrainRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic'

export interface Strain {
  id: string
  name: string
  seed: number
  thcPercent: number
  yield: number
  quantity: number
  hue: number
  rarity: StrainRarity
  potency: number
  flavor: number
  resilience: number
  discoveredAt: number
}

export interface StorefrontSlot {
  strainId: string | null
  price: number
}

export interface FactoryFloor {
  id: string
  name: string
  equippedStrainId: string | null
  level: number
}

export interface SectorUpgrade {
  id: 'thrusters' | 'radar' | 'shield'
  name: string
  level: number
  maxLevel: number
  baseCost: number
  scanRateBonus: number
}

export interface PlanetOffer {
  id: string
  strainName: string
  thcPercent: number
  yield: number
  offerPrice: number
  sellerName: string
}

export interface BlitzUpgrade {
  id: string
  name: string
  description: string
  modifier: number
  modifierType: 'revenue' | 'yield' | 'scan' | 'clone' | 'packLuck'
  price: number
  purchased: boolean
}

export interface InventoryItem {
  id: string
  name: string
  type: 'nutrient' | 'pipe'
  price: number
  emoji: string
  owned: number
}

export interface CloneJob {
  strainId: string
  startedAt: number
  durationMs: number
}

export interface PlayerProfile {
  id: string
  name: string
  avatar: string
  empireLevel: number
  cash: number
  sp: number
  revenuePerSec: number
  badgeIds: [string | null, string | null, string | null]
  storefrontSlots: [StorefrontSlot, StorefrontSlot, StorefrontSlot]
  strains: Strain[]
  isSelf: boolean
}

export type MysteryPackType = 'basic' | 'guaranteed' | 'omega'

export interface PackRevealState {
  open: boolean
  packType: MysteryPackType | null
  strain: Strain | null
  animating: boolean
}

export type FarmSubTab = 'upgrade' | 'control' | 'portal'

export interface GameState {
  cash: number
  sp: number
  empireLevel: number
  name: string
  avatar: string
  badgeIds: [string | null, string | null, string | null]
  storefrontSlots: [StorefrontSlot, StorefrontSlot, StorefrontSlot]
  strains: Strain[]
  inventory: InventoryItem[]
  factoryFloors: FactoryFloor[]
  sectorUpgrades: SectorUpgrade[]
  blitzUpgrades: BlitzUpgrade[]
  blitzEndsAt: number
  purchasedBlitzIds: string[]
  planetOffers: PlanetOffer[]
  counterPrices: Record<string, number>
  cloneJob: CloneJob | null
  focusedStrainId: string | null
  packReveal: PackRevealState
  profileViewIndex: number
  farmSubTab: FarmSubTab
  transactionBeam: { from: string; to: string; active: boolean } | null
  lastTickAt: number
  empireXp: number
}

export interface GameActions {
  tick: (now: number) => void
  buyMysteryPack: (pack: MysteryPackType) => boolean
  closePackReveal: () => void
  buyBlitzUpgrade: (id: string) => boolean
  buyStoreItem: (id: string) => boolean
  upgradeSector: (id: string) => boolean
  acceptOffer: (offerId: string) => boolean
  setCounterPrice: (offerId: string, price: number) => void
  counterOffer: (offerId: string) => boolean
  equipFloor: (floorId: string, strainId: string | null) => void
  startClone: (strainId: string) => boolean
  completeClone: () => void
  buyClanItem: (sellerId: string, slotIndex: number) => boolean
  setName: (name: string) => void
  setAvatar: (avatar: string) => void
  setBadge: (slot: 0 | 1 | 2, badgeId: string | null) => void
  setStorefrontSlot: (slot: 0 | 1 | 2, strainId: string | null, price: number) => void
  setProfileViewIndex: (index: number) => void
  cycleProfileView: (direction: 'prev' | 'next' | 'back') => void
  setFocusedStrain: (id: string | null) => void
  setFarmSubTab: (tab: FarmSubTab) => void
  addStrain: (strain: Strain) => void
  getRevenuePerMs: () => number
  getRevenuePerSec: () => number
  getProfileByIndex: (index: number) => PlayerProfile
  getBlitzRemainingMs: () => number
  getCloneRemainingMs: () => number
  getScanRateMultiplier: () => number
  upgradeStrain: (strainId: string) => boolean
  giftStrain: (strainId: string, targetPlayerId: string) => boolean
  addEmpireXp: (amount: number) => void
  hydrateState: (partial: Partial<GameState>) => void
}

export type GameStore = GameState & GameActions

export const AVATARS = ['🌌', '🛸', '👾', '🌿', '💫', '🔮', '🪐', '⚡'] as const

export const BADGES = [
  { id: 'harvester', emoji: '🌾', label: 'Harvester' },
  { id: 'rift', emoji: '🌀', label: 'Rift Walker' },
  { id: 'omega', emoji: '💎', label: 'Omega Tier' },
  { id: 'cloner', emoji: '🧬', label: 'Clone Master' },
  { id: 'trader', emoji: '🤝', label: 'Void Trader' },
  { id: 'blitz', emoji: '⚡', label: 'Blitz King' },
] as const

export const MYSTERY_PACKS: { type: MysteryPackType; name: string; price: number; spCost?: number; emoji: string; desc: string }[] = [
  { type: 'basic', name: 'Basic Void Pack', price: 5000, emoji: '📦', desc: 'Random procedural strain' },
  { type: 'guaranteed', name: 'Guaranteed Rift Pack', price: 25000, emoji: '🎁', desc: 'Rare+ guaranteed' },
  { type: 'omega', name: 'Omega Rift Pack', price: 100000, spCost: 50, emoji: '🌌', desc: 'Epic+ cosmic anomaly (cash or SP)' },
]

export const STORE_ITEMS: Omit<InventoryItem, 'owned'>[] = [
  { id: 'nutrient-a', name: 'Nebula Nutrients', type: 'nutrient', price: 1200, emoji: '🧪' },
  { id: 'nutrient-b', name: 'Void Bloom Mix', type: 'nutrient', price: 3500, emoji: '💧' },
  { id: 'pipe-a', name: 'Quantum Pipe Mk.I', type: 'pipe', price: 8000, emoji: '🔧' },
  { id: 'pipe-b', name: 'Hyperflow Conduit', type: 'pipe', price: 18000, emoji: '⚙️' },
]
