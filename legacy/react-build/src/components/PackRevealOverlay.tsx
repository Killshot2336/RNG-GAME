import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import { RARITY_COLORS } from '@/utils/format'

export function PackRevealOverlay() {
  const packReveal = useGameStore((s) => s.packReveal)
  const closePackReveal = useGameStore((s) => s.closePackReveal)

  useEffect(() => {
    if (!packReveal.open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closePackReveal()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [packReveal.open, closePackReveal])

  if (!packReveal.open || !packReveal.strain) return null

  const strain = packReveal.strain
  const color = RARITY_COLORS[strain.rarity] ?? '#A855F7'

  return (
    <div className="fixed inset-0 z-[7500] flex items-center justify-center p-4 pack-reveal-bg">
      <button
        type="button"
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={closePackReveal}
        aria-label="Close pack reveal"
      />

      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden pack-reveal-card"
        style={{
          background: `linear-gradient(160deg, hsl(${strain.hue}, 60%, 15%) 0%, #0C011A 50%, #1a0040 100%)`,
          border: `2px solid ${color}`,
          boxShadow: `0 0 60px ${color}66, 0 24px 48px rgba(0,0,0,0.8)`,
        }}
      >
        <div className="absolute inset-0 pack-reveal-shimmer pointer-events-none" />

        <div className="relative p-8 text-center">
          <div className="text-[0.6rem] tracking-[0.4em] text-[#A78BFA] mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
            {packReveal.packType?.toUpperCase()} PACK OPENED
          </div>

          <div
            className="text-6xl mb-4 animate-[cosmic-float_2s_ease-in-out_infinite]"
            style={{ filter: `hue-rotate(${strain.hue}deg)` }}
          >
            🌿
          </div>

          <h2 className="text-xl chromatic-text mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            {strain.name}
          </h2>

          <div
            className="text-[0.65rem] tracking-widest mb-4 font-bold"
            style={{ color, fontFamily: 'var(--font-mono)' }}
          >
            {strain.rarity.toUpperCase()}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { label: 'TH-C', value: `${strain.thcPercent}%` },
              { label: 'YIELD', value: strain.yield },
              { label: 'POTENCY', value: strain.potency },
            ].map((stat) => (
              <div key={stat.label} className="neon-card py-2 px-1 rounded-xl [&]:animate-none">
                <div className="text-[0.45rem] text-[#A78BFA]" style={{ fontFamily: 'var(--font-mono)' }}>{stat.label}</div>
                <div className="text-sm font-bold text-[#39FF14]">{stat.value}</div>
              </div>
            ))}
          </div>

          <button type="button" className="game-btn game-btn-green w-full" onClick={closePackReveal}>
            ADD TO INDEX
          </button>
        </div>
      </div>
    </div>
  )
}
