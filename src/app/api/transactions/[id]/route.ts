import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isDemoUser } from '@/lib/demo'

const DEMO_RO = () => NextResponse.json({ error: 'Compte démo — modifications non autorisées.' }, { status: 403 })

export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  if (isDemoUser(session.user.email)) return DEMO_RO()

  const { id } = await props.params

  const transaction = await prisma.assetTransaction.findUnique({ where: { id } })
  if (!transaction) return NextResponse.json({ error: 'Transaction introuvable' }, { status: 404 })
  if (transaction.userId !== session.user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  await prisma.assetTransaction.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
