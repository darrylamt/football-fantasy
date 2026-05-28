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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-barlow font-black text-5xl text-green-600 uppercase tracking-widest">GFF</div>
          <div className="text-gray-500 text-sm mt-1 font-medium">Ghana Fantasy Football</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <h1 className="font-barlow font-black text-2xl uppercase text-gray-900 mb-6">Create Account</h1>

          <form onSubmit={handleRegister} className="space-y-4">
            {[
              { label: 'Team Name', key: 'teamName', type: 'text', placeholder: 'Your team name', value: teamName, set: setTeamName, max: 30 },
              { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com', value: email, set: setEmail },
              { label: 'Password', key: 'password', type: 'password', placeholder: 'Min 6 characters', value: password, set: setPassword, min: 6 },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5 tracking-wide">{f.label}</label>
                <input
                  type={f.type}
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  required
                  maxLength={f.max}
                  minLength={f.min}
                  placeholder={f.placeholder}
                  className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-colors"
                />
              </div>
            ))}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-barlow font-black uppercase text-lg rounded-lg py-3 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-green-600 hover:underline font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
