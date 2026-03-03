// Base statique d'ETFs français/européens courants
// Données approximatives à fin 2025 — pour usage éducatif uniquement

export interface ETFInfo {
  isin: string
  ticker: string          // symbole de cotation principal
  name: string
  ter: number             // ex: 0.0015 = 0.15%
  benchmark: string
  replication: 'physical' | 'synthetic'
  aum: number             // millions EUR approx
  geo: GeoAllocation
  alternatives?: string[] // ISINs d'alternatives moins chères ou équivalentes
}

export interface GeoAllocation {
  northAmerica: number    // 0–1
  europe: number
  asiaPacific: number
  emergingMarkets: number
  other: number
}

export const REGION_COLORS: Record<keyof GeoAllocation, string> = {
  northAmerica:    '#1e3a5f',
  europe:          '#2563eb',
  asiaPacific:     '#38bdf8',
  emergingMarkets: '#7c3aed',
  other:           '#9ca3af',
}

export const REGION_LABELS: Record<keyof GeoAllocation, string> = {
  northAmerica:    'Amérique du Nord',
  europe:          'Europe',
  asiaPacific:     'Asie-Océanie',
  emergingMarkets: 'Marchés émergents',
  other:           'Autre',
}

// ─────────────────────────────────────────────────────────────────
// Base de données ETF
// Données approximatives — usage éducatif uniquement
// ─────────────────────────────────────────────────────────────────

const W = { northAmerica: 0.65, europe: 0.18, asiaPacific: 0.12, emergingMarkets: 0.00, other: 0.05 }  // MSCI World
const AW = { northAmerica: 0.61, europe: 0.16, asiaPacific: 0.13, emergingMarkets: 0.08, other: 0.02 }  // FTSE All-World / MSCI ACWI
const US = { northAmerica: 0.98, europe: 0.00, asiaPacific: 0.00, emergingMarkets: 0.00, other: 0.02 }  // S&P 500
const NQ = { northAmerica: 0.97, europe: 0.01, asiaPacific: 0.01, emergingMarkets: 0.00, other: 0.01 }  // Nasdaq 100
const EU = { northAmerica: 0.00, europe: 0.98, asiaPacific: 0.00, emergingMarkets: 0.00, other: 0.02 }  // Europe
const EM = { northAmerica: 0.00, europe: 0.01, asiaPacific: 0.55, emergingMarkets: 0.40, other: 0.04 }  // Emerging Markets

