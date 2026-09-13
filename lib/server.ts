import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { Pool } from 'pg'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

let pool: Pool | null = null
export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured')
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 5000 })
  return pool
}

export async function sql<T = any>(text: string, values: any[] = []) {
  const result = await db().query(text, values)
  return result.rows as T[]
}
