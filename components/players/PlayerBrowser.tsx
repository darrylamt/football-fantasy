'use client'

import { useState, useMemo } from 'react'
import type { Player, Position } from '@/types'
import { formatPrice } from '@/lib/utils/format'

const positions: Position[] = ['GK', 'DEF', 'MID', 'FWD']
const posColor: Record<string, string> = { GK: 'text-yellow-600', DEF: 'text-blue-500', MID: 'text-green-600', FWD: 'text-red-500' }
const statusColor: Record<string, string> = { injured: 'text-red-400', suspended: 'text-orange-400', doubtful: 'text-yellow-500' }

interface Props {
  players: Player[]
  onSelect?: (p: Player) => void
  excludeIds?: string[]
  budget?: number
  highlightId?: string
}

export default function PlayerBrowser({ players, onSelect, excludeIds = [], budget, highlightId }: Props) {
  const [search, setSearch] = useState('')
  const [pos, setPos] = useState<Position | 'ALL'>('ALL')
  const [sort, setSort] = useState<'price' | 'total_points'>('total_points')

  const filtered = useMemo(() => players
    .filter(p => !excludeIds.includes(p.id))
    .filter(p => pos === 'ALL' || p.position === pos)
    .filter(p => {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.display_name?.toLowerCase().includes(q) || p.real_teams?.name.toLowerCase().includes(q)
    })
    .filter(p => budget == null || p.price <= budget)
    .sort((a, b) => b[sort] - a[sort])
  , [players, search, pos, sort, excludeIds, budget])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[140px] text-sm border border-gray-200 rounded-md px-3 py-1.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400"
        />
        <div className="flex gap-1">
          {(['ALL', ...positions] as const).map(p => (
            <button key={p} onClick={() => setPos(p)}
              className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${
                pos === p ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >{p}</button>
          ))}
        </div>
        <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
          className="text-xs border border-gray-200 rounded-md px-2 py-1.5 text-gray-600 focus:outline-none bg-white"
        >
          <option value="total_points">By points</option>
          <option value="price">By price</option>
        </select>
      </div>

      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-md bg-white">
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">No players found</div>
        ) : filtered.map(p => (
          <div key={p.id} onClick={() => onSelect?.(p)}
            className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
              highlightId === p.id ? 'bg-gray-50' :
              onSelect ? 'hover:bg-gray-50 cursor-pointer' : ''
            }`}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.real_teams?.primary_color ?? '#d1d5db' }} />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-gray-900 font-medium truncate block">{p.display_name ?? p.name}</span>
              <span className="text-xs text-gray-400">
                {p.real_teams?.short_name}
                {' · '}
                <span className={`font-medium ${posColor[p.position]}`}>{p.position}</span>
                {p.status !== 'available' && <span className={`ml-1 ${statusColor[p.status]}`}>{p.status}</span>}
              </span>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-medium text-gray-900">{formatPrice(p.price)}</div>
              <div className="text-xs text-gray-400">{p.total_points} pts</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
