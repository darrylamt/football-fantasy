'use client'

import { useState } from 'react'
import type { ChipType, ChipUsed, FantasyTeam, Gameweek, Player, FantasyPick } from '@/types'
import PitchCanvas from '@/components/pitch/PitchCanvas'
import PlayerBrowser from '@/components/players/PlayerBrowser'
import { validateSquad } from '@/lib/game/squad-validation'
import { formatPrice, formatDeadline } from '@/lib/utils/format'
import { saveSquad, playChip, cancelChip } from './actions'
import DeadlineCountdown from '@/components/ui/DeadlineCountdown'

type PickWithPlayer = FantasyPick & { players: Player }

interface Props {
  fantasyTeam: FantasyTeam
  gameweek: Gameweek
  allPlayers: Player[]
  initialPicks: PickWithPlayer[]
  chipsUsed: ChipUsed[]
}

const STARTING_BUDGET = 100

const TEAM_CHIPS: { chip: ChipType; label: string; desc: string }[] = [
  { chip: 'bench_boost',   label: 'Bench Boost',    desc: 'Bench points count this GW' },
  { chip: 'triple_captain', label: 'Triple Captain', desc: 'Captain scores 3× this GW' },
]

export default function SquadClient({ fantasyTeam, gameweek, allPlayers, initialPicks, chipsUsed: initialChips }: Props) {
  const [picks, setPicks] = useState<PickWithPlayer[]>(initialPicks)
  const [chips, setChips] = useState<ChipUsed[]>(initialChips)
  const [showBrowser, setShowBrowser] = useState(initialPicks.length < 15)
  const [saving, setSaving] = useState(false)
  const [chipBusy, setChipBusy] = useState<ChipType | null>(null)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const isDeadlinePast = new Date(gameweek.deadline) <= new Date()
  const squadCost = picks.reduce((sum, p) => sum + Number(p.players.price), 0)
  const remainingBudget = STARTING_BUDGET + Number(fantasyTeam.bank) - squadCost
  const excludeIds = picks.map(p => p.player_id)
  const selectingSquad = picks.length < 15

  function chipState(chip: ChipType): 'active' | 'used' | 'available' {
    const row = chips.find(c => c.chip === chip)
    if (!row) return 'available'
    return row.gameweek_id === gameweek.id ? 'active' : 'used'
  }

  async function toggleChip(chip: ChipType) {
    setChipBusy(chip); setSaveError('')
    const state = chipState(chip)
    const result = state === 'active'
      ? await cancelChip(fantasyTeam.id, gameweek.id, chip)
      : await playChip(fantasyTeam.id, gameweek.id, chip)
    setChipBusy(null)
    if (result.error) { setSaveError(result.error); return }
    setChips(prev => state === 'active'
      ? prev.filter(c => c.chip !== chip)
      : [...prev, { id: `tmp-${chip}`, fantasy_team_id: fantasyTeam.id, chip, gameweek_id: gameweek.id }]
    )
  }

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
    <div className="space-y-4">
      {/* Hero */}
      <div className="fpl-hero rounded-lg px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-barlow font-black text-3xl text-white leading-none">
              {selectingSquad ? 'Squad Selection' : 'Pick Team'}
            </h1>
            <p className="text-white/60 text-sm mt-1">
              {fantasyTeam.name} · Gameweek {gameweek.number}
            </p>
          </div>
          <div className="text-right">
            <DeadlineCountdown deadline={gameweek.deadline} light />
            <p className="text-white/40 text-xs mt-0.5">{formatDeadline(gameweek.deadline)}</p>
          </div>
        </div>

        {/* Budget strip */}
        <div className="flex gap-6 mt-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">Budget</div>
            <div className={`font-barlow font-bold text-xl ${remainingBudget < 0 ? 'text-[#e90052]' : 'text-[#00ff87]'}`}>
              {formatPrice(remainingBudget)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">Players</div>
            <div className="font-barlow font-bold text-xl text-white">{picks.length}<span className="text-white/40">/15</span></div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">Squad value</div>
            <div className="font-barlow font-bold text-xl text-white">{formatPrice(squadCost)}</div>
          </div>
        </div>
      </div>

      {/* Chips */}
      {!selectingSquad && !isDeadlinePast && (
        <div className="grid grid-cols-2 gap-2">
          {TEAM_CHIPS.map(({ chip, label, desc }) => {
            const state = chipState(chip)
            return (
              <div key={chip} className={`bg-white rounded-lg border px-4 py-3 flex items-center justify-between gap-2 ${
                state === 'active' ? 'border-[#00ff87] ring-1 ring-[#00ff87]' : 'border-gray-200'
              }`}>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#37003c]">{label}</div>
                  <div className="text-[11px] text-gray-400 truncate">
                    {state === 'used' ? 'Already used this season' : state === 'active' ? 'Active this gameweek' : desc}
                  </div>
                </div>
                <button
                  onClick={() => toggleChip(chip)}
                  disabled={state === 'used' || chipBusy === chip}
                  className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-md transition-colors disabled:opacity-40 ${
                    state === 'active'
                      ? 'bg-[#e90052] text-white hover:bg-[#c70046]'
                      : 'bg-[#00ff87] text-[#37003c] hover:bg-[#00e57a]'
                  }`}
                >
                  {chipBusy === chip ? '…' : state === 'active' ? 'Cancel' : state === 'used' ? 'Used' : 'Play'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pitch */}
        <div className="lg:col-span-2">
          <PitchCanvas
            picks={picks}
            onPicksChange={setPicks}
            readonly={isDeadlinePast}
            valueMode="price"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {!isDeadlinePast && (
            <button
              onClick={() => setShowBrowser(!showBrowser)}
              className="w-full bg-[#37003c] text-white text-sm font-bold rounded-md py-2.5 hover:bg-[#4a0a50] transition-colors"
            >
              {showBrowser ? 'Hide player list' : 'Add players'}
            </button>
          )}

          {showBrowser && !isDeadlinePast && (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-2">
                {selectingSquad ? `Select ${15 - picks.length} more player${15 - picks.length === 1 ? '' : 's'}` : 'Squad is full — transfer players on the Transfers page'}
              </p>
              <PlayerBrowser
                players={allPlayers}
                excludeIds={excludeIds}
                budget={remainingBudget}
                onSelect={player => { addPlayer(player) }}
              />
            </div>
          )}

          {saveError && (
            <div className="bg-[#e90052]/10 border border-[#e90052]/40 rounded-md px-3 py-2.5 text-[#e90052] text-sm whitespace-pre-line">{saveError}</div>
          )}
          {saveSuccess && (
            <div className="bg-[#00ff87]/20 border border-[#00ff87] rounded-md px-3 py-2.5 text-[#37003c] text-sm font-semibold">Team saved</div>
          )}

          {!isDeadlinePast && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#00ff87] text-[#37003c] text-sm font-bold rounded-md py-3 hover:bg-[#00e57a] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Your Team'}
            </button>
          )}

          {isDeadlinePast && (
            <div className="bg-white border border-gray-200 rounded-md px-3 py-2.5 text-sm text-gray-500">
              Deadline has passed — team is locked for this gameweek.
            </div>
          )}

          {!selectingSquad && !isDeadlinePast && (
            <p className="text-[11px] text-gray-400 leading-relaxed px-1">
              Click a player to set your captain, vice-captain or make a substitution. Captain scores double points.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
