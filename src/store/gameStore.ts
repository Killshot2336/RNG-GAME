import { createStore } from 'zustand/vanilla';
import type { GameState, LootItem, PlayerProfile, ProfileId, Rarity, TabId } from '../types/game';
import { harvestYield, rollLootItem, xpToNext } from '../utils/lootTables';

const SAVE_KEY = 'syndicate_swarm_v1';

function defaultProfiles(): Record<ProfileId, PlayerProfile> {
  return {
    aden: {
      id: 'aden',
      name: 'Aden',
      level: 1,
      xp: 0,
      credits: 120,
      badges: [],
      activeWeapon: 'Scrap Blade'
    },
    jamie: {
      id: 'jamie',
      name: 'Jamie',
      level: 1,
      xp: 0,
      credits: 120,
      badges: [],
      activeWeapon: 'Scrap Blade'
    },
    edward: {
      id: 'edward',
      name: 'Edward',
      level: 1,
      xp: 0,
      credits: 120,
      badges: [],
      activeWeapon: 'Scrap Blade'
    }
  };
}

function freshState(): GameState {
  return {
    activeTab: 'combat',
    activeProfileId: 'aden',
    profiles: defaultProfiles(),
    sharedVault: [],
    outpost: {
      portalLevel: 1,
      lastHarvest: Date.now(),
      activeSeeds: ['Iron Seed']
    }
  };
}

function loadState(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as Partial<GameState>;
    const base = freshState();
    return {
      ...base,
      ...parsed,
      profiles: { ...base.profiles, ...(parsed.profiles || {}) },
      outpost: { ...base.outpost, ...(parsed.outpost || {}) },
      sharedVault: Array.isArray(parsed.sharedVault) ? parsed.sharedVault : []
    };
  } catch {
    return freshState();
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(state: GameState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      /* quota */
    }
  }, 280);
}

export interface GameActions {
  setTab: (tab: TabId) => void;
  switchProfile: (profileId: ProfileId) => void;
  addXp: (profileId: ProfileId, amount: number) => void;
  addCredits: (profileId: ProfileId, amount: number) => void;
  openLootChest: (chestRarity: Rarity) => LootItem | null;
  transferToVault: (itemId: string) => void;
  claimFromVault: (itemId: string) => void;
  harvestOutpost: () => { credits: number; seedsGained: number };
  equipWeapon: (profileId: ProfileId, weaponName: string) => void;
  equipBadge: (profileId: ProfileId, badgeName: string) => void;
  bumpPortal: () => void;
  plantSeed: (seedName: string) => void;
  luckyStrike: (profileId: ProfileId) => number;
}

export type SwarmStore = GameState & GameActions;

