import { useEffect, useState } from 'react'
import { NeonCard } from '@/components/NeonCard'
import { StrainCard } from '@/components/StrainCard'
import { CapsuleCloner } from '@/components/CapsuleCloner'
import { ConveyorFloor } from '@/components/ConveyorFloor'
import { useGameStore } from '@/store/gameStore'
import type { FarmSubTab } from '@/types/game'
import { formatCash, formatRevenuePerSec } from '@/utils/format'

const FARM_TABS: { id: FarmSubTab; label: string }[] = [
  { id: 'upgrade', label: 'UPGRADE DECK' },
  { id: 'control', label: 'CONTROL DECK' },
  { id: 'portal', label: 'PORTAL FARM' },
]

export function FarmScreen() {
  const farmSubTab = useGameStore((s) => s.farmSubTab)
  const setFarmSubTab = useGameStore((s) => s.setFarmSubTab)
  const sectorUpgrades = useGameStore((s) => s.sectorUpgrades)
  const upgradeSector = useGameStore((s) => s.upgradeSector)
  const cash = useGameStore((s) => s.cash)
  const planetOffers = useGameStore((s) => s.planetOffers)
  const counterPrices = useGameStore((s) => s.counterPrices)
  const acceptOffer = useGameStore((s) => s.acceptOffer)
  const counterOffer = useGameStore((s) => s.counterOffer)
  const setCounterPrice = useGameStore((s) => s.setCounterPrice)
  const factoryFloors = useGameStore((s) => s.factoryFloors)
  const strains = useGameStore((s) => s.strains)
  const equipFloor = useGameStore((s) => s.equipFloor)
  const cloneJob = useGameStore((s) => s.cloneJob)
  const startClone = useGameStore((s) => s.startClone)
  const getCloneRemainingMs = useGameStore((s) => s.getCloneRemainingMs)
  const getRevenuePerSec = useGameStore((s) => s.getRevenuePerSec)
  const getScanRateMultiplier = useGameStore((s) => s.getScanRateMultiplier)
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 500)
    return () => window.clearInterval(id)
  }, [])

  const cloneRemaining = getCloneRemainingMs()
  const revenue = getRevenuePerSec()
  const scanMult = getScanRateMultiplier()

  return (
    <div className="space-y-4 pb-4">
      <NeonCard variant="green" className="p-3 text-center">
        <div className="text-[0.55rem] text-[#22C55E] tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
          PASSIVE REVENUE · SCAN +{(scanMult * 100).toFixed(0)}%
        </div>
        <div className="text-lg font-bold chromatic-text" style={{ fontFamily: 'var(--font-display)' }}>
          {formatRevenuePerSec(revenue)}
        </div>
      </NeonCard>

      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(15,0,30,0.8)', border: '1px solid rgba(61,0,102,0.6)' }}>
        {FARM_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFarmSubTab(tab.id)}
            className={`flex-1 py-2 px-1 rounded-lg text-[0.5rem] tracking-wider transition-all ${
              farmSubTab === tab.id
                ? 'bg-[rgba(57,255,20,0.12)] text-[#22C55E] border border-[rgba(57,255,20,0.3)]'
                : 'text-[#A78BFA] hover:text-white'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {farmSubTab === 'upgrade' && (
        <div className="space-y-3">
          <div className="text-[0.6rem] text-[#A78BFA] tracking-widest text-center" style={{ fontFamily: 'var(--font-mono)' }}>
            SECTOR SCAN RATE UPGRADES
          </div>
          {sectorUpgrades.map((sector) => {
            const cost = sector.baseCost * (sector.level + 1)
            const scanRate = (sector.level * sector.scanRateBonus * 100).toFixed(0)
            return (
              <NeonCard key={sector.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-sm">{sector.name}</div>
                    <div className="text-[0.55rem] text-[#A78BFA]">
                      Lv.{sector.level}/{sector.maxLevel} · +{scanRate}% scan rate
                    </div>
                  </div>
                  <button
                    type="button"
                    className="game-btn game-btn-green text-[0.55rem] py-1.5 px-3"
                    disabled={sector.level >= sector.maxLevel || cash < cost}
                    onClick={() => upgradeSector(sector.id)}
                  >
                    {sector.level >= sector.maxLevel ? 'MAX' : formatCash(cost)}
                  </button>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(31,0,51,0.8)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(sector.level / sector.maxLevel) * 100}%`,
                      background: 'linear-gradient(90deg, #EC4899, #22C55E)',
                    }}
                  />
                </div>
              </NeonCard>
            )
          })}
        </div>
      )}

      {farmSubTab === 'control' && (
        <div className="space-y-3">
          <div className="text-[0.6rem] text-[#A78BFA] tracking-widest text-center" style={{ fontFamily: 'var(--font-mono)' }}>
            PLANET SHARE BOARD — DAD&apos;S OFFERS
          </div>
          {planetOffers.length === 0 && (
            <NeonCard className="p-4 text-center text-[#A78BFA] text-sm">
              No active offers. Check back later.
            </NeonCard>
          )}
          {planetOffers.map((offer) => (
            <NeonCard key={offer.id} className="p-4">
              <div className="mb-2">
                <div className="text-[0.55rem] text-[#A78BFA]" style={{ fontFamily: 'var(--font-mono)' }}>
                  {offer.sellerName}
                </div>
                <div className="font-semibold text-sm">{offer.strainName}</div>
                <div className="text-[0.55rem] text-[#22C55E] mt-0.5">
                  TH-C {offer.thcPercent}% · Yield {offer.yield}
                </div>
              </div>
              <div className="text-sm font-bold text-[#06B6D4] mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
                Ask: {formatCash(offer.offerPrice)}
              </div>
              <input
                type="number"
                placeholder="Counter price"
                value={counterPrices[offer.id] ?? ''}
                onChange={(e) => setCounterPrice(offer.id, Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-xs bg-[rgba(0,0,0,0.4)] border border-[rgba(61,0,102,0.6)] text-white outline-none focus:border-[#EC4899] mb-2"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="game-btn game-btn-green flex-1 text-[0.55rem]"
                  disabled={cash < offer.offerPrice}
                  onClick={() => acceptOffer(offer.id)}
                >
                  ACCEPT OFFER
                </button>
                <button
                  type="button"
                  className="game-btn flex-1 text-[0.55rem]"
                  disabled={!counterPrices[offer.id] || cash < (counterPrices[offer.id] ?? 0)}
                  onClick={() => counterOffer(offer.id)}
                >
                  COUNTER PRICE
                </button>
              </div>
            </NeonCard>
          ))}
        </div>
      )}

      {farmSubTab === 'portal' && (
        <div className="space-y-4">
          <div className="text-[0.6rem] text-[#A78BFA] tracking-widest text-center" style={{ fontFamily: 'var(--font-mono)' }}>
            FACTORY FLOORS — EQUIP PORTAL STRAINS
          </div>
          {factoryFloors.map((floor) => (
            <ConveyorFloor
              key={floor.id}
              floor={floor}
              strains={strains}
              onEquip={equipFloor}
            />
          ))}

          <CapsuleCloner
            strains={strains}
            cloneJob={cloneJob}
            cloneRemainingMs={cloneRemaining}
            onStartClone={startClone}
          />

          {strains.length > 0 && (
            <div className="space-y-2">
              <div className="text-[0.55rem] text-[#A78BFA] tracking-widest text-center" style={{ fontFamily: 'var(--font-mono)' }}>
                INDEX PREVIEW
              </div>
              {strains.slice(0, 3).map((s) => (
                <StrainCard key={s.id} strain={s} compact />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
