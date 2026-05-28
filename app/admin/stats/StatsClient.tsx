'use client'

import { useState } from 'react'
import type { Gameweek, Fixture, Player, PlayerGameweekStats, RealTeam, Position } from '@/types'
import { upsertPlayerStats, getFixturePlayers } from './actions'
import { calculatePoints } from '@/lib/game/points'

type StatRow = {
  player_id: string
  minutes: number
  goals: number
  assists: number
  clean_sheet: boolean
  saves: number
  penalty_saves: number
  yellow_cards: number
  red_cards: number
  own_goals: number
  bonus: number
}

function defaultRow(player_id: string): StatRow {
  return { player_id, minutes: 0, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, yellow_cards: 0, red_cards: 0, own_goals: 0, bonus: 0 }
}

export default function StatsClient({
  gameweeks,
  fixtures: allFixtures,
  teams,
}: {
  gameweeks: Gameweek[]
  fixtures: Fixture[]
  teams: RealTeam[]
}) {
  const [selectedGw, setSelectedGw] = useState<string>('')
  const [selectedFixture, setSelectedFixture] = useState<string>('')
  const [players, setPlayers] = useState<Player[]>([])
  const [existingStats, setExistingStats] = useState<PlayerGameweekStats[]>([])
  const [rows, setRows] = useState<Record<string, StatRow>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  const gwFixtures = allFixtures.filter(f => f.gameweek_id === selectedGw)

  async function loadFixture(fixtureId: string) {
    setLoading(true); setError(''); setSaved(new Set())
    const { players: ps, stats } = await getFixturePlayers(fixtureId, selectedGw)
    setPlayers(ps)
    setExistingStats(stats)
    const initialRows: Record<string, StatRow> = {}
    ps.forEach(p => {
      const existing = stats.find(s => s.player_id === p.id)
      initialRows[p.id] = existing
        ? { player_id: p.id, minutes: existing.minutes, goals: existing.goals, assists: existing.assists, clean_sheet: existing.clean_sheet, saves: existing.saves, penalty_saves: existing.penalty_saves, yellow_cards: existing.yellow_cards, red_cards: existing.red_cards, own_goals: existing.own_goals, bonus: existing.bonus }
        : defaultRow(p.id)
    })
    setRows(initialRows)
    setLoading(false)
  }

  function handleGwChange(gwId: string) {
    setSelectedGw(gwId); setSelectedFixture(''); setPlayers([]); setRows({})
  }

  function handleFixtureChange(fId: string) {
    setSelectedFixture(fId)
    if (fId) loadFixture(fId)
    else { setPlayers([]); setRows({}) }
  }

  function updateRow(playerId: string, field: keyof StatRow, value: number | boolean) {
    setRows(prev => ({ ...prev, [playerId]: { ...prev[playerId], [field]: value } }))
  }

  async function saveRow(player: Player) {
    const row = rows[player.id]
    if (!row) return
    setSaving(player.id); setError('')
    const result = await upsertPlayerStats({
      ...row,
      gameweek_id: selectedGw,
      fixture_id: selectedFixture,
      position: player.position,
    })
    if (result.error) { setError(result.error) } else {
      setSaved(prev => new Set([...prev, player.id]))
    }
    setSaving(null)
  }

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))

  const posOrder: Position[] = ['GK', 'DEF', 'MID', 'FWD']
  const sorted = [...players].sort((a, b) => posOrder.indexOf(a.position) - posOrder.indexOf(b.position))

  const posBadge: Record<Position, string> = { GK: 'text-yellow-400', DEF: 'text-blue-400', MID: 'text-[#4ade80]', FWD: 'text-red-400' }

  const numField = (playerId: string, field: keyof StatRow, min = 0, max = 99) => (
    <input
      type="number"
      min={min}
      max={max}
      value={(rows[playerId]?.[field] as number) ?? 0}
      onChange={e => updateRow(playerId, field, parseInt(e.target.value) || 0)}
      className="w-12 bg-[#0d1f0d] border border-[#1f3d1f] rounded px-1 py-1 text-white text-center text-sm focus:outline-none focus:border-[#4ade80]"
    />
  )

  return (
    <div className="space-y-6">
      <h1 className="font-barlow font-black text-4xl uppercase text-white">Stats Entry</h1>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">Gameweek</label>
          <select value={selectedGw} onChange={e => handleGwChange(e.target.value)} className="bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4ade80]">
            <option value="">Select GW</option>
            {gameweeks.map(gw => <option key={gw.id} value={gw.id}>GW{gw.number}</option>)}
          </select>
        </div>
        {selectedGw && (
          <div>
            <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">Fixture</label>
            <select value={selectedFixture} onChange={e => handleFixtureChange(e.target.value)} className="bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4ade80]">
              <option value="">Select fixture</option>
              {gwFixtures.map(f => {
                const home = (f as any).home_team ?? teamMap[f.home_team_id]
                const away = (f as any).away_team ?? teamMap[f.away_team_id]
                return (
                  <option key={f.id} value={f.id}>
                    {home?.short_name ?? '?'} {f.played ? `${f.home_score}–${f.away_score}` : 'vs'} {away?.short_name ?? '?'}
                  </option>
                )
              })}
            </select>
          </div>
        )}
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      {loading && <div className="text-gray-400 font-barlow uppercase">Loading players...</div>}

      {!loading && players.length > 0 && (
        <div className="bg-[#112211] border border-[#1f3d1f] rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1f3d1f]">
                {['Player', 'Pos', 'Min', 'G', 'A', 'CS', 'Sv', 'PS', 'YC', 'RC', 'OG', 'Bon', 'Pts', ''].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-barlow uppercase text-gray-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map(player => {
                const row = rows[player.id]
                if (!row) return null
                const pts = calculatePoints({ ...row, gameweek_id: selectedGw }, player.position)
                const isSaved = saved.has(player.id)
                const isSaving = saving === player.id
                return (
                  <tr key={player.id} className={`border-b border-[#1f3d1f]/50 ${isSaved ? 'bg-[#1a331a]' : 'hover:bg-[#141f14]'} transition-colors`}>
                    <td className="px-3 py-2 text-white whitespace-nowrap">
                      {player.display_name ?? player.name}
                      <div className="text-gray-500 text-xs">{teamMap[player.team_id ?? '']?.short_name ?? ''}</div>
                    </td>
                    <td className="px-3 py-2"><span className={`font-barlow font-bold uppercase text-xs ${posBadge[player.position]}`}>{player.position}</span></td>
                    <td className="px-3 py-2">{numField(player.id, 'minutes', 0, 120)}</td>
                    <td className="px-3 py-2">{numField(player.id, 'goals')}</td>
                    <td className="px-3 py-2">{numField(player.id, 'assists')}</td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={row.clean_sheet}
                        onChange={e => updateRow(player.id, 'clean_sheet', e.target.checked)}
                        className="w-4 h-4 accent-[#4ade80]"
                      />
                    </td>
                    <td className="px-3 py-2">{player.position === 'GK' ? numField(player.id, 'saves') : <span className="text-gray-600">–</span>}</td>
                    <td className="px-3 py-2">{numField(player.id, 'penalty_saves')}</td>
                    <td className="px-3 py-2">{numField(player.id, 'yellow_cards', 0, 1)}</td>
                    <td className="px-3 py-2">{numField(player.id, 'red_cards', 0, 1)}</td>
                    <td className="px-3 py-2">{numField(player.id, 'own_goals')}</td>
                    <td className="px-3 py-2">{numField(player.id, 'bonus', 0, 3)}</td>
                    <td className="px-3 py-2 font-barlow font-bold text-[#4ade80]">{pts}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => saveRow(player)}
                        disabled={!!saving}
                        className={`font-barlow font-black uppercase text-xs px-3 py-1.5 rounded transition-colors disabled:opacity-50 ${isSaved ? 'bg-[#1f3d1f] text-[#4ade80]' : 'bg-[#4ade80] text-[#0a1400] hover:bg-[#22c55e]'}`}
                      >
                        {isSaving ? '...' : isSaved ? 'Saved' : 'Save'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && selectedFixture && players.length === 0 && (
        <div className="text-gray-500 font-barlow uppercase text-sm">No players found for this fixture.</div>
      )}

      {!selectedGw && (
        <div className="text-gray-500 font-barlow uppercase text-sm">Select a gameweek and fixture to enter stats.</div>
      )}
    </div>
  )
}
