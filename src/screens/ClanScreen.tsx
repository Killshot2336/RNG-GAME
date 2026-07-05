import { NeonCard } from '@/components/NeonCard'

const MEMBERS = [
  { name: 'VoidPilot_Aden', level: 47, role: 'LEADER', online: true },
  { name: 'Nebula_Edward', level: 39, role: 'OFFICER', online: true },
  { name: 'StarJamie', level: 31, role: 'MEMBER', online: false },
]

const ROLE_COLORS: Record<string, string> = {
  LEADER: '#39FF14',
  OFFICER: '#A855F7',
  MEMBER: '#A78BFA',
}

export function ClanScreen() {
  return (
    <div className="space-y-4 pb-4">
      <NeonCard className="p-5 text-center">
        <div
          className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center text-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(61,0,102,0.8), rgba(11,0,26,0.9))',
            border: '2px solid rgba(168,85,247,0.5)',
            boxShadow: '0 0 24px rgba(168,85,247,0.4)',
          }}
        >
          🛡️
        </div>
        <h2 className="text-base tracking-[0.15em] chromatic-text mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>
          NEBULA SYNDICATE
        </h2>
        <p className="text-[#A78BFA] text-xs" style={{ fontFamily: 'var(--font-mono)' }}>Rank #12 · 3 Members · Lv.42 Clan</p>
      </NeonCard>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'WAR WINS', value: '28' },
          { label: 'TERRITORY', value: '5' },
          { label: 'POWER', value: '9.2K' },
        ].map((s) => (
          <NeonCard key={s.label} className="p-3 text-center [&]:animate-none">
            <div className="text-[0.5rem] text-[#A78BFA] tracking-widest mb-1" style={{ fontFamily: 'var(--font-mono)' }}>{s.label}</div>
            <div className="text-sm font-bold text-[#39FF14]" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</div>
          </NeonCard>
        ))}
      </div>

      <div className="text-[0.6rem] text-[#A78BFA] tracking-widest uppercase text-center" style={{ fontFamily: 'var(--font-mono)' }}>
        Roster
      </div>

      <div className="space-y-2">
        {MEMBERS.map((m) => (
          <NeonCard key={m.name} className="p-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #3D0066, #0B001A)',
                    border: '2px solid rgba(168,85,247,0.4)',
                  }}
                >
                  {m.name[0]}
                </div>
                <span
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0B001A]"
                  style={{ background: m.online ? '#39FF14' : '#4B5563', boxShadow: m.online ? '0 0 6px #39FF14' : 'none' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{m.name}</div>
                <div className="text-[0.55rem] tracking-wider" style={{ color: ROLE_COLORS[m.role], fontFamily: 'var(--font-mono)' }}>
                  {m.role} · LV.{m.level}
                </div>
              </div>
            </div>
          </NeonCard>
        ))}
      </div>
    </div>
  )
}
