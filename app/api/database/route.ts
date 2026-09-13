import { NextResponse } from 'next/server'
import { assertDeveloperAccess } from '@/lib/auth'
import { sql, supabaseAdmin } from '@/lib/server'

function identifier(value: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new Error('Invalid identifier')
  return value
}

function parseTable(raw: string) {
  const decoded = decodeURIComponent(raw)
  const parts = decoded.includes('.') ? decoded.split('.', 2) : ['public', decoded]
  if (parts[0] !== 'public') throw new Error('Only public tables can be edited from this console')
  return { schema: identifier(parts[0]), table: identifier(parts[1]) }
}

export async function GET(req: Request) {
  try {
    await assertDeveloperAccess()
    const { searchParams } = new URL(req.url)
    const raw = searchParams.get('table')
    if (!raw) throw new Error('Table is required')
    const { schema, table } = parseTable(raw)
    const columns = await sql<any>(
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
      [schema, table],
    )

    if (!columns.length) throw new Error('Table not found')

    const { data, error } = await supabaseAdmin.from(table).select('*').range(0, 99)
    if (error) throw error

    return NextResponse.json({ schema, table, columns, rows: data ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'UNAUTHORIZED' ? 401 : 400 })
  }
}

export async function POST(req: Request) {
  try {
    await assertDeveloperAccess()
    const body = await req.json()
    const { schema, table } = parseTable(String(body.table ?? ''))
    if (schema !== 'public') throw new Error('Only public tables are supported')
    const values = body.values
    if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('Row values are required')

    const { data, error } = await supabaseAdmin.from(table).insert(values).select().single()
    if (error) throw error
    return NextResponse.json({ ok: true, row: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'UNAUTHORIZED' ? 401 : 400 })
  }
}

export async function PATCH(req: Request) {
  try {
    await assertDeveloperAccess()
    const body = await req.json()
    const { schema, table } = parseTable(String(body.table ?? ''))
    if (schema !== 'public') throw new Error('Only public tables are supported')
    const key = String(body.key ?? '')
    const keyValue = body.keyValue
    const values = body.values
    if (!key || !values || typeof values !== 'object' || Array.isArray(values)) throw new Error('Update values are required')
    if (key === 'id' && keyValue == null) throw new Error('Primary key value is required')

    const { data, error } = await supabaseAdmin.from(table).update(values).eq(key, keyValue).select().single()
    if (error) throw error
    return NextResponse.json({ ok: true, row: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'UNAUTHORIZED' ? 401 : 400 })
  }
}

export async function DELETE(req: Request) {
  try {
    await assertDeveloperAccess()
    const body = await req.json()
    const { schema, table } = parseTable(String(body.table ?? ''))
    if (schema !== 'public') throw new Error('Only public tables are supported')
    const key = String(body.key ?? '')
    const keyValue = body.keyValue
    if (!key || keyValue == null) throw new Error('A row key is required')

    const { error } = await supabaseAdmin.from(table).delete().eq(key, keyValue)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.message === 'UNAUTHORIZED' ? 401 : 400 })
  }
}
