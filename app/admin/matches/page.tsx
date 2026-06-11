import { createClient } from '@/lib/supabase/server'
import MatchCentreClient from './MatchCentreClient'

export default async function MatchCentrePage() {
  const supabase = await createClient()

  const [{ data: gameweeks }, { data: fixtures }] = await Promise.all([
    supabase.from('gameweeks').select('*').order('number'),
    supabase
      .from('fixtures')
      .select('*, home_team:real_teams!home_team_id(*), away_team:real_teams!away_team_id(*)')
      .order('kickoff_time'),
  ])

  return (
    <MatchCentreClient
      gameweeks={gameweeks ?? []}
      fixtures={(fixtures ?? []) as any}
    />
  )
}
