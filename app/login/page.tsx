'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        setError('Invalid developer password.')
        setPassword('')
        return
      }

      router.replace('/dashboard')
      router.refresh()
    } catch {
      setError('Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="card w-full max-w-md p-8">
        <div className="mb-8">
          <div className="text-3xl mb-3">🔐</div>
          <h1 className="text-2xl font-semibold">Developer Control</h1>
          <p className="muted mt-2 text-sm leading-6">
            Private access to the Blue Pair developer control center.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Developer password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border px-4 py-3 bg-transparent outline-none focus:ring-2"
              placeholder="Enter your private password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-4 py-3 font-medium border disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="muted mt-6 text-xs leading-5">
          This login is independent of Blue Pair Supabase users. No developer
          account, profile, role, or database record is created.
        </p>
      </div>
    </main>
  )
}
