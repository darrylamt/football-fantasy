import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [{ count: playerCount }, { count: teamCount }, { count: fantasyCount }, { data: gameweek }] = await Promise.all([
    supabase.from('players').select('*', { count: 'exact', head: true }),
    supabase.from('real_teams').select('*', { count: 'exact', head: true }),
    supabase.from('fantasy_teams').select('*', { count: 'exact', head: true }),
    supabase.from('gameweeks').select('*').eq('is_current', true).single(),
  ])

  const stats = [
    { label: 'Players', value: playerCount ?? 0, href: '/admin/players' },
    { label: 'Teams', value: teamCount ?? 0, href: '/admin/teams' },
    { label: 'Fantasy Teams', value: fantasyCount ?? 0, href: '#' },
  ]

  const quickLinks = [
    { href: '/admin/players', label: 'Manage Players', desc: 'Add, edit or remove players' },
    { href: '/admin/teams', label: 'Manage Teams', desc: 'Club info and colours' },
    { href: '/admin/gameweeks', label: 'Gameweeks', desc: 'Set deadlines and status' },
    { href: '/admin/fixtures', label: 'Fixtures', desc: 'Schedule and enter results' },
    { href: '/admin/stats', label: 'Stats Entry', desc: 'Enter player stats after matches' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-barlow font-black text-4xl uppercase text-white">Admin Dashboard</h1>
        {gameweek && (
          <p className="text-[#4ade80] font-barlow font-bold uppercase text-sm mt-1">
            Current: GW{gameweek.number} — {gameweek.status}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href} className="bg-[#112211] border border-[#1f3d1f] rounded-xl p-6 hover:border-[#4ade80]/50 transition-colors">
            <div className="text-xs font-barlow uppercase text-gray-400">{s.label}</div>
            <div className="font-barlow font-black text-4xl text-[#4ade80] mt-1">{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-[#112211] border border-[#1f3d1f] rounded-xl p-5 hover:border-[#4ade80]/50 hover:bg-[#1a331a] transition-all group"
          >
            <div className="font-barlow font-bold uppercase text-white group-hover:text-[#4ade80] transition-colors">
              {link.label}
            </div>
            <div className="text-gray-500 text-sm mt-1">{link.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
