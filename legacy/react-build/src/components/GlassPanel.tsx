import type { ReactNode } from 'react'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  variant?: 'purple' | 'green' | 'pink'
}

export function GlassPanel({ children, className = '', variant = 'purple' }: GlassPanelProps) {
  const borderClass =
    variant === 'green'
      ? 'border-[rgba(34,197,94,0.5)]'
      : variant === 'pink'
        ? 'border-[rgba(236,72,153,0.5)]'
        : 'border-[#3D0066]/80'

  return (
    <div
      className={`bg-[#1F0033]/60 backdrop-blur-md border ${borderClass} rounded-2xl p-4 shadow-[0_0_15px_rgba(168,85,247,0.2)] ${className}`}
    >
      {children}
    </div>
  )
}
