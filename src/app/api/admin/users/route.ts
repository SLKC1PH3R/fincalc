import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  if (session.user.email !== process.env.ADMIN_EMAIL) return null
  return session
}

export async function GET() {
  const session = await checkAdmin()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      _count: { select: { simulations: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Fetch image separately with raw query to handle schema differences gracefully
  let usersWithImage: Array<typeof users[0] & { image?: string | null }> = users

  try {
    const images = await prisma.$queryRaw<{ id: string; image: string | null }[]>`
      SELECT id, image FROM "User"
    `
    const imageMap = new Map(images.map(u => [u.id, u.image]))
    usersWithImage = users.map(u => ({ ...u, image: imageMap.get(u.id) ?? null }))
  } catch {
    // image column doesn't exist yet - return users without it
    usersWithImage = users.map(u => ({ ...u, image: null }))
  }

  return NextResponse.json(usersWithImage)
}

export async function DELETE(req: NextRequest) {
  const session = await checkAdmin()
  if (!session) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('id')
  if (!userId) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  if (userId === session.user.id) {
    return NextResponse.json({ error: 'Impossible de supprimer votre propre compte' }, { status: 400 })
  }

  await prisma.user.delete({ where: { id: userId } })
  return NextResponse.json({ success: true })
}
