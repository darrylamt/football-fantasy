'use client'

import type { FantasyPick, Player } from '@/types'
import PlayerCard from './PlayerCard'

interface BenchRowProps {
  bench: (FantasyPick & { players: Player })[]
  onPlayerClick?: (pick: FantasyPick & { players: Player }) => void
}

export default function BenchRow({ bench, onPlayerClick }: BenchRowProps) {
  const sorted = [...bench].sort((a, b) => (a.bench_order ?? 99) - (b.bench_order ?? 99))

  return (
    <div className="mt-2">
      <div className="text-center text-xs font-barlow uppercase text-gray-500 mb-2">Bench</div>
      <div className="flex justify-center gap-4">
        {sorted.map((pick, i) => (
          <div key={pick.id} className="flex flex-col items-center gap-1">
            <span className="text-xs font-barlow text-gray-600 uppercase">{i + 1}</span>
            <PlayerCard pick={pick} onClick={() => onPlayerClick?.(pick)} compact />
          </div>
        ))}
        {Array.from({ length: Math.max(0, 4 - sorted.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="flex flex-col items-center gap-1">
            <span className="text-xs font-barlow text-gray-600 uppercase">{sorted.length + i + 1}</span>
            <div className="w-[60px] h-[60px] border-2 border-dashed border-[#1f3d1f] rounded-lg opacity-40" />
          </div>
        ))}
      </div>
    </div>
  )
}
