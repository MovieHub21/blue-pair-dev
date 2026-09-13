import Shell from '@/components/Shell'
import Controls from './Controls'
import { sql } from '@/lib/server'
export const dynamic='force-dynamic'
export default async function System(){let row:any=null;try{row=(await sql('select * from public.site_settings where environment=$1 limit 1',[process.env.SITE_ENVIRONMENT||'production']))[0]||null}catch{}return <Shell><p className="text-xs uppercase tracking-[.24em] text-amber-400">Website</p><h1 className="text-3xl font-semibold mt-2">Website controls</h1><p className="muted mt-2">Direct controls for settings already supported by the live Blue Pair backend.</p><Controls initial={row} environment={process.env.SITE_ENVIRONMENT||'production'}/></Shell>}
