import { useUIStore } from '@/store/uiStore'
import { useGameStore } from '@/store/gameStore'
import { formatCash } from '@/utils/format'

export function PlayerCardHUD() {
  const openProfile = useUIStore((s) => s.openProfile)
  const name = useGameStore((s) => s.name)
  const avatar = useGameStore((s) => s.avatar)
  const empireLevel = useGameStore((s) => s.empireLevel)
  const cash = useGameStore((s) => s.cash)

  return (
    <button
      type="button"
      onClick={openProfile}
      className="profile-ribbon relative flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full cursor-pointer transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
      aria-label="Open player profile"
    >
      <div className="relative w-10 h-10 shrink-0">
        <div className="avatar-ring" />
        <div
          className="absolute inset-0.5 rounded-full overflow-hidden flex items-center justify-center text-lg"
          style={{
            background: 'linear-gradient(135deg, #3D0066 0%, #0B001A 50%, #1a0040 100%)',
            border: '2px solid rgba(168, 85, 247, 0.5)',
          }}
        >
          {avatar}
        </div>
      </div>

      <div className="flex flex-col items-start min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[0.65rem] font-bold tracking-wide truncate max-w-[100px] sm:max-w-[140px]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {name}
          </span>
          <span
            className="shrink-0 text-[0.55rem] font-bold px-1.5 py-0.5 rounded-md"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'linear-gradient(135deg, #39FF14 0%, #22C55E 100%)',
              color: '#0B001A',
              boxShadow: '0 0 10px rgba(57, 255, 20, 0.5)',
            }}
          >
            LV.{empireLevel}
          </span>
        </div>
        <span
          className="text-[0.55rem] text-[#A78BFA] tracking-wider uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {formatCash(cash)}
        </span>
      </div>
    </button>
  )
}
