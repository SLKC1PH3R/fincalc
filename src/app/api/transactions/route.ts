import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isDemoUser } from '@/lib/demo'

const DEMO_RO = () => NextResponse.json({ error: 'Compte démo — modifications non autorisées.' }, { status: 403 })
const VALID_TYPES = ['BUY', 'SELL', 'DIVIDEND', 'SPLIT', 'TRANSFER']

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const envelopeId = searchParams.get('envelopeId')
  const symbol = searchParams.get('symbol')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { userId: session.user.id }
  if (envelopeId) where.envelopeId = envelopeId
  if (symbol) where.symbol = symbol

  const transactions = await prisma.assetTransaction.findMany({
    where,
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(transactions)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (isDemoUser(session.user.email)) return DEMO_RO()

  const body = await req.json()
  const { envelopeId, positionId, symbol, name, type, quantity, price, fees, date, notes } = body

  if (!symbol || !type || !quantity || !price || !date) {
    return NextResponse.json({ error: 'Champs requis manquants: symbol, type, quantity, price, date' }, { status: 400 })
  }

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: `Type invalide. Valeurs acceptées: ${VALID_TYPES.join(', ')}` }, { status: 400 })
  }

  const transaction = await prisma.assetTransaction.create({
    data: {
      userId: session.user.id,
      envelopeId: envelopeId ?? null,
      positionId: positionId ?? null,
      symbol,
      name: name ?? '',
      type,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      fees: parseFloat(fees ?? 0),
      date: new Date(date),
      notes: notes ?? null,
    },
  })

  return NextResponse.json(transaction, { status: 201 })
}
