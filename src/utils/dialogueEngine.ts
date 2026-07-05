const OPENERS = [
  'The void whispers:',
  'Sector scan reports:',
  'Clone matrix says:',
  'Omega Rift echoes:',
  'Nebula feed:',
  'Portal hums:',
] as const

const EVENT_FRAGMENTS = {
  lowCash: ['Your wallet is crying.', 'Revenue streams are thin.', 'Time to equip a portal floor.'],
  highCash: ['Cash reserves look healthy.', 'Empire coffers overflow.', 'You could buy Dad out.'],
  noStrains: ['Index is empty — hit the Shop.', 'No strains catalogued yet.', 'Open a mystery pack.'],
  hasStrains: ['Strains are multiplying.', 'Index registry growing.', 'Catalogue expanding nicely.'],
  cloning: ['Clone matrix stabilizing.', 'Capsule bubbling away.', 'Replication in progress.'],
  blitzActive: ['Blitz Feed window open.', 'Temporary modifiers available.', 'Strike while the rift is hot.'],
  dadAhead: ['Dad is out-earning you.', 'Player_Dad_99 flexes $8.2B/sec.', 'The patriarch leads the syndicate.'],
  focused: ['Active strain demands attention.', 'Focused card pulsing.', 'HUD strain is watching.'],
} as const

const CLOSERS = [
  'Stay sharp, pilot.',
  'The galaxy waits for no one.',
  'Reality is optional.',
  'Harvest or perish.',
  'Voidline never sleeps.',
] as const

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export interface DialogueContext {
  cash: number
  strainCount: number
  cloneActive: boolean
  blitzRemainingMs: number
  focusedStrainName: string | null
  revenuePerSec: number
}

export function generateDialogueLine(ctx: DialogueContext): string {
  const parts: string[] = [pick(OPENERS)]

  if (ctx.cloneActive) parts.push(pick(EVENT_FRAGMENTS.cloning))
  else if (ctx.blitzRemainingMs > 0 && ctx.blitzRemainingMs < 30 * 60 * 1000) {
    parts.push(pick(EVENT_FRAGMENTS.blitzActive))
  } else if (ctx.strainCount === 0) parts.push(pick(EVENT_FRAGMENTS.noStrains))
  else parts.push(pick(EVENT_FRAGMENTS.hasStrains))

  if (ctx.cash < 10000) parts.push(pick(EVENT_FRAGMENTS.lowCash))
  else if (ctx.cash > 500000) parts.push(pick(EVENT_FRAGMENTS.highCash))

  if (ctx.revenuePerSec < 1e6) parts.push(pick(EVENT_FRAGMENTS.dadAhead))
  if (ctx.focusedStrainName) parts.push(`"${ctx.focusedStrainName}" ${pick(EVENT_FRAGMENTS.focused)}`)

  parts.push(pick(CLOSERS))
  return parts.slice(0, 4).join(' ')
}
