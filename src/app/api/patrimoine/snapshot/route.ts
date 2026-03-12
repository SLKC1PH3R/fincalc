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

  const snapshot = await prisma.patrimoineSnapshot.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    update: { totalValue, byEnvelope },
    create: { userId: user.id, date: today, totalValue, byEnvelope },
  })

  return NextResponse.json(snapshot)
}
