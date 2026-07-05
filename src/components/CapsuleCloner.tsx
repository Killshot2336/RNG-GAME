import { useState } from 'react'
import { NeonCard } from '@/components/NeonCard'
import type { CloneJob, Strain } from '@/types/game'
import { formatCountdown } from '@/utils/format'

interface CapsuleClonerProps {
  strains: Strain[]
  cloneJob: CloneJob | null
  cloneRemainingMs: number
  onStartClone: (strainId: string) => boolean
}

export function CapsuleCloner({ strains, cloneJob, cloneRemainingMs, onStartClone }: CapsuleClonerProps) {
  const [selected, setSelected] = useState('')
  const activeStrain = cloneJob ? strains.find((s) => s.id === cloneJob.strainId) : null

  return (
    <div
      className="capsule-cloner-wrapper relative"
      style={
        activeStrain
          ? {
              background: `linear-gradient(135deg, hsl(${activeStrain.hue}, 45%, 12%) 0%, rgba(31,0,51,0.85) 100%)`,
              borderRadius: '1rem',
            }
          : undefined
      }
    >
    <NeonCard className="p-4 relative overflow-hidden capsule-cloner bg-transparent border-0 shadow-none">
      <div className="clone-bubbles pointer-events-none" />
      <div className="text-[0.55rem] text-[#A78BFA] tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
        CAPSULE CLONER
      </div>

      {cloneJob ? (
        <div className="text-center py-4 clone-active-card">
          <div className="text-4xl mb-2 animate-[cosmic-float_1.5s_ease-in-out_infinite]">🧬</div>
          <div className="text-lg font-bold text-[#22C55E]" style={{ fontFamily: 'var(--font-mono)' }}>
            {formatCountdown(cloneRemainingMs)}
          </div>
          <div className="text-xs text-[#A78BFA] mt-1">
            Cloning {activeStrain?.name ?? 'strain'}...
          </div>
        </div>
      ) : (
        <>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-xs bg-[rgba(0,0,0,0.4)] border border-[rgba(61,0,102,0.6)] text-white outline-none focus:border-[#EC4899] mb-3"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <option value="">— Select strain to clone —</option>
            {strains.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            type="button"
            className="game-btn game-btn-green w-full"
            disabled={!selected}
            onClick={() => {
              if (onStartClone(selected)) setSelected('')
            }}
          >
            START CLONE (+1 on complete)
          </button>
        </>
      )}
    </NeonCard>
    </div>
  )
}
