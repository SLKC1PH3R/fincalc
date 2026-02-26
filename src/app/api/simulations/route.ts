import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  const simulations = await prisma.simulation.findMany({
    where: { userId: session.user.id, ...(type ? { type } : {}) },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(simulations)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { type, name, inputs, results } = body

  if (!type || !name || !inputs || !results) {
    return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
  }

  const simulation = await prisma.simulation.create({
    data: { userId: session.user.id, type, name, inputs, results },
  })

  return NextResponse.json(simulation, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id, inputs, results } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  const sim = await prisma.simulation.findFirst({ where: { id, userId: session.user.id } })
  if (!sim) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  const updated = await prisma.simulation.update({
    where: { id },
    data: { ...(inputs && { inputs }), ...(results && { results }) },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  // Ensure the simulation belongs to the user
  const sim = await prisma.simulation.findFirst({ where: { id, userId: session.user.id } })
  if (!sim) return NextResponse.json({ error: 'Introuvable' }, { status: 404 })

  await prisma.simulation.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
