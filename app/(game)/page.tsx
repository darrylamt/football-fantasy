import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DeadlineCountdown from '@/components/ui/DeadlineCountdown'
import type { RealTeam } from '@/types'
import { formatPrice } from '@/lib/utils/format'

const posColor: Record<string, string> = {
  GK: 'text-yellow-600', DEF: 'text-blue-500', MID: 'text-green-600', FWD: 'text-red-500',
}

function formatKickoff(dt?: string) {
  if (!dt) return 'TBC'
  return new Date(dt).toLocaleString('en-GB', {
    timeZone: 'Africa/Accra', weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: gameweek }, { data: fantasyTeam }] = await Promise.all([
    supabase.from('gameweeks').select('*').eq('is_current', true).single(),
    supabase.from('fantasy_teams').select('*').eq('user_id', user.id).single(),
  ])

  let gwPoints = 0
  if (fantasyTeam && gameweek) {
    const { data: picks } = await supabase
      .from('fantasy_picks')
      .select('points_scored')
      .eq('fantasy_team_id', fantasyTeam.id)
      .eq('gameweek_id', gameweek.id)
      .eq('is_starting', true)
    gwPoints = (picks ?? []).reduce((s, p) => s + (p.points_scored ?? 0), 0)
  }

  const [{ data: recentResults }, { data: upcomingFixtures }, { data: topPlayers }] = await Promise.all([
    supabase
      .from('fixtures')
      .select('*, home_team:real_teams!home_team_id(*), away_team:real_teams!away_team_id(*)')
      .eq('played', true)
      .order('kickoff_time', { ascending: false })
      .limit(4),
    supabase
      .from('fixtures')
      .select('*, home_team:real_teams!home_team_id(*), away_team:real_teams!away_team_id(*)')
      .eq('played', false)
      .order('kickoff_time')
      .limit(4),
    supabase
      .from('players')
      .select('*, real_teams(short_name)')
      .order('total_points', { ascending: false })
      .limit(8),
  ])

  return (
    <div className="space-y-8">

      {/* Platform header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-barlow font-black text-4xl text-gray-900 tracking-tight">Fantasy</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {gameweek
              ? `Gameweek ${gameweek.number} · ${gameweek.status}`
              : 'Ghana Fantasy Football'}
          </p>
        </div>
        {gameweek && <DeadlineCountdown deadline={gameweek.deadline} />}
      </div>

      {/* Your team strip */}
      {fantasyTeam ? (
        <div className="bg-white border border-gray-100 rounded-lg px-4 py-3 flex items-center gap-5 flex-wrap">
          <div className="min-w-0">
            <div className="text-xs text-gray-400">Your team</div>
            <div className="text-sm font-medium text-gray-900 truncate">{fantasyTeam.name}</div>
          </div>
          <div className="hidden sm:block w-px h-6 bg-gray-100" />
          <div>
            <div className="text-xs text-gray-400">GW pts</div>
            <div className="font-barlow font-black text-lg text-gray-900">{gwPoints}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Total</div>
            <div className="font-barlow font-black text-lg text-gray-900">{fantasyTeam.total_points}</div>
          </div>
          {fantasyTeam.overall_rank ? (
            <div>
              <div className="text-xs text-gray-400">Rank</div>
              <div className="font-barlow font-black text-lg text-gray-900">#{fantasyTeam.overall_rank.toLocaleString()}</div>
            </div>
          ) : null}
          <div className="ml-auto flex items-center gap-3 text-xs flex-shrink-0">
            <Link href="/squad" className="text-gray-500 hover:text-gray-900 transition-colors">Squad</Link>
            <span className="text-gray-200">·</span>
            <Link href="/transfers" className="text-gray-500 hover:text-gray-900 transition-colors">Transfers</Link>
            <span className="text-gray-200">·</span>
            <Link href="/points" className="text-gray-500 hover:text-gray-900 transition-colors">Points</Link>
          </div>
        </div>
      ) : (
        <div className="border border-gray-100 rounded-lg p-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-gray-900">No fantasy team yet</div>
            <div className="text-xs text-gray-400 mt-0.5">Pick your squad to join the fantasy league</div>
          </div>
          <Link href="/squad" className="flex-shrink-0 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-800 transition-colors">
            Get started
          </Link>
        </div>
      )}

      {/* Results + Upcoming fixtures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Recent results */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recent Results</h2>
            <Link href="/results" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">View all</Link>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100">
            {(recentResults ?? []).length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No results yet.</div>
            ) : (recentResults ?? []).map(f => {
              const home = (f as any).home_team as RealTeam
              const away = (f as any).away_team as RealTeam
              return (
                <div key={f.id} className="flex items-center gap-2 px-4 py-2.5">
                  <div className="flex-1 flex items-center gap-1.5 justify-end min-w-0">
                    <span className="text-xs text-gray-700 truncate">{home?.short_name}</span>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: home?.primary_color ?? '#d1d5db' }} />
                  </div>
                  <div className="flex-shrink-0 w-14 text-center">
                    <span className="font-barlow font-black text-sm text-gray-900">
                      {f.home_score} <span className="text-gray-300">–</span> {f.away_score}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: away?.primary_color ?? '#d1d5db' }} />
                    <span className="text-xs text-gray-700 truncate">{away?.short_name}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Upcoming fixtures */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Upcoming Fixtures</h2>
            <Link href="/fixtures" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">View all</Link>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100">
            {(upcomingFixtures ?? []).length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No fixtures scheduled.</div>
            ) : (upcomingFixtures ?? []).map(f => {
              const home = (f as any).home_team as RealTeam
              const away = (f as any).away_team as RealTeam
              return (
                <div key={f.id} className="flex items-center gap-2 px-4 py-2.5">
                  <div className="flex-1 flex items-center gap-1.5 justify-end min-w-0">
                    <span className="text-xs text-gray-700 truncate">{home?.short_name}</span>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: home?.primary_color ?? '#d1d5db' }} />
                  </div>
                  <div className="flex-shrink-0 w-14 text-center">
                    <span className="text-xs text-gray-400">vs</span>
                  </div>
                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: away?.primary_color ?? '#d1d5db' }} />
                    <span className="text-xs text-gray-700 truncate">{away?.short_name}</span>
                  </div>
                  <div className="hidden sm:block flex-shrink-0 text-right">
                    <span className="text-xs text-gray-400">{formatKickoff(f.kickoff_time)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top players */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Top Players</h2>
          <Link href="/players" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">View all</Link>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-2 text-xs text-gray-400 w-8">#</th>
                <th className="text-left px-4 py-2 text-xs text-gray-400">Player</th>
                <th className="text-left px-4 py-2 text-xs text-gray-400 hidden sm:table-cell">Club</th>
                <th className="text-left px-4 py-2 text-xs text-gray-400">Pos</th>
                <th className="text-right px-4 py-2 text-xs text-gray-400 hidden sm:table-cell">Price</th>
                <th className="text-right px-4 py-2 text-xs text-gray-400">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(topPlayers ?? []).map((p, i) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-gray-400">{i + 1}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-900">{p.display_name ?? p.name}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400 hidden sm:table-cell">{(p as any).real_teams?.short_name}</td>
                  <td className="px-4 py-2.5 text-xs">
                    <span className={`font-medium ${posColor[p.position]}`}>{p.position}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-400 text-right hidden sm:table-cell">{formatPrice(p.price)}</td>
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-900 text-right">{p.total_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
