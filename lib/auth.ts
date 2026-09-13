import 'server-only'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function assertDeveloperAccess() {
  const name = process.env.DEV_CONTROL_COOKIE || 'bp_dev_control'
  const expected = process.env.DEV_CONTROL_SECRET
  if (!expected) throw new Error('DEV_CONTROL_SECRET is not configured')
  const actual = cookies().get(name)?.value || ''
  const a = Buffer.from(actual)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('UNAUTHORIZED')
  }
}
