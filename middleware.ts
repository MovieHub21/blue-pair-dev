import { NextResponse, type NextRequest } from 'next/server'
import crypto from 'crypto'

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const publicPaths = ['/login', '/api/auth/login', '/api/auth/logout', '/api/auth/status']

  if (publicPaths.includes(path)) return NextResponse.next()

  const expected = process.env.DEV_CONTROL_SECRET
  const cookieName = process.env.DEV_CONTROL_COOKIE || 'bp_dev_control'
  const value = req.cookies.get(cookieName)?.value || ''
  const valid = !!expected && value.length === expected.length && crypto.timingSafeEqual(Buffer.from(value), Buffer.from(expected))

  if (valid) return NextResponse.next()

  return NextResponse.redirect(new URL('/login', req.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
