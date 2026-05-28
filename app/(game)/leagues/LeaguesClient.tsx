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
    setMsg({ text: `League "${createName}" created! Share code: ${result.data?.code}`, type: 'success' })
    setCreateName('')
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMsg(null)
    const result = await joinLeague(joinCode)
    setLoading(false)
    if (result.error) { setMsg({ text: result.error, type: 'error' }); return }
    setMsg({ text: `Joined "${result.leagueName}"!`, type: 'success' })
    setJoinCode('')
  }

  const standings = activeLeague
    ? [...activeLeague.members]
        .map(m => m.fantasy_teams)
        .filter(Boolean)
        .sort((a, b) => (b!.total_points) - (a!.total_points))
    : []

  return (
    <div className="space-y-6">
      <h1 className="font-barlow font-black text-4xl uppercase text-gray-900">Leagues</h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['standings', 'create', 'join'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setMsg(null) }}
            className={`font-barlow font-bold uppercase text-sm px-5 py-2 rounded-lg transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'standings' ? 'My Leagues' : t === 'create' ? '+ Create' : 'Join'}
          </button>
        ))}
      </div>

      {/* Standings */}
      {tab === 'standings' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* League list */}
          <div className="lg:col-span-1 space-y-1.5">
            {leagues.length === 0 ? (
              <div className="text-gray-400 text-sm">No leagues yet.</div>
            ) : (
              leagues.map(l => (
                <button
                  key={l.id}
                  onClick={() => setActiveLeague(l)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                    activeLeague?.id === l.id
                      ? 'border-green-300 bg-green-50 text-green-800'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-sm truncate">{l.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{l.members.length} members · {l.type}</div>
                </button>
              ))
            )}
          </div>

          {/* Standings table */}
          <div className="lg:col-span-3">
            {activeLeague ? (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="font-barlow font-bold uppercase text-gray-900 text-lg">{activeLeague.name}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Code: <span className="font-mono font-bold text-gray-600">{activeLeague.code}</span> · {activeLeague.type}
                    </p>
                  </div>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase text-gray-400 tracking-wide w-10">#</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase text-gray-400 tracking-wide">Team</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold uppercase text-gray-400 tracking-wide">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {standings.map((team, i) => {
                      const isMe = team?.user_id === myTeamId
                      return (
                        <tr key={i} className={isMe ? 'bg-green-50' : 'hover:bg-gray-50'}>
                          <td className="px-5 py-3.5 font-barlow font-bold text-gray-500">{i + 1}</td>
                          <td className="px-5 py-3.5">
                            <span className="font-semibold text-gray-900 text-sm">{team?.name}</span>
                            {isMe && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">You</span>}
                          </td>
                          <td className="px-5 py-3.5 text-right font-barlow font-black text-lg text-gray-900">{team?.total_points}</td>
                        </tr>
                      )
                    })}
                    {standings.length === 0 && (
                      <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400 text-sm">No members yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 shadow-sm">
                Select a league to see standings.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create league */}
      {tab === 'create' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-md">
          <h2 className="font-barlow font-bold uppercase text-gray-900 mb-4">Create a League</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5 tracking-wide">League Name</label>
              <input
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                required
                maxLength={50}
                placeholder="e.g. Office League"
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5 tracking-wide">Type</label>
              <div className="flex gap-2">
                {(['classic', 'h2h'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCreateType(t)}
                    className={`flex-1 py-2.5 rounded-lg border font-barlow font-bold uppercase text-sm transition-colors ${
                      createType === t ? 'bg-green-600 text-white border-green-600' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {t === 'classic' ? '📊 Classic' : '⚔️ H2H'}
                  </button>
                ))}
              </div>
            </div>

            {msg && (
              <div className={`rounded-lg px-4 py-3 text-sm ${msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                {msg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-barlow font-black uppercase text-lg rounded-lg py-3 hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create League'}
            </button>
          </form>
        </div>
      )}

      {/* Join league */}
      {tab === 'join' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-w-md">
          <h2 className="font-barlow font-bold uppercase text-gray-900 mb-4">Join a League</h2>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1.5 tracking-wide">League Code</label>
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                required
                maxLength={8}
                placeholder="e.g. AB12CD"
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-mono placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 tracking-widest"
              />
            </div>

            {msg && (
              <div className={`rounded-lg px-4 py-3 text-sm ${msg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                {msg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white font-barlaw font-black uppercase text-lg rounded-lg py-3 hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Joining…' : 'Join League'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
