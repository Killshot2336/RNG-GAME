import { NeonCard } from '@/components/NeonCard'
import type { FactoryFloor, Strain } from '@/types/game'

interface ConveyorFloorProps {
  floor: FactoryFloor
  strains: Strain[]
  onEquip: (floorId: string, strainId: string | null) => void
}

export function ConveyorFloor({ floor, strains, onEquip }: ConveyorFloorProps) {
  const equipped = strains.find((s) => s.id === floor.equippedStrainId)

  return (
    <NeonCard className="p-4 overflow-visible">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-sm">{floor.name}</div>
          <div className="text-[0.55rem] text-[#A78BFA]">Floor Lv.{floor.level}</div>
        </div>
        {equipped && (
          <div className="text-[0.55rem] text-[#22C55E]" style={{ fontFamily: 'var(--font-mono)' }}>
            {equipped.name}
          </div>
        )}
      </div>

      <div className="conveyor-belt mb-3 rounded-lg overflow-hidden h-10 relative">
        <div className="conveyor-track" />
        {equipped && (
          <div
            className="conveyor-item absolute top-1/2 -translate-y-1/2 text-lg"
            style={{ filter: `hue-rotate(${equipped.hue}deg)` }}
          >
            🌿
          </div>
        )}
      </div>

      <select
        value={floor.equippedStrainId ?? ''}
        onChange={(e) => onEquip(floor.id, e.target.value || null)}
        className="w-full px-3 py-2 rounded-lg text-xs bg-[rgba(0,0,0,0.4)] border border-[rgba(61,0,102,0.6)] text-white outline-none focus:border-[#22C55E]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        <option value="">— Select strain from Index —</option>
        {strains.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} (x{s.quantity})
          </option>
        ))}
      </select>
    </NeonCard>
  )
}
