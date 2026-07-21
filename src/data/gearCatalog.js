/** Timed gacha market + permanent chests. */
export const CHEST_OFFERS = [
  { id: 'wood', name: 'Wood Chest', cost: 50, rarityBias: 0.55, color: '#8B5A2B' },
  { id: 'silver', name: 'Silver Chest', cost: 200, rarityBias: 0.35, color: '#C0C0C0' },
  { id: 'gold', name: 'Gold Chest', cost: 500, rarityBias: 0.18, color: '#F5C542' },
  { id: 'legendary', name: 'Legendary Chest', cost: 1500, rarityBias: 0.06, color: '#A855F7' },
]

export const GEAR_POOL = [
  { name: 'Ashen Buckler', slot: 'armor', rarity: 'common', stat: 'hp', bonus: 8 },
  { name: 'River Fang', slot: 'weapon', rarity: 'common', stat: 'damage', bonus: 6 },
  { name: 'Copper Spurs', slot: 'boots', rarity: 'common', stat: 'speed', bonus: 4 },
  { name: 'Storm Greaves', slot: 'boots', rarity: 'rare', stat: 'speed', bonus: 10 },
  { name: 'Ember Maul', slot: 'weapon', rarity: 'rare', stat: 'damage', bonus: 14 },
  { name: 'Aegis Plate', slot: 'armor', rarity: 'rare', stat: 'hp', bonus: 18 },
  { name: 'Void Repeater', slot: 'weapon', rarity: 'epic', stat: 'damage', bonus: 28 },
  { name: 'Phase Cloak', slot: 'armor', rarity: 'epic', stat: 'hp', bonus: 32 },
  { name: 'Magnet Loop', slot: 'trinket', rarity: 'epic', stat: 'magnet', bonus: 40 },
  { name: 'Godsplitter', slot: 'weapon', rarity: 'legendary', stat: 'damage', bonus: 55 },
  { name: 'Celestial Mantle', slot: 'armor', rarity: 'legendary', stat: 'hp', bonus: 60 },
  { name: 'Hay Day Charm', slot: 'trinket', rarity: 'legendary', stat: 'magnet', bonus: 80 },
]

export const RARITY_WEIGHTS = {
  common: 1,
  rare: 0.45,
  epic: 0.18,
  legendary: 0.05,
}

export function rollGear(rarityBias = 0.4) {
  const roll = Math.random()
  let rarity = 'common'
  if (roll < rarityBias * 0.08) rarity = 'legendary'
  else if (roll < rarityBias * 0.25) rarity = 'epic'
  else if (roll < rarityBias * 0.55) rarity = 'rare'

  const pool = GEAR_POOL.filter((g) => g.rarity === rarity)
  const pick = pool[Math.floor(Math.random() * pool.length)] || GEAR_POOL[0]
  return {
    id: `gear_${Date.now()}_${Math.floor(Math.random() * 9999)}`,
    ...pick,
    rolledAt: Date.now(),
  }
}

/**
 * Pure loot-chest roll used by market chests and the diagnostic sandbox.
 * Does NOT mutate inventory / sharedVault — callers decide persistence.
 *
 * Tier table (display Divine = data rarity `legendary`):
 *   Divine  0.02%
 *   Epic    2.00%
 *   Rare   18.00%
 *   Common 79.98%
 *
 * Optional `rarityBias` (0–1) soft-boosts non-common odds without changing
 * the Divine floor of 0.02% (matches the published drop index).
 */
export const DIVINE_DROP_RATE = 0.0002

export function openLootChest(opts = {}) {
  const bias = typeof opts.rarityBias === 'number' ? opts.rarityBias : 0.4
  const rng = typeof opts.rng === 'function' ? opts.rng : Math.random
  const roll = rng()

  let rarity = 'common'
  if (roll < DIVINE_DROP_RATE) {
    rarity = 'legendary' // Divine tier in UI
  } else if (roll < DIVINE_DROP_RATE + 0.02 * bias) {
    rarity = 'epic'
  } else if (roll < DIVINE_DROP_RATE + 0.02 * bias + 0.18 * bias) {
    rarity = 'rare'
  }

  const pool = GEAR_POOL.filter((g) => g.rarity === rarity)
  const pick = pool[Math.floor(rng() * pool.length)] || GEAR_POOL[0]
  return {
    id: `loot_${Date.now()}_${Math.floor(rng() * 1e9)}`,
    ...pick,
    rolledAt: Date.now(),
    displayTier: rarity === 'legendary' ? 'divine' : rarity,
  }
}

/** Refresh interval for the 4-slot timed store (ms). */
export const MARKET_REFRESH_MS = 4 * 60 * 1000

export function buildTimedSlots(seed = Date.now()) {
  const slots = []
  for (let i = 0; i < 4; i++) {
    const bias = 0.25 + ((seed + i * 97) % 40) / 100
    const item = rollGear(bias)
    slots.push({
      slotIndex: i,
      price: Math.round(40 + bias * 220 + (item.rarity === 'legendary' ? 400 : 0)),
      item,
      purchased: false,
    })
  }
  return slots
}
