import { useRef, useState, useCallback, useEffect, type ReactNode, type MouseEvent, type TouchEvent } from 'react'
import { useUIStore } from '@/store/uiStore'

interface LiftableCardProps {
  id: string
  children: ReactNode
  className?: string
  onUpgrade?: () => void
  onTrade?: () => void
}

export function LiftableCard({ id, children, className = '', onUpgrade, onTrade }: LiftableCardProps) {
  const liftedCardId = useUIStore((s) => s.liftedCardId)
  const liftCard = useUIStore((s) => s.liftCard)
  const dismissCard = useUIStore((s) => s.dismissCard)
  const isLifted = liftedCardId === id

  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)

  const handlePointer = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    const x = (clientX - rect.left) / rect.width - 0.5
    const y = (clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -14, y: x * 14 })
  }, [])

  const onMouseMove = (e: MouseEvent) => {
    if (!isLifted || !cardRef.current) return
    handlePointer(e.clientX, e.clientY, cardRef.current.getBoundingClientRect())
  }

  const onTouchMove = (e: TouchEvent) => {
    if (!isLifted || !cardRef.current || !e.touches[0]) return
    const t = e.touches[0]
    handlePointer(t.clientX, t.clientY, cardRef.current.getBoundingClientRect())
  }

  const resetTilt = () => setTilt({ x: 0, y: 0 })

  useEffect(() => {
    if (isLifted) {
      requestAnimationFrame(() => setScale(1))
    } else {
      setScale(1)
      resetTilt()
    }
  }, [isLifted])

  const handleClick = () => {
    if (!isLifted) liftCard(id)
  }

  const handleBackdropClick = () => dismissCard()

  return (
    <>
      {isLifted && (
        <button
          type="button"
          className="card-lift-backdrop"
          onClick={handleBackdropClick}
          aria-label="Dismiss card"
        />
      )}

      <div
        ref={cardRef}
        onClick={!isLifted ? handleClick : (e) => e.stopPropagation()}
        onMouseMove={onMouseMove}
        onMouseLeave={resetTilt}
        onTouchMove={onTouchMove}
        onTouchEnd={resetTilt}
        className={`
          ${isLifted ? 'fixed z-[600] left-1/2 top-1/2 cursor-default' : 'relative cursor-pointer'}
          ${className}
        `}
        style={{
          transform: isLifted
            ? `translate(-50%, -50%) perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${scale})`
            : undefined,
          width: isLifted ? 'min(340px, 88vw)' : undefined,
          transition: isLifted
            ? 'transform 0.08s ease-out, width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'transform 0.2s ease, box-shadow 0.2s ease',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className={`neon-card ${isLifted ? '' : 'hover:scale-[1.02] active:scale-[0.98]'} transition-transform duration-200`}
          style={{
            animation: isLifted ? 'neon-pulse 1.8s ease-in-out infinite' : undefined,
            boxShadow: isLifted
              ? '0 0 40px rgba(168,85,247,0.6), 0 0 80px rgba(57,255,20,0.15), 0 32px 64px rgba(0,0,0,0.7)'
              : undefined,
          }}
        >
          <div className="relative z-10 p-4">{children}</div>

          {isLifted && (
            <div
              className="relative z-10 flex gap-3 px-4 pb-4 pt-2 border-t border-[rgba(61,0,102,0.6)]"
              style={{ transform: 'translateZ(20px)' }}
            >
              <button
                type="button"
                className="game-btn game-btn-green flex-1"
                onClick={(e) => { e.stopPropagation(); onUpgrade?.() }}
              >
                🔋 UPGRADE CARD
              </button>
              <button
                type="button"
                className="game-btn flex-1"
                onClick={(e) => { e.stopPropagation(); onTrade?.() }}
              >
                🤝 TRADE-GIFT
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
