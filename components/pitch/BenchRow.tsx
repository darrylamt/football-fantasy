'use client'

import type { FantasyPick, Player } from '@/types'
import PlayerCard from './PlayerCard'

type PickWithPlayer = FantasyPick & { players: Player }

interface BenchRowProps {
  bench: PickWithPlayer[]
  onPlayerClick?: (pick: PickWithPlayer) => void
  valueFor: (pick: PickWithPlayer) => string
  highlightIds?: string[]
  dimOthers?: boolean
}

export default function BenchRow({ bench, onPlayerClick, valueFor, highlightIds = [], dimOthers = false }: BenchRowProps) {
  const sorted = [...bench].sort((a, b) => {
    // GK always first on the bench, then by bench order
    if (a.players.position === 'GK') return -1
    if (b.players.position === 'GK') return 1
    return (a.bench_order ?? 99) - (b.bench_order ?? 99)
  })

  return (
    <div className="flex justify-center gap-3 sm:gap-6">
      {sorted.map((pick, i) => {
        const highlighted = highlightIds.includes(pick.id)
        return (
          <div key={pick.id} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold uppercase text-[#37003c]/50">
              {pick.players.position === 'GK' ? 'GK' : `${i}.`}
            </span>
            <PlayerCard
              pick={pick}
              onClick={onPlayerClick ? () => onPlayerClick(pick) : undefined}
              value={valueFor(pick)}
              highlight={highlighted}
              dimmed={dimOthers && !highlighted}
            />
          </div>
        )
      })}
      {Array.from({ length: Math.max(0, 4 - sorted.length) }).map((_, i) => (
        <div key={`empty-${i}`} className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold uppercase text-[#37003c]/30">{sorted.length + i}</span>
          <div className="w-[72px] h-[80px] border-2 border-dashed border-[#37003c]/15 rounded-md" />
        </div>
      ))}
    </div>
  )
}
