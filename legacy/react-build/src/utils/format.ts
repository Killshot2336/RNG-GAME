export function formatCash(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
  return `$${value.toFixed(2)}`
}

export function formatRevenuePerSec(value: number): string {
  return `${formatCash(value)}/sec`
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function formatSp(value: number): string {
  return `${value.toLocaleString()} SP`
}

export const RARITY_COLORS: Record<string, string> = {
  Common: '#A78BFA',
  Rare: '#00F0FF',
  Epic: '#A855F7',
  Legendary: '#39FF14',
  Mythic: '#FFD700',
}
