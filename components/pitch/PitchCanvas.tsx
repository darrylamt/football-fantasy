'use client'

import { useState } from 'react'
import type { FantasyPick, Player, Position } from '@/types'
import PlayerCard from './PlayerCard'
import BenchRow from './BenchRow'
import Modal from '@/components/ui/Modal'
import { formatPrice } from '@/lib/utils/format'

type PickWithPlayer = FantasyPick & { players: Player }

interface PitchCanvasProps {
  picks: PickWithPlayer[]
  onPicksChange?: (picks: PickWithPlayer[]) => void
  readonly?: boolean
  /** What the bottom plate of each card shows */
  valueMode?: 'price' | 'points'
}

const FORMATION_LIMITS: Record<Exclude<Position, 'GK'>, [number, number]> = {
  DEF: [3, 5],
  MID: [2, 5],
  FWD: [1, 3],
}

export default function PitchCanvas({ picks, onPicksChange, readonly = false, valueMode = 'price' }: PitchCanvasProps) {
  const [selectedPick, setSelectedPick] = useState<PickWithPlayer | null>(null)
  const [subSource, setSubSource] = useState<PickWithPlayer | null>(null)

  const starters = picks.filter(p => p.is_starting)
  const bench = picks.filter(p => !p.is_starting)

  const rows: PickWithPlayer[][] = [
    starters.filter(p => p.players.position === 'GK'),
    starters.filter(p => p.players.position === 'DEF'),
    starters.filter(p => p.players.position === 'MID'),
    starters.filter(p => p.players.position === 'FWD'),
  ]

  function valueFor(pick: PickWithPlayer): string {
    if (valueMode === 'points') return `${pick.points_scored ?? 0} pts`
    return formatPrice(Number(pick.players.price))
  }

  /** Can `starter` and `benchPick` legally swap (formation stays valid)? */
  function canSwap(a: PickWithPlayer, b: PickWithPlayer): boolean {
    const starter = a.is_starting ? a : b
    const benchPick = a.is_starting ? b : a
    if (starter.is_starting === benchPick.is_starting) return false

    const sPos = starter.players.position
    const bPos = benchPick.players.position

    // GK can only swap with GK
    if (sPos === 'GK' || bPos === 'GK') return sPos === 'GK' && bPos === 'GK'
    if (sPos === bPos) return true

    // Cross-position swap: check resulting formation
    const counts: Record<Exclude<Position, 'GK'>, number> = { DEF: 0, MID: 0, FWD: 0 }
    for (const p of starters) {
      if (p.id === starter.id) continue
      if (p.players.position !== 'GK') counts[p.players.position as Exclude<Position, 'GK'>]++
    }
    counts[bPos as Exclude<Position, 'GK'>]++

    return (Object.keys(FORMATION_LIMITS) as Array<Exclude<Position, 'GK'>>).every(pos => {
      const [min, max] = FORMATION_LIMITS[pos]
      return counts[pos] >= min && counts[pos] <= max
    })
  }

  const eligibleIds = subSource
    ? picks.filter(p => p.id !== subSource.id && canSwap(subSource, p)).map(p => p.id)
    : []

  function executeSwap(target: PickWithPlayer) {
    if (!onPicksChange || !subSource) return
    const starter = subSource.is_starting ? subSource : target
    const benchPick = subSource.is_starting ? target : subSource

    const updated = picks.map(p => {
      if (p.id === starter.id) {
        // Heading to the bench: lose armband
        return { ...p, is_starting: false, bench_order: benchPick.bench_order, is_captain: false, is_vice_captain: false }
      }
      if (p.id === benchPick.id) {
        return { ...p, is_starting: true, bench_order: undefined }
      }
      return p
    })
    onPicksChange(updated)
    setSubSource(null)
  }

  function handleCardClick(pick: PickWithPlayer) {
    if (readonly) return
    if (subSource) {
      if (pick.id === subSource.id) { setSubSource(null); return }
      if (eligibleIds.includes(pick.id)) executeSwap(pick)
      return
    }
    setSelectedPick(pick)
  }

  function makeCaptain(pick: PickWithPlayer) {
    if (!onPicksChange) return
    onPicksChange(picks.map(p => ({
      ...p,
      is_captain: p.id === pick.id,
      is_vice_captain: p.id === pick.id ? false : p.is_vice_captain,
    })))
    setSelectedPick(null)
  }

  function makeViceCaptain(pick: PickWithPlayer) {
    if (!onPicksChange) return
    onPicksChange(picks.map(p => ({
      ...p,
      is_vice_captain: p.id === pick.id,
      is_captain: p.id === pick.id ? false : p.is_captain,
    })))
    setSelectedPick(null)
  }

  return (
    <div className="w-full">
      {subSource && (
        <div className="mb-2 bg-[#04f5ff]/15 border border-[#04f5ff] rounded-md px-3 py-2 flex items-center justify-between gap-3">
          <span className="text-sm text-[#37003c]">
            Substituting <strong>{subSource.players.display_name ?? subSource.players.name}</strong> — select a highlighted player
          </span>
          <button onClick={() => setSubSource(null)} className="text-xs font-semibold text-[#37003c] underline flex-shrink-0">
            Cancel
          </button>
        </div>
      )}

      {/* Pitch */}
      <div className="relative rounded-lg overflow-hidden fpl-pitch">
        {/* Pitch markings */}
        <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" viewBox="0 0 400 520" preserveAspectRatio="none">
          <rect x="12" y="12" width="376" height="496" stroke="white" strokeWidth="2" fill="none" />
          {/* Goal + penalty area at top */}
          <rect x="100" y="12" width="200" height="70" stroke="white" strokeWidth="2" fill="none" />
          <rect x="150" y="12" width="100" height="30" stroke="white" strokeWidth="2" fill="none" />
          <path d="M150,82 A55,55 0 0,0 250,82" stroke="white" strokeWidth="2" fill="none" />
          {/* Halfway + centre circle at bottom */}
          <line x1="12" y1="508" x2="388" y2="508" stroke="white" strokeWidth="2" />
          <path d="M140,508 A62,62 0 0,1 260,508" stroke="white" strokeWidth="2" fill="none" />
        </svg>

        <div className="relative z-10 flex flex-col justify-between py-5 px-2 min-h-[500px]">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-evenly items-start">
              {row.map(pick => (
                <PlayerCard
                  key={pick.id}
                  pick={pick}
                  onClick={readonly ? undefined : () => handleCardClick(pick)}
                  value={valueFor(pick)}
                  highlight={eligibleIds.includes(pick.id)}
                  dimmed={!!subSource && pick.id !== subSource.id && !eligibleIds.includes(pick.id)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Bench */}
      <div className="mt-2 bg-white rounded-lg py-3 px-2 border border-[#37003c]/10">
        <div className="text-center text-[10px] font-bold uppercase tracking-widest text-[#37003c]/40 mb-2">Substitutes</div>
        <BenchRow
          bench={bench}
          onPlayerClick={readonly ? undefined : handleCardClick}
          valueFor={valueFor}
          highlightIds={eligibleIds}
          dimOthers={!!subSource}
        />
      </div>

      {/* Player action dialog */}
      {!readonly && selectedPick && !subSource && (
        <Modal
          open={!!selectedPick}
          onClose={() => setSelectedPick(null)}
          title={selectedPick.players.display_name ?? selectedPick.players.name}
        >
          <div className="space-y-2">
            <div className="text-sm text-gray-500 mb-4">
              {selectedPick.players.position} · {selectedPick.players.real_teams?.name} · {formatPrice(Number(selectedPick.players.price))} · {selectedPick.players.total_points} pts
            </div>
            {selectedPick.is_starting && !selectedPick.is_captain && (
              <button
                onClick={() => makeCaptain(selectedPick)}
                className="w-full text-left px-4 py-3 bg-[#f4f4f6] hover:bg-[#00ff87]/30 rounded-md text-[#37003c] font-semibold text-sm transition-colors"
              >
                Make Captain
              </button>
            )}
            {selectedPick.is_starting && !selectedPick.is_vice_captain && !selectedPick.is_captain && (
              <button
                onClick={() => makeViceCaptain(selectedPick)}
                className="w-full text-left px-4 py-3 bg-[#f4f4f6] hover:bg-[#00ff87]/30 rounded-md text-[#37003c] font-semibold text-sm transition-colors"
              >
                Make Vice-Captain
              </button>
            )}
            <button
              onClick={() => { setSubSource(selectedPick); setSelectedPick(null) }}
              className="w-full text-left px-4 py-3 bg-[#f4f4f6] hover:bg-[#04f5ff]/30 rounded-md text-[#37003c] font-semibold text-sm transition-colors"
            >
              Substitute
            </button>
            <button
              onClick={() => setSelectedPick(null)}
              className="w-full text-left px-4 py-3 bg-[#f4f4f6] hover:bg-gray-200 rounded-md text-gray-500 font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
