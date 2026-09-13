import { NextResponse } from 'next/server'
import { assertDeveloperAccess } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/server'

export async function POST(req: Request) {
  try {
    await assertDeveloperAccess()
    const { enabled, environment } = await req.json()

    if (!['development', 'preview', 'production'].includes(environment)) {
      throw new Error('Invalid environment')
    }

    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .update({ maintenance_mode: !!enabled, updated_at: new Date().toISOString() })
      .eq('environment', environment)
      .select('environment,maintenance_mode,updated_at')
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error(`site_settings row not found for ${environment}`)

    return NextResponse.json({
      environment: data.environment,
      enabled: data.maintenance_mode,
      updatedAt: data.updated_at,
    })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message === 'UNAUTHORIZED' ? 'Unauthorized' : e.message },
      { status: e.message === 'UNAUTHORIZED' ? 401 : 400 },
    )
  }
}
