import type { MysteryPackType, Strain, StrainRarity } from '@/types/game'

const PREFIXES = [
  'Void', 'Nebula', 'Cosmic', 'Quantum', 'Dark', 'Plasma', 'Stellar', 'Rift',
  'Hyper', 'Null', 'Astral', 'Chrono', 'Solar', 'Lunar', 'Nova', 'Echo',
  'Phantom', 'Radiant', 'Obsidian', 'Cryo', 'Ember', 'Prism', 'Vortex', 'Zenith',
] as const

const SUFFIXES = [
  'Kush', 'Haze', 'Dream', 'Mist', 'Bloom', 'Leaf', 'Root', 'Spore',
  'Crystal', 'Nectar', 'Pulse', 'Wave', 'Shard', 'Orb', 'Veil', 'Drift',
  'Surge', 'Glow', 'Frost', 'Flare', 'Whisper', 'Storm', 'Seed', 'Essence',
] as const

const RARITY_ORDER: StrainRarity[] = ['Common', 'Rare', 'Epic', 'Legendary', 'Mythic']

/** Mulberry32 seeded PRNG */
export function createRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickRarity(rng: () => number, minRarity?: StrainRarity, luckBonus = 0): StrainRarity {
  const roll = rng() - luckBonus * 0.05
  let rarity: StrainRarity
  if (roll > 0.97) rarity = 'Mythic'
  else if (roll > 0.92) rarity = 'Legendary'
  else if (roll > 0.82) rarity = 'Epic'
  else if (roll > 0.55) rarity = 'Rare'
  else rarity = 'Common'

  if (minRarity) {
    const minIdx = RARITY_ORDER.indexOf(minRarity)
    const curIdx = RARITY_ORDER.indexOf(rarity)
    if (curIdx < minIdx) rarity = minRarity
  }
  return rarity
}

function rarityMultiplier(rarity: StrainRarity): number {
  switch (rarity) {
    case 'Mythic': return 2.8
    case 'Legendary': return 2.2
    case 'Epic': return 1.7
    case 'Rare': return 1.3
    default: return 1.0
  }
}

export function generateSeed(): number {
  return Math.floor(Math.random() * 0xffffffff)
}

export function generateStrainFromSeed(
  seed: number,
  minRarity?: StrainRarity,
  luckBonus = 0,
): Strain {
  const rng = createRng(seed)
  const prefix = PREFIXES[Math.floor(rng() * PREFIXES.length)]
  const suffix = SUFFIXES[Math.floor(rng() * SUFFIXES.length)]
  const variant = Math.floor(rng() * 999)
  const name = `${prefix} ${suffix} #${variant}`
  const rarity = pickRarity(rng, minRarity, luckBonus)
  const mult = rarityMultiplier(rarity)

  const potency = Math.round((40 + rng() * 60) * mult)
  const flavor = Math.round((35 + rng() * 55) * mult)
  const yieldRating = Math.round((30 + rng() * 70) * mult)
  const resilience = Math.round((25 + rng() * 50) * mult)
  const thcPercent = parseFloat((12 + rng() * 18 * mult).toFixed(1))
  const hue = Math.floor(rng() * 360)

  return {
    id: `strain_${seed}_${Date.now()}`,
    name,
    seed,
    thcPercent,
    yield: yieldRating,
    quantity: 1,
    hue,
    rarity,
    potency,
    flavor,
    resilience,
    discoveredAt: Date.now(),
  }
}

export interface PackGenOptions {
  scanBonus?: number
  packLuckBonus?: number
}

export function generatePackStrain(
  packType: MysteryPackType,
  seed?: number,
  options: PackGenOptions = {},
): Strain {
  const s = seed ?? generateSeed()
  const luck = (options.packLuckBonus ?? 0) + (options.scanBonus ?? 0) * 0.1
  switch (packType) {
    case 'basic':
      return generateStrainFromSeed(s, undefined, luck)
    case 'guaranteed':
      return generateStrainFromSeed(s, 'Rare', luck)
    case 'omega':
      return generateStrainFromSeed(s, 'Epic', luck)
  }
}

export function mergeStrain(existing: Strain, incoming: Strain): Strain {
  if (existing.name === incoming.name || existing.seed === incoming.seed) {
    return { ...existing, quantity: existing.quantity + 1 }
  }
  return incoming
}

export function strainRevenuePerSec(strain: Strain): number {
  return (strain.yield * strain.quantity * strain.thcPercent) / 100
}

export function proceduralGridLayout(strains: Strain[], seed: number): { strainId: string; x: number; y: number; scale: number; rot: number }[] {
  const rng = createRng(seed)
  return strains.map((s) => ({
    strainId: s.id,
    x: (rng() * 80 + 10),
    y: (rng() * 70 + 15),
    scale: 0.85 + rng() * 0.3,
    rot: (rng() - 0.5) * 12,
  }))
}

export function generateRivalStrains(count: number, baseSeed: number): Strain[] {
  const strains: Strain[] = []
  for (let i = 0; i < count; i++) {
    strains.push(generateStrainFromSeed(baseSeed + i * 7919))
  }
  return strains
}
