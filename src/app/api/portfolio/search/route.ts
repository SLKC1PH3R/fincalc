import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const FINNHUB_KEY = process.env.FINNHUB_API_KEY ?? ''

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (q.length < 1) return NextResponse.json([])

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${FINNHUB_KEY}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return NextResponse.json([])
    const data = await res.json()

    // Filtrer et limiter aux résultats les plus pertinents
    const results = (data.result ?? [])
      .filter((r: { type: string }) => r.type === 'Common Stock' || r.type === 'ETP')
      .slice(0, 8)
      .map((r: { symbol: string; description: string; type: string }) => ({
        symbol: r.symbol,
        name: r.description,
        type: r.type === 'ETP' ? 'ETF' : 'STOCK',
      }))

    return NextResponse.json(results)
  } catch {
    return NextResponse.json([])
  }
}
