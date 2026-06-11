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
    <div className="min-h-screen fpl-hero flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-barlow font-black text-5xl text-white tracking-tight">GFF</div>
          <div className="text-[#00ff87] text-xs uppercase tracking-widest font-semibold mt-1">Ghana Fantasy Football</div>
        </div>

        <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
          <div className="fpl-gradient h-1" />
          <div className="p-7">
            <h1 className="font-barlow font-bold text-2xl text-[#37003c] mb-5">Sign In</h1>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-[#37003c] placeholder-gray-400 focus:outline-none focus:border-[#37003c]"
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
                  className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-[#37003c] placeholder-gray-400 focus:outline-none focus:border-[#37003c]"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="border border-[#e90052]/40 bg-[#e90052]/10 rounded-md px-3 py-2.5 text-[#e90052] text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00ff87] text-[#37003c] text-sm font-bold rounded-md py-3 hover:bg-[#00e57a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="text-gray-400 text-sm mt-5">
              No account?{' '}
              <Link href="/register" className="text-[#37003c] font-semibold hover:underline">Create one</Link>
            </p>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Admin? Sign in above then go to{' '}
                <Link href="/admin" className="text-[#37003c] hover:underline font-mono">/admin</Link>{' '}
                to manage players, fixtures and match data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
