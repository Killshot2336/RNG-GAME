import { useUIStore } from '@/store/uiStore'
import { NAV_ITEMS } from '@/components/icons/NavIcons'

export function BottomNav() {
  const activeTab = useUIStore((s) => s.activeTab)
  const setActiveTab = useUIStore((s) => s.setActiveTab)

  return (
    <nav
      className="relative z-40 shrink-0 mx-3 mb-3 rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(15, 0, 30, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(61, 0, 102, 0.8)',
        boxShadow: '0 -4px 32px rgba(168, 85, 247, 0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#A855F7] to-transparent opacity-60" />

      <ul className="grid grid-cols-4 gap-0 py-2 px-1">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => setActiveTab(id)}
                className={`w-full flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all duration-300 ${
                  isActive ? 'nav-tab-active bg-[rgba(57,255,20,0.06)]' : 'text-[#A78BFA] hover:text-[#C4B5FD]'
                }`}
              >
                <Icon active={isActive} />
                <span
                  className="font-[family-name:var(--font-display)] text-[0.58rem] tracking-[0.18em] font-normal"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-[#39FF14] shadow-[0_0_8px_#39FF14]" />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
