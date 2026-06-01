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
    { key: 'standings', label: 'My leagues' },
    { key: 'create',    label: 'Create' },
    { key: 'join',      label: 'Join' },
  ] as const

  return (
    <div className="space-y-6">
      <h1 className="font-barlow font-black text-3xl text-gray-900">Leagues</h1>

      <div className="flex gap-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setMsg(null) }}
            className={`text-sm px-4 py-1.5 rounded-md transition-colors ${
              tab === t.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'standings' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-1">
            {leagues.length === 0 ? (
              <div className="text-sm text-gray-400">No leagues yet.</div>
            ) : (
              leagues.map(l => (
                <button
                  key={l.id}
                  onClick={() => setActiveLeague(l)}
                  className={`w-full text-left px-3 py-2.5 rounded-md border transition-colors ${
                    activeLeague?.id === l.id
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 truncate">{l.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{l.members.length} members · {l.type}</div>
                </button>
              ))
            )}
          </div>

          <div className="lg:col-span-3">
            {activeLeague ? (
              <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-medium text-gray-900">{activeLeague.name}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Code: <span className="font-mono text-gray-600">{activeLeague.code}</span>
                    </p>
                  </div>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-4 py-2.5 text-xs text-gray-400 w-8">#</th>
                      <th className="text-left px-4 py-2.5 text-xs text-gray-400">Team</th>
                      <th className="text-right px-4 py-2.5 text-xs text-gray-400">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {standings.map((team, i) => {
                      const isMe = team?.user_id === myTeamId
                      return (
                        <tr key={i} className={isMe ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{team?.name}</span>
                            {isMe && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">{team?.total_points}</td>
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
              <div className="bg-white border border-gray-100 rounded-lg p-12 text-center text-sm text-gray-400">
                Select a league to see standings.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'create' && (
        <div className="bg-white border border-gray-100 rounded-lg p-5 max-w-sm">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Create a league</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Name</label>
              <input
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                required
                maxLength={50}
                placeholder="e.g. Office League"
                className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
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
                    className={`flex-1 py-2 rounded-md border text-sm transition-colors ${
                      createType === t ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {t === 'classic' ? 'Classic' : 'H2H'}
                  </button>
                ))}
              </div>
            </div>

            {msg && (
              <div className={`rounded-md px-3 py-2.5 text-sm border ${msg.type === 'success' ? 'border-gray-200 text-gray-600' : 'border-red-200 text-red-600'}`}>
                {msg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white text-sm font-medium rounded-md py-2.5 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create league'}
            </button>
          </form>
        </div>
      )}

      {tab === 'join' && (
        <div className="bg-white border border-gray-100 rounded-lg p-5 max-w-sm">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Join a league</h2>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">League code</label>
              <input
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                required
                maxLength={8}
                placeholder="e.g. AB12CD"
                className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-900 font-mono placeholder-gray-400 focus:outline-none focus:border-gray-400 tracking-widest"
              />
            </div>

            {msg && (
              <div className={`rounded-md px-3 py-2.5 text-sm border ${msg.type === 'success' ? 'border-gray-200 text-gray-600' : 'border-red-200 text-red-600'}`}>
                {msg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white text-sm font-medium rounded-md py-2.5 hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Joining…' : 'Join league'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
