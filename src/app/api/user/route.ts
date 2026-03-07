import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const DEMO_EMAIL = 'demo@digitalstack.cloud'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const body = await req.json()
  const { name, image, targetEmail } = body

  // Determine which user to update
  let targetUserId = session.user.id
  let targetUserEmail = session.user.email

  if (targetEmail) {
    // Only admin can edit another user's profile
    if (!session.user.isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    const targetUser = await prisma.user.findUnique({ where: { email: targetEmail }, select: { id: true, email: true } })
    if (!targetUser) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    targetUserId = targetUser.id
    targetUserEmail = targetUser.email
  }

  // Block demo account from editing its own profile
  if (targetUserEmail === DEMO_EMAIL && !session.user.isAdmin) {
    return NextResponse.json({ error: 'Le compte démo ne peut pas être modifié.' }, { status: 403 })
  }

  try {
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(name !== undefined && { name: name.trim() || null }),
        ...(image !== undefined && { image: image || null }),
      },
      select: { id: true, name: true, email: true }
    })

    // Try to get image too
    let resultImage: string | null = null
    try {
      const imgResult = await prisma.$queryRaw<{ image: string | null }[]>`
        SELECT image FROM "User" WHERE id = ${targetUserId}
      `
      resultImage = imgResult[0]?.image ?? null
    } catch { /* image column may not exist yet */ }

    return NextResponse.json({ ...updated, image: resultImage })
  } catch (err: any) {
    // If image column doesn't exist, retry without it
    if (err?.message?.includes('image') || err?.code === 'P2009') {
      const updated = await prisma.user.update({
        where: { id: targetUserId },
        data: { ...(name !== undefined && { name: name.trim() || null }) },
        select: { id: true, name: true, email: true }
      })
      return NextResponse.json({ ...updated, image: null })
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
