import Shell from '@/components/Shell'
import SqlClient from './SqlClient'
export default function SQL(){return <Shell><p className="text-xs uppercase tracking-[.24em] text-amber-400">Power tools</p><h1 className="text-3xl font-semibold mt-2">SQL console</h1><p className="muted mt-2">Server-side SQL only. Enable it deliberately with ENABLE_SQL_CONSOLE=true.</p><SqlClient/></Shell>}
