'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [teamName, setTeamName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Registration failed. Please try again.')
      setLoading(false)
      return
    }

    // Get active season
    const { data: season } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .single()

    if (season) {
      await supabase.from('fantasy_teams').insert({
        user_id: data.user.id,
        season_id: season.id,
        name: teamName,
        free_transfers: 0, // unlimited on first pick
      })
    }

    router.push('/squad')
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
          <h1 className="font-barlow font-bold text-2xl uppercase text-white mb-6">Create Account</h1>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1.5">Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                required
                maxLength={30}
                className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#4ade80] transition-colors"
                placeholder="Your team name"
              />
            </div>
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
                minLength={6}
                className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#4ade80] transition-colors"
                placeholder="Min 6 characters"
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#4ade80] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
