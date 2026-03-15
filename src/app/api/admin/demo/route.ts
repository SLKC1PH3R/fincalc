import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEMO_EMAIL } from '@/lib/demo-seed'

function isAdmin(email: string | null | undefined) {
  return email === process.env.ADMIN_EMAIL
}

// GET — retourne toutes les données du compte démo
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  const demoUser = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    select: { id: true, email: true, name: true, createdAt: true },
  })
  if (!demoUser) return NextResponse.json({ error: 'Compte démo introuvable' }, { status: 404 })

  const [simulations, portfolio] = await Promise.all([
    prisma.simulation.findMany({
      where: { userId: demoUser.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, type: true, name: true, inputs: true, results: true, createdAt: true },
    }),
    prisma.portfolio.findUnique({
      where: { userId: demoUser.id },
      include: {
        envelopes: {
          orderBy: { sortOrder: 'asc' },
          include: { positions: { orderBy: { createdAt: 'asc' } } },
        },
      },
    }),
  ])

  return NextResponse.json({
    user: demoUser,
    simulations,
    envelopes: portfolio?.envelopes ?? [],
    positions: portfolio?.envelopes.flatMap(e => e.positions) ?? [],
  })
}
