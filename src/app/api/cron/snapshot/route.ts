import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function computeEnvelopeValue(type: string, metadata: Record<string, unknown>, positions: { pru: number; quantity: number }[]): number {
  switch (type) {
    case 'LIVRET':
    case 'PER':
    case 'CASH':
      return Number(metadata.balance ?? 0)
    case 'AV':
      return Number(metadata.surrenderValue ?? 0)
    case 'IMMOBILIER':
      return Number(metadata.currentValue ?? 0)
    case 'PEA':
    case 'CTO':
    case 'CRYPTO':
      // Utilise PRU×qty comme estimation (pas de prix temps réel côté serveur)
      return positions.reduce((s, p) => s + p.pru * p.quantity, 0)
    default:
      return 0
  }
}

export async function POST(req: NextRequest) {
  // Vérification du secret cron
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date(new Date().toISOString().split('T')[0])

  // Récupère tous les portfolios avec leurs enveloppes et positions
  const portfolios = await prisma.portfolio.findMany({
    include: {
      envelopes: {
        include: { positions: { select: { pru: true, quantity: true } } },
      },
    },
  })

  let created = 0
  for (const portfolio of portfolios) {
    if (portfolio.envelopes.length === 0) continue

    let totalValue = 0
    const byEnvelope: Record<string, { value: number; type: string; name: string }> = {}

    for (const env of portfolio.envelopes) {
      const meta = env.metadata as Record<string, unknown>
      const value = computeEnvelopeValue(env.type, meta, env.positions)
      totalValue += value
      byEnvelope[env.id] = { value, type: env.type, name: env.name }
    }

    if (totalValue <= 0) continue

    await prisma.PatrimoineSnapshot.upsert({
      where: { userId_date: { userId: portfolio.userId, date: today } },
      update: { totalValue, byEnvelope },
      create: { userId: portfolio.userId, date: today, totalValue, byEnvelope },
    })
    created++
  }

  return NextResponse.json({ ok: true, date: today.toISOString().split('T')[0], snapshots: created })
}