export const ETF_DATABASE: ETFInfo[] = [
  // ── S&P 500 ──────────────────────────────────────────────────
  {
    isin: 'FR0011550185', ticker: 'PE500',
    name: 'BNP Easy S&P 500 EUR C',
    ter: 0.0015, benchmark: 'S&P 500', replication: 'synthetic', aum: 3800,
    geo: US, alternatives: ['LU1829221024', 'IE0031442068'],
  },
  {
    isin: 'LU1829221024', ticker: 'SXR8',
    name: 'iShares Core S&P 500 UCITS ETF (Acc)',
    ter: 0.0007, benchmark: 'S&P 500', replication: 'physical', aum: 82000,
    geo: US, alternatives: [],
  },
  {
    isin: 'IE0031442068', ticker: 'IUSA',
    name: 'iShares S&P 500 UCITS ETF (Dist)',
    ter: 0.0007, benchmark: 'S&P 500', replication: 'physical', aum: 45000,
    geo: US, alternatives: ['LU1829221024'],
  },
  {
    isin: 'FR0010296061', ticker: 'SP5',
    name: 'Amundi (ex-Lyxor) S&P 500 UCITS ETF (Acc)',
    ter: 0.0015, benchmark: 'S&P 500', replication: 'synthetic', aum: 5200,
    geo: US, alternatives: ['LU1829221024'],
  },
  {
    isin: 'LU1681048804', ticker: 'XSPS',
    name: 'Xtrackers S&P 500 Swap UCITS ETF (PEA)',
    ter: 0.0015, benchmark: 'S&P 500', replication: 'synthetic', aum: 2100,
    geo: US, alternatives: ['LU1829221024'],
  },
  {
    isin: 'FR0013412285', ticker: 'PSP5E',
    name: 'Amundi S&P 500 ESG UCITS ETF (Acc)',
    ter: 0.0012, benchmark: 'S&P 500 ESG', replication: 'synthetic', aum: 3200,
    geo: US, alternatives: ['LU1829221024'],
  },

  // ── MSCI World — PEA-éligibles (synthétiques) ────────────────
  {
    isin: 'IE000Y7KXV53', ticker: 'WPEA',
    name: 'iShares MSCI World Swap PEA UCITS ETF',
    ter: 0.0020, benchmark: 'MSCI World', replication: 'synthetic', aum: 3500,
    geo: W, alternatives: ['IE00B4L5Y983'],
  },
  {
    isin: 'FR0011882364', ticker: 'EWLD',
    name: 'iShares MSCI World Swap PEA UCITS ETF (ancienne série)',
    ter: 0.0025, benchmark: 'MSCI World', replication: 'synthetic', aum: 6200,
    geo: W, alternatives: ['IE000Y7KXV53', 'IE00B4L5Y983'],
  },
  {
    isin: 'LU1781541179', ticker: 'CW8',
    name: 'Amundi MSCI World UCITS ETF (Acc)',
    ter: 0.0038, benchmark: 'MSCI World', replication: 'synthetic', aum: 9500,
    geo: W, alternatives: ['IE000Y7KXV53', 'IE00B4L5Y983', 'LU0274208692'],
  },
  {
    isin: 'FR0011465343', ticker: 'AMEW',
    name: 'Amundi MSCI World II UCITS ETF (Acc)',
    ter: 0.0038, benchmark: 'MSCI World', replication: 'synthetic', aum: 2800,
    geo: W, alternatives: ['IE000Y7KXV53', 'IE00B4L5Y983'],
  },

  // ── MSCI World — physiques (CTO / AV) ────────────────────────
  {
    isin: 'IE00B4L5Y983', ticker: 'IWDA',
    name: 'iShares Core MSCI World UCITS ETF (Acc)',
    ter: 0.0020, benchmark: 'MSCI World', replication: 'physical', aum: 74000,
    geo: W, alternatives: ['LU2089238203'],
  },
  {
    isin: 'LU0274208692', ticker: 'XDWD',
    name: 'Xtrackers MSCI World Swap UCITS ETF 1C',
    ter: 0.0019, benchmark: 'MSCI World', replication: 'synthetic', aum: 9800,
    geo: W, alternatives: ['LU2089238203', 'IE00B4L5Y983'],
  },
  {
    isin: 'LU2089238203', ticker: 'PRIW',
    name: 'Amundi Prime Global UCITS ETF DR (Acc)',
    ter: 0.0005, benchmark: 'Solactive GBS Developed Markets', replication: 'physical', aum: 1200,
    geo: W, alternatives: [],
  },
  {
    isin: 'LU1650490360', ticker: 'LCWL',
    name: 'Amundi (ex-Lyxor) MSCI World UCITS ETF (Acc)',
    ter: 0.0012, benchmark: 'MSCI World', replication: 'physical', aum: 4500,
    geo: W, alternatives: ['IE00B4L5Y983', 'LU2089238203'],
  },

  // ── FTSE All-World ────────────────────────────────────────────
  {
    isin: 'IE00BK5BQT80', ticker: 'VWCE',
    name: 'Vanguard FTSE All-World UCITS ETF (Acc)',
    ter: 0.0022, benchmark: 'FTSE All-World', replication: 'physical', aum: 22000,
    geo: AW, alternatives: ['IE00B6R52259', 'LU1437016972'],
  },
  {
    isin: 'IE00B3RBWM25', ticker: 'VWRL',
    name: 'Vanguard FTSE All-World UCITS ETF (Dist)',
    ter: 0.0022, benchmark: 'FTSE All-World', replication: 'physical', aum: 18000,
    geo: AW, alternatives: ['IE00BK5BQT80'],
  },

  // ── MSCI All Country World ────────────────────────────────────
  {
    isin: 'IE00B6R52259', ticker: 'SSAC',
    name: 'iShares MSCI ACWI UCITS ETF (Acc)',
    ter: 0.0020, benchmark: 'MSCI ACWI', replication: 'physical', aum: 11000,
    geo: AW, alternatives: ['LU1437016972', 'IE00BK5BQT80'],
  },
  {
    isin: 'LU1437016972', ticker: 'PAASI',
    name: 'Amundi MSCI All Countries World UCITS ETF (Acc)',
    ter: 0.0015, benchmark: 'MSCI ACWI', replication: 'synthetic', aum: 4500,
    geo: AW, alternatives: ['IE00B6R52259'],
  },

  // ── Nasdaq 100 ────────────────────────────────────────────────
  {
    isin: 'FR0010342592', ticker: 'ANX',
    name: 'Amundi Nasdaq-100 UCITS ETF (Acc)',
    ter: 0.0023, benchmark: 'Nasdaq 100', replication: 'synthetic', aum: 7800,
    geo: NQ, alternatives: [],
  },
  {
    isin: 'IE0032077012', ticker: 'EQQQ',
    name: 'Invesco EQQQ Nasdaq-100 UCITS ETF',
    ter: 0.0020, benchmark: 'Nasdaq 100', replication: 'physical', aum: 9500,
    geo: NQ, alternatives: ['FR0010342592'],
  },
  {
    isin: 'LU1829221749', ticker: 'SXRV',
    name: 'iShares Nasdaq 100 UCITS ETF (Acc)',
    ter: 0.0033, benchmark: 'Nasdaq 100', replication: 'physical', aum: 14000,
    geo: NQ, alternatives: ['IE0032077012', 'FR0010342592'],
  },

  // ── MSCI Emerging Markets ─────────────────────────────────────
  {
    isin: 'LU1681042609', ticker: 'PAEEM',
    name: 'Amundi MSCI Emerging Markets UCITS ETF (Acc)',
    ter: 0.0020, benchmark: 'MSCI Emerging Markets', replication: 'synthetic', aum: 4200,
    geo: EM, alternatives: ['IE00B4L5YC18'],
  },
  {
    isin: 'IE00B4L5YC18', ticker: 'EIMI',
    name: 'iShares Core MSCI EM IMI UCITS ETF (Acc)',
    ter: 0.0018, benchmark: 'MSCI Emerging Markets IMI', replication: 'physical', aum: 21000,
    geo: EM, alternatives: [],
  },
  {
    isin: 'LU1900068328', ticker: 'AEEM',
    name: 'Amundi MSCI Emerging Markets II UCITS ETF (Acc)',
    ter: 0.0020, benchmark: 'MSCI Emerging Markets', replication: 'synthetic', aum: 1800,
    geo: EM, alternatives: ['IE00B4L5YC18'],
  },

  // ── Europe ────────────────────────────────────────────────────
  {
    isin: 'IE00B53L3W79', ticker: 'SMEA',
    name: 'iShares MSCI Europe UCITS ETF (Acc)',
    ter: 0.0012, benchmark: 'MSCI Europe', replication: 'physical', aum: 9500,
    geo: EU,
  },
  {
    isin: 'LU1681041484', ticker: 'MFEE',
    name: 'Amundi Euro Stoxx 50 UCITS ETF (Acc)',
    ter: 0.0015, benchmark: 'Euro Stoxx 50', replication: 'synthetic', aum: 2800,
    geo: EU, alternatives: ['IE00B53L3W79'],
  },
  {
    isin: 'FR0010261198', ticker: 'CAC',
    name: 'Amundi (ex-Lyxor) CAC 40 (DR) UCITS ETF',
    ter: 0.0025, benchmark: 'CAC 40', replication: 'physical', aum: 3500,
    geo: EU,
  },
  {
    isin: 'IE00B53HP851', ticker: 'ISF',
    name: 'iShares Core FTSE 100 UCITS ETF',
    ter: 0.0007, benchmark: 'FTSE 100', replication: 'physical', aum: 12000,
    geo: EU,
  },

  // ── Small / Mid Caps ─────────────────────────────────────────
  {
    isin: 'IE00B3VVMM84', ticker: 'IUSN',
    name: 'iShares MSCI World Small Cap UCITS ETF (Acc)',
    ter: 0.0035, benchmark: 'MSCI World Small Cap', replication: 'physical', aum: 9500,
    geo: { northAmerica: 0.59, europe: 0.18, asiaPacific: 0.17, emergingMarkets: 0.00, other: 0.06 },
  },
  {
    isin: 'FR0011872182', ticker: 'MSML',
    name: 'Amundi MSCI World Small Cap UCITS ETF (PEA)',
    ter: 0.0035, benchmark: 'MSCI World Small Cap', replication: 'synthetic', aum: 1200,
    geo: { northAmerica: 0.59, europe: 0.18, asiaPacific: 0.17, emergingMarkets: 0.00, other: 0.06 },
    alternatives: ['IE00B3VVMM84'],
  },

  // ── Facteurs / Smart Beta ─────────────────────────────────────
  {
    isin: 'IE00BP3QZB59', ticker: 'IWQU',
    name: 'iShares Edge MSCI World Quality Factor UCITS ETF',
    ter: 0.0030, benchmark: 'MSCI World Quality', replication: 'physical', aum: 5200,
    geo: { northAmerica: 0.64, europe: 0.18, asiaPacific: 0.12, emergingMarkets: 0.00, other: 0.06 },
  },
  {
    isin: 'IE00BP3QZJ36', ticker: 'IWMO',
    name: 'iShares Edge MSCI World Momentum Factor UCITS ETF',
    ter: 0.0030, benchmark: 'MSCI World Momentum', replication: 'physical', aum: 3800,
    geo: { northAmerica: 0.70, europe: 0.16, asiaPacific: 0.10, emergingMarkets: 0.00, other: 0.04 },
  },
  {
    isin: 'IE00B441G979', ticker: 'IWVL',
    name: 'iShares Edge MSCI World Value Factor UCITS ETF',
    ter: 0.0030, benchmark: 'MSCI World Value', replication: 'physical', aum: 4500,
    geo: { northAmerica: 0.58, europe: 0.22, asiaPacific: 0.14, emergingMarkets: 0.00, other: 0.06 },
  },

  // ── ESG ───────────────────────────────────────────────────────
  {
    isin: 'IE00BHZRR098', ticker: 'SUSW',
    name: 'iShares MSCI World ESG Screened UCITS ETF (Acc)',
    ter: 0.0020, benchmark: 'MSCI World ESG Screened', replication: 'physical', aum: 7200,
    geo: W, alternatives: ['IE00B4L5Y983', 'LU2089238203'],
  },
  {
    isin: 'LU1861134382', ticker: 'PAWD',
    name: 'Amundi MSCI World SRI PAB UCITS ETF DR (Acc)',
    ter: 0.0018, benchmark: 'MSCI World SRI PAB', replication: 'physical', aum: 3400,
    geo: W,
  },

  // ── Obligations ───────────────────────────────────────────────
  {
    isin: 'IE00B3F81R35', ticker: 'AGGH',
    name: 'iShares Core Global Aggregate Bond UCITS ETF (EUR Hedged)',
    ter: 0.0010, benchmark: 'Bloomberg Global Aggregate Bond', replication: 'physical', aum: 5800,
    geo: { northAmerica: 0.40, europe: 0.35, asiaPacific: 0.18, emergingMarkets: 0.05, other: 0.02 },
  },
  {
    isin: 'IE00B4WXJJ64', ticker: 'IEAG',
    name: 'iShares Core € Aggregate Bond UCITS ETF',
    ter: 0.0010, benchmark: 'Bloomberg Euro Aggregate Bond', replication: 'physical', aum: 8200,
    geo: { northAmerica: 0.00, europe: 0.95, asiaPacific: 0.00, emergingMarkets: 0.00, other: 0.05 },
  },
  {
    isin: 'IE00B1FZS350', ticker: 'TPXE',
    name: 'iShares € High Yield Corp Bond UCITS ETF',
    ter: 0.0050, benchmark: 'Markit iBoxx EUR High Yield', replication: 'physical', aum: 7600,
    geo: { northAmerica: 0.05, europe: 0.92, asiaPacific: 0.00, emergingMarkets: 0.00, other: 0.03 },
  },

  // ── Matières premières & Thématiques ─────────────────────────
  {
    isin: 'IE00B1XNHC34', ticker: 'INRG',
    name: 'iShares Global Clean Energy UCITS ETF',
    ter: 0.0065, benchmark: 'S&P Global Clean Energy', replication: 'physical', aum: 3200,
    geo: { northAmerica: 0.44, europe: 0.28, asiaPacific: 0.24, emergingMarkets: 0.02, other: 0.02 },
  },
  {
    isin: 'IE00B3WJKG14', ticker: 'IUIT',
    name: 'iShares S&P 500 Information Technology Sector UCITS ETF',
    ter: 0.0015, benchmark: 'S&P 500 IT', replication: 'physical', aum: 5400,
    geo: { northAmerica: 0.97, europe: 0.01, asiaPacific: 0.01, emergingMarkets: 0.00, other: 0.01 },
  },

  // ── Dividendes ────────────────────────────────────────────────
  {
    isin: 'IE00B0M62Q58', ticker: 'IDVY',
    name: 'iShares MSCI Europe Quality Dividend UCITS ETF',
    ter: 0.0028, benchmark: 'MSCI Europe High Dividend Yield', replication: 'physical', aum: 1800,
    geo: EU,
  },
  {
    isin: 'IE00B8GKDB10', ticker: 'VHYL',
    name: 'Vanguard FTSE All-World High Dividend Yield UCITS ETF',
    ter: 0.0029, benchmark: 'FTSE All-World High Dividend Yield', replication: 'physical', aum: 4200,
    geo: { northAmerica: 0.47, europe: 0.22, asiaPacific: 0.18, emergingMarkets: 0.10, other: 0.03 },
  },
]

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

