import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function getEnvelope(id: string, userId: string) {
  return prisma.patrimoineEnvelope.findFirst({
    where: { id, portfolio: { userId } },
    include: { positions: { orderBy: { createdAt: 'asc' } } },
  })
}

// GET — retourne une enveloppe avec ses positions
export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const envelope = await getEnvelope(id, session.user.id)
  if (!envelope) return NextResponse.json({ error: 'Enveloppe introuvable' }, { status: 404 })

  return NextResponse.json(envelope)
}

// PATCH — met à jour name, metadata, sortOrder
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const envelope = await getEnvelope(id, session.user.id)
  if (!envelope) return NextResponse.json({ error: 'Enveloppe introuvable' }, { status: 404 })

  const body = await req.json()
  const { name, metadata, sortOrder } = body

  const updated = await prisma.patrimoineEnvelope.update({
    where: { id },
    data: {
      ...(name != null && { name: name.trim() }),
      ...(metadata != null && { metadata }),
      ...(sortOrder != null && { sortOrder: Number(sortOrder) }),
    },
  })

  return NextResponse.json(updated)
}

// DELETE — supprime l'enveloppe (positions → envelopeId = null)
export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const envelope = await getEnvelope(id, session.user.id)
  if (!envelope) return NextResponse.json({ error: 'Enveloppe introuvable' }, { status: 404 })

  // Détacher les positions (SetNull via cascade Prisma, mais on force ici pour sécurité)
  await prisma.portfolioPosition.updateMany({
    where: { envelopeId: id },
    data: { envelopeId: null },
  })

  await prisma.patrimoineEnvelope.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
