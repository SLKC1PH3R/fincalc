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
  dividendYield?: number  // rendement dividende annuel ex: 0.018 = 1.8% (undefined = capitalisant/acc)
  distributing?: boolean  // true = distribuant (dist), false/undefined = capitalisant (acc)
  yahooSymbol?: string    // symbole Yahoo Finance pour les cours temps réel
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
const JP      = { northAmerica: 0.00, europe: 0.00, asiaPacific: 0.98, emergingMarkets: 0.00, other: 0.02 }
const IN      = { northAmerica: 0.00, europe: 0.00, asiaPacific: 0.12, emergingMarkets: 0.85, other: 0.03 }
const CN      = { northAmerica: 0.00, europe: 0.00, asiaPacific: 0.08, emergingMarkets: 0.89, other: 0.03 }
const APAC    = { northAmerica: 0.00, europe: 0.00, asiaPacific: 0.92, emergingMarkets: 0.05, other: 0.03 }
const EU_BOND = { northAmerica: 0.00, europe: 0.97, asiaPacific: 0.00, emergingMarkets: 0.00, other: 0.03 }
const US_BOND = { northAmerica: 0.97, europe: 0.00, asiaPacific: 0.00, emergingMarkets: 0.00, other: 0.03 }
const EM_BOND = { northAmerica: 0.04, europe: 0.06, asiaPacific: 0.36, emergingMarkets: 0.51, other: 0.03 }
const GOLD    = { northAmerica: 0.00, europe: 0.00, asiaPacific: 0.00, emergingMarkets: 0.00, other: 1.00 }
const REIT_W  = { northAmerica: 0.55, europe: 0.20, asiaPacific: 0.20, emergingMarkets: 0.03, other: 0.02 }
const REIT_EU = { northAmerica: 0.12, europe: 0.74, asiaPacific: 0.12, emergingMarkets: 0.00, other: 0.02 }
const HEALTH_W = { northAmerica: 0.63, europe: 0.24, asiaPacific: 0.10, emergingMarkets: 0.00, other: 0.03 }
const ROBO_W  = { northAmerica: 0.53, europe: 0.24, asiaPacific: 0.22, emergingMarkets: 0.00, other: 0.01 }
const MIN_VOL = { northAmerica: 0.56, europe: 0.25, asiaPacific: 0.15, emergingMarkets: 0.00, other: 0.04 }
const INFRA_W = { northAmerica: 0.40, europe: 0.32, asiaPacific: 0.22, emergingMarkets: 0.04, other: 0.02 }

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

  // ── S&P 500 — variantes supplémentaires ──────────────────────
  { isin: 'IE00B5BMR087', ticker: 'CSPX', name: 'iShares Core S&P 500 UCITS ETF USD (Acc)', ter: 0.0007, benchmark: 'S&P 500', replication: 'physical', aum: 65000, geo: US, alternatives: ['LU1829221024'] },
  { isin: 'IE00B3XXRP09', ticker: 'VUSA', name: 'Vanguard S&P 500 UCITS ETF (Dist)', ter: 0.0007, benchmark: 'S&P 500', replication: 'physical', aum: 35000, geo: US, alternatives: ['IE00B5BMR087', 'LU1829221024'] },
  { isin: 'IE00B6YX5C33', ticker: 'SPXD', name: 'SPDR S&P 500 UCITS ETF (Dist)', ter: 0.0003, benchmark: 'S&P 500', replication: 'physical', aum: 14000, geo: US, alternatives: [] },
  { isin: 'IE00BFY0GT14', ticker: 'VUAG', name: 'Vanguard S&P 500 UCITS ETF (Acc)', ter: 0.0007, benchmark: 'S&P 500', replication: 'physical', aum: 28000, geo: US, alternatives: ['LU1829221024'] },

  // ── MSCI World — variantes supplémentaires ────────────────────
  { isin: 'IE00B4TG9K96', ticker: 'IWDH', name: 'iShares MSCI World EUR Hedged UCITS ETF (Acc)', ter: 0.0055, benchmark: 'MSCI World (EUR Hedged)', replication: 'physical', aum: 3200, geo: W },
  { isin: 'IE00B8FHGS14', ticker: 'MVOL', name: 'iShares Edge MSCI World Minimum Volatility UCITS ETF (Acc)', ter: 0.0030, benchmark: 'MSCI World Minimum Volatility', replication: 'physical', aum: 5800, geo: MIN_VOL, alternatives: ['IE00B4L5Y983'] },
  { isin: 'LU1291106564', ticker: 'XDEW', name: 'Xtrackers MSCI World Swap UCITS ETF 2D', ter: 0.0017, benchmark: 'MSCI World', replication: 'synthetic', aum: 2100, geo: W, alternatives: ['LU0274208692'] },

  // ── Japon ─────────────────────────────────────────────────────
  { isin: 'IE00B4L5YX21', ticker: 'IJPA', name: 'iShares Core MSCI Japan IMI UCITS ETF (Acc)', ter: 0.0012, benchmark: 'MSCI Japan IMI', replication: 'physical', aum: 5000, geo: JP },
  { isin: 'LU0659580079', ticker: 'XMJP', name: 'Xtrackers MSCI Japan UCITS ETF 1C', ter: 0.0009, benchmark: 'MSCI Japan', replication: 'physical', aum: 3500, geo: JP, alternatives: ['IE00B4L5YX21'] },
  { isin: 'FR0011399973', ticker: 'JPNH', name: 'Amundi MSCI Japan UCITS ETF (PEA-éligible)', ter: 0.0028, benchmark: 'MSCI Japan', replication: 'synthetic', aum: 900, geo: JP, alternatives: ['IE00B4L5YX21'] },
  { isin: 'IE00B06YNX21', ticker: 'XMJT', name: 'Xtrackers Nikkei 225 UCITS ETF 1C', ter: 0.0009, benchmark: 'Nikkei 225', replication: 'physical', aum: 800, geo: JP },

  // ── Inde ──────────────────────────────────────────────────────
  { isin: 'IE00BGCG0J87', ticker: 'NDIA', name: 'iShares MSCI India UCITS ETF (Acc)', ter: 0.0065, benchmark: 'MSCI India', replication: 'physical', aum: 1800, geo: IN },
  { isin: 'LU0514695690', ticker: 'XMIN', name: 'Xtrackers MSCI India Swap UCITS ETF 1C', ter: 0.0075, benchmark: 'MSCI India', replication: 'synthetic', aum: 700, geo: IN, alternatives: ['IE00BGCG0J87'] },

  // ── Zone euro / Europe ────────────────────────────────────────
  { isin: 'IE00B53QG562', ticker: 'IEQU', name: 'iShares Core MSCI EMU UCITS ETF (Acc)', ter: 0.0012, benchmark: 'MSCI EMU', replication: 'physical', aum: 9000, geo: EU },
  { isin: 'IE00B60SX394', ticker: 'CS5E', name: 'iShares Core Euro Stoxx 50 UCITS ETF EUR (Acc)', ter: 0.0010, benchmark: 'Euro Stoxx 50', replication: 'physical', aum: 8500, geo: EU },
  { isin: 'FR0007054358', ticker: 'MSE', name: 'Lyxor Euro Stoxx 50 (DR) UCITS ETF (Dist)', ter: 0.0020, benchmark: 'Euro Stoxx 50', replication: 'physical', aum: 4500, geo: EU, alternatives: ['LU1681041484', 'IE00B60SX394'] },
  { isin: 'DE0005933931', ticker: 'EXS1', name: 'iShares Core DAX UCITS ETF (DE)', ter: 0.0016, benchmark: 'DAX 40', replication: 'physical', aum: 18000, geo: EU },
  { isin: 'LU0908500753', ticker: 'LDAX', name: 'Lyxor DAX UCITS ETF (Acc)', ter: 0.0015, benchmark: 'DAX 40', replication: 'physical', aum: 3000, geo: EU, alternatives: ['DE0005933931'] },
  { isin: 'FR0010655696', ticker: 'STOXX', name: 'Amundi (ex-Lyxor) Euro Stoxx 600 UCITS ETF', ter: 0.0007, benchmark: 'Stoxx Europe 600', replication: 'synthetic', aum: 6500, geo: EU },
  { isin: 'IE00B3ZW0K18', ticker: 'SXRD', name: 'iShares Core Euro Stoxx 600 UCITS ETF (Dist)', ter: 0.0007, benchmark: 'Stoxx Europe 600', replication: 'physical', aum: 7200, geo: EU },

  // ── Secteurs (iShares MSCI World) ─────────────────────────────
  { isin: 'IE00BYVJRP78', ticker: 'HEAL', name: 'iShares MSCI World Health Care UCITS ETF (Acc)', ter: 0.0035, benchmark: 'MSCI World Health Care', replication: 'physical', aum: 4500, geo: HEALTH_W },
  { isin: 'IE00BYVJRR91', ticker: 'IFIN', name: 'iShares MSCI World Financials UCITS ETF (Acc)', ter: 0.0035, benchmark: 'MSCI World Financials', replication: 'physical', aum: 2800, geo: { northAmerica: 0.62, europe: 0.22, asiaPacific: 0.13, emergingMarkets: 0.00, other: 0.03 } },
  { isin: 'IE00BYVJRQ85', ticker: 'INDS', name: 'iShares MSCI World Industrials UCITS ETF (Acc)', ter: 0.0035, benchmark: 'MSCI World Industrials', replication: 'physical', aum: 2100, geo: { northAmerica: 0.61, europe: 0.22, asiaPacific: 0.14, emergingMarkets: 0.00, other: 0.03 } },
  { isin: 'IE00BYVJRS07', ticker: 'IWCS', name: 'iShares MSCI World Consumer Staples UCITS ETF (Acc)', ter: 0.0035, benchmark: 'MSCI World Consumer Staples', replication: 'physical', aum: 1900, geo: { northAmerica: 0.58, europe: 0.26, asiaPacific: 0.13, emergingMarkets: 0.00, other: 0.03 } },
  { isin: 'IE00BYVJRV37', ticker: 'IUEM', name: 'iShares MSCI World Energy UCITS ETF (Acc)', ter: 0.0035, benchmark: 'MSCI World Energy', replication: 'physical', aum: 2400, geo: { northAmerica: 0.68, europe: 0.20, asiaPacific: 0.09, emergingMarkets: 0.00, other: 0.03 } },
  { isin: 'IE00BYVJRW44', ticker: 'IURE', name: 'iShares MSCI World Real Estate UCITS ETF (Acc)', ter: 0.0035, benchmark: 'MSCI World Real Estate', replication: 'physical', aum: 1600, geo: REIT_W },

  // ── Thématiques ───────────────────────────────────────────────
  { isin: 'IE00BYZK4552', ticker: 'RBOT', name: 'iShares Automation & Robotics UCITS ETF (Acc)', ter: 0.0040, benchmark: 'iSTOXX FactSet Automation & Robotics', replication: 'physical', aum: 2800, geo: ROBO_W },
  { isin: 'IE00BDVPNG13', ticker: 'WTAI', name: 'WisdomTree Artificial Intelligence UCITS ETF (Acc)', ter: 0.0040, benchmark: 'Nasdaq CTA AI & Robotics', replication: 'physical', aum: 900, geo: { northAmerica: 0.72, europe: 0.10, asiaPacific: 0.16, emergingMarkets: 0.01, other: 0.01 } },
  { isin: 'IE00BYXG2H39', ticker: 'LOCK', name: 'iShares Digital Security UCITS ETF (Acc)', ter: 0.0040, benchmark: 'iSTOXX World Digital Security', replication: 'physical', aum: 1100, geo: { northAmerica: 0.75, europe: 0.14, asiaPacific: 0.10, emergingMarkets: 0.00, other: 0.01 } },
  { isin: 'IE00B4WXJL22', ticker: 'WATER', name: 'iShares Global Water UCITS ETF (Dist)', ter: 0.0065, benchmark: 'S&P Global Water', replication: 'physical', aum: 2100, geo: { northAmerica: 0.50, europe: 0.34, asiaPacific: 0.13, emergingMarkets: 0.01, other: 0.02 } },
  { isin: 'IE00BHZRQX61', ticker: 'INFR', name: 'iShares Global Infrastructure UCITS ETF (Acc)', ter: 0.0065, benchmark: 'FTSE Global Core Infrastructure', replication: 'physical', aum: 3400, geo: INFRA_W },

  // ── Immobilier coté (REITs) ───────────────────────────────────
  { isin: 'IE00B0M63284', ticker: 'IPRP', name: 'iShares European Property Yield UCITS ETF', ter: 0.0040, benchmark: 'FTSE EPRA/NAREIT Europe Dividend+', replication: 'physical', aum: 2100, geo: REIT_EU },
  { isin: 'IE00BDR55506', ticker: 'REET', name: 'iShares Global REIT UCITS ETF (Acc)', ter: 0.0014, benchmark: 'FTSE EPRA/NAREIT Developed', replication: 'physical', aum: 1400, geo: REIT_W },

  // ── Obligations — Zone euro ───────────────────────────────────
  { isin: 'IE00BDZYXK31', ticker: 'SEGA', name: 'iShares Core € Govt Bond UCITS ETF (Acc)', ter: 0.0007, benchmark: 'Bloomberg Euro Aggregate Treasury Bond', replication: 'physical', aum: 6200, geo: EU_BOND },
  { isin: 'LU0641434446', ticker: 'XGLE', name: 'Xtrackers II Eurozone Government Bond UCITS ETF 1C', ter: 0.0015, benchmark: 'Bloomberg Eurozone Govt Bond', replication: 'physical', aum: 3800, geo: EU_BOND, alternatives: ['IE00BDZYXK31'] },
  { isin: 'IE00B3VJFG18', ticker: 'IBCX', name: 'iShares Core € Corp Bond UCITS ETF', ter: 0.0020, benchmark: 'Bloomberg Euro Corp Bond', replication: 'physical', aum: 7100, geo: EU_BOND },
  { isin: 'IE00B66F4759', ticker: 'SHYG', name: 'iShares € Short Duration High Yield Corp Bond UCITS ETF', ter: 0.0050, benchmark: 'Markit iBoxx EUR Liquid HY 0-5', replication: 'physical', aum: 1400, geo: EU_BOND },

  // ── Obligations — États-Unis ──────────────────────────────────
  { isin: 'IE00B14X4S71', ticker: 'IDTL', name: 'iShares $ Treasury Bond 20+yr UCITS ETF (Acc)', ter: 0.0010, benchmark: 'ICE US Treasury 20+ Year Bond', replication: 'physical', aum: 4200, geo: US_BOND },
  { isin: 'IE00B3F81409', ticker: 'IBTS', name: 'iShares $ Treasury Bond 1-3yr UCITS ETF (Acc)', ter: 0.0007, benchmark: 'ICE US Treasury 1-3 Year Bond', replication: 'physical', aum: 3100, geo: US_BOND },
  { isin: 'IE00BDFK5H46', ticker: 'LQDE', name: 'iShares $ Corp Bond UCITS ETF (Acc)', ter: 0.0020, benchmark: 'Markit iBoxx USD Liquid Investment Grade', replication: 'physical', aum: 5800, geo: US_BOND },

  // ── Obligations — Marchés émergents ──────────────────────────
  { isin: 'IE00B2NPKV68', ticker: 'SEMB', name: 'iShares JP Morgan $ EM Bond UCITS ETF (Dist)', ter: 0.0045, benchmark: 'JPM EMBI Global Diversified', replication: 'physical', aum: 5200, geo: EM_BOND },
  { isin: 'LU1808502762', ticker: 'EMBE', name: 'Amundi JP Morgan EM Bond UCITS ETF (Acc)', ter: 0.0045, benchmark: 'JPM EMBI Global Diversified', replication: 'physical', aum: 1800, geo: EM_BOND, alternatives: ['IE00B2NPKV68'] },

  // ── Obligations inflation ─────────────────────────────────────
  { isin: 'IE00B3B8PX14', ticker: 'IBCI', name: 'iShares € Inflation Linked Govt Bond UCITS ETF', ter: 0.0025, benchmark: 'Bloomberg Euro Govt Inflation-Linked Bond', replication: 'physical', aum: 2900, geo: EU_BOND },
  { isin: 'IE00B3DKXQ41', ticker: 'ITPS', name: 'iShares $ TIPS UCITS ETF (Acc)', ter: 0.0010, benchmark: 'Bloomberg US TIPS', replication: 'physical', aum: 2200, geo: US_BOND },

  // ── Or physique / ETCs ────────────────────────────────────────
  { isin: 'JE00B1VS3770', ticker: 'PHAU', name: 'WisdomTree Physical Gold (EUR)', ter: 0.0039, benchmark: 'Or physique', replication: 'physical', aum: 7500, geo: GOLD },
  { isin: 'FR0013416716', ticker: 'GOLD', name: 'Amundi Physical Gold ETC (EUR)', ter: 0.0012, benchmark: 'Or physique', replication: 'physical', aum: 3100, geo: GOLD, alternatives: ['JE00B1VS3770'] },
  { isin: 'JE00B1VS3333', ticker: 'PHAG', name: 'WisdomTree Physical Silver (EUR)', ter: 0.0049, benchmark: 'Argent physique', replication: 'physical', aum: 1200, geo: GOLD },

  // ── ESG supplémentaires ───────────────────────────────────────
  { isin: 'IE00BMF76938', ticker: 'MWRD', name: 'iShares MSCI World ESG Enhanced UCITS ETF (Acc)', ter: 0.0020, benchmark: 'MSCI World ESG Enhanced Focus', replication: 'physical', aum: 4200, geo: W, alternatives: ['IE00B4L5Y983'] },
  { isin: 'LU2056738539', ticker: 'PABW', name: 'Amundi MSCI World Climate Paris Aligned PAB UCITS ETF (Acc)', ter: 0.0018, benchmark: 'MSCI World Climate Paris Aligned', replication: 'synthetic', aum: 1600, geo: W },

  // ── Dividendes supplémentaires ────────────────────────────────
  { isin: 'IE00BTN1Y115', ticker: 'VDIV', name: 'Vanguard FTSE All-World High Div Yield UCITS ETF (Acc)', ter: 0.0029, benchmark: 'FTSE All-World High Dividend Yield', replication: 'physical', aum: 2800, geo: AW, alternatives: ['IE00B8GKDB10'] },
  { isin: 'NL0009272749', ticker: 'TDIV', name: 'VanEck Morningstar Developed Markets Dividend Leaders (Dist)', ter: 0.0038, benchmark: 'Morningstar Developed Markets Large Cap Dividend Leaders', replication: 'physical', aum: 3600, geo: { northAmerica: 0.45, europe: 0.35, asiaPacific: 0.18, emergingMarkets: 0.00, other: 0.02 } },
  { isin: 'IE00B5KKCX20', ticker: 'SEDY', name: 'iShares Emerging Markets Dividend UCITS ETF (Dist)', ter: 0.0065, benchmark: 'Dow Jones EM Select Dividend', replication: 'physical', aum: 800, geo: EM },

  // ── Multi-asset / Allocation ──────────────────────────────────
  { isin: 'IE00BWBXM385', ticker: 'VNGA80', name: 'Vanguard LifeStrategy 80% Equity UCITS ETF (Acc)', ter: 0.0025, benchmark: 'Vanguard LifeStrategy 80 Equity', replication: 'physical', aum: 2800, geo: AW },
  { isin: 'IE00BMVB5P51', ticker: 'VNGA60', name: 'Vanguard LifeStrategy 60% Equity UCITS ETF (Acc)', ter: 0.0025, benchmark: 'Vanguard LifeStrategy 60 Equity', replication: 'physical', aum: 2200, geo: { northAmerica: 0.37, europe: 0.30, asiaPacific: 0.14, emergingMarkets: 0.06, other: 0.13 } },

  // ── Small caps supplémentaires ────────────────────────────────
  { isin: 'IE00BSPLC298', ticker: 'ZPRV', name: 'SPDR MSCI USA Small Cap Value Weighted UCITS ETF', ter: 0.0030, benchmark: 'MSCI USA Small Cap Value Weighted', replication: 'physical', aum: 1800, geo: US },
  { isin: 'IE00BSPLC413', ticker: 'ZPRX', name: 'SPDR MSCI Europe Small Cap Value Weighted UCITS ETF', ter: 0.0030, benchmark: 'MSCI Europe Small Cap Value Weighted', replication: 'physical', aum: 700, geo: EU },
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

