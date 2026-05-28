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
    <div className="space-y-6">
      <div>
        <h1 className="font-barlow font-black text-4xl uppercase text-gray-900">Players</h1>
        <p className="text-gray-500 text-sm mt-0.5">{players?.length ?? 0} players in the league</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <PlayerBrowser players={players ?? []} />
      </div>
    </div>
  )
}
