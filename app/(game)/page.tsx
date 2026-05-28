import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DeadlineCountdown from '@/components/ui/DeadlineCountdown'
import { formatPoints } from '@/lib/utils/format'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: gameweek }, { data: fantasyTeam }, { data: picks }] = await Promise.all([
    supabase.from('gameweeks').select('*').eq('is_current', true).single(),
    supabase.from('fantasy_teams').select('*').eq('user_id', user.id).single(),
    supabase.from('fantasy_picks').select('*, players(*, real_teams(*))').eq('fantasy_team_id', (await supabase.from('fantasy_teams').select('id').eq('user_id', user.id).single()).data?.id ?? '').eq('gameweek_id', (await supabase.from('gameweeks').select('id').eq('is_current', true).single()).data?.id ?? ''),
  ])

  const gwPoints = picks?.reduce((sum, p) => sum + (p.points_scored ?? 0), 0) ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-barlow font-black text-4xl uppercase text-white">
            {fantasyTeam?.name ?? 'My Team'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {gameweek ? `Gameweek ${gameweek.number}` : 'No active gameweek'}
          </p>
        </div>
        {gameweek && <DeadlineCountdown deadline={gameweek.deadline} />}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'GW Points', value: formatPoints(gwPoints) },
          { label: 'Total Points', value: formatPoints(fantasyTeam?.total_points ?? 0) },
          { label: 'Overall Rank', value: fantasyTeam?.overall_rank ? `#${fantasyTeam.overall_rank.toLocaleString()}` : '-' },
          { label: 'Free Transfers', value: fantasyTeam?.free_transfers === 0 ? 'Unlimited' : fantasyTeam?.free_transfers ?? 1 },
        ].map(stat => (
          <div key={stat.label} className="bg-[#112211] border border-[#1f3d1f] rounded-xl p-5">
            <div className="text-xs font-barlow uppercase text-gray-400 mb-1">{stat.label}</div>
            <div className="font-barlow font-black text-3xl text-[#4ade80]">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { href: '/squad', label: 'Manage Squad', desc: 'View & update your team' },
          { href: '/transfers', label: 'Transfers', desc: 'Buy & sell players' },
          { href: '/points', label: 'Points', desc: 'GW breakdown' },
          { href: '/players', label: 'Player Stats', desc: 'Browse all players' },
          { href: '/fixtures', label: 'Fixtures', desc: 'Upcoming matches' },
          { href: '/leagues', label: 'Leagues', desc: 'Mini-league standings' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-[#112211] border border-[#1f3d1f] rounded-xl p-5 hover:border-[#4ade80]/50 hover:bg-[#1a331a] transition-all group"
          >
            <div className="font-barlow font-bold uppercase text-white group-hover:text-[#4ade80] transition-colors">
              {item.label}
            </div>
            <div className="text-gray-500 text-sm mt-1">{item.desc}</div>
          </Link>
        ))}
      </div>

      {/* Recent picks preview */}
      {picks && picks.length > 0 && (
        <div className="bg-[#112211] border border-[#1f3d1f] rounded-xl p-5">
          <h2 className="font-barlow font-bold uppercase text-white mb-4">Starting XI</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {picks
              .filter(p => p.is_starting)
              .slice(0, 8)
              .map(pick => (
                <div key={pick.id} className="flex items-center gap-2 bg-[#0d1f0d] rounded-lg px-3 py-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: (pick.players as any)?.real_teams?.primary_color ?? '#4ade80' }}
                  />
                  <span className="text-sm text-white truncate">
                    {(pick.players as any)?.display_name ?? (pick.players as any)?.name}
                  </span>
                  {pick.is_captain && <span className="text-yellow-400 text-xs font-bold ml-auto">C</span>}
                  {pick.is_vice_captain && <span className="text-gray-300 text-xs font-bold ml-auto">V</span>}
                </div>
              ))}
          </div>
          {picks.filter(p => p.is_starting).length > 8 && (
            <Link href="/squad" className="text-[#4ade80] text-sm mt-3 inline-block hover:underline">
              View full squad →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
