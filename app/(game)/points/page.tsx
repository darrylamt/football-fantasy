import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Position } from '@/types'

const posBadge: Record<string, string> = {
  GK: 'bg-yellow-100 text-yellow-700',
  DEF: 'bg-blue-100 text-blue-700',
  MID: 'bg-green-100 text-green-700',
  FWD: 'bg-red-100 text-red-700',
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
        <h1 className="font-barlow font-black text-4xl uppercase text-gray-900">Points</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 shadow-sm">No active gameweek.</div>
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
  const totalGW = (picks ?? []).filter(p => p.is_starting).reduce((s, p) => s + (p.points_scored ?? 0), 0)

  function PickRow({ pick, isBench }: { pick: any, isBench?: boolean }) {
    const player = pick.players
    const pts = pick.points_scored ?? 0
    return (
      <div className={`flex items-center gap-3 px-5 py-3.5 ${isBench ? 'opacity-60' : ''}`}>
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: player?.real_teams?.primary_color ?? '#d1d5db' }} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm truncate">
            {player?.display_name ?? player?.name}
            {pick.is_captain && <span className="ml-1.5 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">C</span>}
            {pick.is_vice_captain && <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">V</span>}
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <span>{player?.real_teams?.short_name}</span>
            <span className={`font-barlow font-bold uppercase px-1.5 py-0.5 rounded text-xs ${posBadge[player?.position] ?? ''}`}>{player?.position}</span>
            {isBench && <span className="text-gray-400">Bench</span>}
          </div>
        </div>
        <div className={`font-barlow font-black text-xl ${pts > 0 ? 'text-green-600' : 'text-gray-400'}`}>{pts}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-barlow font-black text-4xl uppercase text-gray-900">Points</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gameweek {gameweek.number}</p>
        </div>
        <div className="bg-green-600 text-white rounded-xl px-6 py-3 text-center">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-80">GW Points</div>
          <div className="font-barlow font-black text-4xl">{totalGW}</div>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Points', value: fantasyTeam.total_points },
          { label: 'GW Points', value: totalGW },
          { label: 'Players Picked', value: picks?.length ?? 0 },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase text-gray-400 tracking-wide mb-1">{s.label}</div>
            <div className="font-barlow font-black text-3xl text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Starting XI */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <h2 className="font-barlow font-bold uppercase text-gray-700">Starting XI</h2>
        </div>
        {starting.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No picks for this gameweek.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {starting.map(pick => <PickRow key={pick.id} pick={pick} />)}
          </div>
        )}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          <span className="text-sm font-semibold text-gray-500">Gameweek total</span>
          <span className="font-barlow font-black text-xl text-green-600">{totalGW} pts</span>
        </div>
      </div>

      {/* Bench */}
      {bench.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-barlow font-bold uppercase text-gray-700">Bench</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {bench.map(pick => <PickRow key={pick.id} pick={pick} isBench />)}
          </div>
        </div>
      )}
    </div>
  )
}
