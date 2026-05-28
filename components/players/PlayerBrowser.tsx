'use client'

import { useState, useMemo } from 'react'
import type { Player, Position } from '@/types'
import { formatPrice } from '@/lib/utils/format'

interface PlayerBrowserProps {
  players: Player[]
  onSelect?: (player: Player) => void
  excludeIds?: string[]
  budget?: number
}

const positions: Position[] = ['GK', 'DEF', 'MID', 'FWD']

export default function PlayerBrowser({ players, onSelect, excludeIds = [], budget }: PlayerBrowserProps) {
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState<Position | 'ALL'>('ALL')
  const [sortBy, setSortBy] = useState<'price' | 'total_points'>('total_points')

  const filtered = useMemo(() => {
    return players
      .filter(p => !excludeIds.includes(p.id))
      .filter(p => posFilter === 'ALL' || p.position === posFilter)
      .filter(p => {
        const q = search.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.display_name?.toLowerCase().includes(q) ||
          p.real_teams?.name.toLowerCase().includes(q)
        )
      })
      .filter(p => budget == null || p.price <= budget)
      .sort((a, b) => b[sortBy] - a[sortBy])
  }, [players, search, posFilter, sortBy, excludeIds, budget])

  const statusColor: Record<string, string> = {
    available: 'text-[#4ade80]',
    injured: 'text-red-400',
    suspended: 'text-orange-400',
    doubtful: 'text-yellow-400',
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search players..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#4ade80]"
        />
        <div className="flex gap-1">
          {(['ALL', ...positions] as const).map(pos => (
            <button
              key={pos}
              onClick={() => setPosFilter(pos)}
              className={`font-barlow font-bold uppercase text-xs px-3 py-2 rounded transition-colors ${
                posFilter === pos
                  ? 'bg-[#4ade80] text-[#0a1400]'
                  : 'bg-[#1f3d1f] text-gray-300 hover:bg-[#2d5a2d]'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4ade80]"
        >
          <option value="total_points">Sort: Points</option>
          <option value="price">Sort: Price</option>
        </select>
      </div>

      {/* Player list */}
      <div className="max-h-[500px] overflow-y-auto space-y-1 pr-1">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-8 text-sm">No players found</div>
        ) : (
          filtered.map(player => (
            <div
              key={player.id}
              className={`flex items-center gap-3 px-4 py-3 bg-[#0d1f0d] border border-[#1f3d1f] rounded-lg transition-colors ${
                onSelect ? 'hover:border-[#4ade80]/50 hover:bg-[#1a331a] cursor-pointer' : ''
              }`}
              onClick={() => onSelect?.(player)}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: player.real_teams?.primary_color ?? '#4ade80' }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-white truncate">
                  {player.display_name ?? player.name}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {player.real_teams?.short_name} · {player.position}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-barlow font-bold text-[#4ade80] text-sm">{formatPrice(player.price)}</div>
                <div className="text-xs text-gray-400">{player.total_points} pts</div>
              </div>
              <span className={`text-xs font-barlow uppercase ${statusColor[player.status]}`}>
                {player.status !== 'available' ? player.status : ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
