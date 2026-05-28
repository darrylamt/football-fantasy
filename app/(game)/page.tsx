import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DeadlineCountdown from '@/components/ui/DeadlineCountdown'
import { formatPoints } from '@/lib/utils/format'

const quickLinks = [
  { href: '/squad', label: 'My Squad', desc: 'View & pick your team', icon: '👕' },
  { href: '/transfers', label: 'Transfers', desc: 'Buy & sell players', icon: '🔄' },
  { href: '/points', label: 'Points', desc: 'GW points breakdown', icon: '📊' },
  { href: '/players', label: 'Players', desc: 'Browse all players', icon: '⚽' },
  { href: '/fixtures', label: 'Fixtures', desc: 'Upcoming matches', icon: '📅' },
  { href: '/leagues', label: 'Leagues', desc: 'Mini-league standings', icon: '🏆' },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: gameweek } = await supabase.from('gameweeks').select('*').eq('is_current', true).single()
  const { data: fantasyTeam } = await supabase.from('fantasy_teams').select('*').eq('user_id', user.id).single()

  let gwPoints = 0
  if (fantasyTeam && gameweek) {
    const { data: picks } = await supabase
      .from('fantasy_picks')
      .select('points_scored')
      .eq('fantasy_team_id', fantasyTeam.id)
      .eq('gameweek_id', gameweek.id)
    gwPoints = picks?.reduce((sum, p) => sum + (p.points_scored ?? 0), 0) ?? 0
  }

  const stats = [
    { label: 'GW Points', value: gwPoints, suffix: 'pts' },
    { label: 'Total Points', value: fantasyTeam?.total_points ?? 0, suffix: 'pts' },
    { label: 'Overall Rank', value: fantasyTeam?.overall_rank ? `#${fantasyTeam.overall_rank.toLocaleString()}` : '–', raw: true },
    { label: 'Free Transfers', value: fantasyTeam?.free_transfers === 0 ? '∞' : fantasyTeam?.free_transfers ?? 1, raw: true },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-barlow font-black text-4xl uppercase text-gray-900">
            {fantasyTeam?.name ?? 'My Team'}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {gameweek ? `Gameweek ${gameweek.number}` : 'No active gameweek'}
          </p>
        </div>
        {gameweek && <DeadlineCountdown deadline={gameweek.deadline} />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase text-gray-400 tracking-wide mb-1">{s.label}</div>
            <div className="font-barlow font-black text-3xl text-green-600">
              {s.raw ? s.value : `${s.value}`}
              {!s.raw && <span className="text-lg text-gray-400 font-bold ml-1">{s.suffix}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {quickLinks.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:border-green-300 hover:shadow-md transition-all group"
          >
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="font-barlow font-bold uppercase text-gray-900 group-hover:text-green-700 transition-colors">
              {item.label}
            </div>
            <div className="text-gray-400 text-sm mt-0.5">{item.desc}</div>
          </Link>
        ))}
      </div>

      {!fantasyTeam && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-green-800 font-semibold mb-3">You don't have a team yet.</p>
          <Link href="/squad" className="inline-block bg-green-600 text-white font-barlow font-bold uppercase px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors">
            Pick Your Squad →
          </Link>
        </div>
      )}
    </div>
  )
}
