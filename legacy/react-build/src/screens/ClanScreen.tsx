import { LiftableCard } from '@/components/LiftableCard'
import { NeonCard } from '@/components/NeonCard'
import { StrainCard } from '@/components/StrainCard'
import { useGameStore } from '@/store/gameStore'
import { formatCash, formatRevenuePerSec } from '@/utils/format'

export function ClanScreen() {
  const cash = useGameStore((s) => s.cash)
  const buyClanItem = useGameStore((s) => s.buyClanItem)
  const getProfileByIndex = useGameStore((s) => s.getProfileByIndex)
  const strains = useGameStore((s) => s.strains)
  const storefrontSlots = useGameStore((s) => s.storefrontSlots)

  const players = [0, 1, 2].map((i) => getProfileByIndex(i))

  return (
    <div className="space-y-4 pb-4">
      <NeonCard className="p-5 text-center">
        <div className="text-3xl mb-2">🛡️</div>
        <h2 className="text-base tracking-[0.15em] chromatic-text mb-0.5" style={{ fontFamily: 'var(--font-display)' }}>
          CLAN MARKETPLACE
        </h2>
        <p className="text-[#A78BFA] text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
          Balance: {formatCash(cash)} · Tap booths to buy
        </p>
      </NeonCard>

      <div className="space-y-4 void-scroll max-h-[60vh] overflow-y-auto">
        {players.map((player) => (
          <NeonCard key={player.id} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                style={{
                  background: 'linear-gradient(135deg, #3D0066, #0B001A)',
                  border: '2px solid rgba(168,85,247,0.4)',
                }}
              >
                {player.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">
                  {player.name}
                  {player.isSelf && <span className="text-[#22C55E] ml-1 text-[0.55rem]">(YOU)</span>}
                </div>
                <div className="text-[0.55rem] text-[#A78BFA]" style={{ fontFamily: 'var(--font-mono)' }}>
                  Lv.{player.empireLevel} · {formatRevenuePerSec(player.revenuePerSec)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {player.storefrontSlots.map((slot, slotIdx) => {
                const strain = slot.strainId
                  ? player.strains.find((s) => s.id === slot.strainId)
                  : null
                const isOwn = player.isSelf
                const cardId = `clan-${player.id}-slot-${slotIdx}`

                if (!strain || isOwn) {
                  return (
                    <div
                      key={slotIdx}
                      className="rounded-xl p-2 min-h-[100px] flex flex-col items-center justify-center opacity-60"
                      style={{
                        background: 'rgba(0,0,0,0.35)',
                        border: `1px solid ${strain ? 'rgba(168,85,247,0.4)' : 'rgba(61,0,102,0.3)'}`,
                      }}
                    >
                      {strain ? (
                        <>
                          <div className="text-2xl mb-1" style={{ filter: `hue-rotate(${strain.hue}deg)` }}>🌿</div>
                          <div className="text-[0.45rem] font-semibold truncate w-full text-center">{strain.name}</div>
                          <div className="text-[0.45rem] text-[#22C55E] mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
                            {formatCash(slot.price)}
                          </div>
                        </>
                      ) : (
                        <div className="text-[0.5rem] text-[#A78BFA]/50">EMPTY</div>
                      )}
                    </div>
                  )
                }

                return (
                  <LiftableCard
                    key={slotIdx}
                    id={cardId}
                    className="min-h-[100px]"
                    onUpgrade={() => buyClanItem(player.id, slotIdx)}
                    onTrade={() => buyClanItem(player.id, slotIdx)}
                  >
                    <div
                      className={`rounded-xl p-2 min-h-[80px] flex flex-col items-center justify-center transition-all ${
                        cash >= slot.price
                          ? 'cursor-pointer hover:ring-1 hover:ring-[#22C55E]'
                          : 'opacity-40'
                      }`}
                      style={{
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid rgba(168,85,247,0.4)',
                      }}
                    >
                      <div className="text-2xl mb-1" style={{ filter: `hue-rotate(${strain.hue}deg)` }}>🌿</div>
                      <div className="text-[0.45rem] font-semibold truncate w-full text-center">{strain.name}</div>
                      <div className="text-[0.45rem] text-[#22C55E] mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
                        {formatCash(slot.price)}
                      </div>
                    </div>
                  </LiftableCard>
                )
              })}
            </div>
          </NeonCard>
        ))}
      </div>

      <NeonCard className="p-3">
        <div className="text-[0.55rem] text-[#A78BFA] tracking-widest mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
          YOUR LISTED STRAINS
        </div>
        {storefrontSlots.every((s) => !s.strainId) ? (
          <p className="text-xs text-[#A78BFA]/70">Set storefront slots in your Profile modal.</p>
        ) : (
          <div className="space-y-2">
            {storefrontSlots.map((slot, i) => {
              const strain = slot.strainId ? strains.find((s) => s.id === slot.strainId) : null
              if (!strain) return null
              return <StrainCard key={i} strain={strain} compact />
            })}
          </div>
        )}
      </NeonCard>
    </div>
  )
}
