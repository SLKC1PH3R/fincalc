import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Valeur calculée pour les types manuels (balance dans metadata)
function computeManualValue(type: string, metadata: Record<string, unknown>): number {
  switch (type) {
    case 'LIVRET':
    case 'PER':
    case 'CASH':
      return Number(metadata.balance ?? 0)
    case 'AV':
      return Number(metadata.surrenderValue ?? 0)
    case 'IMMOBILIER': {
      const v = Number(metadata.currentValue ?? 0)
      const c = Number(metadata.creditRemaining ?? 0)
      return Math.max(0, v - c)
    }
    default:
      return 0
  }
}

// GET — liste toutes les enveloppes avec valeur calculée (hors prix marché)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
    include: {
      envelopes: {
        include: {
          positions: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!portfolio) return NextResponse.json([])

  const envelopes = portfolio.envelopes.map(e => {
    const meta = e.metadata as Record<string, unknown>
    const isMarketBased = ['PEA', 'CTO', 'CRYPTO'].includes(e.type)
    // Pour les types marché, on retourne null (le front calculera avec les prix temps réel)
    const totalValue = isMarketBased ? null : computeManualValue(e.type, meta)
    return {
      id: e.id,
      type: e.type,
      name: e.name,
      metadata: meta,
      sortOrder: e.sortOrder,
      positions: e.positions,
      positionCount: e.positions.length,
      totalValue,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }
  })

  return NextResponse.json(envelopes)
}

// POST — crée une nouvelle enveloppe
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { type, name, metadata = {} } = body

  if (!type || !name?.trim()) {
    return NextResponse.json({ error: 'type et name sont requis' }, { status: 400 })
  }

  const VALID_TYPES = ['LIVRET', 'IMMOBILIER', 'PEA', 'AV', 'CTO', 'CRYPTO', 'PER', 'CASH']
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
  }

  // Upsert portfolio
  const portfolio = await prisma.portfolio.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  })

  // Déterminer le sortOrder (après la dernière enveloppe)
  const count = await prisma.patrimoineEnvelope.count({
    where: { portfolioId: portfolio.id },
  })

  const envelope = await prisma.patrimoineEnvelope.create({
    data: {
      portfolioId: portfolio.id,
      type,
      name: name.trim(),
      metadata,
      sortOrder: count,
    },
  })

  return NextResponse.json(envelope, { status: 201 })
}
