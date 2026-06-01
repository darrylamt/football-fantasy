'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/'); router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="font-barlow font-black text-4xl text-gray-900 tracking-tight">GFF</div>
          <div className="text-gray-400 text-sm mt-1">Ghana Fantasy Football</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-6">Sign in</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="border border-red-200 rounded-md px-3 py-2.5 text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white text-sm font-medium rounded-md py-2.5 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-gray-400 text-sm mt-6">
            No account?{' '}
            <Link href="/register" className="text-gray-900 hover:underline">Create one</Link>
          </p>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Admin?{' '}
              Sign in above then navigate to{' '}
              <Link href="/admin" className="text-gray-600 hover:underline font-mono">/admin</Link>{' '}
              to manage players, fixtures and match data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
