import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'
import { PLAYER } from '@/components/PlayerCardHUD'

export function PlayerProfileModal() {
  const open = useUIStore((s) => s.profileOpen)
  const closeProfile = useUIStore((s) => s.closeProfile)
  const toggleSettings = useUIStore((s) => s.toggleSettings)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeProfile()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeProfile])

  if (!open) return null

  const xpPct = Math.round((PLAYER.xp / PLAYER.xpMax) * 100)

  return (
    <div
      className="fixed inset-0 z-[8000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Player profile"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        onClick={closeProfile}
        aria-label="Close profile"
      />

      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden animate-[cosmic-float_0.5s_ease-out]"
        style={{
          background: 'rgba(15, 0, 28, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(168, 85, 247, 0.5)',
          boxShadow: '0 0 60px rgba(168, 85, 247, 0.3), 0 24px 48px rgba(0,0,0,0.6)',
        }}
      >
        {/* Hero banner */}
        <div
          className="relative h-32 overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #3D0066 0%, #0B001A 40%, #1a0040 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(57,255,20,0.3) 0%, transparent 50%)',
          }} />
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
            <div className="relative w-20 h-20">
              <div className="avatar-ring" />
              <div
                className="absolute inset-1 rounded-full flex items-center justify-center text-3xl"
                style={{
                  background: 'linear-gradient(135deg, #1F0033, #0B001A)',
                  border: '3px solid #A855F7',
                  boxShadow: '0 0 24px rgba(168,85,247,0.6)',
                }}
              >
                🌌
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={closeProfile}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-[#A78BFA] hover:text-white transition-colors"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(168,85,247,0.3)' }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="pt-12 px-6 pb-6 text-center">
          <h2
            className="chromatic-text text-xl tracking-wide mb-0.5"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {PLAYER.name}
          </h2>
          <p className="text-[#A78BFA] text-sm mb-1">{PLAYER.title}</p>
          <p className="text-[0.65rem] text-[#A78BFA]/70 mb-5" style={{ fontFamily: 'var(--font-mono)' }}>
            {PLAYER.clan}
          </p>

          {/* XP bar */}
          <div className="mb-5 text-left">
            <div className="flex justify-between text-[0.65rem] mb-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
              <span className="text-[#A78BFA]">XP PROGRESS</span>
              <span className="text-[#39FF14]">{PLAYER.xp.toLocaleString()} / {PLAYER.xpMax.toLocaleString()}</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(31,0,51,0.8)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${xpPct}%`,
                  background: 'linear-gradient(90deg, #A855F7, #39FF14)',
                  boxShadow: '0 0 12px rgba(57,255,20,0.5)',
                }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { label: 'LEVEL', value: PLAYER.level, color: '#39FF14' },
              { label: 'CREDITS', value: PLAYER.credits, color: '#A855F7' },
              { label: 'RANK', value: '#12', color: '#00F0FF' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="neon-card py-3 px-2 rounded-xl"
                style={{ animation: 'none', boxShadow: `0 0 12px ${stat.color}33` }}
              >
                <div className="text-[0.5rem] text-[#A78BFA] tracking-widest mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
                  {stat.label}
                </div>
                <div className="text-sm font-bold" style={{ color: stat.color, fontFamily: 'var(--font-display)' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button type="button" className="game-btn flex-1" onClick={toggleSettings}>
              ⚙ SETTINGS
            </button>
            <button type="button" className="game-btn game-btn-green flex-1" onClick={closeProfile}>
              RESUME
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
