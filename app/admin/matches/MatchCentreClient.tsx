'use client'

import { useState } from 'react'
import type { Fixture, Gameweek, Player, RealTeam } from '@/types'
import { getFixturePlayers } from '../stats/actions'
import { saveMatchResult, type MatchPlayerRow } from './actions'
import { calculatePoints } from '@/lib/game/points'

type FixtureFull = Fixture & { home_team?: RealTeam; away_team?: RealTeam }

type RowState = Omit<MatchPlayerRow, 'player_id' | 'position' | 'team_id'>

const emptyRow: RowState = {
  minutes: 0, goals: 0, assists: 0, saves: 0, penalty_saves: 0,
  yellow_cards: 0, red_cards: 0, own_goals: 0, bonus: 0,
}

const statCols: { key: keyof RowState; label: string; title: string }[] = [
  { key: 'goals',          label: 'G',  title: 'Goals' },
  { key: 'assists',        label: 'A',  title: 'Assists' },
  { key: 'yellow_cards',   label: 'YC', title: 'Yellow cards' },
  { key: 'red_cards',      label: 'RC', title: 'Red cards' },
  { key: 'saves',          label: 'SV', title: 'Saves (GK)' },
  { key: 'penalty_saves',  label: 'PS', title: 'Penalty saves' },
  { key: 'own_goals',      label: 'OG', title: 'Own goals' },
  { key: 'bonus',          label: 'B',  title: 'Bonus (0-3)' },
]

