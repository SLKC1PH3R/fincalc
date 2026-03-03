import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DEMO_EMAIL } from '@/lib/demo-seed'

function isAdmin(email: string | null | undefined) {
  return email === process.env.ADMIN_EMAIL
}

// PATCH — modifie name / inputs / results d'une simulation démo
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  const demoUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (!demoUser) return NextResponse.json({ error: 'Compte démo introuvable' }, { status: 404 })

  const sim = await prisma.simulation.findFirst({ where: { id, userId: demoUser.id } })
  if (!sim) return NextResponse.json({ error: 'Simulation introuvable' }, { status: 404 })

  const body = await req.json()
  const { name, inputs, results } = body

  const updated = await prisma.simulation.update({
    where: { id },
    data: {
      ...(name != null && { name }),
      ...(inputs != null && { inputs }),
      ...(results != null && { results }),
    },
  })
  return NextResponse.json(updated)
}

// DELETE — supprime une simulation démo
export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  const demoUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } })
  if (!demoUser) return NextResponse.json({ error: 'Compte démo introuvable' }, { status: 404 })

  const sim = await prisma.simulation.findFirst({ where: { id, userId: demoUser.id } })
  if (!sim) return NextResponse.json({ error: 'Simulation introuvable' }, { status: 404 })

  await prisma.simulation.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
