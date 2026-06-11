'use client'

import { useState, useMemo } from 'react'
import type { Player, Position } from '@/types'
import { formatPrice } from '@/lib/utils/format'

const positions: Position[] = ['GK', 'DEF', 'MID', 'FWD']
const posLabel: Record<string, string> = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', FWD: 'Forward' }
const statusColor: Record<string, string> = { injured: 'text-[#e90052]', suspended: 'text-orange-500', doubtful: 'text-yellow-600' }

interface Props {
  players: Player[]
  onSelect?: (p: Player) => void
  excludeIds?: string[]
  budget?: number
  highlightId?: string
  /** Lock the list to a single position (e.g. FPL-style same-position transfers) */
  positionLock?: Position
}

export default function PlayerBrowser({ players, onSelect, excludeIds = [], budget, highlightId, positionLock }: Props) {
  const [search, setSearch] = useState('')
  const [pos, setPos] = useState<Position | 'ALL'>(positionLock ?? 'ALL')
  const [sort, setSort] = useState<'price' | 'total_points'>('total_points')

  const activePos = positionLock ?? pos

  const filtered = useMemo(() => players
    .filter(p => !excludeIds.includes(p.id))
    .filter(p => activePos === 'ALL' || p.position === activePos)
    .filter(p => {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.display_name?.toLowerCase().includes(q) || p.real_teams?.name.toLowerCase().includes(q)
    })
    .filter(p => budget == null || p.price <= budget)
    .sort((a, b) => b[sort] - a[sort])
  , [players, search, activePos, sort, excludeIds, budget])

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search player or club…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[140px] text-sm border border-gray-200 rounded-md px-3 py-1.5 text-[#37003c] placeholder-gray-400 bg-white focus:outline-none focus:border-[#37003c]"
        />
        {positionLock ? (
          <span className="text-xs font-semibold text-[#37003c] bg-[#00ff87]/40 rounded-md px-2.5 py-1.5">
            {posLabel[positionLock]}s only
          </span>
        ) : (
          <div className="flex gap-1">
            {(['ALL', ...positions] as const).map(p => (
              <button key={p} onClick={() => setPos(p)}
                className={`text-xs px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                  pos === p ? 'bg-[#37003c] text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-[#37003c]'
                }`}
              >{p}</button>
            ))}
          </div>
        )}
        <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
          className="text-xs border border-gray-200 rounded-md px-2 py-1.5 text-[#37003c] focus:outline-none bg-white"
        >
          <option value="total_points">Total points</option>
          <option value="price">Price</option>
        </select>
      </div>

      <div className="max-h-[420px] overflow-y-auto rounded-md bg-white border border-gray-200">
        <div className="bg-[#37003c] px-3 py-2 flex items-center text-[10px] font-bold uppercase tracking-wider text-white/70 sticky top-0 z-10">
          <span className="flex-1">Player</span>
          <span className="w-14 text-right">Price</span>
          <span className="w-12 text-right">Pts</span>
        </div>
        {filtered.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">No players found</div>
        ) : filtered.map(p => (
          <div key={p.id} onClick={() => onSelect?.(p)}
            className={`flex items-center gap-2.5 px-3 py-2 border-b border-gray-100 last:border-0 transition-colors ${
              highlightId === p.id ? 'bg-[#00ff87]/20' :
              onSelect ? 'hover:bg-[#37003c]/5 cursor-pointer' : ''
            }`}
          >
            <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: p.real_teams?.primary_color ?? '#d1d5db' }} />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-[#37003c] font-semibold truncate block leading-tight">{p.display_name ?? p.name}</span>
              <span className="text-[11px] text-gray-400">
                {p.real_teams?.short_name} · {p.position}
                {p.status !== 'available' && <span className={`ml-1 font-semibold ${statusColor[p.status]}`}>{p.status}</span>}
              </span>
            </div>
            <div className="w-14 text-right text-sm text-[#37003c] flex-shrink-0">{formatPrice(p.price)}</div>
            <div className="w-12 text-right text-sm font-bold text-[#37003c] flex-shrink-0">{p.total_points}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
