/** Era progression catalog — textures/meshes swap by age. */
export const ERAS = [
  {
    id: 'stone',
    name: 'Stone Age',
    order: 0,
    researchCost: 0,
    researchSeconds: 0,
    palette: { ground: 0x5a4a32, accent: 0x8b7355, enemy: 0x6b4423, weapon: 0x9a8b6b },
    enemyName: 'Wolf',
    weaponName: 'Stone Club',
    projectile: { radius: 0.12, length: 0.55, color: 0xc4a574, speed: 14 },
    enemyScale: 1,
  },
  {
    id: 'bronze',
    name: 'Bronze Age',
    order: 1,
    researchCost: 400,
    researchSeconds: 45,
    palette: { ground: 0x4a3f2a, accent: 0xb87333, enemy: 0x8b4513, weapon: 0xcd7f32 },
    enemyName: 'Brigand',
    weaponName: 'Bronze Spear',
    projectile: { radius: 0.1, length: 0.7, color: 0xcd7f32, speed: 16 },
    enemyScale: 1.05,
  },
  {
    id: 'iron',
    name: 'Iron Age',
    order: 2,
    researchCost: 1200,
    researchSeconds: 90,
    palette: { ground: 0x3a3a42, accent: 0x708090, enemy: 0x4a5568, weapon: 0xa8b0b8 },
    enemyName: 'Iron Warden',
    weaponName: 'Iron Cleaver',
    projectile: { radius: 0.09, length: 0.65, color: 0xd0d5db, speed: 18 },
    enemyScale: 1.1,
  },
  {
    id: 'cyber',
    name: 'Cyber Age',
    order: 3,
    researchCost: 3500,
    researchSeconds: 150,
    palette: { ground: 0x0f172a, accent: 0x22d3ee, enemy: 0x7c3aed, weapon: 0x06b6d4 },
    enemyName: 'Drone Swarm',
    weaponName: 'Pulse Rail',
    projectile: { radius: 0.08, length: 0.9, color: 0x22d3ee, speed: 24 },
    enemyScale: 1.15,
  },
  {
    id: 'god',
    name: 'God Age',
    order: 4,
    researchCost: 9000,
    researchSeconds: 240,
    palette: { ground: 0x1a0a2e, accent: 0xfbbf24, enemy: 0xec4899, weapon: 0xfde68a },
    enemyName: 'Cosmic Deity',
    weaponName: 'Divine Raygun',
    projectile: { radius: 0.11, length: 1.1, color: 0xfbbf24, speed: 28 },
    enemyScale: 1.25,
  },
]

export function eraById(id) {
  return ERAS.find((e) => e.id === id) || ERAS[0]
}

export function nextEra(currentId) {
  const cur = eraById(currentId)
  return ERAS.find((e) => e.order === cur.order + 1) || null
}
