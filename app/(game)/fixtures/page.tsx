import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Fixture, RealTeam } from '@/types'

function formatKickoff(dt?: string) {
  if (!dt) return 'TBC'
  return new Date(dt).toLocaleString('en-GB', {
    timeZone: 'Africa/Accra',
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function FixturesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: gameweeks }, { data: fixtures }] = await Promise.all([
    supabase.from('gameweeks').select('*').order('number'),
    supabase.from('fixtures').select('*, home_team:real_teams!home_team_id(*), away_team:real_teams!away_team_id(*)').order('kickoff_time'),
  ])

  const gwMap = Object.fromEntries((gameweeks ?? []).map(gw => [gw.id, gw]))

  const grouped: Record<string, Fixture[]> = {}
  for (const f of fixtures ?? []) {
    if (!grouped[f.gameweek_id]) grouped[f.gameweek_id] = []
    grouped[f.gameweek_id].push(f as any)
  }

  return (
    <div className="space-y-4">
      <div className="fpl-hero rounded-lg px-5 py-5 sm:px-6">
        <h1 className="font-barlow font-black text-3xl text-white leading-none">Fixtures</h1>
        <p className="text-white/60 text-sm mt-1">All matches across the season</p>
      </div>

      {Object.entries(grouped).map(([gwId, gfixtures]) => {
        const gw = gwMap[gwId]
        return (
          <div key={gwId} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-[#37003c] px-4 py-2.5 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Gameweek {gw?.number}</h2>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                gw?.status === 'active' ? 'text-[#00ff87]' : gw?.status === 'finished' ? 'text-white/40' : 'text-[#04f5ff]'
              }`}>
                {gw?.status ?? 'upcoming'}
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {gfixtures.map(f => {
                const home = (f as any).home_team as RealTeam | undefined
                const away = (f as any).away_team as RealTeam | undefined
                return (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
                      <span className="text-sm font-semibold text-[#37003c] truncate text-right">{home?.name ?? '–'}</span>
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: home?.primary_color ?? '#d1d5db' }} />
                    </div>

                    <div className="flex-shrink-0 text-center w-24">
                      {f.played ? (
                        <span className="bg-[#37003c] text-white font-barlow font-bold text-base rounded px-2.5 py-0.5">
                          {f.home_score}–{f.away_score}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 leading-tight block">{formatKickoff(f.kickoff_time)}</span>
                      )}
                    </div>

                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: away?.primary_color ?? '#d1d5db' }} />
                      <span className="text-sm font-semibold text-[#37003c] truncate">{away?.name ?? '–'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {!fixtures?.length && (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-sm text-gray-400">
          No fixtures scheduled yet.
        </div>
      )}
    </div>
  )
}
