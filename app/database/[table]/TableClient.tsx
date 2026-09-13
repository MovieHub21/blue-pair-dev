'use client'

import { useMemo, useState } from 'react'

function display(value: any) {
  if (value === null || value === undefined) return ''
  return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
}

function parseValue(text: string, type: string) {
  if (text === '') return null
  if (type === 'json' || type === 'jsonb') {
    try { return JSON.parse(text) } catch { throw new Error('Invalid JSON value') }
  }
  if (type === 'boolean') return text === 'true'
  if (['integer', 'bigint', 'smallint', 'numeric', 'real', 'double precision', 'decimal'].includes(type)) return Number(text)
  return text
}

export default function TableClient({ table, columns, initialRows }: { table: string; columns: any[]; initialRows: any[] }) {
  const [rows, setRows] = useState(initialRows)
  const [editing, setEditing] = useState<any | null>(null)
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  const pk = columns.find(c => c.is_primary_key)?.column_name || columns.find(c => c.column_name === 'id')?.column_name
  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(row => Object.values(row).some(value => display(value).toLowerCase().includes(q)))
  }, [rows, search])

  function startEdit(row: any) {
    setMessage('')
    setEditing({ ...row })
    setAdding(false)
  }

  function startAdd() {
    const next: any = {}
    columns.forEach(c => { if (!c.column_default && c.is_nullable === 'YES') next[c.column_name] = null })
    setEditing(next)
    setAdding(true)
    setMessage('')
  }

  async function save() {
    setBusy(true); setMessage('')
    try {
      const values: any = {}
      for (const column of columns) {
        const key = column.column_name
        if (!adding && key === pk) continue
        if (Object.prototype.hasOwnProperty.call(editing, key)) values[key] = parseValue(display(editing[key]), column.data_type)
      }
      const response = await fetch('/api/database', {
        method: adding ? 'POST' : 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ table, values, key: pk, keyValue: editing?.[pk] }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Database operation failed')
      if (adding) setRows(current => [...current, result.row])
      else setRows(current => current.map(row => row[pk!] === editing[pk!] ? result.row : row))
      setEditing(null); setAdding(false); setMessage(adding ? 'Row added.' : 'Row updated.')
    } catch (error: any) {
      setMessage(error.message)
    } finally { setBusy(false) }
  }

  async function remove(row: any) {
    if (!pk) return setMessage('This table has no detectable primary key. Delete it from SQL instead.')
    if (!confirm(`Delete this row from ${table}? This cannot be undone.`)) return
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/database', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ table, key: pk, keyValue: row[pk] }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Delete failed')
      setRows(current => current.filter(item => item[pk] !== row[pk]))
      setMessage('Row deleted.')
    } catch (error: any) { setMessage(error.message) } finally { setBusy(false) }
  }

  return <>
    <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mt-6">
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search rows…" className="w-full md:max-w-sm bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400/50" />
      <button onClick={startAdd} className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm">+ Add row</button>
    </div>

    {message && <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">{message}</div>}

    <div className="card p-4 mt-5 overflow-auto">
      <div className="flex items-center justify-between mb-3"><h2 className="font-semibold">Rows</h2><span className="text-xs muted">{visibleRows.length} shown · max 100</span></div>
      {visibleRows.length === 0 ? <p className="muted text-sm">No rows match.</p> : <table className="min-w-full text-xs"><thead><tr className="text-left border-b border-white/8">{columns.map(c => <th key={c.column_name} className="p-2 whitespace-nowrap">{c.column_name}</th>)}<th className="p-2">Actions</th></tr></thead><tbody>{visibleRows.map((row, index) => <tr key={pk ? String(row[pk]) : index} className="border-b border-white/5">{columns.map(c => <td key={c.column_name} className="p-2 align-top max-w-[260px] truncate" title={display(row[c.column_name])}>{display(row[c.column_name]) || '—'}</td>)}<td className="p-2 whitespace-nowrap"><button disabled={busy} onClick={() => startEdit(row)} className="text-amber-300 hover:text-amber-200 mr-3">Edit</button><button disabled={busy} onClick={() => remove(row)} className="text-red-300 hover:text-red-200">Delete</button></td></tr>)}</tbody></table>}
    </div>

    {editing && <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center"><div className="w-full max-w-3xl max-h-[90vh] overflow-auto rounded-2xl border border-white/10 bg-[#111] p-5 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold">{adding ? 'Add row' : 'Edit row'}</h2><p className="muted text-xs mt-1">Changes are written directly to Supabase.</p></div><button onClick={() => setEditing(null)} className="muted hover:text-white">✕</button></div><div className="grid md:grid-cols-2 gap-4 mt-6">{columns.map(c => { const locked = !adding && c.column_name === pk; const value = editing[c.column_name]; return <label key={c.column_name} className="block"><span className="text-xs muted">{c.column_name} <span className="opacity-60">({c.data_type})</span>{locked && ' · primary key'}</span><textarea disabled={locked} value={display(value)} onChange={e => setEditing((current: any) => ({ ...current, [c.column_name]: e.target.value }))} className="mt-1 w-full min-h-20 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-amber-400/50 disabled:opacity-50" /></label>})}</div><div className="flex justify-end gap-3 mt-6"><button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-white/10">Cancel</button><button disabled={busy} onClick={save} className="px-5 py-2 rounded-xl bg-amber-500 text-black font-semibold disabled:opacity-50">{busy ? 'Saving…' : 'Save changes'}</button></div></div></div>}
  </>
}
