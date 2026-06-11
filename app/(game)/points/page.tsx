import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PitchCanvas from '@/components/pitch/PitchCanvas'

export default async function PointsPage({ searchParams }: { searchParams: Promise<{ gw?: string }> }) {
  const { gw: gwParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: gameweeks }, { data: fantasyTeam }] = await Promise.all([
    supabase.from('gameweeks').select('*').order('number'),
    supabase.from('fantasy_teams').select('*').eq('user_id', user.id).single(),
  ])

  const current = (gameweeks ?? []).find(g => g.is_current)
  const requested = gwParam ? (gameweeks ?? []).find(g => g.number === Number(gwParam)) : undefined
  const gameweek = requested ?? current

  if (!gameweek || !fantasyTeam) {
    return (
      <div className="space-y-6">
        <h1 className="font-barlow font-black text-3xl text-[#37003c]">Points</h1>
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-sm text-gray-400">No active gameweek.</div>
      </div>
    )
  }

  const [{ data: picks }, { data: allGwPicks }, { data: chipRows }] = await Promise.all([
    supabase
      .from('fantasy_picks')
      .select('*, players(*, real_teams(*))')
      .eq('fantasy_team_id', fantasyTeam.id)
      .eq('gameweek_id', gameweek.id),
    supabase
      .from('fantasy_picks')
      .select('fantasy_team_id, points_scored')
      .eq('gameweek_id', gameweek.id)
      .eq('is_starting', true),
    supabase
      .from('chips_used')
      .select('chip')
      .eq('fantasy_team_id', fantasyTeam.id)
      .eq('gameweek_id', gameweek.id),
  ])

  const benchBoost = (chipRows ?? []).some(c => c.chip === 'bench_boost')
  const tripleCaptain = (chipRows ?? []).some(c => c.chip === 'triple_captain')

  const starting = (picks ?? []).filter(p => p.is_starting)
  const bench = (picks ?? []).filter(p => !p.is_starting)
  const gwPoints =
    starting.reduce((s, p) => s + (p.points_scored ?? 0), 0) +
    (benchBoost ? bench.reduce((s, p) => s + (p.points_scored ?? 0), 0) : 0)

  // League-wide average and highest for this GW
  const teamTotals = new Map<string, number>()
  for (const p of allGwPicks ?? []) {
    teamTotals.set(p.fantasy_team_id, (teamTotals.get(p.fantasy_team_id) ?? 0) + (p.points_scored ?? 0))
  }
  const totals = [...teamTotals.values()]
  const average = totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : 0
  const highest = totals.length ? Math.max(...totals) : 0

  const prevGw = (gameweeks ?? []).find(g => g.number === gameweek.number - 1)
  const nextGw = (gameweeks ?? []).find(g => g.number === gameweek.number + 1)

  return (
    <div className="space-y-4">
      {/* Hero with GW navigation */}
      <div className="fpl-hero rounded-lg px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          {prevGw ? (
            <Link href={`/points?gw=${prevGw.number}`} className="text-white/60 hover:text-[#00ff87] text-2xl font-bold px-2 transition-colors">‹</Link>
          ) : <span className="w-8" />}

          <div className="text-center">
            <p className="text-white/60 text-sm">{fantasyTeam.name}</p>
            <h1 className="font-barlow font-black text-2xl text-white leading-tight">Gameweek {gameweek.number}</h1>
            {(benchBoost || tripleCaptain) && (
              <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-[#37003c] bg-[#00ff87] rounded px-2 py-0.5">
                {benchBoost ? 'Bench Boost' : 'Triple Captain'} active
              </span>
            )}
          </div>

          {nextGw ? (
            <Link href={`/points?gw=${nextGw.number}`} className="text-white/60 hover:text-[#00ff87] text-2xl font-bold px-2 transition-colors">›</Link>
          ) : <span className="w-8" />}
        </div>

        <div className="flex justify-center gap-10 mt-4">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-white/50">Average</div>
            <div className="font-barlow font-bold text-2xl text-white">{average}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-white/50">Your points</div>
            <div className="font-barlow font-black text-5xl text-[#00ff87] leading-none">{gwPoints}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-white/50">Highest</div>
            <div className="font-barlow font-bold text-2xl text-white">{highest}</div>
          </div>
        </div>
      </div>

      {/* Pitch with points */}
      {(picks ?? []).length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-sm text-gray-400">
          No picks for this gameweek.
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <PitchCanvas picks={(picks ?? []) as any} readonly valueMode="points" />
        </div>
      )}

      <p className="text-center text-[11px] text-gray-400">
        Captain points are doubled{tripleCaptain ? ' (tripled this week)' : ''}. Bench points
        {benchBoost ? ' count this gameweek (Bench Boost).' : ' do not count unless auto-subs apply.'}
      </p>
    </div>
  )
}
