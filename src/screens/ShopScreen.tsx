import { LiftableCard } from '@/components/LiftableCard'
import { NeonCard } from '@/components/NeonCard'

const SHOP_ITEMS = [
  { id: 'seed-crate', name: 'Quantum Seed Crate', price: '2,400 CR', rarity: 'RARE', emoji: '📦' },
  { id: 'plasma-drill', name: 'Plasma Drill Mk.III', price: '8,900 CR', rarity: 'EPIC', emoji: '⚡' },
  { id: 'void-fertilizer', name: 'Void Fertilizer', price: '450 CR', rarity: 'COMMON', emoji: '🧪' },
]

const RARITY_COLORS: Record<string, string> = {
  COMMON: '#A78BFA',
  RARE: '#00F0FF',
  EPIC: '#A855F7',
  LEGENDARY: '#39FF14',
}

export function ShopScreen() {
  return (
    <div className="space-y-4 pb-4">
      <div className="text-center mb-2">
        <h2 className="text-lg tracking-[0.2em] chromatic-text" style={{ fontFamily: 'var(--font-display)' }}>
          NEBULA MARKET
        </h2>
        <p className="text-[0.65rem] text-[#A78BFA] mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
          Premium galactic goods — tap a card to inspect
        </p>
      </div>

      <NeonCard variant="green" className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[0.55rem] text-[#39FF14] tracking-widest mb-1" style={{ fontFamily: 'var(--font-mono)' }}>DAILY DEAL</div>
            <div className="font-semibold text-sm">Hyperdrive Sprout Bundle</div>
            <div className="text-[#A78BFA] text-xs mt-0.5">-40% · 2h 14m remaining</div>
          </div>
          <div className="text-3xl animate-[cosmic-float_3s_ease-in-out_infinite]">🌱</div>
        </div>
      </NeonCard>

      <div className="grid gap-3">
        {SHOP_ITEMS.map((item) => (
          <LiftableCard key={item.id} id={`shop-${item.id}`}>
            <div className="flex items-start gap-3">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{
                  background: 'rgba(61,0,102,0.5)',
                  border: `1px solid ${RARITY_COLORS[item.rarity]}55`,
                  boxShadow: `0 0 12px ${RARITY_COLORS[item.rarity]}33`,
                }}
              >
                {item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[0.55rem] tracking-widest mb-0.5"
                  style={{ color: RARITY_COLORS[item.rarity], fontFamily: 'var(--font-mono)' }}
                >
                  {item.rarity}
                </div>
                <div className="font-semibold text-sm truncate">{item.name}</div>
                <div className="text-[#39FF14] text-xs mt-1 font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                  {item.price}
                </div>
              </div>
            </div>
          </LiftableCard>
        ))}
      </div>
    </div>
  )
}
