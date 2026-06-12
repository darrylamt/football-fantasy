import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SquadClient from './SquadClient'

export default async function SquadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: gameweek }, { data: fantasyTeam }, { data: allPlayers }] = await Promise.all([
    supabase.from('gameweeks').select('*').eq('is_current', true).single(),
    supabase.from('fantasy_teams').select('*').eq('user_id', user.id).single(),
    supabase.from('players').select('*, real_teams(*)').order('position').order('total_points', { ascending: false }),
  ])

  if (!fantasyTeam) redirect('/welcome')

  if (!gameweek) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
        <div className="font-barlow font-bold text-2xl text-[#37003c]">No active season</div>
        <div className="text-gray-400 mt-2 text-sm">Check back when a gameweek is active.</div>
      </div>
    )
  }

  const [{ data: existingPicks }, { data: chipsUsed }] = await Promise.all([
    supabase
      .from('fantasy_picks')
      .select('*, players(*, real_teams(*))')
      .eq('fantasy_team_id', fantasyTeam.id)
      .eq('gameweek_id', gameweek.id),
    supabase
      .from('chips_used')
      .select('*')
      .eq('fantasy_team_id', fantasyTeam.id),
  ])

  return (
    <SquadClient
      fantasyTeam={fantasyTeam}
      gameweek={gameweek}
      allPlayers={allPlayers ?? []}
      initialPicks={(existingPicks ?? []) as any}
      chipsUsed={chipsUsed ?? []}
    />
  )
}
