import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isDemoUser } from '@/lib/demo'

const DEMO_RO = () =>
  NextResponse.json({ error: 'Compte démo — modifications non autorisées.' }, { status: 403 })

// PATCH — met à jour un objectif
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (isDemoUser(session.user.email)) return DEMO_RO()

  const goal = await prisma.patrimoineGoal.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!goal) return NextResponse.json({ error: 'Objectif introuvable' }, { status: 404 })

  const body = await req.json()
  const { title, description, targetAmount, targetDate, envelopeId, color } = body

  const updated = await prisma.patrimoineGoal.update({
    where: { id },
    data: {
      ...(title != null && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(targetAmount != null && { targetAmount: Number(targetAmount) }),
      ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
      ...(envelopeId !== undefined && { envelopeId: envelopeId || null }),
      ...(color != null && { color }),
    },
  })

  return NextResponse.json(updated)
}

// DELETE — supprime un objectif
export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (isDemoUser(session.user.email)) return DEMO_RO()

  const goal = await prisma.patrimoineGoal.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!goal) return NextResponse.json({ error: 'Objectif introuvable' }, { status: 404 })

  await prisma.patrimoineGoal.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
