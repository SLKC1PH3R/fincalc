import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingDone: true, financialProfile: true },
  })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(user)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { onboardingDone, financialProfile } = body

  const data: Record<string, unknown> = {}
  if (typeof onboardingDone === 'boolean') data.onboardingDone = onboardingDone
  if (financialProfile !== undefined) data.financialProfile = financialProfile

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { onboardingDone: true, financialProfile: true },
  })

  return NextResponse.json(user)
}
