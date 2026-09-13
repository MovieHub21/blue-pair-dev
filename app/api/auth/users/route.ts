import { NextResponse } from 'next/server'
import { assertDeveloperAccess } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/server'

export async function GET() {
  try {
    await assertDeveloperAccess()

    const [{ data, error }, { data: roleRows, error: roleError }] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from('user_roles').select('user_id,role'),
    ])

    if (error) throw error
    if (roleError) throw roleError

    const rolesByUser = new Map<string, string[]>()
    for (const row of roleRows ?? []) {
      const roles = rolesByUser.get(row.user_id) ?? []
      roles.push(row.role)
      rolesByUser.set(row.user_id, roles)
    }

    const users = data.users.map((user) => ({
      ...user,
      roles: rolesByUser.get(user.id) ?? [],
      isSuperAdmin: (rolesByUser.get(user.id) ?? []).includes('super_admin'),
      isBanned: !!user.banned_until && new Date(user.banned_until).getTime() > Date.now(),
      bannedUntil: user.banned_until,
    }))

    return NextResponse.json({ users })
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === 'UNAUTHORIZED' ? 401 : 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    await assertDeveloperAccess()

    const { id, action } = await req.json()
    if (!id) throw new Error('User id required')

    if (action === 'delete') {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    if (action === 'ban') {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
        ban_duration: '876000h',
      })
      if (error) throw error
      return NextResponse.json({
        ok: true,
        banned: true,
        bannedUntil: data.user?.banned_until ?? null,
      })
    }

    if (action === 'unban') {
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
        ban_duration: 'none',
      })
      if (error) throw error
      return NextResponse.json({
        ok: true,
        banned: false,
        bannedUntil: data.user?.banned_until ?? null,
      })
    }

    if (action === 'make_super_admin') {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', id)
        .eq('role', 'super_admin')
        .maybeSingle()

      if (existingError) throw existingError

      if (!existing) {
        const { error } = await supabaseAdmin.from('user_roles').insert({
          user_id: id,
          role: 'super_admin',
        })
        if (error) throw error
      }

      return NextResponse.json({ ok: true, isSuperAdmin: true })
    }

    if (action === 'remove_super_admin') {
      const { data: admins, error: countError } = await supabaseAdmin
        .from('user_roles')
        .select('id,user_id')
        .eq('role', 'super_admin')

      if (countError) throw countError
      if ((admins ?? []).length <= 1 && (admins ?? []).some((row) => row.user_id === id)) {
        throw new Error('Cannot remove the last super admin.')
      }

      const { error } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', id)
        .eq('role', 'super_admin')

      if (error) throw error
      return NextResponse.json({ ok: true, isSuperAdmin: false })
    }

    throw new Error('Unknown action')
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: e.message === 'UNAUTHORIZED' ? 401 : 400 },
    )
  }
}
