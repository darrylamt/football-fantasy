import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LeaguesClient from './LeaguesClient'

export default async function LeaguesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: fantasyTeam } = await supabase
    .from('fantasy_teams')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!fantasyTeam) {
    return (
      <div className="space-y-4">
        <div className="fpl-hero rounded-lg px-5 py-5 sm:px-6">
          <h1 className="font-barlow font-black text-3xl text-white leading-none">Leagues</h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-sm text-gray-400">
          Create a fantasy team first to join leagues.
        </div>
      </div>
    )
  }

  // Get leagues this team belongs to
  const { data: memberships } = await supabase
    .from('league_members')
    .select('league_id')
    .eq('fantasy_team_id', fantasyTeam.id)

  const leagueIds = (memberships ?? []).map(m => m.league_id)

  const leagues = await Promise.all(
    leagueIds.map(async id => {
      const { data: league } = await supabase.from('leagues').select('*').eq('id', id).single()
      const { data: members } = await supabase
        .from('league_members')
        .select('fantasy_teams(name, total_points, user_id)')
        .eq('league_id', id)
      return { ...league!, members: members ?? [], myTeamId: user.id }
    })
  )

  return (
    <LeaguesClient
      leagues={leagues.filter(Boolean) as any}
      myTeamId={user.id}
    />
  )
}
