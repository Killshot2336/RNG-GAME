export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Divine';

export type ProfileId = 'aden' | 'edward' | 'jamie';

export type TabId = 'combat' | 'outpost' | 'vault' | 'profiles';

export interface PlayerProfile {
  id: ProfileId;
  name: string;
  level: number;
  xp: number;
  credits: number;
  badges: string[];
  activeWeapon: string;
}

export interface LootItem {
  id: string;
  name: string;
  rarity: Rarity;
  statModifier: number;
  type: 'Weapon' | 'Badge' | 'Seed' | 'Resource';
}

export interface OutpostState {
  portalLevel: number;
  lastHarvest: number;
  activeSeeds: string[];
}

export interface GameState {
  activeTab: TabId;
  activeProfileId: ProfileId;
  profiles: Record<ProfileId, PlayerProfile>;
  sharedVault: LootItem[];
  outpost: OutpostState;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface CombatEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  kind: 'player' | 'enemy' | 'bullet' | 'pickup';
  dmg?: number;
  ttl?: number;
  tint?: string;
}

export interface DamageSplash {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  crit: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  r: number;
  color: string;
}
