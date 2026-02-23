import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// fmt lives in fmt.ts — re-exported here so all existing imports still work
export { fmt } from './fmt'

export const fmtPct = (n: number) => n.toFixed(2) + '%'

export const fmtCompact = (n: number) => {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M€'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'k€'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n)
}
