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
    const posCount = { GK: 0, DEF: 0, MID: 0, FWD: 0 }
    picks.forEach(p => posCount[p.players.position]++)
    const maxByPos = { GK: 2, DEF: 5, MID: 5, FWD: 3 }
    if (posCount[player.position] >= maxByPos[player.position]) return
    if (player.price > remainingBudget) return

    const starters = picks.filter(p => p.is_starting)
    const isStarting = starters.length < 11

    setPicks(prev => [...prev, {
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
    }])
  }

  async function handleSave() {
    const validation = validateSquad(picks as any, STARTING_BUDGET + Number(fantasyTeam.bank))
    if (!validation.valid) { setSaveError(validation.errors.join('\n')); return }
    setSaving(true); setSaveError('')
    const result = await saveSquad(fantasyTeam.id, gameweek.id, picks)
    setSaving(false)
    if (result.error) { setSaveError(result.error) } else {
      setSaveSuccess(true); setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-barlow font-black text-3xl text-gray-900">My Squad</h1>
          <p className="text-sm text-gray-400">Gameweek {gameweek.number}</p>
        </div>
        <DeadlineCountdown deadline={gameweek.deadline} />
      </div>

      <div className="flex gap-4 text-sm">
        <div>
          <span className="text-gray-400">Budget </span>
          <span className={`font-medium ${remainingBudget < 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {formatPrice(remainingBudget)}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Players </span>
          <span className="font-medium text-gray-900">{picks.length}<span className="text-gray-400">/15</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PitchCanvas picks={picks} onPicksChange={setPicks} readonly={isDeadlinePast} />
        </div>

        <div className="space-y-3">
          {!isDeadlinePast && (
            <button
              onClick={() => setShowBrowser(!showBrowser)}
              className="w-full bg-gray-900 text-white text-sm font-medium rounded-md py-2.5 hover:bg-gray-800 transition-colors"
            >
              {showBrowser ? 'Hide browser' : '+ Add players'}
            </button>
          )}

          {showBrowser && !isDeadlinePast && (
            <div className="bg-white border border-gray-100 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-3">Click a player to add them</p>
              <PlayerBrowser
                players={allPlayers}
                excludeIds={excludeIds}
                budget={remainingBudget}
                onSelect={player => { addPlayer(player); setShowBrowser(false) }}
              />
            </div>
          )}

          {saveError && (
            <div className="border border-red-200 rounded-md px-3 py-2.5 text-red-600 text-sm whitespace-pre-line">{saveError}</div>
          )}
          {saveSuccess && (
            <div className="border border-gray-200 rounded-md px-3 py-2.5 text-gray-700 text-sm">Squad saved</div>
          )}

          {!isDeadlinePast && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full border border-gray-200 text-gray-700 text-sm font-medium rounded-md py-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save team'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
