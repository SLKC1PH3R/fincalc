import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH — met à jour une position
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { name, quantity, pru } = body

  // Vérifie que la position appartient bien à l'utilisateur
  const position = await prisma.portfolioPosition.findFirst({
    where: { id, portfolio: { userId: session.user.id } },
  })
  if (!position) return NextResponse.json({ error: 'Position introuvable' }, { status: 404 })

  const updated = await prisma.portfolioPosition.update({
    where: { id },
    data: {
      ...(name != null && { name: name.trim() }),
      ...(quantity != null && { quantity: Number(quantity) }),
      ...(pru != null && { pru: Number(pru) }),
    },
  })

  return NextResponse.json(updated)
}

// DELETE — supprime une position
export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const position = await prisma.portfolioPosition.findFirst({
    where: { id, portfolio: { userId: session.user.id } },
  })
  if (!position) return NextResponse.json({ error: 'Position introuvable' }, { status: 404 })

  await prisma.portfolioPosition.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
