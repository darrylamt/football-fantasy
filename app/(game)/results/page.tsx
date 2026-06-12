import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { RealTeam } from '@/types'

function formatDate(dt?: string) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('en-GB', {
    timeZone: 'Africa/Accra',
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

export default async function ResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: gameweeks }, { data: fixtures }, { data: scorerRows }] = await Promise.all([
    supabase.from('gameweeks').select('*').order('number'),
    supabase
      .from('fixtures')
      .select('*, home_team:real_teams!home_team_id(*), away_team:real_teams!away_team_id(*)')
      .eq('played', true)
      .order('kickoff_time', { ascending: false }),
    supabase
      .from('player_gameweek_stats')
      .select('fixture_id, goals, players(name, display_name)')
      .gt('goals', 0),
  ])

  const gwMap = Object.fromEntries((gameweeks ?? []).map(gw => [gw.id, gw]))

  // fixture_id → scorer list
  const scorerMap: Record<string, { name: string; goals: number }[]> = {}
  for (const row of scorerRows ?? []) {
    if (!row.fixture_id) continue
    if (!scorerMap[row.fixture_id]) scorerMap[row.fixture_id] = []
    const name = (row.players as any)?.display_name ?? (row.players as any)?.name ?? 'Unknown'
    scorerMap[row.fixture_id].push({ name, goals: row.goals })
  }

  // Group fixtures by GW
  const grouped: Record<string, typeof fixtures> = {}
  for (const f of fixtures ?? []) {
    if (!grouped[f.gameweek_id]) grouped[f.gameweek_id] = []
    grouped[f.gameweek_id]!.push(f as any)
  }

  const gwIds = Object.keys(grouped)

  return (
    <div className="space-y-4">
      <div className="fpl-hero rounded-lg px-5 py-5 sm:px-6">
        <h1 className="font-barlow font-black text-3xl text-white leading-none">Results</h1>
        <p className="text-white/60 text-sm mt-1">Completed matches & goal scorers</p>
      </div>

      {gwIds.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-sm text-gray-400">
          No results yet.
        </div>
      )}

      {gwIds.map(gwId => {
        const gw = gwMap[gwId]
        const gfixtures = grouped[gwId] ?? []
        return (
          <div key={gwId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-[#37003c] px-4 py-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Gameweek {gw?.number}</h2>
            </div>

            <div className="divide-y divide-gray-100">
              {gfixtures.map(f => {
                const home = (f as any).home_team as RealTeam | undefined
                const away = (f as any).away_team as RealTeam | undefined
                const fScorers = scorerMap[f.id] ?? []
                return (
                  <Link key={f.id} href={`/results/${f.id}`} className="block px-4 py-3 hover:bg-[#37003c]/5 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
                        <span className="text-sm font-semibold text-[#37003c] truncate text-right">{home?.name ?? '–'}</span>
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: home?.primary_color ?? '#d1d5db' }} />
                      </div>

                      <div className="flex-shrink-0 w-16 text-center">
                        <span className="bg-[#37003c] text-white font-barlow font-bold text-base rounded px-2.5 py-0.5">
                          {f.home_score}–{f.away_score}
                        </span>
                      </div>

                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: away?.primary_color ?? '#d1d5db' }} />
                        <span className="text-sm font-semibold text-[#37003c] truncate">{away?.name ?? '–'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1.5">
                      <div className="text-[11px] text-gray-400">
                        {fScorers.length > 0
                          ? fScorers.map((s, i) => (
                              <span key={i}>
                                {i > 0 && ', '}
                                {s.name}{s.goals > 1 ? ` ×${s.goals}` : ''}
                              </span>
                            ))
                          : <span className="text-gray-300">No scorers recorded</span>
                        }
                      </div>
                      <span className="text-[11px] text-gray-300 flex-shrink-0 ml-4 group-hover:text-[#37003c] transition-colors">
                        {f.kickoff_time ? `${formatDate(f.kickoff_time)} ` : ''}›
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
