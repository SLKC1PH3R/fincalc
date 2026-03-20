import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Sets x-pathname header so dashboard/layout.tsx can read the current path
export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set('x-pathname', request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: '/dashboard/:path*',
}
