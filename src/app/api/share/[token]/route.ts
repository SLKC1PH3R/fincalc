import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params
  const sim = await prisma.simulation.findUnique({
    where: { shareToken: token },
    select: { type: true, name: true, inputs: true, results: true, createdAt: true },
  })
  if (!sim) return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 404 })
  return NextResponse.json(sim)
}
