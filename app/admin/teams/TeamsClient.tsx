'use client'

import { useState } from 'react'
import type { RealTeam } from '@/types'
import { createTeam, updateTeam, deleteTeam } from './actions'

export default function TeamsClient({ teams: initial }: { teams: RealTeam[] }) {
  const [teams, setTeams] = useState(initial)
  const [editing, setEditing] = useState<RealTeam | null>(null)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', short_name: '', primary_color: '#4ade80' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function openAdd() { setForm({ name: '', short_name: '', primary_color: '#4ade80' }); setAdding(true); setEditing(null) }
  function openEdit(t: RealTeam) { setForm({ name: t.name, short_name: t.short_name, primary_color: t.primary_color }); setEditing(t); setAdding(false) }
  function cancel() { setAdding(false); setEditing(null); setError('') }

  async function handleSave() {
    setLoading(true); setError('')
    if (adding) {
      const result = await createTeam(form)
      if (result.error) { setError(result.error); setLoading(false); return }
      if (result.data) setTeams(prev => [...prev, result.data!])
    } else if (editing) {
      const result = await updateTeam(editing.id, form)
      if (result.error) { setError(result.error); setLoading(false); return }
      setTeams(prev => prev.map(t => t.id === editing.id ? { ...t, ...form } : t))
    }
    setLoading(false); cancel()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this team?')) return
    await deleteTeam(id)
    setTeams(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-barlow font-black text-4xl uppercase text-white">Teams</h1>
        <button onClick={openAdd} className="bg-[#4ade80] text-[#0a1400] font-barlow font-black uppercase px-5 py-2.5 rounded-xl hover:bg-[#22c55e] transition-colors">
          + Add Team
        </button>
      </div>

      {(adding || editing) && (
        <div className="bg-[#112211] border border-[#1f3d1f] rounded-xl p-6 space-y-4">
          <h2 className="font-barlow font-bold uppercase text-white">{adding ? 'Add Team' : 'Edit Team'}</h2>
          {error && <div className="text-red-400 text-sm">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'name', label: 'Full Name', placeholder: 'Hearts of Oak' },
              { key: 'short_name', label: 'Short Name', placeholder: 'HOA' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">{f.label}</label>
                <input
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4ade80]"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-barlow uppercase text-gray-400 mb-1">Colour</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={e => setForm(p => ({ ...p, primary_color: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-gray-300 text-sm">{form.primary_color}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={loading} className="bg-[#4ade80] text-[#0a1400] font-barlow font-black uppercase px-5 py-2 rounded-lg hover:bg-[#22c55e] transition-colors disabled:opacity-50">
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={cancel} className="bg-[#1f3d1f] text-gray-300 font-barlow font-bold uppercase px-5 py-2 rounded-lg hover:bg-[#2d5a2d] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#112211] border border-[#1f3d1f] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1f3d1f]">
              {['Colour', 'Name', 'Short', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-barlow uppercase text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map(team => (
              <tr key={team.id} className="border-b border-[#1f3d1f]/50 hover:bg-[#1a331a] transition-colors">
                <td className="px-4 py-3">
                  <div className="w-6 h-6 rounded-full border border-white/20" style={{ background: team.primary_color }} />
                </td>
                <td className="px-4 py-3 text-white font-medium">{team.name}</td>
                <td className="px-4 py-3 text-gray-400 font-barlow font-bold uppercase">{team.short_name}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(team)} className="text-[#4ade80] text-sm hover:underline font-barlow uppercase">Edit</button>
                    <button onClick={() => handleDelete(team.id)} className="text-red-400 text-sm hover:underline font-barlow uppercase">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {teams.length === 0 && (
              <tr><td colSpan={4} className="text-center text-gray-500 py-8">No teams yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
