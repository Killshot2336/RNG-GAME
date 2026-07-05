import { useEffect, useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useGameStore } from '@/store/gameStore'
import { AVATARS, BADGES } from '@/types/game'
import { formatCash, formatRevenuePerSec, formatSp } from '@/utils/format'

export function PlayerProfileModal() {
  const open = useUIStore((s) => s.profileOpen)
  const closeProfile = useUIStore((s) => s.closeProfile)
  const toggleSettings = useUIStore((s) => s.toggleSettings)

  const profileViewIndex = useGameStore((s) => s.profileViewIndex)
  const cycleProfileView = useGameStore((s) => s.cycleProfileView)
  const getProfileByIndex = useGameStore((s) => s.getProfileByIndex)
  const setName = useGameStore((s) => s.setName)
  const setAvatar = useGameStore((s) => s.setAvatar)
  const setBadge = useGameStore((s) => s.setBadge)
  const setStorefrontSlot = useGameStore((s) => s.setStorefrontSlot)
  const strains = useGameStore((s) => s.strains)

  const [editName, setEditName] = useState('')
  const profile = getProfileByIndex(profileViewIndex)
  const isSelf = profile.isSelf

  useEffect(() => {
    if (open && isSelf) setEditName(profile.name)
  }, [open, isSelf, profile.name])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeProfile()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeProfile])

  if (!open) return null

  const profileLabels = ['YOU', 'DAD', 'CHRIS']

  return (
    <div
      className="fixed inset-0 z-[8000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Player profile"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        onClick={closeProfile}
        aria-label="Close profile"
      />

      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto void-scroll"
        style={{
          background: 'rgba(15, 0, 28, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(168, 85, 247, 0.5)',
          boxShadow: '0 0 60px rgba(168, 85, 247, 0.3), 0 24px 48px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="relative h-24 overflow-hidden shrink-0"
          style={{ background: 'linear-gradient(160deg, #3D0066 0%, #0B001A 40%, #1a0040 100%)' }}
        >
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            <div className="relative w-16 h-16">
              <div className="avatar-ring" />
              <div
                className="absolute inset-1 rounded-full flex items-center justify-center text-2xl"
                style={{
                  background: 'linear-gradient(135deg, #1F0033, #0B001A)',
                  border: '3px solid #A855F7',
                  boxShadow: '0 0 24px rgba(168,85,247,0.6)',
                }}
              >
                {profile.avatar}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={closeProfile}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-[#A78BFA] hover:text-white"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(168,85,247,0.3)' }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="pt-10 px-5 pb-5">
          {/* Profile flipper */}
          <div className="flex items-center justify-center gap-1 mb-4 flex-wrap">
            <button type="button" className="game-btn text-[0.5rem] py-1.5 px-2" onClick={() => cycleProfileView('prev')}>
              ◀ PREV PLAYER
            </button>
            <button type="button" className="game-btn text-[0.5rem] py-1.5 px-2" onClick={() => cycleProfileView('back')}>
              BACK
            </button>
            <span className="text-[0.6rem] text-[#22C55E] tracking-widest px-2" style={{ fontFamily: 'var(--font-mono)' }}>
              {profileLabels[profileViewIndex]}
            </span>
            <button type="button" className="game-btn text-[0.5rem] py-1.5 px-2" onClick={() => cycleProfileView('next')}>
              NEXT PLAYER ▶
            </button>
          </div>

          {isSelf ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => setName(editName.trim() || 'VoidPilot')}
              className="w-full text-center text-lg font-bold bg-transparent border-b border-[rgba(168,85,247,0.4)] pb-1 mb-3 outline-none focus:border-[#39FF14] chromatic-text"
              style={{ fontFamily: 'var(--font-display)' }}
              maxLength={24}
            />
          ) : (
            <h2 className="text-lg tracking-wide mb-3 text-center chromatic-text" style={{ fontFamily: 'var(--font-display)' }}>
              {profile.name}
            </h2>
          )}

          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            {[
              { label: 'CASH', value: formatCash(profile.cash) },
              { label: 'SP', value: formatSp(profile.sp) },
              { label: 'REV/SEC', value: formatRevenuePerSec(profile.revenuePerSec) },
            ].map((stat) => (
              <div key={stat.label} className="neon-card py-2 px-1 rounded-xl [&]:animate-none">
                <div className="text-[0.45rem] text-[#A78BFA]" style={{ fontFamily: 'var(--font-mono)' }}>{stat.label}</div>
                <div className="text-[0.6rem] font-bold text-[#39FF14] truncate">{stat.value}</div>
              </div>
            ))}
          </div>

          <div className="text-[0.55rem] text-[#A78BFA] tracking-widest mb-2 text-center" style={{ fontFamily: 'var(--font-mono)' }}>
            LV.{profile.empireLevel} EMPIRE
          </div>

          {/* Avatar selector (self only) */}
          {isSelf && (
            <div className="mb-4">
              <div className="text-[0.5rem] text-[#A78BFA] tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)' }}>AVATAR</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`w-9 h-9 rounded-full text-lg flex items-center justify-center transition-all ${
                      profile.avatar === av ? 'ring-2 ring-[#39FF14] scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ background: 'rgba(31,0,51,0.8)', border: '1px solid rgba(168,85,247,0.4)' }}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Badge slots */}
          <div className="mb-4">
            <div className="text-[0.5rem] text-[#A78BFA] tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)' }}>BADGES</div>
            <div className="grid grid-cols-3 gap-2">
              {([0, 1, 2] as const).map((slot) => (
                <div key={slot}>
                  {isSelf ? (
                    <select
                      value={profile.badgeIds[slot] ?? ''}
                      onChange={(e) => setBadge(slot, e.target.value || null)}
                      className="w-full px-1 py-2 rounded-lg text-xs bg-[rgba(0,0,0,0.4)] border border-[rgba(61,0,102,0.6)] text-white outline-none"
                    >
                      <option value="">—</option>
                      {BADGES.map((b) => (
                        <option key={b.id} value={b.id}>{b.emoji} {b.label}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-center py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(61,0,102,0.4)' }}>
                      {profile.badgeIds[slot]
                        ? BADGES.find((b) => b.id === profile.badgeIds[slot])?.emoji ?? '—'
                        : '—'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Storefront slots (self only) */}
          {isSelf && (
            <div className="mb-4">
              <div className="text-[0.5rem] text-[#A78BFA] tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
                STOREFRONT (3 SLOTS)
              </div>
              {([0, 1, 2] as const).map((slot) => {
                const sf = profile.storefrontSlots[slot]
                return (
                  <div key={slot} className="flex gap-2 mb-2">
                    <select
                      value={sf.strainId ?? ''}
                      onChange={(e) => setStorefrontSlot(slot, e.target.value || null, sf.price)}
                      className="flex-1 px-2 py-1.5 rounded-lg text-[0.55rem] bg-[rgba(0,0,0,0.4)] border border-[rgba(61,0,102,0.6)] text-white outline-none"
                    >
                      <option value="">Empty slot</option>
                      {strains.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Price"
                      value={sf.price || ''}
                      onChange={(e) => setStorefrontSlot(slot, sf.strainId, Number(e.target.value))}
                      className="w-20 px-2 py-1.5 rounded-lg text-[0.55rem] bg-[rgba(0,0,0,0.4)] border border-[rgba(61,0,102,0.6)] text-white outline-none"
                    />
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" className="game-btn flex-1" onClick={toggleSettings}>
              ⚙ SETTINGS
            </button>
            <button type="button" className="game-btn game-btn-green flex-1" onClick={closeProfile}>
              RESUME
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
