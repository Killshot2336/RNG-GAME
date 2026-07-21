/* Chronos static content — tree, story, planets, recipes */
window.ChronosData = {
  WARBAND: [
    { id: 'aden', name: 'Aden', accent: '#3de0c5', portrait: '/public/art/chronos/portrait-aden.png', blurb: 'Rift lead' },
    { id: 'jamie', name: 'Jamie', accent: '#ff3d5a', portrait: '/public/art/chronos/portrait-jamie.png', blurb: 'Bulwark steel' },
    { id: 'edward', name: 'Edward', accent: '#e8c56a', portrait: '/public/art/chronos/portrait-edward.png', blurb: 'Warden craft' }
  ],
  ART: {
    who: '/public/art/chronos/who-bg.png',
    hub: '/public/art/chronos/hub-stage.png?v=22',
    tower: '/public/art/chronos/tower-arena.png?v=22',
    forge: '/public/art/chronos/forge-bg.png?v=22',
    gate: '/public/art/chronos/gate-bg.png?v=22',
    life: '/public/art/chronos/life-bg.png?v=22',
    tree: '/public/art/chronos/tree-bg.png?v=22',
    uiBtn: '/public/art/chronos/ui/btn-battle.png',
    uiFrame: '/public/art/chronos/ui/frame-portrait.png',
    uiHud: '/public/art/chronos/ui/hud-top.png',
    uiAbilities: '/public/art/chronos/ui/ability-icons.png',
    uiChrome: '/public/art/chronos/ui/ui-chrome-sheet.png'
  },
  ERAS: [
    { id: 'stone', name: 'STONE AGE', blurb: 'Bone spears. Fire rings. Survive the first night.', accent: '#c4a574', story: 'You hit dirt and ash. The Chronolith hums under a dead sky.' },
    { id: 'bronze', name: 'BRONZE AGE', blurb: 'Cast shields. Rally tribes against the swarm.', accent: '#cd7f32', story: 'Metal remembers the future. Tribes gather at your fire.' },
    { id: 'iron', name: 'IRON AGE', blurb: 'Forged walls. Discipline under blood moons.', accent: '#9aa0a6', story: 'Walls rise. The swarm learns fear — briefly.' },
    { id: 'powder', name: 'GUNPOWDER', blurb: 'Thunder sticks. Smoke and siege.', accent: '#ff6a3d', story: 'Thunder in a tube. The timeline cracks louder.' },
    { id: 'neon', name: 'NEON AGE', blurb: 'Circuits wake. Chronolith sings.', accent: '#7cf0ff', story: 'Light becomes language. The Anchor answers.' },
    { id: 'void', name: 'VOID ERA', blurb: 'Time bends. The homeward gate waits.', accent: '#e8c56a', story: 'No more eras — only the choice to go home, or go further.' }
  ],
  PLANETS: [
    { id: 'cinder', name: 'CINDER REACH', exotic: 'ember_root', exoticName: 'Ember Root', blurb: 'Volcanic veins. Burn fuel for the forge.', accent: '#ff6a3d', eraNeed: 1, hazard: 'burn', verb: 'Mine the vein' },
    { id: 'glacier', name: 'GLACIER NYX', exotic: 'frost_bloom', exoticName: 'Frost Bloom', blurb: 'Still air. Freeze the timeline.', accent: '#7cf0ff', eraNeed: 2, hazard: 'slow', verb: 'Cut the bloom' },
    { id: 'verdant', name: 'VERDANT HUSK', exotic: 'life_spine', exoticName: 'Life Spine', blurb: 'Living metal. Mend what breaks.', accent: '#9dffb0', eraNeed: 3, hazard: 'spore', verb: 'Harvest the spine' },
    { id: 'oblivion', name: 'OBLIVION KEY', exotic: 'void_shard', exoticName: 'Void Shard', blurb: 'No sky. Only hunger.', accent: '#c084fc', eraNeed: 5, hazard: 'drain', verb: 'Pull the shard' }
  ],
  SHARDS: [
    { id: 'bone', name: 'Bone', icon: '◆', rarity: 'common' },
    { id: 'ore', name: 'Ore', icon: '◇', rarity: 'common' },
    { id: 'spark', name: 'Spark', icon: '✦', rarity: 'rare' },
    { id: 'ash', name: 'Ash', icon: '✧', rarity: 'rare' },
    { id: 'core', name: 'Core', icon: '◎', rarity: 'epic' },
    { id: 'echo', name: 'Echo', icon: '◈', rarity: 'myth' }
  ],
  RECIPES: [
    { a: 'bone', b: 'ore', out: 'spark', name: 'Spark Fuse' },
    { a: 'spark', b: 'ash', out: 'core', name: 'Core Bind' },
    { a: 'bone', b: 'spark', out: 'ash', name: 'Ash Burn' },
    { a: 'core', b: 'echo', out: 'relic_rift', name: 'Rift Relic', relic: true },
    { a: 'ember_root', b: 'core', out: 'relic_ember', name: 'Ember Plate', relic: true },
    { a: 'frost_bloom', b: 'spark', out: 'relic_frost', name: 'Frost Lens', relic: true },
    { a: 'life_spine', b: 'ash', out: 'relic_life', name: 'Life Loom', relic: true },
    { a: 'void_shard', b: 'echo', out: 'relic_void', name: 'Void Crown', relic: true },
    { a: 'ember_root', b: 'frost_bloom', out: 'relic_tempest', name: 'Tempest Heart', relic: true },
    { a: 'life_spine', b: 'void_shard', out: 'relic_anchor', name: 'Anchor Sigil', relic: true }
  ],
  RELICS: {
    relic_rift: { dmg: 0.25, label: '+25% damage' },
    relic_ember: { burn: 0.15, label: 'Burn aura' },
    relic_frost: { slow: 0.2, label: 'Slow field' },
    relic_life: { heal: 0.12, regen: 6, label: 'Core mend' },
    relic_void: { dmg: 0.4, label: '+40% void damage' },
    relic_tempest: { dmg: 0.15, slow: 0.1, burn: 0.1, label: 'Storm dual' },
    relic_anchor: { armor: 0.1, phoenix: 1, label: 'Second life' }
  },
  STORY: [
    { id: 0, title: 'IMPACT', body: 'Thrown back. Three seats. One Chronolith. Hold it or the timeline eats you.' },
    { id: 1, title: 'FIRST FIRE', body: 'Stone age holds. The forge wakes. Something on Cinder Reach answers the heat.' },
    { id: 2, title: 'BRONZE PACT', body: 'Tribes follow your light. Jamie holds the line. Aden cuts. Edward mends.' },
    { id: 3, title: 'IRON LAW', body: 'Walls remember every death. The swarm brings a champion — roles or ruin.' },
    { id: 4, title: 'THUNDER', body: 'Powder era. Planets open wider. Exotics rewrite the tree.' },
    { id: 5, title: 'NEON HYMN', body: 'The Chronolith sings your names. Home is close. Oblivion is closer.' },
    { id: 6, title: 'VOID CHOICE', body: 'Stabilize the last era. Crown the Anchor. Or keep going.' }
  ],
  /* Expanded constellation */
  TREE: [
    { id: 'root', name: 'ANCHOR', desc: 'Awaken in deep time.', x: 300, y: 36, cost: 0, req: [], role: 'any', stats: {} },
    /* Bulwark left */
    { id: 'b1', name: 'IRON SKIN', desc: 'Core −12% damage taken.', x: 120, y: 110, cost: 1, req: ['root'], role: 'bulwark', stats: { armor: 0.12 } },
    { id: 'b2', name: 'TAUNT PULSE', desc: 'Pull swarm toward core.', x: 70, y: 190, cost: 1, req: ['b1'], role: 'bulwark', stats: { taunt: 1 } },
    { id: 'b3', name: 'BASTION', desc: '+80 starting shield.', x: 120, y: 270, cost: 2, req: ['b2'], role: 'bulwark', stats: { shield: 80 } },
    { id: 'b4', name: 'RALLY', desc: 'Allies +8% armor aura.', x: 60, y: 350, cost: 2, req: ['b3'], role: 'bulwark', stats: { armor: 0.08, aura: 0.05 } },
    { id: 'b5', name: 'EARTHQUAKE', desc: 'KEYSTONE: Stomp stuns near core.', x: 120, y: 440, cost: 3, req: ['b4'], role: 'bulwark', stats: { quake: 1 }, keystone: true },
    { id: 'b6', name: 'TITAN BLOOD', desc: 'KEYSTONE: Core max HP +35%.', x: 40, y: 520, cost: 4, req: ['b5'], role: 'bulwark', stats: { armor: 0.1, coreMult: 0.35 }, keystone: true },
    /* Rift center */
    { id: 'r1', name: 'ARC BOLT', desc: '+18% damage.', x: 300, y: 110, cost: 1, req: ['root'], role: 'rift', stats: { dmg: 0.18 } },
    { id: 'r2', name: 'CHAIN', desc: 'Bolts jump +2 targets.', x: 300, y: 190, cost: 1, req: ['r1'], role: 'rift', stats: { chain: 2 } },
    { id: 'r3', name: 'OVERCHARGE', desc: 'Crit +20%.', x: 300, y: 270, cost: 2, req: ['r2'], role: 'rift', stats: { crit: 0.2 } },
    { id: 'r4', name: 'PIERCE', desc: 'Boss damage +25%.', x: 260, y: 350, cost: 2, req: ['r3'], role: 'rift', stats: { bossDmg: 0.25 } },
    { id: 'r5', name: 'TIMELINE CUT', desc: 'KEYSTONE: Freeze wave 1.5s.', x: 300, y: 440, cost: 3, req: ['r4'], role: 'rift', stats: { freeze: 1.5 }, keystone: true },
    { id: 'r6', name: 'SINGULARITY', desc: 'KEYSTONE: Ult hits all enemies.', x: 340, y: 520, cost: 4, req: ['r5'], role: 'rift', stats: { dmg: 0.2, nova: 1 }, keystone: true },
    /* Warden right */
    { id: 'w1', name: 'MEND', desc: 'Regen core +8/s.', x: 480, y: 110, cost: 1, req: ['root'], role: 'warden', stats: { regen: 8 } },
    { id: 'w2', name: 'CLEANSE', desc: 'Purge burn stacks.', x: 530, y: 190, cost: 1, req: ['w1'], role: 'warden', stats: { cleanse: 1 } },
    { id: 'w3', name: 'AURA', desc: 'Allies +10% damage near core.', x: 480, y: 270, cost: 2, req: ['w2'], role: 'warden', stats: { aura: 0.1 } },
    { id: 'w4', name: 'BEACON', desc: 'Heal pulses +40.', x: 540, y: 350, cost: 2, req: ['w3'], role: 'warden', stats: { heal: 0.2, regen: 4 } },
    { id: 'w5', name: 'PHOENIX LINK', desc: 'KEYSTONE: Once/run refuse death.', x: 480, y: 440, cost: 3, req: ['w4'], role: 'warden', stats: { phoenix: 1 }, keystone: true },
    { id: 'w6', name: 'TIME SUTURE', desc: 'KEYSTONE: Slow field +25%.', x: 560, y: 520, cost: 4, req: ['w5'], role: 'warden', stats: { slow: 0.25, regen: 6 }, keystone: true },
    /* Cross / utility */
    { id: 'x1', name: 'FUSION SIGHT', desc: 'Better merge luck.', x: 200, y: 320, cost: 2, req: ['b3', 'r3'], role: 'any', stats: { mergeLuck: 1 } },
    { id: 'x2', name: 'GATE WALKER', desc: 'Extract +25% yield.', x: 400, y: 320, cost: 2, req: ['r3', 'w3'], role: 'any', stats: { extract: 0.25 } },
    { id: 'x3', name: 'WARBAND LINK', desc: 'Co-op aura +12%.', x: 300, y: 380, cost: 3, req: ['x1', 'x2'], role: 'any', stats: { aura: 0.12, coopPower: 0.12 } },
    { id: 'x4', name: 'CHRONO GREED', desc: '+20% chrono from waves.', x: 220, y: 500, cost: 2, req: ['x1'], role: 'any', stats: { chronoGain: 0.2 } },
    { id: 'x5', name: 'DEEP NET', desc: 'Fishing / garden yields up.', x: 380, y: 500, cost: 2, req: ['x2'], role: 'any', stats: { lifeYield: 0.3 } },
    { id: 'x6', name: 'ERA BREAKER', desc: 'KEYSTONE: Boss gates −1 requirement.', x: 300, y: 580, cost: 5, req: ['x3', 'b5', 'r5', 'w5'], role: 'any', stats: { gateBreak: 1 }, keystone: true }
  ],
  TOWER_UPS: [
    { id: 'damage', name: 'STRIKE', base: 25 },
    { id: 'rate', name: 'CADENCE', base: 40 },
    { id: 'core', name: 'CORE HP', base: 35 },
    { id: 'range', name: 'REACH', base: 45 },
    { id: 'luck', name: 'SPOILS', base: 50 }
  ],
  FISH: [
    { id: 'minnow', name: 'Chrono Minnow', chrono: 6, weight: 40 },
    { id: 'scale', name: 'Era Scale', shard: 'spark', weight: 25 },
    { id: 'relicfish', name: 'Anchor Koi', chrono: 25, essence: 1, weight: 8 },
    { id: 'boot', name: 'Wet Boot', chrono: 2, weight: 27 }
  ],
  ROOM_ID: 'voidline-chronos'
};
