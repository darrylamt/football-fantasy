'use client'

import { useState } from 'react'
import type { Fixture, Gameweek, RealTeam } from '@/types'
import { createFixture, updateFixture, markPlayed, deleteFixture } from './actions'

type FixtureForm = { gameweek_id: string; home_team_id: string; away_team_id: string; kickoff_time: string }
const emptyForm: FixtureForm = { gameweek_id: '', home_team_id: '', away_team_id: '', kickoff_time: '' }

type ScoreForm = { home_score: string; away_score: string }

export default function FixturesClient({
  fixtures: initial,
  gameweeks,
  teams,
}: {
  fixtures: Fixture[]
  gameweeks: Gameweek[]
  teams: RealTeam[]
}) {
  const [fixtures, setFixtures] = useState(initial)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<Fixture | null>(null)
  const [scoring, setScoring] = useState<Fixture | null>(null)
  const [form, setForm] = useState<FixtureForm>(emptyForm)
  const [scoreForm, setScoreForm] = useState<ScoreForm>({ home_score: '0', away_score: '0' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [gwFilter, setGwFilter] = useState<string>('ALL')

  function openAdd() {
    setForm({ ...emptyForm, gameweek_id: gameweeks[0]?.id ?? '' })
    setAdding(true); setEditing(null); setScoring(null); setError('')
  }

  function openEdit(f: Fixture) {
    setForm({
      gameweek_id: f.gameweek_id,
      home_team_id: f.home_team_id,
      away_team_id: f.away_team_id,
      kickoff_time: f.kickoff_time ? f.kickoff_time.slice(0, 16) : '',
    })
    setEditing(f); setAdding(false); setScoring(null); setError('')
  }

  function openScore(f: Fixture) {
    setScoreForm({ home_score: String(f.home_score ?? 0), away_score: String(f.away_score ?? 0) })
    setScoring(f); setAdding(false); setEditing(null); setError('')
  }

  function cancel() { setAdding(false); setEditing(null); setScoring(null); setError('') }

  async function handleSave() {
    setLoading(true); setError('')
    if (adding) {
      const result = await createFixture(form)
      if (result.error) { setError(result.error); setLoading(false); return }
      if (result.data) setFixtures(prev => [...prev, result.data!])
    } else if (editing) {
      const result = await updateFixture(editing.id, form)
      if (result.error) { setError(result.error); setLoading(false); return }
      setFixtures(prev => prev.map(f => f.id === editing.id ? { ...f, ...form } : f))
    }
    setLoading(false); cancel()
  }

  async function handleMarkPlayed() {
    if (!scoring) return
    setLoading(true); setError('')
    const result = await markPlayed(scoring.id, parseInt(scoreForm.home_score), parseInt(scoreForm.away_score))
    if (result.error) { setError(result.error); setLoading(false); return }
    setFixtures(prev => prev.map(f =>
      f.id === scoring.id
        ? { ...f, played: true, home_score: parseInt(scoreForm.home_score), away_score: parseInt(scoreForm.away_score) }
        : f
    ))
    setLoading(false); cancel()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this fixture?')) return
    await deleteFixture(id)
    setFixtures(prev => prev.filter(f => f.id !== id))
  }

  const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))
  const gwMap = Object.fromEntries(gameweeks.map(gw => [gw.id, gw]))

  const filtered = gwFilter === 'ALL' ? fixtures : fixtures.filter(f => f.gameweek_id === gwFilter)

  function formatKickoff(dt?: string) {
    if (!dt) return '-'
    return new Date(dt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-barlow font-black text-4xl uppercase text-white">Fixtures</h1>
        <button onClick={openAdd} className="bg-[#4ade80] text-[#0a1400] font-barlow font-black uppercase px-5 py-2.5 rounded-xl hover:bg-[#22c55e] transition-colors">
          + Add Fixture
        </button>
      </div>

      {(adding || editing) && (
        <div className="bg-[#112211] border border-[#1f3d1f] rounded-xl p-6 space-y-4">
          <h2 className="font-barlow font-bold uppercase text-white">{adding ? 'Add Fixture' : 'Edit Fixture'}</h2>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">Gameweek</label>
              <select value={form.gameweek_id} onChange={e => setForm(p => ({ ...p, gameweek_id: e.target.value }))} className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4ade80]">
                <option value="">Select gameweek</option>
                {gameweeks.map(gw => <option key={gw.id} value={gw.id}>GW{gw.number}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">Home Team</label>
              <select value={form.home_team_id} onChange={e => setForm(p => ({ ...p, home_team_id: e.target.value }))} className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4ade80]">
                <option value="">Select team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">Away Team</label>
              <select value={form.away_team_id} onChange={e => setForm(p => ({ ...p, away_team_id: e.target.value }))} className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4ade80]">
                <option value="">Select team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">Kickoff (UTC)</label>
              <input type="datetime-local" value={form.kickoff_time} onChange={e => setForm(p => ({ ...p, kickoff_time: e.target.value }))} className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4ade80]" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={loading} className="bg-[#4ade80] text-[#0a1400] font-barlow font-black uppercase px-5 py-2 rounded-lg hover:bg-[#22c55e] disabled:opacity-50 transition-colors">{loading ? 'Saving...' : 'Save'}</button>
            <button onClick={cancel} className="bg-[#1f3d1f] text-gray-300 font-barlow font-bold uppercase px-5 py-2 rounded-lg hover:bg-[#2d5a2d] transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {scoring && (
        <div className="bg-[#112211] border border-[#1f3d1f] rounded-xl p-6 space-y-4">
          <h2 className="font-barlow font-bold uppercase text-white">Enter Result</h2>
          <p className="text-gray-400 text-sm">
            {teamMap[scoring.home_team_id]?.name ?? '?'} vs {teamMap[scoring.away_team_id]?.name ?? '?'}
          </p>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">Home Score</label>
              <input type="number" min={0} value={scoreForm.home_score} onChange={e => setScoreForm(p => ({ ...p, home_score: e.target.value }))} className="w-24 bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white text-center text-2xl font-bold focus:outline-none focus:border-[#4ade80]" />
            </div>
            <span className="text-gray-500 font-barlow font-bold text-2xl mt-5">–</span>
            <div>
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">Away Score</label>
              <input type="number" min={0} value={scoreForm.away_score} onChange={e => setScoreForm(p => ({ ...p, away_score: e.target.value }))} className="w-24 bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white text-center text-2xl font-bold focus:outline-none focus:border-[#4ade80]" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleMarkPlayed} disabled={loading} className="bg-[#4ade80] text-[#0a1400] font-barlow font-black uppercase px-5 py-2 rounded-lg hover:bg-[#22c55e] disabled:opacity-50 transition-colors">{loading ? 'Saving...' : 'Mark Played'}</button>
            <button onClick={cancel} className="bg-[#1f3d1f] text-gray-300 font-barlow font-bold uppercase px-5 py-2 rounded-lg hover:bg-[#2d5a2d] transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* GW Filter */}
      <div className="flex gap-1 flex-wrap">
        <button
          onClick={() => setGwFilter('ALL')}
          className={`font-barlow font-bold uppercase text-sm px-3 py-1.5 rounded transition-colors ${gwFilter === 'ALL' ? 'bg-[#4ade80] text-[#0a1400]' : 'bg-[#1f3d1f] text-gray-300 hover:bg-[#2d5a2d]'}`}
        >
          All
        </button>
        {gameweeks.map(gw => (
          <button
            key={gw.id}
            onClick={() => setGwFilter(gw.id)}
            className={`font-barlow font-bold uppercase text-sm px-3 py-1.5 rounded transition-colors ${gwFilter === gw.id ? 'bg-[#4ade80] text-[#0a1400]' : 'bg-[#1f3d1f] text-gray-300 hover:bg-[#2d5a2d]'}`}
          >
            GW{gw.number}
          </button>
        ))}
      </div>

      <div className="bg-[#112211] border border-[#1f3d1f] rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1f3d1f]">
              {['GW', 'Home', 'Score', 'Away', 'Kickoff', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-barlow uppercase text-gray-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(f => {
              const home = (f as any).home_team ?? teamMap[f.home_team_id]
              const away = (f as any).away_team ?? teamMap[f.away_team_id]
              const gw = (f as any).gameweeks ?? gwMap[f.gameweek_id]
              return (
                <tr key={f.id} className="border-b border-[#1f3d1f]/50 hover:bg-[#1a331a] transition-colors">
                  <td className="px-4 py-3 font-barlow font-bold text-white whitespace-nowrap">GW{gw?.number ?? '?'}</td>
                  <td className="px-4 py-3 text-white">{home?.name ?? '?'}</td>
                  <td className="px-4 py-3 font-barlow font-black text-[#4ade80] text-lg whitespace-nowrap">
                    {f.played ? `${f.home_score} – ${f.away_score}` : '–'}
                  </td>
                  <td className="px-4 py-3 text-white">{away?.name ?? '?'}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm whitespace-nowrap">{formatKickoff(f.kickoff_time)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-barlow uppercase text-xs ${f.played ? 'text-gray-500' : 'text-[#4ade80]'}`}>
                      {f.played ? 'Played' : 'Upcoming'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 whitespace-nowrap">
                      {!f.played && (
                        <button onClick={() => openScore(f)} className="text-[#4ade80] text-sm hover:underline font-barlow uppercase">Result</button>
                      )}
                      <button onClick={() => openEdit(f)} className="text-blue-400 text-sm hover:underline font-barlow uppercase">Edit</button>
                      <button onClick={() => handleDelete(f.id)} className="text-red-400 text-sm hover:underline font-barlow uppercase">Del</button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center text-gray-500 py-8">No fixtures</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
