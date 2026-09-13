'use client'
import { useEffect, useState } from 'react'

export default function UsersClient() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const r = await fetch('/api/auth/users')
    const j = await r.json()
    setUsers(j.users || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const act = async (id: string, action: string, label: string) => {
    if (!confirm(`Confirm ${label} for this user?`)) return
    const r = await fetch('/api/auth/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    const j = await r.json()
    if (!r.ok) alert(j.error || 'Failed')
    await load()
  }

  return (
    <div className="card mt-7 overflow-auto">
      {loading ? <div className="p-6 muted">Loading…</div> : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left muted border-b border-white/8">
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Created</th>
              <th className="p-4">Last sign-in</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-white/5">
                <td className="p-4">
                  {u.email || '—'}
                  <div className="text-[10px] muted mt-1">{u.id}</div>
                </td>
                <td className="p-4">
                  {u.isSuperAdmin
                    ? <span className="inline-flex px-2 py-1 rounded-full bg-amber-400/15 text-amber-300 text-xs font-medium">Super Admin</span>
                    : <span className="muted text-xs">User</span>}
                </td>
                <td className="p-4 muted">{u.created_at?.slice(0, 10)}</td>
                <td className="p-4 muted">{u.last_sign_in_at?.slice(0, 19) || '—'}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {u.isSuperAdmin ? (
                      <button onClick={() => act(u.id, 'remove_super_admin', 'remove Super Admin access')} className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-200 text-xs">Remove Super Admin</button>
                    ) : (
                      <button onClick={() => act(u.id, 'make_super_admin', 'make this user a Super Admin')} className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-200 text-xs">Make Super Admin</button>
                    )}
                    <button onClick={() => act(u.id, 'ban', 'ban')} className="px-3 py-1.5 rounded-lg bg-white/8 text-xs">Ban</button>
                    <button onClick={() => act(u.id, 'delete', 'delete')} className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-200 text-xs">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
