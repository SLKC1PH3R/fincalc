import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { totalValue, byEnvelope } = body as { totalValue: number; byEnvelope: Record<string, unknown> }

  const today = new Date(new Date().toISOString().split('T')[0])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byEnvelopeJson = byEnvelope as any

  const snapshot = await prisma.PatrimoineSnapshot.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    update: { totalValue, byEnvelope: byEnvelopeJson },
    create: { userId: user.id, date: today, totalValue, byEnvelope: byEnvelopeJson },
  })

  return NextResponse.json(snapshot)
}
