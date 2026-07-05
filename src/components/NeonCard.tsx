import type { ReactNode } from 'react'

interface NeonCardProps {
  children: ReactNode
  variant?: 'purple' | 'green'
  className?: string
  onClick?: () => void
}

export function NeonCard({ children, variant = 'purple', className = '', onClick }: NeonCardProps) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`neon-card ${variant === 'green' ? 'neon-card-green' : ''} ${className} ${onClick ? 'cursor-pointer text-left w-full' : ''}`}
    >
      <div className="relative z-10">{children}</div>
    </Tag>
  )
}
