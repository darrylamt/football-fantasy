import { createClient } from '@/lib/supabase/server'
import FixturesClient from './FixturesClient'

export default async function AdminFixturesPage() {
  const supabase = await createClient()
  const [{ data: fixtures }, { data: gameweeks }, { data: teams }] = await Promise.all([
    supabase.from('fixtures').select('*, gameweeks(*), home_team:real_teams!home_team_id(*), away_team:real_teams!away_team_id(*)').order('kickoff_time'),
    supabase.from('gameweeks').select('*').order('number'),
    supabase.from('real_teams').select('*').order('name'),
  ])
  return <FixturesClient fixtures={fixtures ?? []} gameweeks={gameweeks ?? []} teams={teams ?? []} />
}
