import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { runDemoSeed } from '@/lib/demo-seed'

function isAdmin(email: string | null | undefined) {
  return email === process.env.ADMIN_EMAIL
}

// POST — réinitialise toutes les données du compte démo
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Interdit' }, { status: 403 })
  }

  try {
    const counts = await runDemoSeed()
    return NextResponse.json({ ok: true, ...counts })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
