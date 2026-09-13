import Shell from '@/components/Shell'
import { sql } from '@/lib/server'
import Link from 'next/link'
import TableClient from './TableClient'

export const dynamic = 'force-dynamic'

function ident(v: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(v)) throw new Error('Invalid identifier')
  return '"' + v.replace(/"/g, '""') + '"'
}

export default async function TablePage({ params }: { params: { table: string } }) {
  const raw = decodeURIComponent(params.table)
  const [schema, name] = raw.includes('.') ? raw.split('.', 2) : ['public', raw]
  if (schema !== 'public') throw new Error('Only public tables can be edited from this console')

  const table = ident(schema) + '.' + ident(name)
  const cols = await sql<any>(
    `select c.column_name,c.data_type,c.udt_name,c.is_nullable,c.column_default,
      case when pk.column_name is not null then true else false end as is_primary_key
     from information_schema.columns c
     left join (
       select kcu.column_name
       from information_schema.table_constraints tc
       join information_schema.key_column_usage kcu on kcu.constraint_name=tc.constraint_name and kcu.table_schema=tc.table_schema and kcu.table_name=tc.table_name
       where tc.table_schema=$1 and tc.table_name=$2 and tc.constraint_type='PRIMARY KEY'
     ) pk on pk.column_name=c.column_name
     where c.table_schema=$1 and c.table_name=$2
     order by c.ordinal_position`,
    [schema, name],
  )

  if (!cols.length) throw new Error('Table not found')

  let rows: any[] = []
  let error = ''
  try {
    rows = await sql(`select * from ${table} limit 100`)
  } catch (e: any) {
    error = e.message
  }

  return <Shell>
    <div className="flex gap-3 text-sm mb-5"><Link href="/database" className="muted hover:text-white">Database</Link><span className="muted">/</span><span>{schema}.{name}</span></div>
    <h1 className="text-2xl font-semibold">{name}</h1>
    <p className="muted text-sm mt-1">Direct Supabase editor · {cols.length} columns · first 100 rows</p>

    <div className="card p-4 mt-6 overflow-auto">
      <h2 className="font-semibold mb-3">Schema</h2>
      <table className="w-full text-xs"><thead><tr className="text-left muted border-b border-white/8"><th className="p-2">Column</th><th className="p-2">Type</th><th className="p-2">Nullable</th><th className="p-2">Default</th><th className="p-2">Key</th></tr></thead><tbody>{cols.map((c: any) => <tr key={c.column_name} className="border-b border-white/5"><td className="p-2">{c.column_name}</td><td className="p-2 muted">{c.data_type}</td><td className="p-2 muted">{c.is_nullable}</td><td className="p-2 muted max-w-xs truncate">{c.column_default || '—'}</td><td className="p-2">{c.is_primary_key ? 'PRIMARY KEY' : '—'}</td></tr>)}</tbody></table>
    </div>

    {error ? <div className="card p-4 mt-5 text-red-300 text-sm">{error}<p className="muted mt-2">The table editor uses Supabase directly, so editing can still work once the service-role environment variables are configured.</p></div> : <TableClient table={`${schema}.${name}`} columns={cols} initialRows={rows} />}
  </Shell>
}
