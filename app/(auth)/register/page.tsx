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
    setLoading(true); setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (!data.user) { setError('Registration failed. Please try again.'); setLoading(false); return }

    const { data: season } = await supabase.from('seasons').select('id').eq('is_active', true).single()
    if (season) {
      await supabase.from('fantasy_teams').insert({
        user_id: data.user.id,
        season_id: season.id,
        name: teamName,
        free_transfers: 0,
      })
    }

    router.push('/squad'); router.refresh()
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
            <h1 className="font-barlow font-bold text-2xl text-[#37003c] mb-5">Create Account</h1>

            <form onSubmit={handleRegister} className="space-y-4">
              {[
                { label: 'Team name', key: 'teamName', type: 'text', placeholder: 'Your team name', value: teamName, set: setTeamName, max: 30 },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com', value: email, set: setEmail },
                { label: 'Password', key: 'password', type: 'password', placeholder: 'Min 6 characters', value: password, set: setPassword, min: 6 },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs text-gray-500 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    required
                    maxLength={f.max}
                    minLength={f.min}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-[#37003c] placeholder-gray-400 focus:outline-none focus:border-[#37003c]"
                  />
                </div>
              ))}

              {error && (
                <div className="border border-[#e90052]/40 bg-[#e90052]/10 rounded-md px-3 py-2.5 text-[#e90052] text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00ff87] text-[#37003c] text-sm font-bold rounded-md py-3 hover:bg-[#00e57a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="text-gray-400 text-sm mt-5">
              Already have an account?{' '}
              <Link href="/login" className="text-[#37003c] font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
