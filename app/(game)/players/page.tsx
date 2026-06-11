import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PlayerBrowser from '@/components/players/PlayerBrowser'

export default async function PlayersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: players } = await supabase
    .from('players')
    .select('*, real_teams(*)')
    .order('total_points', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="fpl-hero rounded-lg px-5 py-5 sm:px-6">
        <h1 className="font-barlow font-black text-3xl text-white leading-none">Player Statistics</h1>
        <p className="text-white/60 text-sm mt-1">{players?.length ?? 0} players in the league</p>
      </div>

      <PlayerBrowser players={players ?? []} />
    </div>
  )
}
