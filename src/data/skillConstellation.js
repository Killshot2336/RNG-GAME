/** Skyrim-style constellation perk graph. */
export const SKILL_NODES = [
  { id: 'core', name: 'Void Spark', cost: 0, x: 0, y: 0, requires: [], effect: { damage: 1 } },
  { id: 'might1', name: 'Might I', cost: 80, x: -2.2, y: 1.4, requires: ['core'], effect: { damage: 1.15 } },
  { id: 'might2', name: 'Might II', cost: 160, x: -3.4, y: 2.6, requires: ['might1'], effect: { damage: 1.3 } },
  { id: 'might3', name: 'Titan Strike', cost: 320, x: -4.2, y: 4.0, requires: ['might2'], effect: { damage: 1.55 } },
  { id: 'swift1', name: 'Swift I', cost: 80, x: 2.2, y: 1.4, requires: ['core'], effect: { fireRate: 0.9 } },
  { id: 'swift2', name: 'Swift II', cost: 160, x: 3.4, y: 2.6, requires: ['swift1'], effect: { fireRate: 0.78 } },
  { id: 'swift3', name: 'Overclock', cost: 320, x: 4.2, y: 4.0, requires: ['swift2'], effect: { fireRate: 0.62 } },
  { id: 'magnet1', name: 'Pull I', cost: 100, x: 0, y: 2.2, requires: ['core'], effect: { magnet: 1.4 } },
  { id: 'magnet2', name: 'Pull II', cost: 220, x: 0, y: 3.8, requires: ['magnet1'], effect: { magnet: 2.2 } },
  { id: 'ward1', name: 'Ward', cost: 140, x: -1.6, y: 3.2, requires: ['might1', 'magnet1'], effect: { hp: 1.25 } },
  { id: 'fury1', name: 'Fury', cost: 140, x: 1.6, y: 3.2, requires: ['swift1', 'magnet1'], effect: { multishot: true } },
  { id: 'apex', name: 'Apex Star', cost: 500, x: 0, y: 5.4, requires: ['might3', 'swift3', 'magnet2'], effect: { damage: 1.8, fireRate: 0.55, magnet: 3 } },
]

export const SKILL_EDGES = [
  ['core', 'might1'],
  ['might1', 'might2'],
  ['might2', 'might3'],
  ['core', 'swift1'],
  ['swift1', 'swift2'],
  ['swift2', 'swift3'],
  ['core', 'magnet1'],
  ['magnet1', 'magnet2'],
  ['might1', 'ward1'],
  ['magnet1', 'ward1'],
  ['swift1', 'fury1'],
  ['magnet1', 'fury1'],
  ['might3', 'apex'],
  ['swift3', 'apex'],
  ['magnet2', 'apex'],
]

export function computeSkillMods(unlockedIds) {
  const mods = { damage: 1, fireRate: 1, magnet: 1, hp: 1, multishot: false }
  for (const id of unlockedIds) {
    const node = SKILL_NODES.find((n) => n.id === id)
    if (!node) continue
    const e = node.effect
    if (e.damage) mods.damage *= e.damage
    if (e.fireRate) mods.fireRate *= e.fireRate
    if (e.magnet) mods.magnet *= e.magnet
    if (e.hp) mods.hp *= e.hp
    if (e.multishot) mods.multishot = true
  }
  return mods
}
