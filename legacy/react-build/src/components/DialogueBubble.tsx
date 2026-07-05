import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { generateDialogueLine } from '@/utils/dialogueEngine'

export function DialogueBubble() {
  const cash = useGameStore((s) => s.cash)
  const strains = useGameStore((s) => s.strains)
  const cloneJob = useGameStore((s) => s.cloneJob)
  const focusedStrainId = useGameStore((s) => s.focusedStrainId)
  const getBlitzRemainingMs = useGameStore((s) => s.getBlitzRemainingMs)
  const getRevenuePerSec = useGameStore((s) => s.getRevenuePerSec)

  const [text, setText] = useState('')
  const [visible, setVisible] = useState(true)

  const focused = strains.find((s) => s.id === focusedStrainId)

  useEffect(() => {
    const refresh = () => {
      setText(
        generateDialogueLine({
          cash,
          strainCount: strains.length,
          cloneActive: cloneJob !== null,
          blitzRemainingMs: getBlitzRemainingMs(),
          focusedStrainName: focused?.name ?? null,
          revenuePerSec: getRevenuePerSec(),
        }),
      )
    }
    refresh()
    const interval = window.setInterval(() => {
      setVisible(false)
      window.setTimeout(() => {
        refresh()
        setVisible(true)
      }, 400)
    }, 8000)
    return () => window.clearInterval(interval)
  }, [cash, strains.length, cloneJob, focused?.name, getBlitzRemainingMs, getRevenuePerSec])

  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-[85%] pointer-events-none transition-all duration-400 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div
        className="px-4 py-2.5 rounded-2xl text-[0.65rem] leading-relaxed text-[#E9D5FF]"
        style={{
          fontFamily: 'var(--font-mono)',
          background: 'rgba(31, 0, 51, 0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(236, 72, 153, 0.35)',
          boxShadow: '0 0 20px rgba(168, 85, 247, 0.25)',
        }}
      >
        <span className="text-[#22C55E] mr-1">▸</span>
        {focused && (
          <span className="text-[#06B6D4] mr-1">[{focused.name}]</span>
        )}
        {text}
      </div>
    </div>
  )
}
