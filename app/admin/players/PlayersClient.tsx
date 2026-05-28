'use client'

import { useState } from 'react'
import type { Player, RealTeam, Position } from '@/types'
import { createPlayer, updatePlayer, deletePlayer } from './actions'
import { formatPrice } from '@/lib/utils/format'

const positions: Position[] = ['GK', 'DEF', 'MID', 'FWD']
const statuses = ['available', 'injured', 'suspended', 'doubtful']

type PlayerForm = {
  name: string; display_name: string; position: Position; team_id: string; price: string; status: string; news: string
}

const emptyForm: PlayerForm = { name: '', display_name: '', position: 'MID', team_id: '', price: '5.0', status: 'available', news: '' }

export default function PlayersClient({ players: initial, teams }: { players: (Player & { real_teams?: RealTeam })[]; teams: RealTeam[] }) {
  const [players, setPlayers] = useState(initial)
  const [editing, setEditing] = useState<Player | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState<PlayerForm>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [posFilter, setPosFilter] = useState<Position | 'ALL'>('ALL')

  function openAdd() { setForm(emptyForm); setAdding(true); setEditing(null) }
  function openEdit(p: Player) {
    setForm({ name: p.name, display_name: p.display_name ?? '', position: p.position, team_id: p.team_id ?? '', price: String(p.price), status: p.status, news: p.news ?? '' })
    setEditing(p); setAdding(false)
  }
  function cancel() { setAdding(false); setEditing(null); setError('') }

  async function handleSave() {
    setLoading(true); setError('')
    const payload = { ...form, price: parseFloat(form.price) }
    if (adding) {
      const result = await createPlayer(payload)
      if (result.error) { setError(result.error); setLoading(false); return }
      if (result.data) setPlayers(prev => [...prev, result.data!])
    } else if (editing) {
      const result = await updatePlayer(editing.id, payload)
      if (result.error) { setError(result.error); setLoading(false); return }
      setPlayers(prev => prev.map(p => p.id === editing.id ? { ...p, ...payload, status: payload.status as import('@/types').PlayerStatus } : p))
    }
    setLoading(false); cancel()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this player?')) return
    await deletePlayer(id)
    setPlayers(prev => prev.filter(p => p.id !== id))
  }

  const filtered = posFilter === 'ALL' ? players : players.filter(p => p.position === posFilter)

  const statusBadge: Record<string, string> = {
    available: 'text-[#4ade80]', injured: 'text-red-400', suspended: 'text-orange-400', doubtful: 'text-yellow-400',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-barlow font-black text-4xl uppercase text-white">Players</h1>
        <button onClick={openAdd} className="bg-[#4ade80] text-[#0a1400] font-barlow font-black uppercase px-5 py-2.5 rounded-xl hover:bg-[#22c55e] transition-colors">
          + Add Player
        </button>
      </div>

      {(adding || editing) && (
        <div className="bg-[#112211] border border-[#1f3d1f] rounded-xl p-6 space-y-4">
          <h2 className="font-barlow font-bold uppercase text-white">{adding ? 'Add Player' : 'Edit Player'}</h2>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'name', label: 'Full Name', type: 'text' },
              { key: 'display_name', label: 'Display Name', type: 'text' },
              { key: 'price', label: 'Price (₵m)', type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">{f.label}</label>
                <input
                  type={f.type}
                  step={f.key === 'price' ? '0.5' : undefined}
                  value={form[f.key as keyof PlayerForm]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4ade80]"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">Position</label>
              <select value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value as Position }))} className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4ade80]">
                {positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">Club</label>
              <select value={form.team_id} onChange={e => setForm(p => ({ ...p, team_id: e.target.value }))} className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4ade80]">
                <option value="">Select club</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4ade80]">
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">News</label>
              <input value={form.news} onChange={e => setForm(p => ({ ...p, news: e.target.value }))} placeholder="Injury news..." className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4ade80]" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={loading} className="bg-[#4ade80] text-[#0a1400] font-barlow font-black uppercase px-5 py-2 rounded-lg hover:bg-[#22c55e] disabled:opacity-50 transition-colors">{loading ? 'Saving...' : 'Save'}</button>
            <button onClick={cancel} className="bg-[#1f3d1f] text-gray-300 font-barlow font-bold uppercase px-5 py-2 rounded-lg hover:bg-[#2d5a2d] transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Position filter */}
      <div className="flex gap-1">
        {(['ALL', ...positions] as const).map(p => (
          <button key={p} onClick={() => setPosFilter(p)} className={`font-barlow font-bold uppercase text-sm px-3 py-1.5 rounded transition-colors ${posFilter === p ? 'bg-[#4ade80] text-[#0a1400]' : 'bg-[#1f3d1f] text-gray-300 hover:bg-[#2d5a2d]'}`}>{p}</button>
        ))}
      </div>

      <div className="bg-[#112211] border border-[#1f3d1f] rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1f3d1f]">
              {['Name', 'Pos', 'Club', 'Price', 'Pts', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-barlow uppercase text-gray-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(player => (
              <tr key={player.id} className="border-b border-[#1f3d1f]/50 hover:bg-[#1a331a] transition-colors">
                <td className="px-4 py-3">
                  <div className="text-white font-medium">{player.name}</div>
                  {player.display_name && <div className="text-gray-500 text-xs">{player.display_name}</div>}
                </td>
                <td className="px-4 py-3"><span className="font-barlow font-bold uppercase text-sm text-[#4ade80]">{player.position}</span></td>
                <td className="px-4 py-3 text-gray-300 text-sm">{(player as any).real_teams?.short_name ?? '-'}</td>
                <td className="px-4 py-3 font-barlow font-bold text-white">{formatPrice(player.price)}</td>
                <td className="px-4 py-3 text-gray-300">{player.total_points}</td>
                <td className="px-4 py-3"><span className={`font-barlow uppercase text-xs ${statusBadge[player.status]}`}>{player.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(player)} className="text-[#4ade80] text-sm hover:underline font-barlow uppercase">Edit</button>
                    <button onClick={() => handleDelete(player.id)} className="text-red-400 text-sm hover:underline font-barlow uppercase">Del</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center text-gray-500 py-8">No players</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
