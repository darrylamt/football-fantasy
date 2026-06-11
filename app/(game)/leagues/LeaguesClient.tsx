'use client'

import { useState } from 'react'
import { createLeague, joinLeague } from './actions'

type LeagueWithMembers = {
  id: string
  name: string
  code: string
  type: string
  members: { fantasy_teams: { name: string; total_points: number; user_id: string } | null }[]
  myTeamId: string
}

export default function LeaguesClient({ leagues, myTeamId }: { leagues: LeagueWithMembers[]; myTeamId: string }) {
  const [tab, setTab] = useState<'standings' | 'create' | 'join'>('standings')
  const [activeLeague, setActiveLeague] = useState<LeagueWithMembers | null>(leagues[0] ?? null)
  const [createName, setCreateName] = useState('')
  const [createType, setCreateType] = useState<'classic' | 'h2h'>('classic')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMsg(null)
    const result = await createLeague(createName, createType)
    setLoading(false)
    if (result.error) { setMsg({ text: result.error, type: 'error' }); return }
    setMsg({ text: `League "${createName}" created! Code: ${result.data?.code}`, type: 'success' })
    setCreateName('')
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMsg(null)
    const result = await joinLeague(joinCode)
    setLoading(false)
    if (result.error) { setMsg({ text: result.error, type: 'error' }); return }
    setMsg({ text: `Joined "${result.leagueName}"`, type: 'success' })
    setJoinCode('')
  }

  const standings = activeLeague
    ? [...activeLeague.members]
        .map(m => m.fantasy_teams)
        .filter(Boolean)
        .sort((a, b) => (b!.total_points) - (a!.total_points))
    : []

  const tabs = [
    { key: 'standings', label: 'My Leagues' },
    { key: 'create',    label: 'Create' },
    { key: 'join',      label: 'Join' },
  ] as const

  const inputClass = "w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-[#37003c] placeholder-gray-400 bg-white focus:outline-none focus:border-[#37003c]"

  return (
    <div className="space-y-4">
      <div className="fpl-hero rounded-lg px-5 py-5 sm:px-6">
        <h1 className="font-barlow font-black text-3xl text-white leading-none">Leagues</h1>
        <p className="text-white/60 text-sm mt-1">Compete against friends in classic or head-to-head leagues</p>
      </div>

      <div className="flex gap-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setMsg(null) }}
            className={`text-sm font-semibold px-4 py-2 rounded-md transition-colors ${
              tab === t.key ? 'bg-[#37003c] text-white' : 'text-[#37003c]/60 hover:text-[#37003c] hover:bg-[#37003c]/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'standings' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1 space-y-1.5">
            {leagues.length === 0 ? (
              <div className="text-sm text-gray-400 px-1">No leagues yet — create or join one.</div>
            ) : (
              leagues.map(l => (
                <button
                  key={l.id}
                  onClick={() => setActiveLeague(l)}
                  className={`w-full text-left px-3 py-2.5 rounded-md border transition-colors ${
                    activeLeague?.id === l.id
                      ? 'border-[#00ff87] bg-white ring-1 ring-[#00ff87]'
                      : 'border-gray-200 bg-white hover:border-[#37003c]/40'
                  }`}
                >
                  <div className="text-sm font-semibold text-[#37003c] truncate">{l.name}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">{l.members.length} members · {l.type === 'h2h' ? 'Head-to-Head' : 'Classic'}</div>
                </button>
              ))
            )}
          </div>

          <div className="lg:col-span-3">
            {activeLeague ? (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-[#37003c] px-4 py-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold text-white truncate">{activeLeague.name}</h2>
                  <span className="text-[11px] text-white/60 flex-shrink-0">
                    Code: <span className="font-mono font-bold text-[#00ff87]">{activeLeague.code}</span>
                  </span>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 w-12">Rank</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Team</th>
                      <th className="text-right px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {standings.map((team, i) => {
                      const isMe = team?.user_id === myTeamId
                      return (
                        <tr key={i} className={isMe ? 'bg-[#00ff87]/10' : 'hover:bg-[#37003c]/5'}>
                          <td className="px-4 py-3 font-barlow font-bold text-[#37003c]">{i + 1}</td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold text-[#37003c]">{team?.name}</span>
                            {isMe && <span className="ml-2 text-[10px] font-bold text-[#37003c] bg-[#00ff87] rounded px-1.5 py-0.5">YOU</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-barlow font-bold text-lg text-[#37003c]">{team?.total_points}</td>
                        </tr>
                      )
                    })}
                    {standings.length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-400">No members yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg p-12 text-center text-sm text-gray-400">
                Select a league to see standings.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'create' && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-sm">
          <h2 className="text-sm font-bold text-[#37003c] mb-4">Create a league</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Name</label>
              <input
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                required
                maxLength={50}
                placeholder="e.g. Office League"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Type</label>
              <div className="flex gap-2">
                {(['classic', 'h2h'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCreateType(t)}
                    className={`flex-1 py-2 rounded-md border text-sm font-semibold transition-colors ${
                      createType === t ? 'bg-[#37003c] text-white border-[#37003c]' : 'border-gray-200 text-gray-500 hover:border-[#37003c]/40'
                    }`}
                  >
                    {t === 'classic' ? 'Classic' : 'Head-to-Head'}
                  </button>
                ))}
              </div>
            </div>

            {msg && (
              <div className={`rounded-md px-3 py-2.5 text-sm border ${
                msg.type === 'success' ? 'border-[#00ff87] bg-[#00ff87]/10 text-[#37003c]' : 'border-[#e90052]/40 bg-[#e90052]/10 text-[#e90052]'
              }`}>
                {msg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00ff87] text-[#37003c] text-sm font-bold rounded-md py-2.5 hover:bg-[#00e57a] transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create League'}
            </button>
          </form>
        </div>
      )}

      {tab === 'join' && (
        <div className="bg-white border border-gray-200 rounded-lg p-5 max-w-sm">
          <h2 className="text-sm font-bold text-[#37003c] mb-4">Join a league</h2>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">League code</label>
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                required
                maxLength={8}
                placeholder="e.g. AB12CD"
                className={`${inputClass} font-mono tracking-widest`}
              />
            </div>

            {msg && (
              <div className={`rounded-md px-3 py-2.5 text-sm border ${
                msg.type === 'success' ? 'border-[#00ff87] bg-[#00ff87]/10 text-[#37003c]' : 'border-[#e90052]/40 bg-[#e90052]/10 text-[#e90052]'
              }`}>
                {msg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00ff87] text-[#37003c] text-sm font-bold rounded-md py-2.5 hover:bg-[#00e57a] transition-colors disabled:opacity-50"
            >
              {loading ? 'Joining…' : 'Join League'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
