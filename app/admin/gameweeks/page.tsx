import { createClient } from '@/lib/supabase/server'
import GameweeksClient from './GameweeksClient'

export default async function GameweeksPage() {
  const supabase = await createClient()
  const [{ data: gameweeks }, { data: seasons }] = await Promise.all([
    supabase.from('gameweeks').select('*, seasons(*)').order('number'),
    supabase.from('seasons').select('*'),
  ])
  return <GameweeksClient gameweeks={gameweeks ?? []} seasons={seasons ?? []} />
}