export function lookupByIsin(isin: string): ETFInfo | null {
  return ETF_DATABASE.find(e => e.isin.toUpperCase() === isin.toUpperCase()) ?? null
}

export function lookupByTicker(ticker: string): ETFInfo | null {
  const t = ticker.toUpperCase().replace(/\.(PA|AS|DE|L|MI|SW)$/, '')
  return ETF_DATABASE.find(e => {
    const db = e.ticker.toUpperCase().replace(/\.(PA|AS|DE|L|MI|SW)$/, '')
    return db === t
  }) ?? null
}

/** Trouve les alternatives moins chères (ou équivalentes) pour un ETF donné. */
export function getAlternatives(isin: string): ETFInfo[] {
  const etf = lookupByIsin(isin)
  if (!etf || !etf.alternatives?.length) return []
  return etf.alternatives
    .map(a => lookupByIsin(a))
    .filter((e): e is ETFInfo => e !== null)
}

/**
 * Calcule l'impact des frais sur X années.
 * Formule : V = P × (1 + rendementBrut - ter)^années
 */
export function calcFeeImpact(
  invested: number,
  years: number,
  returnRate: number, // ex: 0.08 pour 8%
  ter1: number,       // TER de l'ETF actuel (ex: 0.0038)
  ter2: number,       // TER de l'alternative (ex: 0.0020)
): { value1: number; value2: number; feeDrag: number; annualCost1: number; annualCost2: number } {
  const r1 = returnRate - ter1
  const r2 = returnRate - ter2
  const value1 = invested * Math.pow(1 + r1, years)
  const value2 = invested * Math.pow(1 + r2, years)
  return {
    value1,
    value2,
    feeDrag: value2 - value1,
    annualCost1: invested * ter1,
    annualCost2: invested * ter2,
  }
}

/**
 * Calcule l'allocation géographique agrégée pour un ensemble de positions.
 * positions: [{ value: number, isin?: string, ticker?: string }]
 */
export function calcPortfolioGeo(
  positions: { value: number; isin?: string; ticker?: string }[]
): GeoAllocation & { totalValue: number } {
  let total = 0
  const acc: GeoAllocation = { northAmerica: 0, europe: 0, asiaPacific: 0, emergingMarkets: 0, other: 0 }

  for (const pos of positions) {
    const etf = pos.isin
      ? lookupByIsin(pos.isin)
      : pos.ticker ? lookupByTicker(pos.ticker) : null

    if (!etf) continue
    total += pos.value
    for (const key of Object.keys(acc) as (keyof GeoAllocation)[]) {
      acc[key] += etf.geo[key] * pos.value
    }
  }

  if (total === 0) return { ...acc, totalValue: 0 }

  for (const key of Object.keys(acc) as (keyof GeoAllocation)[]) {
    acc[key] = acc[key] / total
  }
  return { ...acc, totalValue: total }
}
