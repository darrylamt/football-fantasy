'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const inputClass =
  'w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-[#37003c] placeholder-gray-400 focus:outline-none focus:border-[#37003c] focus:ring-2 focus:ring-[#37003c]/10'

function friendlyError(message: string) {
  if (/invalid login credentials/i.test(message)) return 'Incorrect email or password.'
  if (/email not confirmed/i.test(message)) return 'Your email isn’t confirmed yet — check your inbox for the confirmation link.'
  return message
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('confirmed')) setNotice('Email confirmed — sign in to get started.')
    if (params.get('reset')) setNotice('Password updated — sign in with your new password.')
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(friendlyError(error.message)); setLoading(false); return }

    // New managers (or anyone whose club creation was interrupted) go to onboarding
    const { data: team } = await supabase
      .from('fantasy_teams')
      .select('id')
      .eq('user_id', data.user.id)
      .maybeSingle()

    router.push(team ? '/' : '/welcome')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
      <div className="fpl-gradient h-1" />
      <div className="p-7">
        <h1 className="font-barlow font-bold text-2xl text-[#37003c]">Sign In</h1>
        <p className="text-gray-400 text-sm mt-0.5 mb-5">Welcome back, manager.</p>

        {notice && (
          <div className="border border-[#00ff87]/50 bg-[#00ff87]/10 rounded-md px-3 py-2.5 text-[#1a7a4a] text-sm mb-4">
            {notice}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputClass}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs text-gray-500">Password</label>
              <Link href="/forgot-password" className="text-xs text-[#37003c] font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={`${inputClass} pr-16`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-[#37003c]"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
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
          New to GFF?{' '}
          <Link href="/register" className="text-[#37003c] font-semibold hover:underline">Create your team</Link>
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
  )
}
