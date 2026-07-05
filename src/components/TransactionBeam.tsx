import { useGameStore } from '@/store/gameStore'

export function TransactionBeam() {
  const beam = useGameStore((s) => s.transactionBeam)
  if (!beam?.active) return null

  return (
    <div className="fixed inset-0 z-[7000] pointer-events-none flex items-center justify-center">
      <div className="transaction-beam-line" />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-xs font-bold tracking-wider animate-pulse"
        style={{
          fontFamily: 'var(--font-display)',
          background: 'rgba(57, 255, 20, 0.15)',
          border: '1px solid rgba(57, 255, 20, 0.5)',
          color: '#39FF14',
          boxShadow: '0 0 30px rgba(57, 255, 20, 0.4)',
        }}
      >
        ⚡ {beam.from} → {beam.to}
      </div>
    </div>
  )
}
