import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function GET() {
  const expected = process.env.DEV_CONTROL_SECRET
  const cookieName = process.env.DEV_CONTROL_COOKIE || 'bp_dev_control'
  const value = cookies().get(cookieName)?.value || ''
  const authenticated = !!expected && value.length === expected.length && crypto.timingSafeEqual(Buffer.from(value), Buffer.from(expected))

  return NextResponse.json({ authenticated })
}
