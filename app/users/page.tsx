import Shell from '@/components/Shell'
import UsersClient from './UsersClient'
export const dynamic='force-dynamic'
export default function Users(){return <Shell><p className="text-xs uppercase tracking-[.24em] text-amber-400">Identity</p><h1 className="text-3xl font-semibold mt-2">Auth users</h1><p className="muted mt-2">Supabase Admin API. This does not create a developer identity or role.</p><UsersClient/></Shell>}
