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
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #0a1400 0%, #0d1f0d 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-barlow font-black text-4xl text-[#4ade80] uppercase tracking-widest">GFF</div>
          <div className="text-gray-400 text-sm mt-1">Ghana Fantasy Football</div>
        </div>

        <div className="bg-[#112211] border border-[#1f3d1f] rounded-2xl p-8">
          <h1 className="font-barlow font-bold text-2xl uppercase text-white mb-6">Sign In</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#4ade80] transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#4ade80] transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4ade80] text-[#0a1400] font-barlow font-black uppercase text-lg rounded-lg py-3 hover:bg-[#22c55e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            No account?{' '}
            <Link href="/register" className="text-[#4ade80] hover:underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