export const gameStore = createStore<SwarmStore>((set, get) => ({
  ...loadState(),

  setTab(tab) {
    set({ activeTab: tab });
    scheduleSave(get());
  },

  switchProfile(profileId) {
    const state = get();
    if (!state.profiles[profileId]) return;
    if (state.activeProfileId === profileId) return;
    set({ activeProfileId: profileId });
    scheduleSave(get());
  },

  addXp(profileId, amount) {
    const state = get();
    const p = state.profiles[profileId];
    if (!p || amount <= 0) return;
    let xp = p.xp + amount;
    let level = p.level;
    let guard = 0;
    while (xp >= xpToNext(level) && guard < 40) {
      xp -= xpToNext(level);
      level += 1;
      guard += 1;
    }
    set({
      profiles: {
        ...state.profiles,
        [profileId]: { ...p, xp, level }
      }
    });
    scheduleSave(get());
  },

  addCredits(profileId, amount) {
    const state = get();
    const p = state.profiles[profileId];
    if (!p) return;
    set({
      profiles: {
        ...state.profiles,
        [profileId]: { ...p, credits: Math.max(0, p.credits + amount) }
      }
    });
    scheduleSave(get());
  },

  luckyStrike(profileId) {
    const p = get().profiles[profileId];
    if (!p) return 0;
    const badgeLuck = p.badges.length * 0.04;
    const levelLuck = Math.min(0.12, (p.level - 1) * 0.008);
    return badgeLuck + levelLuck;
  },

  openLootChest(chestRarity) {
    const state = get();
    const pid = state.activeProfileId;
    const profile = state.profiles[pid];
    if (!profile) return null;
    const cost: Record<Rarity, number> = { Common: 25, Rare: 80, Epic: 220, Divine: 900 };
    const price = cost[chestRarity];
    if (profile.credits < price) return null;
    const item = rollLootItem({
      chestRarity,
      profileId: pid,
      luck: get().luckyStrike(pid),
      salt: state.sharedVault.length + profile.level + Date.now() % 997
    });
    const nextCredits = profile.credits - price;
    const nextVault = [...state.sharedVault, item];
    set({
      profiles: {
        ...state.profiles,
        [pid]: { ...profile, credits: nextCredits }
      },
      sharedVault: nextVault
    });
    scheduleSave(get());
    return item;
  },

  transferToVault(itemId) {
    const state = get();
    if (!state.sharedVault.some((i) => i.id === itemId)) return;
    scheduleSave(get());
  },

  claimFromVault(itemId) {
    const state = get();
    const item = state.sharedVault.find((i) => i.id === itemId);
    if (!item) return;
    const pid = state.activeProfileId;
    const profile = state.profiles[pid];
    if (!profile) return;
    const vault = state.sharedVault.filter((i) => i.id !== itemId);
    let next = { ...profile };
    if (item.type === 'Weapon') next.activeWeapon = item.name;
    if (item.type === 'Badge') {
      const badges = [...next.badges, item.name].slice(-3);
      next.badges = badges;
    }
    if (item.type === 'Seed') {
      set({
        sharedVault: vault,
        profiles: { ...state.profiles, [pid]: next },
        outpost: {
          ...state.outpost,
          activeSeeds: [...state.outpost.activeSeeds, item.name].slice(0, 8)
        }
      });
      scheduleSave(get());
      return;
    }
    if (item.type === 'Resource') {
      next.credits += Math.floor(12 * item.statModifier);
    }
    set({
      sharedVault: vault,
      profiles: { ...state.profiles, [pid]: next }
    });
    scheduleSave(get());
  },

  harvestOutpost() {
    const state = get();
    const now = Date.now();
    const elapsed = Math.max(0, now - state.outpost.lastHarvest);
    const { credits, seedsGained } = harvestYield(
      state.outpost.portalLevel,
      elapsed,
      state.outpost.activeSeeds.length
    );
    const pid = state.activeProfileId;
    const profile = state.profiles[pid];
    const newSeeds = [...state.outpost.activeSeeds];
    for (let i = 0; i < seedsGained; i++) newSeeds.push(`Auto Seed ${state.outpost.portalLevel}`);
    set({
      outpost: {
        ...state.outpost,
        lastHarvest: now,
        activeSeeds: newSeeds.slice(0, 12)
      },
      profiles: {
        ...state.profiles,
        [pid]: { ...profile, credits: profile.credits + credits }
      }
    });
    scheduleSave(get());
    return { credits, seedsGained };
  },

  equipWeapon(profileId, weaponName) {
    const state = get();
    const p = state.profiles[profileId];
    if (!p) return;
    set({
      profiles: {
        ...state.profiles,
        [profileId]: { ...p, activeWeapon: weaponName }
      }
    });
    scheduleSave(get());
  },

  equipBadge(profileId, badgeName) {
    const state = get();
    const p = state.profiles[profileId];
    if (!p) return;
    const badges = [...p.badges.filter((b) => b !== badgeName), badgeName].slice(-3);
    set({
      profiles: {
        ...state.profiles,
        [profileId]: { ...p, badges }
      }
    });
    scheduleSave(get());
  },

  bumpPortal() {
    const state = get();
    const pid = state.activeProfileId;
    const p = state.profiles[pid];
    const cost = 100 + state.outpost.portalLevel * 75;
    if (p.credits < cost) return;
    set({
      outpost: { ...state.outpost, portalLevel: state.outpost.portalLevel + 1 },
      profiles: {
        ...state.profiles,
        [pid]: { ...p, credits: p.credits - cost }
      }
    });
    scheduleSave(get());
  },

  plantSeed(seedName) {
    const state = get();
    if (state.outpost.activeSeeds.length >= 12) return;
    set({
      outpost: {
        ...state.outpost,
        activeSeeds: [...state.outpost.activeSeeds, seedName]
      }
    });
    scheduleSave(get());
  }
}));

export function getActiveProfile(): PlayerProfile {
  const s = gameStore.getState();
  return s.profiles[s.activeProfileId];
}
