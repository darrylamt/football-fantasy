import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const posColor: Record<string, string> = {
  GK: 'text-yellow-600', DEF: 'text-blue-500', MID: 'text-green-600', FWD: 'text-red-500',
}

export default async function PointsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gameweek } = await supabase.from('gameweeks').select('*').eq('is_current', true).single()
  const { data: fantasyTeam } = await supabase.from('fantasy_teams').select('*').eq('user_id', user.id).single()

  if (!gameweek || !fantasyTeam) {
    return (
      <div className="space-y-6">
        <h1 className="font-barlow font-black text-3xl text-gray-900">Points</h1>
        <div className="bg-white border border-gray-100 rounded-lg p-12 text-center text-sm text-gray-400">No active gameweek.</div>
      </div>
    )
  }

  const { data: picks } = await supabase
    .from('fantasy_picks')
    .select('*, players(*, real_teams(*))')
    .eq('fantasy_team_id', fantasyTeam.id)
    .eq('gameweek_id', gameweek.id)
    .order('is_starting', { ascending: false })

  const starting = (picks ?? []).filter(p => p.is_starting)
  const bench = (picks ?? []).filter(p => !p.is_starting).sort((a, b) => (a.bench_order ?? 0) - (b.bench_order ?? 0))
  const totalGW = starting.reduce((s, p) => s + (p.points_scored ?? 0), 0)

  function PickRow({ pick, isBench }: { pick: any, isBench?: boolean }) {
    const player = pick.players
    const pts = pick.points_scored ?? 0
    return (
      <div className={`flex items-center gap-3 px-4 py-3 ${isBench ? 'opacity-50' : ''}`}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: player?.real_teams?.primary_color ?? '#d1d5db' }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-900 truncate">
            {player?.display_name ?? player?.name}
            {pick.is_captain && <span className="ml-1.5 text-xs font-medium text-gray-500">(C)</span>}
            {pick.is_vice_captain && <span className="ml-1.5 text-xs font-medium text-gray-500">(V)</span>}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {player?.real_teams?.short_name}
            {' · '}
            <span className={`font-medium ${posColor[player?.position] ?? ''}`}>{player?.position}</span>
            {isBench && <span className="ml-1">· Bench</span>}
          </div>
        </div>
        <div className="text-sm font-medium text-gray-900">{pts} <span className="text-gray-400 font-normal text-xs">pts</span></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-barlow font-black text-3xl text-gray-900">Points</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gameweek {gameweek.number}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'GW Points',    value: totalGW },
          { label: 'Total Points', value: fantasyTeam.total_points },
          { label: 'Picks',        value: picks?.length ?? 0 },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-lg px-4 py-3">
            <div className="text-xs text-gray-400 mb-1">{s.label}</div>
            <div className="font-barlow font-black text-2xl text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Starting XI</span>
          <span className="text-xs text-gray-400">{totalGW} pts</span>
        </div>
        {starting.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No picks for this gameweek.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {starting.map(pick => <PickRow key={pick.id} pick={pick} />)}
          </div>
        )}
      </div>

      {bench.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500">Bench</span>
          </div>
          <div className="divide-y divide-gray-100">
            {bench.map(pick => <PickRow key={pick.id} pick={pick} isBench />)}
          </div>
        </div>
      )}
    </div>
  )
}
