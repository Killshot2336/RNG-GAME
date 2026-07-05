import { LiftableCard } from '@/components/LiftableCard'
import { NeonCard } from '@/components/NeonCard'

const PLOTS = [
  { id: 'alpha', name: 'Alpha Sector', crop: 'Void Wheat', progress: 78, status: 'GROWING' },
  { id: 'beta', name: 'Beta Nebula', crop: 'Plasma Corn', progress: 100, status: 'HARVEST' },
  { id: 'gamma', name: 'Gamma Ridge', crop: 'Dark Matter Beans', progress: 34, status: 'GROWING' },
]

export function FarmScreen() {
  return (
    <div className="space-y-4 pb-4">
      {/* Boss / weekly objective banner */}
      <NeonCard className="p-4 overflow-visible">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-3xl">👾</div>
          <div>
            <div className="text-[0.55rem] text-[#A78BFA] tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
              WEEKLY BOSS
            </div>
            <div className="font-bold text-sm chromatic-text" style={{ fontFamily: 'var(--font-display)' }}>
              The Null Harvester
            </div>
          </div>
        </div>
        <div className="h-3 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: '42%',
              background: 'linear-gradient(90deg, #ff0050, #A855F7, #39FF14)',
              boxShadow: '0 0 12px rgba(255,0,80,0.5)',
            }}
          />
        </div>
        <div className="flex justify-between text-[0.6rem]" style={{ fontFamily: 'var(--font-mono)' }}>
          <span className="text-[#ff0050]">26 / 63 HP</span>
          <span className="text-[#A78BFA]">4d 12h left</span>
        </div>
      </NeonCard>

      <div className="text-[0.65rem] text-[#A78BFA] text-center tracking-widest uppercase" style={{ fontFamily: 'var(--font-mono)' }}>
        Active Plots — tap to manage
      </div>

      <div className="grid gap-3">
        {PLOTS.map((plot) => (
          <LiftableCard key={plot.id} id={`plot-${plot.id}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-semibold text-sm">{plot.name}</div>
                <div className="text-[#A78BFA] text-xs">{plot.crop}</div>
              </div>
              <span
                className="text-[0.55rem] px-2 py-1 rounded-md font-bold tracking-wider"
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: plot.status === 'HARVEST' ? 'rgba(57,255,20,0.15)' : 'rgba(168,85,247,0.15)',
                  color: plot.status === 'HARVEST' ? '#39FF14' : '#A855F7',
                  border: `1px solid ${plot.status === 'HARVEST' ? 'rgba(57,255,20,0.4)' : 'rgba(168,85,247,0.4)'}`,
                }}
              >
                {plot.status}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(31,0,51,0.8)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${plot.progress}%`,
                  background: plot.progress === 100
                    ? 'linear-gradient(90deg, #39FF14, #22C55E)'
                    : 'linear-gradient(90deg, #A855F7, #3D0066)',
                }}
              />
            </div>
            <div className="text-right text-[0.55rem] text-[#A78BFA] mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
              {plot.progress}%
            </div>
          </LiftableCard>
        ))}
      </div>
    </div>
  )
}
