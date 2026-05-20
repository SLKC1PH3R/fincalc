import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ score: null })

  const last = await prisma.PatrimoineScore.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: { score: true },
  })

  return NextResponse.json({ score: last?.score ?? null })
}
