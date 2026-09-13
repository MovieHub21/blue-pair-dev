import Shell from '@/components/Shell'
import { sql } from '@/lib/server'

export const dynamic = 'force-dynamic'

export default async function Logs() {
  let rows: any[] = []
  let message = ''

  try {
    rows = await sql(`select * from public.activity_logs order by created_at desc limit 100`)
  } catch (e: any) {
    message = 'The existing activity_logs table could not be read: ' + e.message
  }

  return (
    <Shell>
      <p className="text-xs uppercase tracking-[.24em] text-amber-400">Observability</p>
      <h1 className="text-3xl font-semibold mt-2">Activity logs</h1>
      <p className="muted mt-2">Reads the existing Blue Pair activity log; no developer logging table is created.</p>
      <div className="card mt-7 overflow-auto">
        {message ? <div className="p-6 text-sm text-red-200">{message}</div> : rows.length === 0 ? <div className="p-6 muted">No audit entries found.</div> : <pre className="p-5 text-xs leading-6">{JSON.stringify(rows, null, 2)}</pre>}
      </div>
    </Shell>
  )
}