export default function MatchCentreClient({ gameweeks, fixtures }: { gameweeks: Gameweek[]; fixtures: FixtureFull[] }) {
  const currentGw = gameweeks.find(g => g.is_current)
  const [gwId, setGwId] = useState(currentGw?.id ?? gameweeks[0]?.id ?? '')
  const [fixture, setFixture] = useState<FixtureFull | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [rows, setRows] = useState<Record<string, RowState>>({})
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const gwFixtures = fixtures.filter(f => f.gameweek_id === gwId)

  async function openFixture(f: FixtureFull) {
    setLoading(true); setMsg(''); setFixture(f)
    setHomeScore(f.home_score ?? 0)
    setAwayScore(f.away_score ?? 0)
    const { players: ps, stats } = await getFixturePlayers(f.id, f.gameweek_id)
    setPlayers(ps as Player[])
    const next: Record<string, RowState> = {}
    for (const p of ps as Player[]) {
      const s = stats.find((x: any) => x.player_id === p.id)
      next[p.id] = s
        ? {
            minutes: s.minutes, goals: s.goals, assists: s.assists, saves: s.saves,
            penalty_saves: s.penalty_saves, yellow_cards: s.yellow_cards,
            red_cards: s.red_cards, own_goals: s.own_goals, bonus: s.bonus,
          }
        : { ...emptyRow }
    }
    setRows(next)
    setLoading(false)
  }

  function setStat(playerId: string, key: keyof RowState, value: number) {
    setRows(prev => ({ ...prev, [playerId]: { ...prev[playerId], [key]: Math.max(0, value) } }))
  }

  function livePoints(p: Player): number {
    const r = rows[p.id]
    if (!r || r.minutes === 0 || !fixture) return 0
    const conceded = p.team_id === fixture.home_team_id ? awayScore : homeScore
    return calculatePoints(
      { ...r, player_id: p.id, gameweek_id: fixture.gameweek_id, clean_sheet: r.minutes >= 60 && conceded === 0 },
      p.position
    )
  }

  async function handleSave() {
    if (!fixture) return
    setSaving(true); setMsg('')
    const result = await saveMatchResult({
      fixtureId: fixture.id,
      gameweekId: fixture.gameweek_id,
      homeTeamId: fixture.home_team_id,
      homeScore,
      awayScore,
      rows: players.map(p => ({
        player_id: p.id,
        position: p.position,
        team_id: p.team_id,
        ...rows[p.id],
      })),
    })
    setSaving(false)
    if (result.error) { setMsg(`Error: ${result.error}`); return }
    setMsg('Match saved — score, line-ups and player points updated.')
    setFixture(prev => prev ? { ...prev, played: true, home_score: homeScore, away_score: awayScore } : prev)
  }

  function ClubTable({ teamId, teamName }: { teamId: string; teamName: string }) {
    const squad = players.filter(p => p.team_id === teamId)
    return (
      <div className="bg-[#112211] border border-[#1f3d1f] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 bg-[#0d1f0d] border-b border-[#1f3d1f]">
          <h3 className="font-barlow font-bold uppercase text-white text-sm">{teamName}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f3d1f]">
                <th className="text-left px-3 py-2 text-xs font-barlow uppercase text-gray-400">Player</th>
                <th className="px-1 py-2 text-xs font-barlow uppercase text-gray-400" title="Quick: started, played 90">XI</th>
                <th className="px-1 py-2 text-xs font-barlow uppercase text-gray-400" title="Minutes played">Min</th>
                {statCols.map(c => (
                  <th key={c.key} className="px-1 py-2 text-xs font-barlow uppercase text-gray-400" title={c.title}>{c.label}</th>
                ))}
                <th className="px-2 py-2 text-xs font-barlow uppercase text-[#4ade80]">Pts</th>
              </tr>
            </thead>
            <tbody>
              {squad.map(p => {
                const r = rows[p.id] ?? emptyRow
                const inLineup = r.minutes > 0
                return (
                  <tr key={p.id} className={`border-b border-[#1f3d1f]/50 ${inLineup ? '' : 'opacity-50'}`}>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      <span className="text-white">{p.display_name ?? p.name}</span>
                      <span className="text-gray-500 text-xs ml-1.5">{p.position}</span>
                      {p.status !== 'available' && (
                        <span className="text-red-400 text-xs ml-1.5">({p.status})</span>
                      )}
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <button
                        onClick={() => setStat(p.id, 'minutes', inLineup ? 0 : 90)}
                        className={`w-9 h-7 rounded text-xs font-barlow font-bold transition-colors ${
                          inLineup ? 'bg-[#4ade80] text-[#0a1400]' : 'bg-[#0d1f0d] border border-[#1f3d1f] text-gray-400 hover:border-[#4ade80]'
                        }`}
                        title={inLineup ? 'Remove from line-up (0 mins)' : 'Add to line-up (90 mins)'}
                      >
                        {inLineup ? '✓' : '–'}
                      </button>
                    </td>
                    <td className="px-1 py-1.5">
                      <input
                        type="number" min={0} max={90}
                        value={r.minutes}
                        onChange={e => setStat(p.id, 'minutes', parseInt(e.target.value) || 0)}
                        className="w-12 bg-[#0d1f0d] border border-[#1f3d1f] rounded px-1 py-1 text-center text-white text-xs focus:outline-none focus:border-[#4ade80]"
                      />
                    </td>
                    {statCols.map(c => (
                      <td key={c.key} className="px-1 py-1.5">
                        <input
                          type="number" min={0} max={c.key === 'bonus' ? 3 : 99}
                          value={r[c.key]}
                          onChange={e => setStat(p.id, c.key, parseInt(e.target.value) || 0)}
                          className="w-10 bg-[#0d1f0d] border border-[#1f3d1f] rounded px-1 py-1 text-center text-white text-xs focus:outline-none focus:border-[#4ade80]"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-center font-barlow font-bold text-[#4ade80]">{livePoints(p)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-barlow font-black text-4xl uppercase text-white">Match Centre</h1>
        <p className="text-gray-400 text-sm mt-1">
          Pick a fixture, enter the final score, set the line-ups and record events — clean sheets and points are calculated automatically.
          Player availability (injuries, suspensions) is managed on the <a href="/admin/players" className="text-[#4ade80] hover:underline">Players</a> page.
        </p>
      </div>

      {/* Gameweek tabs */}
      <div className="flex gap-1 flex-wrap">
        {gameweeks.map(gw => (
          <button
            key={gw.id}
            onClick={() => { setGwId(gw.id); setFixture(null); setMsg('') }}
            className={`font-barlow font-bold uppercase text-sm px-4 py-2 rounded-lg transition-colors ${
              gwId === gw.id ? 'bg-[#4ade80] text-[#0a1400]' : 'bg-[#112211] border border-[#1f3d1f] text-gray-300 hover:border-[#4ade80]'
            }`}
          >
            GW{gw.number}{gw.is_current ? ' •' : ''}
          </button>
        ))}
      </div>

      {/* Fixture list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {gwFixtures.length === 0 && (
          <div className="text-gray-500 text-sm col-span-full">No fixtures in this gameweek — add them on the Fixtures page.</div>
        )}
        {gwFixtures.map(f => (
          <button
            key={f.id}
            onClick={() => openFixture(f)}
            className={`text-left px-4 py-3 rounded-xl border transition-colors ${
              fixture?.id === f.id ? 'bg-[#1f3d1f] border-[#4ade80]' : 'bg-[#112211] border-[#1f3d1f] hover:border-[#4ade80]/50'
            }`}
          >
            <div className="text-white text-sm font-semibold">
              {f.home_team?.short_name} vs {f.away_team?.short_name}
            </div>
            <div className="text-xs mt-0.5">
              {f.played
                ? <span className="text-[#4ade80] font-bold">{f.home_score}–{f.away_score} · played</span>
                : <span className="text-gray-500">not played</span>}
            </div>
          </button>
        ))}
      </div>

      {msg && (
        <div className={`rounded-lg px-4 py-3 text-sm font-semibold ${
          msg.startsWith('Error') ? 'bg-red-900/30 border border-red-700 text-red-300' : 'bg-[#1f3d1f] border border-[#4ade80]/40 text-[#4ade80]'
        }`}>
          {msg}
        </div>
      )}

      {loading && <div className="text-gray-400 text-sm">Loading players…</div>}

      {fixture && !loading && (
        <>
          {/* Score */}
          <div className="bg-[#112211] border border-[#1f3d1f] rounded-xl p-5 flex items-center justify-center gap-4 flex-wrap">
            <span className="font-barlow font-bold text-white text-lg text-right min-w-[120px]">{fixture.home_team?.name}</span>
            <input
              type="number" min={0}
              value={homeScore}
              onChange={e => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-14 bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-2 py-2 text-center text-white font-barlow font-black text-xl focus:outline-none focus:border-[#4ade80]"
            />
            <span className="text-gray-500 font-bold">–</span>
            <input
              type="number" min={0}
              value={awayScore}
              onChange={e => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-14 bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-2 py-2 text-center text-white font-barlow font-black text-xl focus:outline-none focus:border-[#4ade80]"
            />
            <span className="font-barlow font-bold text-white text-lg min-w-[120px]">{fixture.away_team?.name}</span>
          </div>

          {/* Line-ups & events */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ClubTable teamId={fixture.home_team_id} teamName={fixture.home_team?.name ?? 'Home'} />
            <ClubTable teamId={fixture.away_team_id} teamName={fixture.away_team?.name ?? 'Away'} />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#4ade80] text-[#0a1400] font-barlow font-black uppercase px-6 py-3 rounded-xl hover:bg-[#22c55e] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Match'}
            </button>
            <span className="text-gray-500 text-xs">
              Saves the score, all line-ups and events. Run “Finalize & Score” on the Gameweeks page once every match in the GW is saved.
            </span>
          </div>
        </>
      )}
    </div>
  )
}
