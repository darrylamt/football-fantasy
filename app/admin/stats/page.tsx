import { createClient } from '@/lib/supabase/server'
import StatsClient from './StatsClient'

export default async function AdminStatsPage() {
  const supabase = await createClient()
  const [{ data: gameweeks }, { data: fixtures }, { data: teams }] = await Promise.all([
    supabase.from('gameweeks').select('*').order('number'),
    supabase.from('fixtures').select('*, home_team:real_teams!home_team_id(*), away_team:real_teams!away_team_id(*)').order('kickoff_time'),
    supabase.from('real_teams').select('*').order('name'),
  ])
  return <StatsClient gameweeks={gameweeks ?? []} fixtures={fixtures ?? []} teams={teams ?? []} />
}
