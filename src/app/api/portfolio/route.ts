import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — liste toutes les positions de l'utilisateur
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
    include: { positions: { orderBy: { createdAt: 'asc' } } },
  })

  return NextResponse.json(portfolio?.positions ?? [])
}

// POST — ajoute une position (crée le portfolio si inexistant)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { assetType, symbol, name, isin, quantity, pru, currency, envelopeId } = body

  if (!assetType || !symbol || !name || quantity == null || pru == null) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  // Upsert portfolio (crée si inexistant)
  const portfolio = await prisma.portfolio.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  })

  // Vérifier que l'enveloppe appartient bien à cet utilisateur
  if (envelopeId) {
    const env = await prisma.patrimoineEnvelope.findFirst({
      where: { id: envelopeId, portfolio: { userId: session.user.id } },
    })
    if (!env) return NextResponse.json({ error: 'Enveloppe introuvable' }, { status: 404 })
  }

  const position = await prisma.portfolioPosition.create({
    data: {
      portfolioId: portfolio.id,
      envelopeId: envelopeId ?? null,
      assetType,
      symbol: symbol.trim().toUpperCase(),
      name: name.trim(),
      isin: isin ? isin.trim().toUpperCase() : null,
      quantity: Number(quantity),
      pru: Number(pru),
      currency: currency ?? 'EUR',
    },
  })

  return NextResponse.json(position, { status: 201 })
}
