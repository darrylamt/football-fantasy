'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const inputClass =
  'w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-[#37003c] placeholder-gray-400 focus:outline-none focus:border-[#37003c] focus:ring-2 focus:ring-[#37003c]/10'

export default function WelcomeClient({ suggestedName, email }: { suggestedName: string; email: string }) {
  const [teamName, setTeamName] = useState(suggestedName)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: season } = await supabase.from('seasons').select('id').eq('is_active', true).single()
    if (!season) { setError('No active season right now — check back soon.'); setLoading(false); return }

    const { error: insertError } = await supabase.from('fantasy_teams').insert({
      user_id: user.id,
      season_id: season.id,
      name: teamName.trim(),
      free_transfers: 0,
    })
    // Unique violation means the club already exists — just continue
    if (insertError && !insertError.message.includes('duplicate')) {
      setError(insertError.message); setLoading(false); return
    }

    router.push('/squad'); router.refresh()
  }

  return (
    <div className="min-h-screen fpl-hero flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="font-barlow font-black text-5xl text-white tracking-tight">GFF</div>
          <div className="text-[#00ff87] text-xs uppercase tracking-widest font-semibold mt-1">Ghana Fantasy Football</div>
        </div>

        <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
          <div className="fpl-gradient h-1" />
          <div className="p-7">
            <h1 className="font-barlow font-bold text-2xl text-[#37003c]">Welcome, Manager</h1>
            <p className="text-gray-400 text-sm mt-0.5 mb-5">
              One last step — name your club to start playing.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Club name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  required
                  minLength={3}
                  maxLength={30}
                  autoFocus
                  className={inputClass}
                  placeholder="e.g. Accra All Stars"
                />
              </div>

              <div className="fpl-hero rounded-md px-4 py-3">
                <div className="text-[10px] uppercase tracking-wider text-white/50">Your club</div>
                <div className="font-barlow font-black text-2xl text-white truncate leading-tight">
                  {teamName.trim() || '—'}
                </div>
                <div className="text-[11px] text-[#00ff87]">{email}</div>
              </div>

              {error && (
                <div className="border border-[#e90052]/40 bg-[#e90052]/10 rounded-md px-3 py-2.5 text-[#e90052] text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading || teamName.trim().length < 3}
                className="w-full bg-[#00ff87] text-[#37003c] text-sm font-bold rounded-md py-3 hover:bg-[#00e57a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating your club…' : 'Create My Club & Pick Squad'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
