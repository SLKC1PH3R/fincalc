import { NextResponse } from 'next/server'

// Static / semi-static fallback data
const FALLBACK = {
  livretA:     { value: 2.4,  label: 'Livret A',       unit: '%', trend: 'stable' as const },
  oat10y:      { value: 3.45, label: 'OAT 10 ans',     unit: '%', trend: 'up'     as const },
  bce:         { value: 2.65, label: 'Taux BCE',        unit: '%', trend: 'down'   as const },
  inflation:   { value: 1.1,  label: 'Inflation FR',   unit: '%', trend: 'down'   as const },
  immo15y:     { value: 3.10, label: 'Crédit immo 15a', unit: '%', trend: 'stable' as const },
  immo20y:     { value: 3.30, label: 'Crédit immo 20a', unit: '%', trend: 'stable' as const },
  immo25y:     { value: 3.50, label: 'Crédit immo 25a', unit: '%', trend: 'stable' as const },
  creditConso: { value: 5.80, label: 'Crédit conso',   unit: '%', trend: 'stable' as const },
}

async function fetchOAT(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5ETNO10Y?interval=1d&range=5d',
      { next: { revalidate: 3600 }, headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const close = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    return typeof close === 'number' ? Math.round(close * 100) / 100 : null
  } catch { return null }
}

async function fetchBCERate(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.RT0.BY.DFR.LEVL.D?lastNObservations=1&format=jsondata',
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const obs = data?.dataSets?.[0]?.series?.['0:0:0:0:0:0:0:0']?.observations
    if (!obs) return null
    const keys = Object.keys(obs)
    const last = obs[keys[keys.length - 1]]?.[0]
    return typeof last === 'number' ? Math.round(last * 100) / 100 : null
  } catch { return null }
}

export async function GET() {
  const [oat, bce] = await Promise.all([fetchOAT(), fetchBCERate()])

  const rates = {
    livretA:     FALLBACK.livretA,
    oat10y:      { ...FALLBACK.oat10y,    value: oat ?? FALLBACK.oat10y.value },
    bce:         { ...FALLBACK.bce,       value: bce ?? FALLBACK.bce.value },
    inflation:   FALLBACK.inflation,
    immo15y:     FALLBACK.immo15y,
    immo20y:     FALLBACK.immo20y,
    immo25y:     FALLBACK.immo25y,
    creditConso: FALLBACK.creditConso,
    updatedAt:   new Date().toISOString(),
    live: { oat: oat !== null, bce: bce !== null },
  }

  return NextResponse.json(rates, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
  })
}
