import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Fixture, Gameweek, RealTeam } from '@/types'

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

  // Group fixtures by gameweek
  const grouped: Record<string, Fixture[]> = {}
  for (const f of fixtures ?? []) {
    if (!grouped[f.gameweek_id]) grouped[f.gameweek_id] = []
    grouped[f.gameweek_id].push(f as any)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-barlow font-black text-4xl uppercase text-gray-900">Fixtures</h1>
        <p className="text-gray-500 text-sm mt-0.5">All matches across the season</p>
      </div>

      {Object.entries(grouped).map(([gwId, gfixtures]) => {
        const gw = gwMap[gwId]
        return (
          <div key={gwId}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-barlow font-black text-xl uppercase text-gray-900">Gameweek {gw?.number}</h2>
              <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${
                gw?.status === 'active' ? 'bg-green-100 text-green-700' :
                gw?.status === 'finished' ? 'bg-gray-100 text-gray-500' :
                'bg-blue-50 text-blue-600'
              }`}>
                {gw?.status ?? 'upcoming'}
              </span>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {gfixtures.map((f, i) => {
                const home = (f as any).home_team as RealTeam | undefined
                const away = (f as any).away_team as RealTeam | undefined
                return (
                  <div
                    key={f.id}
                    className={`flex items-center gap-3 px-5 py-4 ${i < gfixtures.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    {/* Home */}
                    <div className="flex-1 flex items-center gap-2 justify-end">
                      <span className="font-semibold text-gray-900 text-sm sm:text-base truncate text-right">{home?.name ?? '–'}</span>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: home?.primary_color ?? '#d1d5db' }} />
                    </div>

                    {/* Score / kickoff */}
                    <div className="flex-shrink-0 text-center min-w-[80px]">
                      {f.played ? (
                        <div className="font-barlow font-black text-xl text-gray-900">
                          {f.home_score} <span className="text-gray-400">–</span> {f.away_score}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 leading-tight">{formatKickoff(f.kickoff_time)}</div>
                      )}
                    </div>

                    {/* Away */}
                    <div className="flex-1 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: away?.primary_color ?? '#d1d5db' }} />
                      <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">{away?.name ?? '–'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {!fixtures?.length && (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 shadow-sm">
          No fixtures scheduled yet.
        </div>
      )}
    </div>
  )
}
