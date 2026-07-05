import { NeonCard } from '@/components/NeonCard'
import { LiftableCard } from '@/components/LiftableCard'

const ENTRIES = [
  { id: 'void-wheat', name: 'Void Wheat', category: 'CROP', discovered: true, desc: 'Emits faint purple bioluminescence at maturity.' },
  { id: 'plasma-corn', name: 'Plasma Corn', category: 'CROP', discovered: true, desc: 'Kernels crackle with stored electrical energy.' },
  { id: 'null-seed', name: 'Null Seed', category: 'ARTIFACT', discovered: false, desc: '???' },
  { id: 'harvester-droid', name: 'Harvester Droid', category: 'UNIT', discovered: true, desc: 'Autonomous farm unit. Efficiency: 94%.' },
]

export function IndexScreen() {
  const discovered = ENTRIES.filter((e) => e.discovered).length

  return (
    <div className="space-y-4 pb-4">
      <NeonCard variant="green" className="p-4 text-center">
        <div className="text-[0.55rem] text-[#39FF14] tracking-[0.3em] mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
          COMPENDIUM INDEX
        </div>
        <div className="text-3xl font-bold chromatic-text" style={{ fontFamily: 'var(--font-display)' }}>
          {discovered}/{ENTRIES.length}
        </div>
        <div className="text-[#A78BFA] text-xs mt-1">Entries catalogued</div>
      </NeonCard>

      <div className="space-y-2">
        {ENTRIES.map((entry) => (
          entry.discovered ? (
            <LiftableCard key={entry.id} id={`index-${entry.id}`}>
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                  style={{ background: 'rgba(61,0,102,0.6)', border: '1px solid rgba(168,85,247,0.4)' }}
                >
                  {entry.category === 'CROP' ? '🌾' : entry.category === 'UNIT' ? '🤖' : '💎'}
                </div>
                <div>
                  <div className="text-[0.55rem] text-[#A78BFA] tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
                    {entry.category}
                  </div>
                  <div className="font-semibold text-sm">{entry.name}</div>
                  <div className="text-[#A78BFA]/80 text-xs mt-0.5 leading-relaxed">{entry.desc}</div>
                </div>
              </div>
            </LiftableCard>
          ) : (
            <NeonCard key={entry.id} className="p-4 opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  🔒
                </div>
                <div>
                  <div className="text-sm text-[#A78BFA]">Undiscovered Entry</div>
                  <div className="text-xs text-[#A78BFA]/50" style={{ fontFamily: 'var(--font-mono)' }}>Continue exploring...</div>
                </div>
              </div>
            </NeonCard>
          )
        ))}
      </div>
    </div>
  )
}
