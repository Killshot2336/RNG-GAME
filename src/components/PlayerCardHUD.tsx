import { useUIStore } from '@/store/uiStore'

const PLAYER = {
  name: 'VoidPilot_Aden',
  level: 47,
  title: 'Galactic Harvester',
  xp: 8420,
  xpMax: 10000,
  credits: '1.2M',
  clan: 'Nebula Syndicate',
}

export function PlayerCardHUD() {
  const openProfile = useUIStore((s) => s.openProfile)

  return (
    <button
      type="button"
      onClick={openProfile}
      className="profile-ribbon relative flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full cursor-pointer transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
      aria-label="Open player profile"
    >
      {/* Animated avatar */}
      <div className="relative w-10 h-10 shrink-0">
        <div className="avatar-ring" />
        <div
          className="absolute inset-0.5 rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #3D0066 0%, #0B001A 50%, #1a0040 100%)',
            border: '2px solid rgba(168, 85, 247, 0.5)',
          }}
        >
          <svg viewBox="0 0 40 40" className="w-full h-full">
            <defs>
              <linearGradient id="avatarGrad" x1="0" y1="0" x2="40" y2="40">
                <stop stopColor="#A855F7" />
                <stop offset="1" stopColor="#39FF14" />
              </linearGradient>
            </defs>
            <circle cx="20" cy="16" r="8" fill="url(#avatarGrad)" opacity="0.9" />
            <ellipse cx="20" cy="34" rx="12" ry="8" fill="url(#avatarGrad)" opacity="0.7" />
            <circle cx="17" cy="15" r="1.5" fill="#0B001A" />
            <circle cx="23" cy="15" r="1.5" fill="#0B001A" />
          </svg>
        </div>
      </div>

      <div className="flex flex-col items-start min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[0.65rem] font-bold tracking-wide truncate max-w-[100px] sm:max-w-[140px]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {PLAYER.name}
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
            LV.{PLAYER.level}
          </span>
        </div>
        <span
          className="text-[0.55rem] text-[#A78BFA] tracking-wider uppercase"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {PLAYER.title}
        </span>
      </div>
    </button>
  )
}

export { PLAYER }
