import { useGameStore } from '@/store/gameStore'
import type { GameState } from '@/types/game'

const SAVE_KEY = 'voidline_galaxy_farm_v1'

const PERSIST_KEYS: (keyof GameState)[] = [
  'cash', 'sp', 'empireLevel', 'empireXp', 'name', 'avatar', 'badgeIds',
  'storefrontSlots', 'strains', 'inventory', 'factoryFloors', 'sectorUpgrades',
  'blitzUpgrades', 'blitzEndsAt', 'purchasedBlitzIds', 'planetOffers',
  'counterPrices', 'cloneJob', 'focusedStrainId', 'farmSubTab',
]

export function pickPersistedState(state: GameState): Partial<GameState> {
  const partial: Partial<GameState> = {}
  for (const key of PERSIST_KEYS) {
    ;(partial as Record<string, unknown>)[key] = state[key]
  }
  return partial
}

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(pickPersistedState(state)))
  } catch {
    /* quota or private mode */
  }
}

export function loadGameState(): Partial<GameState> | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<GameState>
  } catch {
    return null
  }
}

export function initPersistence(): () => void {
  const saved = loadGameState()
  if (saved) useGameStore.getState().hydrateState(saved)

  let timeout: ReturnType<typeof setTimeout> | null = null
  const unsub = useGameStore.subscribe((state) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => saveGameState(state), 800)
  })

  return unsub
}
