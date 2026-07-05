import type { NavTab } from '@/store/uiStore'

interface NavIconProps {
  active?: boolean
  className?: string
}

export function ShopIcon({ active, className = '' }: NavIconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={`w-7 h-7 ${className}`} aria-hidden>
      <path
        className="nav-icon-ring"
        d="M6 12 L16 4 L26 12 V26 H6 Z"
        stroke={active ? '#39FF14' : '#A78BFA'}
        strokeWidth="1.5"
        fill={active ? 'rgba(57,255,20,0.12)' : 'rgba(168,85,247,0.08)'}
      />
      <rect x="12" y="18" width="8" height="8" rx="1" stroke={active ? '#39FF14' : '#A855F7'} strokeWidth="1.2" fill="none" />
      <path d="M16 4 V8" stroke={active ? '#39FF14' : '#A855F7'} strokeWidth="1.2" />
    </svg>
  )
}

export function FarmIcon({ active, className = '' }: NavIconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={`w-7 h-7 ${className}`} aria-hidden>
      <circle cx="16" cy="16" r="10" className="nav-icon-ring" stroke={active ? '#39FF14' : '#A78BFA'} strokeWidth="1.5" fill={active ? 'rgba(57,255,20,0.1)' : 'rgba(168,85,247,0.06)'} />
      <path d="M16 8 C12 12, 12 16, 16 20 C20 16, 20 12, 16 8" fill={active ? '#39FF14' : '#A855F7'} opacity="0.85" />
      <ellipse cx="16" cy="22" rx="6" ry="2" stroke={active ? '#39FF14' : '#A855F7'} strokeWidth="1" fill="none" opacity="0.6" />
    </svg>
  )
}

export function IndexIcon({ active, className = '' }: NavIconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={`w-7 h-7 ${className}`} aria-hidden>
      <rect x="6" y="4" width="20" height="24" rx="2" className="nav-icon-ring" stroke={active ? '#39FF14' : '#A78BFA'} strokeWidth="1.5" fill={active ? 'rgba(57,255,20,0.08)' : 'rgba(168,85,247,0.06)'} />
      <path d="M10 10 H22 M10 16 H22 M10 22 H18" stroke={active ? '#39FF14' : '#A855F7'} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function ClanIcon({ active, className = '' }: NavIconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={`w-7 h-7 ${className}`} aria-hidden>
      <path
        className="nav-icon-ring"
        d="M16 4 L28 10 V22 L16 28 L4 22 V10 Z"
        stroke={active ? '#39FF14' : '#A78BFA'}
        strokeWidth="1.5"
        fill={active ? 'rgba(57,255,20,0.1)' : 'rgba(168,85,247,0.06)'}
      />
      <path d="M16 10 L22 13.5 V20.5 L16 24 L10 20.5 V13.5 Z" stroke={active ? '#39FF14' : '#A855F7'} strokeWidth="1.2" fill="none" />
      <circle cx="16" cy="16" r="2.5" fill={active ? '#39FF14' : '#A855F7'} />
    </svg>
  )
}

export const NAV_ITEMS: { id: NavTab; label: string; emoji: string; Icon: typeof ShopIcon }[] = [
  { id: 'shop', label: 'SHOP', emoji: '🏪', Icon: ShopIcon },
  { id: 'farm', label: 'FARM', emoji: '🚜', Icon: FarmIcon },
  { id: 'index', label: 'INDEX', emoji: '📖', Icon: IndexIcon },
  { id: 'clan', label: 'CLAN', emoji: '🛡️', Icon: ClanIcon },
]
