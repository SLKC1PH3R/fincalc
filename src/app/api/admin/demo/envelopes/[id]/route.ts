import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEMO_EMAIL } from '@/lib/demo-seed'

function isAdmin(email: string | null | undefined) {
  return email === process.env.ADMIN_EMAIL
}

// PATCH — modifie le nom / metadata d'une enveloppe démo
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  const demoUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (!demoUser) return NextResponse.json({ error: 'Compte démo introuvable' }, { status: 404 })

  const env = await prisma.patrimoineEnvelope.findFirst({
    where: { id, portfolio: { userId: demoUser.id } },
  })
  if (!env) return NextResponse.json({ error: 'Enveloppe introuvable' }, { status: 404 })

  const body = await req.json()
  const { name, metadata } = body

  const updated = await prisma.patrimoineEnvelope.update({
    where: { id },
    data: {
      ...(name != null && { name }),
      ...(metadata != null && { metadata }),
    },
  })
  return NextResponse.json(updated)
}

// DELETE — supprime une enveloppe démo (et détache ses positions)
export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  const demoUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (!demoUser) return NextResponse.json({ error: 'Compte démo introuvable' }, { status: 404 })

  const env = await prisma.patrimoineEnvelope.findFirst({
    where: { id, portfolio: { userId: demoUser.id } },
  })
  if (!env) return NextResponse.json({ error: 'Enveloppe introuvable' }, { status: 404 })

  await prisma.portfolioPosition.updateMany({ where: { envelopeId: id }, data: { envelopeId: null } })
  await prisma.patrimoineEnvelope.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
