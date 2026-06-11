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
        <h1 className="font-barlow font-black text-3xl text-[#37003c]">Transfers</h1>
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-sm text-gray-400">
          No active gameweek or team found.
        </div>
      </div>
    )
  }

  const [{ data: picks }, { data: allPlayers }, { data: chipsUsed }] = await Promise.all([
    supabase.from('fantasy_picks').select('*, players(*, real_teams(*))').eq('fantasy_team_id', fantasyTeam.id).eq('gameweek_id', gameweek.id),
    supabase.from('players').select('*, real_teams(*)').order('total_points', { ascending: false }),
    supabase.from('chips_used').select('*').eq('fantasy_team_id', fantasyTeam.id),
  ])

  return (
    <TransfersClient
      fantasyTeam={fantasyTeam}
      gameweek={gameweek}
      picks={(picks ?? []) as any}
      allPlayers={allPlayers ?? []}
      chipsUsed={chipsUsed ?? []}
    />
  )
}
