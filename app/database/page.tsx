import Shell from '@/components/Shell'
import {sql} from '@/lib/server'
import Link from 'next/link'
export const dynamic='force-dynamic'
export default async function Database(){const tables=await sql<any>(`select table_schema, table_name from information_schema.tables where table_schema not in ('pg_catalog','information_schema') order by table_schema, table_name`);return <Shell><p className="text-xs uppercase tracking-[.24em] text-amber-400">Data</p><h1 className="text-3xl font-semibold mt-2">Database explorer</h1><p className="muted mt-2">Inspect and operate existing tables. Nothing is created by this app.</p><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-7">{tables.map((t:any)=><Link href={'/database/'+encodeURIComponent(t.table_schema+'.'+t.table_name)} key={t.table_schema+'.'+t.table_name} className="card p-4 hover:bg-white/6"><div className="text-xs muted">{t.table_schema}</div><div className="font-medium mt-1 break-all">{t.table_name}</div></Link>)}</div></Shell>}
