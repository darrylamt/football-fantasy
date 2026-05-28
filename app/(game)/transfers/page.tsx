import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransfersClient from './TransfersClient'

export default async function TransfersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gameweek } = await supabase.from('gameweeks').select('*').eq('is_current', true).single()
  const { data: fantasyTeam } = await supabase.from('fantasy_teams').select('*').eq('user_id', user.id).single()

  if (!gameweek || !fantasyTeam) {
    return (
      <div className="space-y-6">
        <h1 className="font-barlow font-black text-4xl uppercase text-gray-900">Transfers</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 shadow-sm">
          No active gameweek or team found.
        </div>
      </div>
    )
  }

  const [{ data: picks }, { data: allPlayers }] = await Promise.all([
    supabase.from('fantasy_picks').select('*, players(*, real_teams(*))').eq('fantasy_team_id', fantasyTeam.id).eq('gameweek_id', gameweek.id),
    supabase.from('players').select('*, real_teams(*)').order('total_points', { ascending: false }),
  ])

  return (
    <TransfersClient
      fantasyTeam={fantasyTeam}
      gameweek={gameweek}
      picks={(picks ?? []) as any}
      allPlayers={allPlayers ?? []}
    />
  )
}
