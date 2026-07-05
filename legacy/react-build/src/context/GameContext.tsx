import { useEffect, type ReactNode } from 'react'
import { useGameStore } from '@/store/gameStore'

const TICK_MS = 50

export function GameTickProvider({ children }: { children: ReactNode }) {
  const tick = useGameStore((s) => s.tick)

  useEffect(() => {
    tick(Date.now())
    const id = window.setInterval(() => tick(Date.now()), TICK_MS)
    return () => window.clearInterval(id)
  }, [tick])

  return <>{children}</>
}

/** GameContext facade — spec-compliant hook over Zustand store */
export function GameProvider({ children }: { children: ReactNode }) {
  return <GameTickProvider>{children}</GameTickProvider>
}

export function useGame() {
  return useGameStore()
}

export { useGameStore }
