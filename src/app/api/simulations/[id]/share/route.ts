import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const sim = await prisma.simulation.findUnique({ where: { id } })
  if (!sim) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  if (sim.userId !== session.user.id) return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  // Reuse existing token or generate a new one
  const shareToken = sim.shareToken ?? crypto.randomUUID()
  await prisma.simulation.update({ where: { id }, data: { shareToken } })

  return NextResponse.json({ url: `/share/${shareToken}` })
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const sim = await prisma.simulation.findUnique({ where: { id } })
  if (!sim) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })
  if (sim.userId !== session.user.id) return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  await prisma.simulation.update({ where: { id }, data: { shareToken: null } })
  return NextResponse.json({ ok: true })
}
