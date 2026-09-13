import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ authenticated: false })
  response.cookies.set({
    name: process.env.DEV_CONTROL_COOKIE || 'bp_dev_control',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return response
}
