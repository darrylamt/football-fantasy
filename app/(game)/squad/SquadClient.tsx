'use client'

import { useState } from 'react'
import type { FantasyTeam, Gameweek, Player, FantasyPick } from '@/types'
import PitchCanvas from '@/components/pitch/PitchCanvas'
import PlayerBrowser from '@/components/players/PlayerBrowser'
import { validateSquad } from '@/lib/game/squad-validation'
import { formatPrice } from '@/lib/utils/format'
import { saveSquad } from './actions'
import DeadlineCountdown from '@/components/ui/DeadlineCountdown'

type PickWithPlayer = FantasyPick & { players: Player }

interface Props {
  fantasyTeam: FantasyTeam
  gameweek: Gameweek
  allPlayers: Player[]
  initialPicks: PickWithPlayer[]
}

const STARTING_BUDGET = 100

export default function SquadClient({ fantasyTeam, gameweek, allPlayers, initialPicks }: Props) {
  const [picks, setPicks] = useState<PickWithPlayer[]>(initialPicks)
  const [showBrowser, setShowBrowser] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const isDeadlinePast = new Date(gameweek.deadline) <= new Date()

  const squadCost = picks.reduce((sum, p) => sum + Number(p.players.price), 0)
  const remainingBudget = STARTING_BUDGET + Number(fantasyTeam.bank) - squadCost

  const excludeIds = picks.map(p => p.player_id)

  function addPlayer(player: Player) {
    if (picks.length >= 15) return

    const positionCounts = {
      GK: picks.filter(p => p.players.position === 'GK').length,
      DEF: picks.filter(p => p.players.position === 'DEF').length,
      MID: picks.filter(p => p.players.position === 'MID').length,
      FWD: picks.filter(p => p.players.position === 'FWD').length,
    }
    const maxByPos = { GK: 2, DEF: 5, MID: 5, FWD: 3 }
    if (positionCounts[player.position] >= maxByPos[player.position]) return
    if (player.price > remainingBudget) return

    const starters = picks.filter(p => p.is_starting)
    const isStarting = starters.length < 11

    const newPick: PickWithPlayer = {
      id: `temp-${Date.now()}`,
      fantasy_team_id: fantasyTeam.id,
      gameweek_id: gameweek.id,
      player_id: player.id,
      is_starting: isStarting,
      bench_order: isStarting ? undefined : picks.filter(p => !p.is_starting).length + 1,
      is_captain: false,
      is_vice_captain: false,
      points_scored: 0,
      players: player,
    }

    setPicks(prev => [...prev, newPick])
  }

  async function handleSave() {
    const validation = validateSquad(picks as any, STARTING_BUDGET + Number(fantasyTeam.bank))
    if (!validation.valid) {
      setSaveError(validation.errors.join('\n'))
      return
    }

    setSaving(true)
    setSaveError('')
    const result = await saveSquad(fantasyTeam.id, gameweek.id, picks)
    setSaving(false)

    if (result.error) {
      setSaveError(result.error)
    } else {
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-barlow font-black text-4xl uppercase text-white">My Squad</h1>
          <p className="text-gray-400 text-sm">Gameweek {gameweek.number}</p>
        </div>
        <DeadlineCountdown deadline={gameweek.deadline} />
      </div>

      {/* Budget */}
      <div className="flex gap-4 flex-wrap">
        <div className="bg-[#112211] border border-[#1f3d1f] rounded-xl px-5 py-3">
          <div className="text-xs font-barlow uppercase text-gray-400">Budget</div>
          <div className={`font-barlow font-black text-2xl ${remainingBudget < 0 ? 'text-red-400' : 'text-[#4ade80]'}`}>
            {formatPrice(remainingBudget)}
          </div>
        </div>
        <div className="bg-[#112211] border border-[#1f3d1f] rounded-xl px-5 py-3">
          <div className="text-xs font-barlow uppercase text-gray-400">Players</div>
          <div className="font-barlow font-black text-2xl text-white">{picks.length}/15</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pitch */}
        <div className="lg:col-span-2">
          <PitchCanvas picks={picks} onPicksChange={setPicks} readonly={isDeadlinePast} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {!isDeadlinePast && (
            <button
              onClick={() => setShowBrowser(!showBrowser)}
              className="w-full bg-[#4ade80] text-[#0a1400] font-barlow font-black uppercase text-lg rounded-xl py-3 hover:bg-[#22c55e] transition-colors"
            >
              {showBrowser ? 'Hide Browser' : '+ Add Players'}
            </button>
          )}

          {showBrowser && !isDeadlinePast && (
            <div className="bg-[#112211] border border-[#1f3d1f] rounded-xl p-4">
              <h2 className="font-barlow font-bold uppercase text-white mb-3">Player Browser</h2>
              <PlayerBrowser
                players={allPlayers}
                excludeIds={excludeIds}
                budget={remainingBudget}
                onSelect={player => { addPlayer(player); setShowBrowser(false) }}
              />
            </div>
          )}

          {saveError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm whitespace-pre-line">
              {saveError}
            </div>
          )}

          {saveSuccess && (
            <div className="bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl p-4 text-[#4ade80] text-sm font-bold">
              Squad saved successfully!
            </div>
          )}

          {!isDeadlinePast && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#1f3d1f] border border-[#4ade80]/30 text-[#4ade80] font-barlow font-black uppercase text-lg rounded-xl py-3 hover:bg-[#2d5a2d] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Team'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
