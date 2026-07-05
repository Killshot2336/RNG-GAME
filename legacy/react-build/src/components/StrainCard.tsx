import type { CSSProperties } from 'react'
import type { Strain } from '@/types/game'
import { RARITY_COLORS } from '@/utils/format'

interface StrainCardProps {
  strain: Strain
  compact?: boolean
  selected?: boolean
  onClick?: () => void
}

export function StrainCard({ strain, compact, selected, onClick }: StrainCardProps) {
  const color = RARITY_COLORS[strain.rarity] ?? '#A855F7'
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`relative rounded-xl overflow-hidden text-left w-full transition-transform ${
        onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
      } ${selected ? 'ring-2 ring-[#39FF14]' : ''}`}
      style={{
        background: `linear-gradient(135deg, hsl(${strain.hue}, 50%, 12%) 0%, rgba(31,0,51,0.8) 100%)`,
        border: `1px solid ${color}55`,
        boxShadow: selected ? `0 0 20px ${color}44` : undefined,
      }}
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none holographic-sheen"
        style={{ '--strain-hue': `${strain.hue}deg` } as CSSProperties}
      />
      <div className={`relative z-10 ${compact ? 'p-2' : 'p-3'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[0.5rem] tracking-widest mb-0.5" style={{ color, fontFamily: 'var(--font-mono)' }}>
              {strain.rarity.toUpperCase()}
            </div>
            <div className={`font-semibold truncate ${compact ? 'text-xs' : 'text-sm'}`}>{strain.name}</div>
          </div>
          {!compact && (
            <div className="text-2xl shrink-0" style={{ filter: `hue-rotate(${strain.hue}deg)` }}>🌿</div>
          )}
        </div>
        <div className={`flex gap-3 ${compact ? 'mt-1' : 'mt-2'} text-[0.55rem]`} style={{ fontFamily: 'var(--font-mono)' }}>
          <span className="text-[#39FF14]">TH-C {strain.thcPercent}%</span>
          <span className="text-[#A78BFA]">YLD {strain.yield}</span>
          <span className="text-[#00F0FF]">x{strain.quantity}</span>
        </div>
      </div>
    </Tag>
  )
}
