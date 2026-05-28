import { createClient } from '@/lib/supabase/server'
import PlayersClient from './PlayersClient'

export default async function AdminPlayersPage() {
  const supabase = await createClient()
  const [{ data: players }, { data: teams }] = await Promise.all([
    supabase.from('players').select('*, real_teams(*)').order('position').order('name'),
    supabase.from('real_teams').select('*').order('name'),
  ])
  return <PlayersClient players={players ?? []} teams={teams ?? []} />
}
