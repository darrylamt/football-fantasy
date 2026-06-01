import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DeadlineCountdown from '@/components/ui/DeadlineCountdown'

const quickLinks = [
  { href: '/squad',     label: 'My Squad',  desc: 'View & pick your team' },
  { href: '/transfers', label: 'Transfers', desc: 'Buy & sell players' },
  { href: '/points',    label: 'Points',    desc: 'GW points breakdown' },
  { href: '/players',   label: 'Players',   desc: 'Browse all players' },
  { href: '/fixtures',  label: 'Fixtures',  desc: 'Upcoming matches' },
  { href: '/leagues',   label: 'Leagues',   desc: 'Mini-league standings' },
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
    { label: 'GW Points',      value: gwPoints },
    { label: 'Total Points',   value: fantasyTeam?.total_points ?? 0 },
    { label: 'Overall Rank',   value: fantasyTeam?.overall_rank ? `#${fantasyTeam.overall_rank.toLocaleString()}` : '–' },
    { label: 'Free Transfers', value: fantasyTeam?.free_transfers === 0 ? '∞' : (fantasyTeam?.free_transfers ?? 1) },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-barlow font-black text-3xl text-gray-900">
            {fantasyTeam?.name ?? 'My Team'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {gameweek ? `Gameweek ${gameweek.number}` : 'No active gameweek'}
          </p>
        </div>
        {gameweek && <DeadlineCountdown deadline={gameweek.deadline} />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-lg px-4 py-3">
            <div className="text-xs text-gray-400 mb-1">{s.label}</div>
            <div className="font-barlow font-black text-2xl text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {quickLinks.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white border border-gray-100 rounded-lg px-4 py-3 hover:border-gray-300 transition-colors"
          >
            <div className="text-sm font-medium text-gray-900">{item.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
          </Link>
        ))}
      </div>

      {!fantasyTeam && (
        <div className="border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-3">You don't have a team yet.</p>
          <Link href="/squad" className="inline-block bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-800 transition-colors">
            Pick your squad
          </Link>
        </div>
      )}
    </div>
  )
}
