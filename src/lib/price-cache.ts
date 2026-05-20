const CACHE_KEY = 'Patrimo_price_cache'
const TTL_MS = 60_000

interface CachedEntry { priceEur: number; changePct: number; fetchedAt: number }
type PriceCache = Record<string, CachedEntry>

function readCache(): PriceCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as PriceCache
  } catch {
    return {}
  }
}

function writeCache(cache: PriceCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch { /* ignore quota errors */ }
}

export function getCachedPrices(symbols: string[]): {
  hits: Record<string, { priceEur: number; changePct: number }>
  misses: string[]
  oldestHitMs: number | null
} {
  const cache = readCache()
  const now = Date.now()
  const hits: Record<string, { priceEur: number; changePct: number }> = {}
  const misses: string[] = []
  let oldestHitMs: number | null = null

  for (const sym of symbols) {
    const entry = cache[sym]
    if (entry && entry.fetchedAt + TTL_MS >= now) {
      hits[sym] = { priceEur: entry.priceEur, changePct: entry.changePct }
      if (oldestHitMs === null || entry.fetchedAt < oldestHitMs) {
        oldestHitMs = entry.fetchedAt
      }
    } else {
      misses.push(sym)
    }
  }

  return { hits, misses, oldestHitMs }
}

export function setCachedPrices(prices: Record<string, { priceEur: number; changePct: number }>): void {
  const cache = readCache()
  const now = Date.now()
  for (const [sym, data] of Object.entries(prices)) {
    cache[sym] = { priceEur: data.priceEur, changePct: data.changePct, fetchedAt: now }
  }
  writeCache(cache)
}
