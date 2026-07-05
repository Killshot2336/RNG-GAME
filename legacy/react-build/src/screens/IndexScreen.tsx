import { useMemo } from 'react'
import { LiftableCard } from '@/components/LiftableCard'
import { NeonCard } from '@/components/NeonCard'
import { StrainCard } from '@/components/StrainCard'
import { useGameStore } from '@/store/gameStore'
import { proceduralGridLayout } from '@/utils/strainGenerator'

export function IndexScreen() {
  const strains = useGameStore((s) => s.strains)
  const focusedStrainId = useGameStore((s) => s.focusedStrainId)
  const setFocusedStrain = useGameStore((s) => s.setFocusedStrain)
  const upgradeStrain = useGameStore((s) => s.upgradeStrain)
  const giftStrain = useGameStore((s) => s.giftStrain)

  const layout = useMemo(
    () => proceduralGridLayout(strains, strains.length * 1337 + 42),
    [strains],
  )

  const focused = strains.find((s) => s.id === focusedStrainId)

  return (
    <div className="space-y-4 pb-4">
      <NeonCard variant="green" className="p-4 text-center">
        <div className="text-[0.55rem] text-[#22C55E] tracking-[0.3em] mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
          STRAIN INDEX
        </div>
        <div className="text-3xl font-bold chromatic-text" style={{ fontFamily: 'var(--font-display)' }}>
          {strains.length}
        </div>
        <div className="text-[#A78BFA] text-xs mt-1">Tap any card to lift · zero bag limit</div>
      </NeonCard>

      {strains.length === 0 ? (
        <NeonCard className="p-6 text-center">
          <div className="text-3xl mb-2 opacity-50">🌿</div>
          <div className="text-sm text-[#A78BFA]">No strains yet.</div>
          <div className="text-xs text-[#A78BFA]/60 mt-1">Open mystery packs in the Shop tab.</div>
        </NeonCard>
      ) : (
        <>
          <div
            className="relative rounded-2xl overflow-hidden holographic-grid"
            style={{
              height: '280px',
              background: 'linear-gradient(180deg, rgba(31,0,51,0.6) 0%, rgba(12,1,26,0.9) 100%)',
              border: '1px solid rgba(61,0,102,0.6)',
            }}
          >
            <div className="absolute inset-0 holographic-grid-lines pointer-events-none" />
            {layout.map((pos) => {
              const strain = strains.find((s) => s.id === pos.strainId)
              if (!strain) return null
              const isFocused = focusedStrainId === strain.id
              return (
                <button
                  key={strain.id}
                  type="button"
                  onClick={() => setFocusedStrain(strain.id)}
                  className={`absolute transition-all duration-300 ${isFocused ? 'z-20 scale-110' : 'z-10 hover:z-15'}`}
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: `translate(-50%, -50%) rotate(${pos.rot}deg) scale(${pos.scale})`,
                  }}
                >
                  <div
                    className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center text-center p-1 ${
                      isFocused ? 'ring-2 ring-[#22C55E]' : ''
                    }`}
                    style={{
                      background: `linear-gradient(135deg, hsl(${strain.hue}, 50%, 18%) 0%, rgba(31,0,51,0.9) 100%)`,
                      border: '1px solid rgba(168,85,247,0.4)',
                      boxShadow: isFocused ? '0 0 20px rgba(57,255,20,0.4)' : undefined,
                    }}
                  >
                    <span className="text-lg" style={{ filter: `hue-rotate(${strain.hue}deg)` }}>🌿</span>
                    <span className="text-[0.4rem] text-[#22C55E] font-bold truncate w-full" style={{ fontFamily: 'var(--font-mono)' }}>
                      x{strain.quantity}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="space-y-2">
            {strains.map((strain) => (
              <LiftableCard
                key={strain.id}
                id={`index-${strain.id}`}
                onUpgrade={() => upgradeStrain(strain.id)}
                onTrade={() => giftStrain(strain.id, 'dad')}
              >
                <StrainCard
                  strain={strain}
                  selected={focusedStrainId === strain.id}
                  onClick={() => setFocusedStrain(strain.id === focusedStrainId ? null : strain.id)}
                />
              </LiftableCard>
            ))}
          </div>

          {focused && (
            <div className="p-3 text-center text-[0.6rem] text-[#06B6D4] rounded-2xl border border-[rgba(6,182,212,0.3)] bg-[rgba(31,0,51,0.5)]" style={{ fontFamily: 'var(--font-mono)' }}>
              FOCUSED: {focused.name} · TH-C {focused.thcPercent}% · x{focused.quantity} Held
            </div>
          )}
        </>
      )}
    </div>
  )
}
