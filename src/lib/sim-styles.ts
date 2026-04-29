/**
 * Shared structural styles for all simulator / calculator pages.
 * Accent colors (per-simulator) stay in each page file.
 */
import type { CSSProperties } from 'react'

export const S = {
  // ── Page shell ──────────────────────────────────────────────────────────────
  page: {
    background: 'var(--p-bg)',
    minHeight: '100%',
    padding: '24px 28px 56px',
  } as CSSProperties,

  // ── Cards ────────────────────────────────────────────────────────────────────
  card: {
    background: 'var(--p-card)',
    border: '1px solid var(--p-line)',
    borderRadius: 16,
    boxShadow: 'var(--shadow-sm)',
  } as CSSProperties,

  cardSm: {
    background: 'var(--p-card)',
    border: '1px solid var(--p-line)',
    borderRadius: 12,
    boxShadow: 'var(--shadow-sm)',
  } as CSSProperties,

  cardPad: '16px 20px' as CSSProperties['padding'],
  cardPadSm: '12px 16px' as CSSProperties['padding'],

  // ── Divider ──────────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    background: 'var(--p-line)',
  } as CSSProperties,

  // ── Typography ───────────────────────────────────────────────────────────────
  h1: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--p-text-em)',
    margin: 0,
    letterSpacing: '-0.03em',
    fontFamily: "'Geist', system-ui, sans-serif",
  } as CSSProperties,

  h2: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--p-text-em)',
    margin: 0,
    letterSpacing: '-0.02em',
  } as CSSProperties,

  h3: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--p-text-em)',
    margin: 0,
  } as CSSProperties,

  label: {
    fontSize: 11,
    color: 'var(--p-text-faint)',
    letterSpacing: '0.04em',
    fontWeight: 500,
    textTransform: 'uppercase',
  } as CSSProperties,

  labelNoCaps: {
    fontSize: 12,
    color: 'var(--p-text-faint)',
    fontWeight: 500,
  } as CSSProperties,

  body: {
    fontSize: 13,
    color: 'var(--p-text)',
    lineHeight: 1.5,
  } as CSSProperties,

  muted: {
    fontSize: 12,
    color: 'var(--p-text-dim)',
  } as CSSProperties,

  faint: {
    fontSize: 11,
    color: 'var(--p-text-faint)',
  } as CSSProperties,

  mono: {
    fontFamily: "'Geist Mono', ui-monospace, monospace",
    fontVariantNumeric: 'tabular-nums',
  } as CSSProperties,

  // ── Breadcrumb ───────────────────────────────────────────────────────────────
  breadcrumb: {
    fontSize: 11,
    color: 'var(--p-text-faint)',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  } as CSSProperties,

  // ── Inputs ───────────────────────────────────────────────────────────────────
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  } as CSSProperties,

  // ── Row ──────────────────────────────────────────────────────────────────────
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid var(--p-line)',
  } as CSSProperties,

  rowHover: 'var(--p-row-hover)' as string,

  // ── Tips / alert strip ───────────────────────────────────────────────────────
  tipStrip: {
    background: 'var(--p-gold-08)',
    border: '1px solid var(--p-gold-18)',
    borderRadius: 10,
    padding: '10px 14px',
  } as CSSProperties,

  // ── Two-column grid ──────────────────────────────────────────────────────────
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  } as CSSProperties,

  threeCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3,1fr)',
    gap: 12,
  } as CSSProperties,
}

/** Merge S.card + extra overrides in one call */
export function card(extra?: CSSProperties): CSSProperties {
  return { ...S.card, ...extra }
}

/** KPI value style (large number) */
export function kpiValue(color?: string): CSSProperties {
  return {
    fontSize: 28,
    fontWeight: 700,
    color: color ?? 'var(--p-text-em)',
    letterSpacing: '-0.04em',
    fontFamily: "'Instrument Serif', Georgia, serif",
    lineHeight: 1.1,
  }
}

/** Accent chip / badge */
export function chip(color: string): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 11,
    fontWeight: 600,
    color,
    background: color + '18',
    border: `1px solid ${color}30`,
    borderRadius: 20,
    padding: '3px 10px',
  }
}
