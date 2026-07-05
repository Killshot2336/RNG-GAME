import { useUIStore } from '@/store/uiStore'

export function RealityWarpOverlay() {
  const enabled = useUIStore((s) => s.realityWarp)
  if (!enabled) return null
  return <div className="reality-warp-overlay" aria-hidden />
}

export function SettingsPanel() {
  const open = useUIStore((s) => s.settingsOpen)
  const toggleSettings = useUIStore((s) => s.toggleSettings)
  const realityWarp = useUIStore((s) => s.realityWarp)
  const setRealityWarp = useUIStore((s) => s.setRealityWarp)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[8500] flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={toggleSettings}
        aria-label="Close settings"
      />

      <div className="relative w-full max-w-sm neon-card rounded-2xl p-5 mb-2 sm:mb-0">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm tracking-[0.2em]" style={{ fontFamily: 'var(--font-display)' }}>
            SYSTEM CONFIG
          </h3>
          <button type="button" onClick={toggleSettings} className="text-[#A78BFA] hover:text-white text-lg">✕</button>
        </div>

        {/* Reality Warp toggle */}
        <div
          className="flex items-center justify-between p-4 rounded-xl mb-3"
          style={{
            background: realityWarp ? 'rgba(57,255,20,0.08)' : 'rgba(31,0,51,0.5)',
            border: `1px solid ${realityWarp ? 'rgba(57,255,20,0.4)' : 'rgba(61,0,102,0.6)'}`,
          }}
        >
          <div>
            <div className="text-sm font-semibold mb-0.5 chromatic-text">Reality Warp Mode</div>
            <div className="text-[0.65rem] text-[#A78BFA]">Hyper-focus shader overlay</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={realityWarp}
            onClick={() => setRealityWarp(!realityWarp)}
            className="relative w-14 h-7 rounded-full transition-all duration-300 shrink-0"
            style={{
              background: realityWarp
                ? 'linear-gradient(90deg, #39FF14, #A855F7)'
                : 'rgba(61,0,102,0.8)',
              boxShadow: realityWarp ? '0 0 16px rgba(57,255,20,0.5)' : 'none',
            }}
          >
            <span
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
              style={{ left: realityWarp ? 'calc(100% - 1.625rem)' : '0.125rem' }}
            />
          </button>
        </div>

        <p className="text-[0.6rem] text-[#A78BFA]/60 leading-relaxed" style={{ fontFamily: 'var(--font-mono)' }}>
          Applies vignette, chromatic aberration, and rhythmic contrast breathing across the entire frame.
        </p>
      </div>
    </div>
  )
}
