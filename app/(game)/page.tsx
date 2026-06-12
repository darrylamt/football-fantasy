import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DeadlineCountdown from '@/components/ui/DeadlineCountdown'
import type { RealTeam } from '@/types'
import { formatPrice, formatDeadline } from '@/lib/utils/format'

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
    <div className="space-y-4">

      {/* Hero */}
      <div className="fpl-hero rounded-lg px-5 py-6 sm:px-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-barlow font-black text-4xl text-white tracking-tight leading-none">Fantasy</h1>
            <p className="text-white/60 text-sm mt-1.5">
              {gameweek ? `Gameweek ${gameweek.number} · ${formatDeadline(gameweek.deadline)}` : 'Ghana Premier League'}
            </p>
            {gameweek && <div className="mt-1"><DeadlineCountdown deadline={gameweek.deadline} light /></div>}
          </div>
          <div className="flex gap-2">
            <Link href="/squad" className="bg-[#00ff87] text-[#37003c] text-sm font-bold px-4 py-2.5 rounded-md hover:bg-[#00e57a] transition-colors">
              Pick Team
            </Link>
            <Link href="/transfers" className="bg-white/10 text-white text-sm font-bold px-4 py-2.5 rounded-md hover:bg-white/20 transition-colors border border-white/20">
              Transfers
            </Link>
          </div>
        </div>

        {/* Your stats inside hero */}
        {fantasyTeam ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-6 max-w-xl">
            <div className="bg-white/10 rounded-md px-3 py-2.5 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-wider text-white/50">GW Points</div>
              <div className="font-barlow font-black text-2xl text-[#00ff87]">{gwPoints}</div>
            </div>
            <div className="bg-white/10 rounded-md px-3 py-2.5 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-wider text-white/50">Total</div>
              <div className="font-barlow font-black text-2xl text-white">{fantasyTeam.total_points}</div>
            </div>
            <div className="bg-white/10 rounded-md px-3 py-2.5 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-wider text-white/50">Rank</div>
              <div className="font-barlow font-black text-2xl text-white">
                {fantasyTeam.overall_rank ? `#${fantasyTeam.overall_rank.toLocaleString()}` : '–'}
              </div>
            </div>
            <div className="hidden sm:block bg-white/10 rounded-md px-3 py-2.5 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-wider text-white/50">Team</div>
              <div className="font-barlow font-bold text-lg text-white truncate">{fantasyTeam.name}</div>
            </div>
          </div>
        ) : (
          <div className="mt-6 bg-white/10 rounded-md px-4 py-3 max-w-xl flex items-center justify-between gap-3 backdrop-blur-sm">
            <span className="text-sm text-white/80">You don't have a team yet — create your club to join.</span>
            <Link href="/welcome" className="flex-shrink-0 bg-[#00ff87] text-[#37003c] text-xs font-bold px-3 py-2 rounded-md hover:bg-[#00e57a] transition-colors">
              Get started
            </Link>
          </div>
        )}
      </div>

      {/* Results + Fixtures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-[#37003c] px-4 py-2.5 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Results</h2>
            <Link href="/results" className="text-[11px] text-[#00ff87] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {(recentResults ?? []).length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No results yet.</div>
            ) : (recentResults ?? []).map(f => {
              const home = (f as any).home_team as RealTeam
              const away = (f as any).away_team as RealTeam
              return (
                <Link key={f.id} href={`/results/${f.id}`} className="flex items-center gap-2 px-4 py-2.5 hover:bg-[#37003c]/5 transition-colors">
                  <div className="flex-1 flex items-center gap-1.5 justify-end min-w-0">
                    <span className="text-xs font-semibold text-[#37003c] truncate">{home?.short_name}</span>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: home?.primary_color ?? '#d1d5db' }} />
                  </div>
                  <div className="flex-shrink-0 w-14 text-center">
                    <span className="bg-[#37003c] text-white font-barlow font-bold text-sm rounded px-2 py-0.5">
                      {f.home_score}–{f.away_score}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: away?.primary_color ?? '#d1d5db' }} />
                    <span className="text-xs font-semibold text-[#37003c] truncate">{away?.short_name}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-[#37003c] px-4 py-2.5 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Fixtures</h2>
            <Link href="/fixtures" className="text-[11px] text-[#00ff87] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {(upcomingFixtures ?? []).length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No fixtures scheduled.</div>
            ) : (upcomingFixtures ?? []).map(f => {
              const home = (f as any).home_team as RealTeam
              const away = (f as any).away_team as RealTeam
              return (
                <div key={f.id} className="flex items-center gap-2 px-4 py-2.5">
                  <div className="flex-1 flex items-center gap-1.5 justify-end min-w-0">
                    <span className="text-xs font-semibold text-[#37003c] truncate">{home?.short_name}</span>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: home?.primary_color ?? '#d1d5db' }} />
                  </div>
                  <div className="flex-shrink-0 w-14 text-center">
                    <span className="text-[11px] text-gray-400">vs</span>
                  </div>
                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: away?.primary_color ?? '#d1d5db' }} />
                    <span className="text-xs font-semibold text-[#37003c] truncate">{away?.short_name}</span>
                  </div>
                  <span className="hidden sm:block text-[11px] text-gray-400 flex-shrink-0">{formatKickoff(f.kickoff_time)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Top players */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-[#37003c] px-4 py-2.5 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Most Points</h2>
          <Link href="/players" className="text-[11px] text-[#00ff87] hover:underline">View all</Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 w-8">#</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Player</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hidden sm:table-cell">Club</th>
              <th className="text-left px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Pos</th>
              <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hidden sm:table-cell">Price</th>
              <th className="text-right px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(topPlayers ?? []).map((p, i) => (
              <tr key={p.id} className="hover:bg-[#37003c]/5 transition-colors">
                <td className="px-4 py-2.5 text-xs text-gray-400">{i + 1}</td>
                <td className="px-4 py-2.5 text-sm font-semibold text-[#37003c]">{p.display_name ?? p.name}</td>
                <td className="px-4 py-2.5 text-xs text-gray-400 hidden sm:table-cell">{(p as any).real_teams?.short_name}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500">{p.position}</td>
                <td className="px-4 py-2.5 text-xs text-gray-500 text-right hidden sm:table-cell">{formatPrice(p.price)}</td>
                <td className="px-4 py-2.5 text-sm font-bold text-[#37003c] text-right">{p.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
