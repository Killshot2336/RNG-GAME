import type { LootItem, Rarity } from '../types/game';

const RARITY_WEIGHTS: Record<Rarity, number> = {
  Common: 70,
  Rare: 24,
  Epic: 5.99,
  Divine: 0.01
};

const POOLS: Record<Rarity, Array<Omit<LootItem, 'id'>>> = {
  Common: [
    { name: 'Scrap Blade', rarity: 'Common', statModifier: 1.05, type: 'Weapon' },
    { name: 'Iron Seed', rarity: 'Common', statModifier: 1.02, type: 'Seed' },
    { name: 'Ash Fiber', rarity: 'Common', statModifier: 1.01, type: 'Resource' },
    { name: 'Patrol Badge', rarity: 'Common', statModifier: 1.03, type: 'Badge' }
  ],
  Rare: [
    { name: 'Pulse Rifle', rarity: 'Rare', statModifier: 1.18, type: 'Weapon' },
    { name: 'Chrono Seed', rarity: 'Rare', statModifier: 1.12, type: 'Seed' },
    { name: 'Volt Core', rarity: 'Rare', statModifier: 1.1, type: 'Resource' },
    { name: 'Strike Badge', rarity: 'Rare', statModifier: 1.15, type: 'Badge' }
  ],
  Epic: [
    { name: 'Rift Cannon', rarity: 'Epic', statModifier: 1.4, type: 'Weapon' },
    { name: 'Portal Seed', rarity: 'Epic', statModifier: 1.3, type: 'Seed' },
    { name: 'Syndicate Badge', rarity: 'Epic', statModifier: 1.35, type: 'Badge' },
    { name: 'Null Ore', rarity: 'Epic', statModifier: 1.28, type: 'Resource' }
  ],
  Divine: [
    { name: 'Swarm Crown', rarity: 'Divine', statModifier: 2.0, type: 'Badge' },
    { name: 'Final Edge', rarity: 'Divine', statModifier: 2.2, type: 'Weapon' },
    { name: 'Worldseed', rarity: 'Divine', statModifier: 1.9, type: 'Seed' }
  ]
};

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(parts: Array<string | number>): number {
  let h = 2166136261;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rollRarity(rng: () => number, luck = 0): Rarity {
  const boost = Math.max(0, Math.min(0.25, luck));
  const weights: Array<[Rarity, number]> = [
    ['Common', RARITY_WEIGHTS.Common * (1 - boost * 0.5)],
    ['Rare', RARITY_WEIGHTS.Rare * (1 + boost * 0.4)],
    ['Epic', RARITY_WEIGHTS.Epic * (1 + boost * 1.2)],
    ['Divine', RARITY_WEIGHTS.Divine * (1 + boost * 4)]
  ];
  const total = weights.reduce((a, w) => a + w[1], 0);
  let roll = rng() * total;
  for (const [rarity, w] of weights) {
    roll -= w;
    if (roll <= 0) return rarity;
  }
  return 'Common';
}

export function rollLootItem(opts: {
  chestRarity: Rarity;
  profileId: string;
  luck?: number;
  salt?: number;
}): LootItem {
  const seed = hashSeed([opts.profileId, opts.chestRarity, opts.salt ?? Date.now()]);
  const rng = mulberry32(seed);
  const floor: Record<Rarity, number> = { Common: 0, Rare: 1, Epic: 2, Divine: 3 };
  const order: Rarity[] = ['Common', 'Rare', 'Epic', 'Divine'];
  let rarity = rollRarity(rng, opts.luck ?? 0);
  if (floor[rarity] < floor[opts.chestRarity]) {
    rarity = opts.chestRarity;
  }
  if (opts.chestRarity === 'Divine' && rng() < 0.35) rarity = 'Divine';
  const pool = POOLS[rarity];
  const pick = pool[Math.floor(rng() * pool.length)];
  return {
    id: `${rarity.toLowerCase()}_${pick.type.toLowerCase()}_${seed.toString(36)}_${Math.floor(rng() * 1e6).toString(36)}`,
    name: pick.name,
    rarity: pick.rarity,
    statModifier: +(pick.statModifier + rng() * 0.08).toFixed(3),
    type: pick.type
  };
}

export function xpToNext(level: number): number {
  return Math.floor(100 * Math.pow(1.35, level - 1));
}

export function harvestYield(portalLevel: number, elapsedMs: number, seedCount: number) {
  const hours = Math.min(24, elapsedMs / 3_600_000);
  const base = 8 + portalLevel * 6;
  const seedBonus = 1 + seedCount * 0.12;
  const credits = Math.floor(base * hours * seedBonus);
  const seedsGained = Math.floor(hours * (0.4 + portalLevel * 0.15));
  return { credits, seedsGained };
}
