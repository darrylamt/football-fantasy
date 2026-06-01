import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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
      .select('fixture_id, goals_scored, players(name, display_name)')
      .gt('goals_scored', 0),
  ])

  const gwMap = Object.fromEntries((gameweeks ?? []).map(gw => [gw.id, gw]))

  // fixture_id → scorer list
  const scorerMap: Record<string, { name: string; goals: number }[]> = {}
  for (const row of scorerRows ?? []) {
    if (!scorerMap[row.fixture_id]) scorerMap[row.fixture_id] = []
    const name = (row.players as any)?.display_name ?? (row.players as any)?.name ?? 'Unknown'
    scorerMap[row.fixture_id].push({ name, goals: row.goals_scored })
  }

  // Group fixtures by GW
  const grouped: Record<string, typeof fixtures> = {}
  for (const f of fixtures ?? []) {
    if (!grouped[f.gameweek_id]) grouped[f.gameweek_id] = []
    grouped[f.gameweek_id]!.push(f as any)
  }

  const gwIds = Object.keys(grouped)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-barlow font-black text-3xl text-gray-900">Results</h1>
        <p className="text-sm text-gray-400 mt-0.5">Completed matches</p>
      </div>

      {gwIds.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-lg p-12 text-center text-sm text-gray-400">
          No results yet.
        </div>
      )}

      {gwIds.map(gwId => {
        const gw = gwMap[gwId]
        const gfixtures = grouped[gwId] ?? []
        return (
          <div key={gwId}>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-sm font-medium text-gray-900">Gameweek {gw?.number}</h2>
              <span className="text-xs text-gray-300">·</span>
              <span className="text-xs text-gray-400">finished</span>
            </div>

            <div className="bg-white border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100">
              {gfixtures.map(f => {
                const home = (f as any).home_team as RealTeam | undefined
                const away = (f as any).away_team as RealTeam | undefined
                const fScorers = scorerMap[f.id] ?? []
                return (
                  <div key={f.id} className="px-4 py-3">
                    {/* Score row */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
                        <span className="text-sm text-gray-900 truncate text-right">{home?.name ?? '–'}</span>
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: home?.primary_color ?? '#d1d5db' }} />
                      </div>

                      <div className="flex-shrink-0 w-16 text-center">
                        <span className="font-barlow font-black text-xl text-gray-900">
                          {f.home_score} <span className="text-gray-300">–</span> {f.away_score}
                        </span>
                      </div>

                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: away?.primary_color ?? '#d1d5db' }} />
                        <span className="text-sm text-gray-900 truncate">{away?.name ?? '–'}</span>
                      </div>
                    </div>

                    {/* Scorers + date */}
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-xs text-gray-400">
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
                      {f.kickoff_time && (
                        <span className="text-xs text-gray-300 flex-shrink-0 ml-4">{formatDate(f.kickoff_time)}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
