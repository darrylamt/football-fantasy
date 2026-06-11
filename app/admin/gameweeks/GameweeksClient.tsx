'use client'

import { useState } from 'react'
import type { Gameweek, Season } from '@/types'
import { createGameweek, updateGameweekStatus, setCurrentGameweek, finalizeGameweek } from './actions'
import { formatDeadline } from '@/lib/utils/format'

const statuses = ['upcoming', 'active', 'finished'] as const

export default function GameweeksClient({ gameweeks: initial, seasons }: { gameweeks: (Gameweek & { seasons?: Season })[]; seasons: Season[] }) {
  const [gameweeks, setGameweeks] = useState(initial)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ season_id: seasons.find(s => s.is_active)?.id ?? '', number: '', deadline: '' })
  const [loading, setLoading] = useState(false)
  const [finalizing, setFinalizing] = useState<string | null>(null)
  const [finalizeMsg, setFinalizeMsg] = useState('')

  async function handleFinalize(gw: Gameweek) {
    if (!confirm(`Finalize GW${gw.number}? This scores all fantasy teams (auto-subs, captain points, chips), marks the gameweek finished and recalculates ranks.`)) return
    setFinalizing(gw.id); setFinalizeMsg('')
    const result = await finalizeGameweek(gw.id)
    setFinalizing(null)
    if (result.error) { setFinalizeMsg(`Error: ${result.error}`); return }
    setFinalizeMsg(`GW${gw.number} finalized — picks scored and ranks updated.`)
    setGameweeks(prev => prev.map(g => g.id === gw.id ? { ...g, status: 'finished' } : g))
  }

  async function handleAdd() {
    setLoading(true)
    const result = await createGameweek({ season_id: form.season_id, number: parseInt(form.number), deadline: form.deadline })
    if (result.data) setGameweeks(prev => [...prev, result.data!])
    setLoading(false); setAdding(false)
  }

  async function handleStatusChange(id: string, status: Gameweek['status']) {
    await updateGameweekStatus(id, status)
    setGameweeks(prev => prev.map(gw => gw.id === id ? { ...gw, status } : gw))
  }

  async function handleSetCurrent(id: string) {
    await setCurrentGameweek(id)
    setGameweeks(prev => prev.map(gw => ({ ...gw, is_current: gw.id === id })))
  }

  const statusColor: Record<string, string> = {
    upcoming: 'text-gray-400', active: 'text-[#4ade80]', finished: 'text-gray-600',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-barlow font-black text-4xl uppercase text-white">Gameweeks</h1>
        <button onClick={() => setAdding(true)} className="bg-[#4ade80] text-[#0a1400] font-barlow font-black uppercase px-5 py-2.5 rounded-xl hover:bg-[#22c55e] transition-colors">
          + Add Gameweek
        </button>
      </div>

      {adding && (
        <div className="bg-[#112211] border border-[#1f3d1f] rounded-xl p-6 space-y-4">
          <h2 className="font-barlow font-bold uppercase text-white">New Gameweek</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">Season</label>
              <select value={form.season_id} onChange={e => setForm(p => ({ ...p, season_id: e.target.value }))} className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4ade80]">
                {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">GW Number</label>
              <input type="number" value={form.number} onChange={e => setForm(p => ({ ...p, number: e.target.value }))} className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4ade80]" />
            </div>
            <div>
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">Deadline (UTC)</label>
              <input type="datetime-local" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4ade80]" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={loading} className="bg-[#4ade80] text-[#0a1400] font-barlow font-black uppercase px-5 py-2 rounded-lg disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
            <button onClick={() => setAdding(false)} className="bg-[#1f3d1f] text-gray-300 font-barlow font-bold uppercase px-5 py-2 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {finalizeMsg && (
        <div className={`rounded-lg px-4 py-3 text-sm font-semibold ${
          finalizeMsg.startsWith('Error') ? 'bg-red-900/30 border border-red-700 text-red-300' : 'bg-[#1f3d1f] border border-[#4ade80]/40 text-[#4ade80]'
        }`}>
          {finalizeMsg}
        </div>
      )}

      <div className="bg-[#112211] border border-[#1f3d1f] rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1f3d1f]">
              {['GW', 'Deadline', 'Status', 'Current', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-barlow uppercase text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gameweeks.map(gw => (
              <tr key={gw.id} className="border-b border-[#1f3d1f]/50 hover:bg-[#1a331a]">
                <td className="px-4 py-3 font-barlow font-bold text-white">GW{gw.number}</td>
                <td className="px-4 py-3 text-gray-300 text-sm">{formatDeadline(gw.deadline)}</td>
                <td className="px-4 py-3">
                  <select
                    value={gw.status}
                    onChange={e => handleStatusChange(gw.id, e.target.value as Gameweek['status'])}
                    className="bg-[#0d1f0d] border border-[#1f3d1f] rounded px-2 py-1 text-sm focus:outline-none focus:border-[#4ade80]"
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {gw.is_current ? (
                    <span className="font-barlow font-bold uppercase text-xs text-[#4ade80]">Current</span>
                  ) : (
                    <button onClick={() => handleSetCurrent(gw.id)} className="text-gray-400 text-xs hover:text-[#4ade80] font-barlow uppercase">Set Current</button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleFinalize(gw)}
                    disabled={finalizing === gw.id}
                    className="bg-[#4ade80] text-[#0a1400] font-barlow font-bold uppercase text-xs px-3 py-1.5 rounded hover:bg-[#22c55e] transition-colors disabled:opacity-50"
                  >
                    {finalizing === gw.id ? 'Scoring…' : 'Finalize & Score'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
