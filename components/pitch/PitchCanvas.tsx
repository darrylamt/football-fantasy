'use client'

import { useState } from 'react'
import type { FantasyPick, Player, Formation } from '@/types'
import PlayerCard from './PlayerCard'
import BenchRow from './BenchRow'
import FormationSelector from './FormationSelector'
import Modal from '@/components/ui/Modal'

interface PitchCanvasProps {
  picks: (FantasyPick & { players: Player })[]
  onPicksChange?: (picks: (FantasyPick & { players: Player })[]) => void
  readonly?: boolean
}

function parseFormation(f: Formation): [number, number, number] {
  const parts = f.split('-').map(Number)
  return [parts[0], parts[1], parts[2]] as [number, number, number]
}

export default function PitchCanvas({ picks, onPicksChange, readonly = false }: PitchCanvasProps) {
  const [formation, setFormation] = useState<Formation>('4-4-2')
  const [selectedPick, setSelectedPick] = useState<(FantasyPick & { players: Player }) | null>(null)

  const starters = picks.filter(p => p.is_starting)
  const bench = picks.filter(p => !p.is_starting)

  const gks = starters.filter(p => p.players.position === 'GK')
  const defs = starters.filter(p => p.players.position === 'DEF')
  const mids = starters.filter(p => p.players.position === 'MID')
  const fwds = starters.filter(p => p.players.position === 'FWD')

  const [defCount, midCount, fwdCount] = parseFormation(formation)

  function handleFormationChange(f: Formation) {
    setFormation(f)
    // Formation is cosmetic only for display — actual squad stays same
    // Real re-arrangement would need pick editing logic
  }

  function makeCaptain(pick: FantasyPick & { players: Player }) {
    if (!onPicksChange) return
    const updated = picks.map(p => ({
      ...p,
      is_captain: p.id === pick.id,
      is_vice_captain: p.is_vice_captain && p.id !== pick.id,
    }))
    onPicksChange(updated)
    setSelectedPick(null)
  }

  function makeViceCaptain(pick: FantasyPick & { players: Player }) {
    if (!onPicksChange) return
    const updated = picks.map(p => ({
      ...p,
      is_vice_captain: p.id === pick.id,
      is_captain: p.is_captain && p.id !== pick.id,
    }))
    onPicksChange(updated)
    setSelectedPick(null)
  }

  function moveToStarter(pick: FantasyPick & { players: Player }) {
    if (!onPicksChange) return
    // Find a starter with same position to swap with bench slot 1
    const samePosBenchPick = bench.find(p => p.players.position === pick.players.position)
    if (!samePosBenchPick) return

    const updated = picks.map(p => {
      if (p.id === pick.id) return { ...p, is_starting: true, bench_order: undefined }
      if (p.id === samePosBenchPick.id) return { ...p, is_starting: false, bench_order: pick.bench_order }
      return p
    })
    onPicksChange(updated)
    setSelectedPick(null)
  }

  function moveToBench(pick: FantasyPick & { players: Player }) {
    if (!onPicksChange) return
    const nextSlot = (bench.reduce((max, b) => Math.max(max, b.bench_order ?? 0), 0)) + 1
    const updated = picks.map(p => {
      if (p.id === pick.id) return { ...p, is_starting: false, bench_order: nextSlot, is_captain: false, is_vice_captain: false }
      return p
    })
    onPicksChange(updated)
    setSelectedPick(null)
  }

  const rows: (FantasyPick & { players: Player })[][] = [
    fwds.slice(0, fwdCount),
    mids.slice(0, midCount),
    defs.slice(0, defCount),
    gks.slice(0, 1),
  ]

  return (
    <div className="w-full">
      {!readonly && (
        <div className="mb-4">
          <FormationSelector value={formation} onChange={handleFormationChange} />
        </div>
      )}

      {/* Pitch */}
      <div
        className="relative rounded-2xl overflow-hidden border border-[#1f3d1f]"
        style={{
          background: 'linear-gradient(180deg, #0d2b0d 0%, #0a2000 50%, #0d2b0d 100%)',
          minHeight: 480,
        }}
      >
        {/* SVG pitch markings */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 400 480"
          preserveAspectRatio="none"
        >
          {/* Outer border */}
          <rect x="20" y="20" width="360" height="440" stroke="white" strokeWidth="2" fill="none" />
          {/* Halfway line */}
          <line x1="20" y1="240" x2="380" y2="240" stroke="white" strokeWidth="1.5" />
          {/* Centre circle */}
          <circle cx="200" cy="240" r="50" stroke="white" strokeWidth="1.5" fill="none" />
          <circle cx="200" cy="240" r="3" fill="white" />
          {/* Top penalty area */}
          <rect x="100" y="20" width="200" height="80" stroke="white" strokeWidth="1.5" fill="none" />
          <rect x="145" y="20" width="110" height="40" stroke="white" strokeWidth="1.5" fill="none" />
          {/* Bottom penalty area */}
          <rect x="100" y="380" width="200" height="80" stroke="white" strokeWidth="1.5" fill="none" />
          <rect x="145" y="440" width="110" height="40" stroke="white" strokeWidth="1.5" fill="none" />
          {/* Corner arcs */}
          <path d="M20,20 Q30,20 30,30" stroke="white" strokeWidth="1.5" fill="none" />
          <path d="M380,20 Q370,20 370,30" stroke="white" strokeWidth="1.5" fill="none" />
          <path d="M20,460 Q30,460 30,450" stroke="white" strokeWidth="1.5" fill="none" />
          <path d="M380,460 Q370,460 370,450" stroke="white" strokeWidth="1.5" fill="none" />
          {/* Penalty spots */}
          <circle cx="200" cy="75" r="3" fill="white" />
          <circle cx="200" cy="405" r="3" fill="white" />
          {/* Stripes */}
          {Array.from({ length: 10 }).map((_, i) => (
            <rect key={i} x={20 + i * 36} y="20" width="18" height="440" fill="white" opacity="0.03" />
          ))}
        </svg>

        {/* Players */}
        <div className="relative z-10 flex flex-col justify-around py-6 px-4 min-h-[480px]">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-around items-center">
              {row.map(pick => (
                <PlayerCard
                  key={pick.id}
                  pick={pick}
                  onClick={readonly ? undefined : () => setSelectedPick(pick)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Bench */}
      <div className="mt-4 bg-[#0d1f0d] border border-[#1f3d1f] rounded-xl py-4 px-2">
        <BenchRow
          bench={bench}
          onPlayerClick={readonly ? undefined : setSelectedPick}
        />
      </div>

      {/* Player action modal */}
      {!readonly && selectedPick && (
        <Modal
          open={!!selectedPick}
          onClose={() => setSelectedPick(null)}
          title={selectedPick.players.display_name ?? selectedPick.players.name}
        >
          <div className="space-y-2">
            <div className="text-sm text-gray-400 mb-4">
              {selectedPick.players.position} · {selectedPick.players.real_teams?.name} · ₵{Number(selectedPick.players.price).toFixed(1)}m
            </div>
            {selectedPick.is_starting && !selectedPick.is_captain && (
              <button
                onClick={() => makeCaptain(selectedPick)}
                className="w-full text-left px-4 py-3 bg-[#0d1f0d] hover:bg-[#1f3d1f] rounded-lg text-yellow-400 font-barlow font-bold uppercase text-sm transition-colors"
              >
                Make Captain
              </button>
            )}
            {selectedPick.is_starting && !selectedPick.is_vice_captain && !selectedPick.is_captain && (
              <button
                onClick={() => makeViceCaptain(selectedPick)}
                className="w-full text-left px-4 py-3 bg-[#0d1f0d] hover:bg-[#1f3d1f] rounded-lg text-gray-300 font-barlow font-bold uppercase text-sm transition-colors"
              >
                Make Vice Captain
              </button>
            )}
            {selectedPick.is_starting && (
              <button
                onClick={() => moveToBench(selectedPick)}
                className="w-full text-left px-4 py-3 bg-[#0d1f0d] hover:bg-[#1f3d1f] rounded-lg text-white font-barlow font-bold uppercase text-sm transition-colors"
              >
                Move to Bench
              </button>
            )}
            {!selectedPick.is_starting && (
              <button
                onClick={() => moveToStarter(selectedPick)}
                className="w-full text-left px-4 py-3 bg-[#0d1f0d] hover:bg-[#1f3d1f] rounded-lg text-[#4ade80] font-barlow font-bold uppercase text-sm transition-colors"
              >
                Move to Starting XI
              </button>
            )}
            <button
              onClick={() => setSelectedPick(null)}
              className="w-full text-left px-4 py-3 bg-[#0d1f0d] hover:bg-[#1f3d1f] rounded-lg text-gray-500 font-barlow font-bold uppercase text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