/** Recherche plein-texte : nom, ticker, benchmark ou ISIN. Retourne max 10 résultats. */
export function lookupByName(query: string): ETFInfo[] {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return []
  return ETF_DATABASE.filter(e =>
    e.name.toLowerCase().includes(q) ||
    e.ticker.toLowerCase().includes(q) ||
    e.benchmark.toLowerCase().includes(q) ||
    e.isin.toLowerCase().includes(q)
  ).slice(0, 10)
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

/**
 * Table de rendements dividendes par ticker/ISIN — ETFs distribuants courants.
 * Source : données approximatives fin 2025, usage éducatif uniquement.
 */
const DIVIDEND_YIELD_MAP: Record<string, number> = {
  // S&P 500 Dist
  'IE00B5BMR087': 0.013, 'CSPX': 0.013,
  'IE00B3XXRP09': 0.013, 'VUSA': 0.013,
  'IE00B6YX5C33': 0.013, 'SPXD': 0.013,
  // All-World Dist
  'IE00B3RBWM25': 0.020, 'VWRL': 0.020,
  // High Dividend Yield
  'IE00B8GKDB10': 0.032, 'VHYL': 0.032,
  'NL0009272749': 0.045, 'TDIV': 0.045,
  'IE00B5KKCX20': 0.045, 'SEDY': 0.045,
  // Europe Dist
  'IE00B3ZW0K18': 0.032, 'SXRD': 0.032,
  'FR0007054358': 0.030, 'MSE': 0.030,
  'IE00B0M63284': 0.040, 'IPRP': 0.040,
  // iShares Div Europe
  'IE00B4K6B022': 0.035, 'QDVX': 0.035,
  // Bond ETFs distribuants
  'IE00B4WXJL22': 0.018, 'WATER': 0.018,
  'IE00B2NPKV68': 0.045, 'SEMB': 0.045,
  'IE00B00FV128': 0.030, 'IEAC': 0.030,
  // REIT
  'IE00B1FZSF77': 0.035, 'IWDP': 0.035,
  // Stoxx 50 Dist
  'LU0136234068': 0.030, 'C50': 0.030,
}

/**
 * Estime le revenu annuel brut d'une position ETF/action.
 * Retourne 0 si non distribuant ou inconnu.
 */
export function estimatePositionIncome(
  ticker: string,
  isin: string | null | undefined,
  value: number,
): number {
  const key = (isin ?? '').toUpperCase()
  const tkr = ticker.toUpperCase().replace(/\.(PA|AS|DE|L|MI|SW)$/, '')
  const yld = DIVIDEND_YIELD_MAP[key] ?? DIVIDEND_YIELD_MAP[tkr] ?? 0
  return value * yld
}
