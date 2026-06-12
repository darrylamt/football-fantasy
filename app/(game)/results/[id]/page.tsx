import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import type { Player, RealTeam, Gameweek, PlayerGameweekStats } from '@/types'

type StatRow = PlayerGameweekStats & { players: Player & { real_teams?: RealTeam } }

function formatKickoff(dt?: string) {
  if (!dt) return ''
  return new Date(dt).toLocaleString('en-GB', {
    timeZone: 'Africa/Accra',
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}

function playerName(row: StatRow) {
  return row.players?.display_name ?? row.players?.name ?? 'Unknown'
}

/** "Afriyie ×2" style label for count-based events */
function eventNames(rows: StatRow[], count: (r: StatRow) => number) {
  return rows
    .filter(r => count(r) > 0)
    .map(r => ({ id: r.id ?? r.player_id, label: `${playerName(r)}${count(r) > 1 ? ` ×${count(r)}` : ''}` }))
}

const GoalIcon = (
  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0" aria-label="Goal">
    <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="8" cy="8" r="2.2" fill="currentColor" />
  </svg>
)

const AssistIcon = (
  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 flex-shrink-0" aria-label="Assist">
    <path d="M3 13L13 3M13 3H7M13 3v6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function CardIcon({ color }: { color: string }) {
  return <span className="inline-block w-2.5 h-3.5 rounded-[2px] flex-shrink-0" style={{ background: color }} />
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: fixture } = await supabase
    .from('fixtures')
    .select('*, home_team:real_teams!home_team_id(*), away_team:real_teams!away_team_id(*), gameweeks(*)')
    .eq('id', id)
    .single()
  if (!fixture) notFound()

  const home = (fixture as any).home_team as RealTeam | null
  const away = (fixture as any).away_team as RealTeam | null
  const gw = (fixture as any).gameweeks as Gameweek | null

  const { data: statRows } = await supabase
    .from('player_gameweek_stats')
    .select('*, players(*, real_teams(*))')
    .eq('fixture_id', id)
    .order('calculated_points', { ascending: false })

  const rows = (statRows ?? []) as unknown as StatRow[]
  const homeRows = rows.filter(r => r.players?.team_id === fixture.home_team_id)
  const awayRows = rows.filter(r => r.players?.team_id === fixture.away_team_id)

  const eventSections = [
    { label: 'Goals', icon: <span className="text-[#37003c]">{GoalIcon}</span>, home: eventNames(homeRows, r => r.goals), away: eventNames(awayRows, r => r.goals) },
    { label: 'Assists', icon: <span className="text-[#37003c]">{AssistIcon}</span>, home: eventNames(homeRows, r => r.assists), away: eventNames(awayRows, r => r.assists) },
    { label: 'Own Goals', icon: <span className="text-[#e90052]">{GoalIcon}</span>, home: eventNames(homeRows, r => r.own_goals), away: eventNames(awayRows, r => r.own_goals) },
    { label: 'Yellow Cards', icon: <CardIcon color="#fbbf24" />, home: eventNames(homeRows, r => r.yellow_cards), away: eventNames(awayRows, r => r.yellow_cards) },
    { label: 'Red Cards', icon: <CardIcon color="#e90052" />, home: eventNames(homeRows, r => r.red_cards), away: eventNames(awayRows, r => r.red_cards) },
    { label: 'Penalty Saves', icon: <span className="text-[#04a0aa]">{AssistIcon}</span>, home: eventNames(homeRows, r => r.penalty_saves), away: eventNames(awayRows, r => r.penalty_saves) },
  ].filter(s => s.home.length > 0 || s.away.length > 0)

  const statColumns = [
    { key: 'minutes', label: 'Min', hideMobile: false },
    { key: 'goals', label: 'G', hideMobile: false },
    { key: 'assists', label: 'A', hideMobile: false },
    { key: 'yellow_cards', label: 'YC', hideMobile: false },
    { key: 'red_cards', label: 'RC', hideMobile: true },
    { key: 'saves', label: 'SV', hideMobile: true },
    { key: 'penalty_saves', label: 'PS', hideMobile: true },
    { key: 'own_goals', label: 'OG', hideMobile: true },
    { key: 'bonus', label: 'B', hideMobile: true },
  ] as const

  return (
    <div className="space-y-4">
      <Link href="/results" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-[#37003c] transition-colors">
        <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Results
      </Link>

      {/* Score header */}
      <div className="fpl-hero rounded-lg px-5 py-7 sm:px-8">
        <div className="text-center text-white/50 text-xs uppercase tracking-wider">
          {gw ? `Gameweek ${gw.number}` : 'Match'}
          {fixture.kickoff_time && ` · ${formatKickoff(fixture.kickoff_time)}`}
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-8 mt-4">
          <div className="flex-1 flex flex-col items-center sm:items-end gap-1.5 min-w-0">
            <div className="w-3.5 h-3.5 rounded-full" style={{ background: home?.primary_color ?? '#d1d5db' }} />
            <span className="font-barlow font-bold text-lg sm:text-2xl text-white text-center sm:text-right leading-tight">
              {home?.name ?? '–'}
            </span>
          </div>

          <div className="flex-shrink-0 text-center">
            {fixture.played ? (
              <>
                <div className="bg-white/10 rounded-lg px-5 py-2 backdrop-blur-sm">
                  <span className="font-barlow font-black text-4xl sm:text-5xl text-white tracking-tight">
                    {fixture.home_score}–{fixture.away_score}
                  </span>
                </div>
                <div className="text-[#00ff87] text-[11px] font-bold uppercase tracking-wider mt-1.5">Full Time</div>
              </>
            ) : (
              <div className="bg-white/10 rounded-lg px-5 py-3 backdrop-blur-sm">
                <span className="font-barlow font-bold text-2xl text-white/60">vs</span>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center sm:items-start gap-1.5 min-w-0">
            <div className="w-3.5 h-3.5 rounded-full" style={{ background: away?.primary_color ?? '#d1d5db' }} />
            <span className="font-barlow font-bold text-lg sm:text-2xl text-white text-center sm:text-left leading-tight">
              {away?.name ?? '–'}
            </span>
          </div>
        </div>
      </div>

      {!fixture.played ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-sm text-gray-400">
          This match hasn’t been played yet.
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-sm text-gray-400">
          No match data recorded yet — check back soon.
        </div>
      ) : (
        <>
          {/* Match events */}
          {eventSections.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-[#37003c] px-4 py-2.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">Match Events</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {eventSections.map(section => (
                  <div key={section.label} className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                      {section.icon}
                      {section.label}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 text-right">
                        {section.home.length === 0 ? (
                          <div className="text-xs text-gray-200">—</div>
                        ) : section.home.map(e => (
                          <div key={e.id} className="text-sm font-semibold text-[#37003c]">{e.label}</div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {section.away.length === 0 ? (
                          <div className="text-xs text-gray-200">—</div>
                        ) : section.away.map(e => (
                          <div key={e.id} className="text-sm font-semibold text-[#37003c]">{e.label}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player statistics per team */}
          {[
            { side: 'home', team: home, teamRows: homeRows },
            { side: 'away', team: away, teamRows: awayRows },
          ].map(({ side, team, teamRows }) => (
            <div key={side} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: '#37003c' }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: team?.primary_color ?? '#d1d5db' }} />
                <h2 className="text-xs font-bold uppercase tracking-wider text-white">{team?.name ?? 'Team'}</h2>
              </div>
              {teamRows.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-400">No player data recorded.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Player</th>
                        <th className="text-left px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Pos</th>
                        {statColumns.map(c => (
                          <th
                            key={c.key}
                            className={`text-center px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${c.hideMobile ? 'hidden sm:table-cell' : ''}`}
                          >
                            {c.label}
                          </th>
                        ))}
                        <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {teamRows.map(r => (
                        <tr key={r.id ?? r.player_id} className="hover:bg-[#37003c]/5 transition-colors">
                          <td className="px-4 py-2.5 text-sm font-semibold text-[#37003c] whitespace-nowrap">
                            {playerName(r)}
                            {r.clean_sheet && (r.players?.position === 'GK' || r.players?.position === 'DEF') && (
                              <span className="ml-1.5 text-[10px] font-bold text-[#00b04a] uppercase">CS</span>
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-xs text-gray-400">{r.players?.position}</td>
                          {statColumns.map(c => {
                            const v = (r as any)[c.key] as number
                            return (
                              <td
                                key={c.key}
                                className={`px-2 py-2.5 text-xs text-center ${v > 0 ? 'text-[#37003c] font-semibold' : 'text-gray-300'} ${c.hideMobile ? 'hidden sm:table-cell' : ''}`}
                              >
                                {v}
                              </td>
                            )
                          })}
                          <td className="px-4 py-2.5 text-sm font-bold text-[#37003c] text-right">{r.calculated_points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
