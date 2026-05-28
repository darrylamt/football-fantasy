'use client'

import { useState, useMemo } from 'react'
import type { Player, Position } from '@/types'
import { formatPrice } from '@/lib/utils/format'

interface PlayerBrowserProps {
  players: Player[]
  onSelect?: (player: Player) => void
  excludeIds?: string[]
  budget?: number
  highlightId?: string
}

const positions: Position[] = ['GK', 'DEF', 'MID', 'FWD']

const posBadge: Record<string, string> = {
  GK: 'bg-yellow-100 text-yellow-700',
  DEF: 'bg-blue-100 text-blue-700',
  MID: 'bg-green-100 text-green-700',
  FWD: 'bg-red-100 text-red-700',
}

const statusStyle: Record<string, string> = {
  available: 'text-green-600',
  injured: 'text-red-500',
  suspended: 'text-orange-500',
  doubtful: 'text-yellow-600',
}

export default function PlayerBrowser({ players, onSelect, excludeIds = [], budget, highlightId }: PlayerBrowserProps) {
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState<Position | 'ALL'>('ALL')
  const [sortBy, setSortBy] = useState<'price' | 'total_points'>('total_points')

  const filtered = useMemo(() => {
    return players
      .filter(p => !excludeIds.includes(p.id))
      .filter(p => posFilter === 'ALL' || p.position === posFilter)
      .filter(p => {
        const q = search.toLowerCase()
        return p.name.toLowerCase().includes(q) ||
          p.display_name?.toLowerCase().includes(q) ||
          p.real_teams?.name.toLowerCase().includes(q)
      })
      .filter(p => budget == null || p.price <= budget)
      .sort((a, b) => b[sortBy] - a[sortBy])
  }, [players, search, posFilter, sortBy, excludeIds, budget])

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search players…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
        />
        <div className="flex gap-1 flex-wrap">
          {(['ALL', ...positions] as const).map(pos => (
            <button
              key={pos}
              onClick={() => setPosFilter(pos)}
              className={`font-barlow font-bold uppercase text-xs px-3 py-2 rounded-lg transition-colors ${
                posFilter === pos
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-green-500"
        >
          <option value="total_points">Sort: Points</option>
          <option value="price">Sort: Price</option>
        </select>
      </div>

      {/* List */}
      <div className="max-h-[480px] overflow-y-auto space-y-1 pr-1">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">No players found</div>
        ) : (
          filtered.map(player => (
            <div
              key={player.id}
              onClick={() => onSelect?.(player)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                highlightId === player.id
                  ? 'border-green-400 bg-green-50'
                  : onSelect
                    ? 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50 cursor-pointer'
                    : 'border-gray-200 bg-white'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: player.real_teams?.primary_color ?? '#16a34a' }} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate">{player.display_name ?? player.name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <span>{player.real_teams?.short_name ?? '–'}</span>
                  <span className={`font-barlow font-bold uppercase px-1.5 py-0.5 rounded text-xs ${posBadge[player.position]}`}>{player.position}</span>
                  {player.status !== 'available' && (
                    <span className={`${statusStyle[player.status]} text-xs capitalize`}>{player.status}</span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-barlow font-bold text-green-600 text-sm">{formatPrice(player.price)}</div>
                <div className="text-xs text-gray-400">{player.total_points} pts</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
