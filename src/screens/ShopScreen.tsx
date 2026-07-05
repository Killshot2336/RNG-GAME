import { useEffect, useState } from 'react'
import { LiftableCard } from '@/components/LiftableCard'
import { NeonCard } from '@/components/NeonCard'
import { useGameStore } from '@/store/gameStore'
import { MYSTERY_PACKS } from '@/types/game'
import { formatCash, formatCountdown } from '@/utils/format'

export function ShopScreen() {
  const cash = useGameStore((s) => s.cash)
  const buyMysteryPack = useGameStore((s) => s.buyMysteryPack)
  const buyBlitzUpgrade = useGameStore((s) => s.buyBlitzUpgrade)
  const buyStoreItem = useGameStore((s) => s.buyStoreItem)
  const blitzUpgrades = useGameStore((s) => s.blitzUpgrades)
  const inventory = useGameStore((s) => s.inventory)
  const getBlitzRemainingMs = useGameStore((s) => s.getBlitzRemainingMs)
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const blitzRemaining = getBlitzRemainingMs()

  return (
    <div className="space-y-4 pb-4">
      <div className="text-center mb-2">
        <h2 className="text-lg tracking-[0.2em] chromatic-text" style={{ fontFamily: 'var(--font-display)' }}>
          NEBULA MARKET
        </h2>
        <p className="text-[0.65rem] text-[#A78BFA] mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
          Balance: {formatCash(cash)}
        </p>
      </div>

      {/* Mystery Packs */}
      <div>
        <div className="text-[0.6rem] text-[#39FF14] tracking-widest mb-2 text-center" style={{ fontFamily: 'var(--font-mono)' }}>
          MYSTERY PACKS
        </div>
        <div className="grid gap-3">
          {MYSTERY_PACKS.map((pack) => (
            <LiftableCard
              key={pack.type}
              id={`pack-${pack.type}`}
              onUpgrade={() => buyMysteryPack(pack.type)}
            >
              <div className="flex items-center gap-3">
                <div className="text-3xl">{pack.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{pack.name}</div>
                  <div className="text-[#A78BFA] text-xs">{pack.desc}</div>
                  <div className="text-[#39FF14] text-xs font-bold mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatCash(pack.price)}
                  </div>
                </div>
                <button
                  type="button"
                  className="game-btn game-btn-green shrink-0 text-[0.6rem] py-2 px-3"
                  onClick={(e) => { e.stopPropagation(); buyMysteryPack(pack.type) }}
                  disabled={cash < pack.price}
                >
                  OPEN
                </button>
              </div>
            </LiftableCard>
          ))}
        </div>
      </div>

      {/* Blitz Feed */}
      <NeonCard variant="green" className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[0.55rem] text-[#39FF14] tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
              30-MIN BLITZ FEED
            </div>
            <div className="font-bold text-sm">Permanent Modifiers</div>
          </div>
          <div className="text-lg font-bold text-[#39FF14]" style={{ fontFamily: 'var(--font-mono)' }}>
            {formatCountdown(blitzRemaining)}
          </div>
        </div>
        <div className="space-y-2">
          {blitzUpgrades.map((upgrade) => (
            <div
              key={upgrade.id}
              className={`flex items-center justify-between p-2.5 rounded-xl ${
                upgrade.purchased ? 'opacity-45' : ''
              }`}
              style={{
                background: 'rgba(0,0,0,0.35)',
                border: `1px solid ${upgrade.purchased ? 'rgba(100,100,100,0.3)' : 'rgba(57,255,20,0.25)'}`,
              }}
            >
              <div className="min-w-0 flex-1 mr-2">
                <div className="text-xs font-semibold">{upgrade.name}</div>
                <div className="text-[0.55rem] text-[#A78BFA]">{upgrade.description}</div>
              </div>
              <button
                type="button"
                className={`game-btn shrink-0 text-[0.55rem] py-1.5 px-2.5 ${upgrade.purchased ? '' : 'game-btn-green'}`}
                disabled={upgrade.purchased || cash < upgrade.price}
                onClick={() => buyBlitzUpgrade(upgrade.id)}
              >
                {upgrade.purchased ? 'PURCHASED' : formatCash(upgrade.price)}
              </button>
            </div>
          ))}
        </div>
      </NeonCard>

      {/* General Store */}
      <div>
        <div className="text-[0.6rem] text-[#A78BFA] tracking-widest mb-2 text-center" style={{ fontFamily: 'var(--font-mono)' }}>
          GENERAL STORE
        </div>
        <div className="grid gap-2">
          {inventory.map((item) => (
            <NeonCard key={item.id} className="p-3">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{item.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{item.name}</div>
                  <div className="text-[0.55rem] text-[#A78BFA] capitalize">{item.type} · Owned: {item.owned}</div>
                </div>
                <button
                  type="button"
                  className="game-btn game-btn-green text-[0.55rem] py-1.5 px-2.5 shrink-0"
                  disabled={cash < item.price}
                  onClick={() => buyStoreItem(item.id)}
                >
                  {formatCash(item.price)}
                </button>
              </div>
            </NeonCard>
          ))}
        </div>
      </div>
    </div>
  )
}
