import { NextResponse } from 'next/server'
import crypto from 'crypto'

function safeEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function POST(req: Request) {
  const expected = process.env.DEV_CONTROL_SECRET

  if (!expected) {
    return NextResponse.json({ error: 'Developer authentication is not configured.' }, { status: 500 })
  }

  let body: { password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const password = typeof body.password === 'string' ? body.password : ''

  if (!safeEqual(password, expected)) {
    return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 })
  }

  const response = NextResponse.json({ authenticated: true })
  response.cookies.set({
    name: process.env.DEV_CONTROL_COOKIE || 'bp_dev_control',
    value: expected,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
