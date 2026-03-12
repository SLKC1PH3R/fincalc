import { TrendingUp, Building2, PiggyBank, Shield, Wallet, Landmark, Bitcoin } from 'lucide-react'
import type { ComponentType } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
export type EnvelopeType = 'LIVRET' | 'IMMOBILIER' | 'PEA' | 'AV' | 'CTO' | 'CRYPTO' | 'PER' | 'CASH'
export type AssetType = 'STOCK' | 'ETF' | 'CRYPTO' | 'SCPI' | 'LIVRET' | 'CASH'

export interface Position {
  id: string
  assetType: AssetType
  symbol: string
  name: string
  isin?: string | null
  quantity: number
  pru: number
  currency: string
  envelopeId?: string | null
}

export interface PriceData { priceEur: number; changePct: number }

export interface Envelope {
  id: string
  type: EnvelopeType
  name: string
  metadata: Record<string, unknown>
  positions: Position[]
  positionCount: number
  totalValue: number | null
  createdAt: string
  updatedAt: string
}

// ── Config ────────────────────────────────────────────────────────────────────
export const ENVELOPE_TYPE_CONFIG: Record<EnvelopeType, {
  label: string; color: string
  icon: ComponentType<{ style?: object; className?: string }>
}> = {
  LIVRET:     { label: 'Livret réglementé', color: '#34d399', icon: PiggyBank  },
  IMMOBILIER: { label: 'Immobilier',        color: '#f472b6', icon: Building2  },
  PEA:        { label: 'PEA',              color: '#818cf8', icon: TrendingUp  },
  AV:         { label: 'Assurance Vie',     color: '#fb923c', icon: Shield     },
  CTO:        { label: 'Compte-Titres',     color: '#38bdf8', icon: TrendingUp },
  CRYPTO:     { label: 'Crypto',            color: '#f59e0b', icon: Bitcoin    },
  PER:        { label: 'PER',              color: '#a78bfa', icon: Landmark    },
  CASH:       { label: 'Liquidités',        color: '#94a3b8', icon: Wallet     },
}

export const LIVRET_CONFIG: Record<string, { label: string; maxBalance: number | null; rate: number }> = {
  LIVRET_A:     { label: 'Livret A',     maxBalance: 22_950, rate: 2.4 },
  LDDS:         { label: 'LDDS',         maxBalance: 12_000, rate: 2.4 },
  LEP:          { label: 'LEP',          maxBalance: 10_000, rate: 3.5 },
  LIVRET_JEUNE: { label: 'Livret Jeune', maxBalance:  1_600, rate: 4.0 },
  PEL:          { label: 'PEL',          maxBalance: 61_200, rate: 2.25 },
  CEL:          { label: 'CEL',          maxBalance: 15_300, rate: 1.5  },
  LIVRET_B:     { label: 'Livret B',     maxBalance: null,   rate: 0.5  },
  AUTRE:        { label: 'Autre livret', maxBalance: null,   rate: 0    },
}

export const PEA_MAX = 150_000

export const ASSET_LABELS: Record<AssetType, string> = {
  STOCK: 'Action', ETF: 'ETF', CRYPTO: 'Crypto',
  SCPI: 'SCPI', LIVRET: 'Livret', CASH: 'Liquidités',
}
export const ASSET_COLORS: Record<AssetType, string> = {
  STOCK: '#818cf8', ETF: '#38bdf8', CRYPTO: '#fb923c',
  SCPI: '#f472b6', LIVRET: '#34d399', CASH: '#94a3b8',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
export function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}
export function fmtCompact(n: number) {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M€`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)} k€`
  return fmtEur(n)
}
export function fmtPct(n: number, sign = true) {
  const s = sign && n > 0 ? '+' : ''
  return `${s}${n.toFixed(2)} %`
}
