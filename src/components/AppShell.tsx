import type { ReactNode } from 'react'
import { useUIStore } from '@/store/uiStore'
import { BottomNav } from '@/components/BottomNav'
import { PlayerCardHUD } from '@/components/PlayerCardHUD'
import { PlayerProfileModal } from '@/components/PlayerProfileModal'
import { RealityWarpOverlay, SettingsPanel } from '@/components/RealityWarpOverlay'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const realityWarp = useUIStore((s) => s.realityWarp)
  const backdropDimmed = useUIStore((s) => s.backdropDimmed)

  return (
    <div className={`h-full w-full flex items-center justify-center ${realityWarp ? 'reality-warp-active' : ''}`}>
      {/* Desktop ambient glow behind phone frame */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(61,0,102,0.25) 0%, #050010 70%)',
        }}
      />

      {/* Phone frame container */}
      <div
        className="relative void-bg flex flex-col w-full h-full sm:h-[92vh] sm:max-h-[900px] sm:max-w-xl sm:rounded-[2rem] overflow-hidden"
        style={{
          boxShadow: '0 0 80px rgba(168, 85, 247, 0.2), 0 0 0 1px rgba(61, 0, 102, 0.5)',
          transition: 'filter 0.35s ease',
          filter: backdropDimmed ? 'brightness(0.4)' : undefined,
        }}
      >
        {/* Top HUD bar */}
        <header className="relative z-30 shrink-0 flex items-center justify-between px-4 py-3">
          <div className="flex flex-col">
            <span
              className="text-[0.55rem] tracking-[0.35em] text-[#A78BFA]/70 uppercase"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Voidline
            </span>
            <span
              className="text-sm tracking-[0.15em] chromatic-text leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              GALAXY FARM
            </span>
          </div>
          <PlayerCardHUD />
        </header>

        {/* Main scrollable content */}
        <main className="relative z-20 flex-1 overflow-y-auto overflow-x-hidden void-scroll px-4 pb-2">
          {children}
        </main>

        <BottomNav />

        <RealityWarpOverlay />
      </div>

      <PlayerProfileModal />
      <SettingsPanel />
    </div>
  )
}
