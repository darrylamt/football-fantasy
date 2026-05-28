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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-barlow font-black text-5xl text-green-600 uppercase tracking-widest">GFF</div>
          <div className="text-gray-500 text-sm mt-1 font-medium">Ghana Fantasy Football</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <h1 className="font-barlow font-black text-2xl uppercase text-gray-900 mb-6">Sign In</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5 tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5 tracking-wide">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-barlow font-black uppercase text-lg rounded-lg py-3 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            No account?{' '}
            <Link href="/register" className="text-green-600 hover:underline font-semibold">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
