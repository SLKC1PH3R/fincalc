import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isDemoUser } from '@/lib/demo'

const DEMO_RO = () =>
  NextResponse.json({ error: 'Compte démo — modifications non autorisées.' }, { status: 403 })

// GET — liste tous les objectifs de l'utilisateur
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const goals = await prisma.PatrimoineGoal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(goals)
}

// POST — crée un nouvel objectif
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (isDemoUser(session.user.email)) return DEMO_RO()

  const body = await req.json()
  const { title, description, targetAmount, targetDate, envelopeId, color } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Le titre est requis' }, { status: 400 })
  }
  if (!targetAmount || isNaN(Number(targetAmount)) || Number(targetAmount) <= 0) {
    return NextResponse.json({ error: 'Le montant cible est requis' }, { status: 400 })
  }

  const goal = await prisma.PatrimoineGoal.create({
    data: {
      userId: session.user.id,
      title: title.trim(),
      description: description?.trim() || null,
      targetAmount: Number(targetAmount),
      targetDate: targetDate ? new Date(targetDate) : null,
      envelopeId: envelopeId || null,
      color: color || '#f97316',
    },
  })

  return NextResponse.json(goal, { status: 201 })
}
