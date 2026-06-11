'use client'

import { useState } from 'react'
import type { ChipUsed, FantasyTeam, Gameweek, Player, FantasyPick, Position } from '@/types'
import PlayerBrowser from '@/components/players/PlayerBrowser'
import Modal from '@/components/ui/Modal'
import DeadlineCountdown from '@/components/ui/DeadlineCountdown'
import { formatPrice, formatDeadline } from '@/lib/utils/format'
import { makeTransfers } from './actions'
import { playChip, cancelChip } from '../squad/actions'

type PickWithPlayer = FantasyPick & { players: Player }
type Move = { out: PickWithPlayer; in: Player }

const POSITION_ORDER: Position[] = ['GK', 'DEF', 'MID', 'FWD']
const POSITION_LABEL: Record<Position, string> = { GK: 'Goalkeepers', DEF: 'Defenders', MID: 'Midfielders', FWD: 'Forwards' }

export default function TransfersClient({
  fantasyTeam,
  gameweek,
  picks: initialPicks,
  allPlayers,
  chipsUsed: initialChips,
}: {
  fantasyTeam: FantasyTeam
  gameweek: Gameweek
  picks: PickWithPlayer[]
  allPlayers: Player[]
  chipsUsed: ChipUsed[]
}) {
  const [picks, setPicks] = useState(initialPicks)
  const [bank, setBank] = useState(Number(fantasyTeam.bank))
  const [freeTransfers, setFreeTransfers] = useState(fantasyTeam.free_transfers ?? 1)
  const [chips, setChips] = useState<ChipUsed[]>(initialChips)
  const [moves, setMoves] = useState<Move[]>([])
  const [selectingFor, setSelectingFor] = useState<PickWithPlayer | null>(null)
  const [saving, setSaving] = useState(false)
  const [chipBusy, setChipBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isDeadlinePast = new Date(gameweek.deadline) <= new Date()

  const wildcardRow = chips.find(c => c.chip === 'wildcard_1')
  const wildcardState: 'active' | 'used' | 'available' =
    !wildcardRow ? 'available' : wildcardRow.gameweek_id === gameweek.id ? 'active' : 'used'

  const unlimited = freeTransfers === 0 || wildcardState === 'active'
  const hits = unlimited ? 0 : Math.max(0, moves.length - freeTransfers) * 4
  const netSpend = moves.reduce((s, m) => s + Number(m.in.price) - Number(m.out.players.price), 0)
  const bankAfter = bank - netSpend

  const outIds = moves.map(m => m.out.player_id)
  const inIds = moves.map(m => m.in.id)
  const excludeIds = [...picks.map(p => p.player_id), ...inIds]

  /** Effective squad row: shows incoming player if a move is pending for that slot */
  function effective(pick: PickWithPlayer): { player: Player; pendingOut: boolean } {
    const move = moves.find(m => m.out.id === pick.id)
    return move ? { player: move.in, pendingOut: true } : { player: pick.players, pendingOut: false }
  }

  function startTransfer(pick: PickWithPlayer) {
    if (isDeadlinePast) return
    setError(''); setSuccess('')
    // If this slot already has a pending move, undo it
    if (moves.some(m => m.out.id === pick.id)) {
      setMoves(prev => prev.filter(m => m.out.id !== pick.id))
      return
    }
    setSelectingFor(pick)
  }

  function chooseReplacement(player: Player) {
    if (!selectingFor) return
    setMoves(prev => [...prev, { out: selectingFor, in: player }])
    setSelectingFor(null)
  }

  async function confirmTransfers() {
    if (moves.length === 0) return
    if (bankAfter < 0) { setError('Insufficient budget for these transfers.'); return }
    setSaving(true); setError(''); setSuccess('')

    const result = await makeTransfers(
      fantasyTeam.id,
      gameweek.id,
      moves.map(m => ({ outId: m.out.player_id, inId: m.in.id }))
    )
    setSaving(false)
    if (result.error) { setError(result.error); return }

    // Apply locally
    setPicks(prev => prev.map(p => {
      const move = moves.find(m => m.out.id === p.id)
      return move ? { ...p, player_id: move.in.id, players: move.in, points_scored: 0 } : p
    }))
    setBank(bankAfter)
    if (!unlimited) setFreeTransfers(Math.max(0, freeTransfers - moves.length))
    setSuccess(`${moves.length} transfer${moves.length === 1 ? '' : 's'} confirmed${result.cost ? ` — ${result.cost} pt hit` : ''}`)
    setMoves([])
  }

  async function toggleWildcard() {
    setChipBusy(true); setError('')
    const result = wildcardState === 'active'
      ? await cancelChip(fantasyTeam.id, gameweek.id, 'wildcard_1')
      : await playChip(fantasyTeam.id, gameweek.id, 'wildcard_1')
    setChipBusy(false)
    if (result.error) { setError(result.error); return }
    setChips(prev => wildcardState === 'active'
      ? prev.filter(c => c.chip !== 'wildcard_1')
      : [...prev, { id: 'tmp-wc', fantasy_team_id: fantasyTeam.id, chip: 'wildcard_1', gameweek_id: gameweek.id }]
    )
  }

  const budgetForSlot = selectingFor
    ? bank - moves.reduce((s, m) => s + Number(m.in.price) - Number(m.out.players.price), 0) + Number(selectingFor.players.price)
    : undefined

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="fpl-hero rounded-lg px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-barlow font-black text-3xl text-white leading-none">Transfers</h1>
            <p className="text-white/60 text-sm mt-1">Gameweek {gameweek.number}</p>
          </div>
          <div className="text-right">
            <DeadlineCountdown deadline={gameweek.deadline} light />
            <p className="text-white/40 text-xs mt-0.5">{formatDeadline(gameweek.deadline)}</p>
          </div>
        </div>

        <div className="flex gap-6 mt-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">Free transfers</div>
            <div className="font-barlow font-bold text-xl text-[#00ff87]">
              {wildcardState === 'active' ? 'Wildcard' : freeTransfers === 0 ? 'Unlimited' : freeTransfers}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">Cost</div>
            <div className={`font-barlow font-bold text-xl ${hits > 0 ? 'text-[#e90052]' : 'text-white'}`}>
              {hits > 0 ? `-${hits} pts` : '0 pts'}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-white/50">Bank</div>
            <div className={`font-barlow font-bold text-xl ${bankAfter < 0 ? 'text-[#e90052]' : 'text-white'}`}>
              {formatPrice(bankAfter)}
            </div>
          </div>
        </div>
      </div>

      {/* Wildcard */}
      {!isDeadlinePast && (
        <div className={`bg-white rounded-lg border px-4 py-3 flex items-center justify-between gap-3 ${
          wildcardState === 'active' ? 'border-[#00ff87] ring-1 ring-[#00ff87]' : 'border-gray-200'
        }`}>
          <div>
            <div className="text-sm font-bold text-[#37003c]">Wildcard</div>
            <div className="text-[11px] text-gray-400">
              {wildcardState === 'used' ? 'Already used this season'
                : wildcardState === 'active' ? 'Active — all transfers free this gameweek'
                : 'Unlimited free transfers this gameweek'}
            </div>
          </div>
          <button
            onClick={toggleWildcard}
            disabled={wildcardState === 'used' || chipBusy}
            className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-md transition-colors disabled:opacity-40 ${
              wildcardState === 'active' ? 'bg-[#e90052] text-white hover:bg-[#c70046]' : 'bg-[#00ff87] text-[#37003c] hover:bg-[#00e57a]'
            }`}
          >
            {chipBusy ? '…' : wildcardState === 'active' ? 'Cancel' : wildcardState === 'used' ? 'Used' : 'Play'}
          </button>
        </div>
      )}

      {isDeadlinePast && (
        <div className="bg-white border border-gray-200 rounded-md px-4 py-3 text-sm text-gray-500">
          Deadline has passed — transfers are locked for this gameweek.
        </div>
      )}

      {error && <div className="bg-[#e90052]/10 border border-[#e90052]/40 rounded-md px-3 py-2.5 text-[#e90052] text-sm">{error}</div>}
      {success && <div className="bg-[#00ff87]/20 border border-[#00ff87] rounded-md px-3 py-2.5 text-[#37003c] text-sm font-semibold">{success}</div>}

      {/* Pending moves bar */}
      {moves.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-[#37003c] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white/80">
            Pending transfers ({moves.length})
          </div>
          <div className="divide-y divide-gray-100">
            {moves.map(m => (
              <div key={m.out.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="text-[#e90052] font-semibold truncate">{m.out.players.display_name ?? m.out.players.name}</span>
                <span className="text-gray-300 flex-shrink-0">→</span>
                <span className="text-[#37003c] font-semibold truncate">{m.in.display_name ?? m.in.name}</span>
                <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                  {formatPrice(Number(m.in.price) - Number(m.out.players.price))} diff
                </span>
                <button
                  onClick={() => setMoves(prev => prev.filter(x => x.out.id !== m.out.id))}
                  className="text-gray-300 hover:text-[#e90052] flex-shrink-0 text-lg leading-none"
                  title="Remove"
                >&times;</button>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-gray-500">
              {hits > 0
                ? <>This will cost <strong className="text-[#e90052]">{hits} points</strong></>
                : 'No point hits'}
              {' · '}Bank after: <strong className={bankAfter < 0 ? 'text-[#e90052]' : 'text-[#37003c]'}>{formatPrice(bankAfter)}</strong>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setMoves([])}
                className="text-xs font-semibold text-gray-500 border border-gray-200 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={confirmTransfers}
                disabled={saving || bankAfter < 0}
                className="text-xs font-bold bg-[#00ff87] text-[#37003c] px-4 py-2 rounded-md hover:bg-[#00e57a] transition-colors disabled:opacity-50"
              >
                {saving ? 'Confirming…' : `Confirm Transfers${hits > 0 ? ` (-${hits} pts)` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Squad by position */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {POSITION_ORDER.map(pos => {
          const group = picks.filter(p => p.players.position === pos)
          if (group.length === 0) return null
          return (
            <div key={pos}>
              <div className="bg-[#37003c] px-4 py-2 flex items-center text-[10px] font-bold uppercase tracking-wider text-white/80">
                <span className="flex-1">{POSITION_LABEL[pos]}</span>
                <span className="w-16 text-right">Price</span>
                <span className="w-12 text-right">Pts</span>
                <span className="w-12" />
              </div>
              {group.map(pick => {
                const { player, pendingOut } = effective(pick)
                return (
                  <div key={pick.id} className={`flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-100 last:border-0 ${pendingOut ? 'bg-[#00ff87]/10' : ''}`}>
                    <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: player.real_teams?.primary_color ?? '#d1d5db' }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-[#37003c] truncate block leading-tight">
                        {player.display_name ?? player.name}
                        {pendingOut && <span className="ml-2 text-[10px] font-bold text-[#37003c] bg-[#00ff87] rounded px-1.5 py-0.5 align-middle">IN</span>}
                      </span>
                      <span className="text-[11px] text-gray-400">{player.real_teams?.short_name}</span>
                    </div>
                    <span className="w-16 text-right text-sm text-[#37003c] flex-shrink-0">{formatPrice(Number(player.price))}</span>
                    <span className="w-12 text-right text-sm font-bold text-[#37003c] flex-shrink-0">{player.total_points}</span>
                    <div className="w-12 flex justify-end flex-shrink-0">
                      <button
                        onClick={() => startTransfer(pick)}
                        disabled={isDeadlinePast}
                        title={pendingOut ? 'Undo transfer' : 'Transfer out'}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors disabled:opacity-30 ${
                          pendingOut
                            ? 'bg-[#e90052] text-white hover:bg-[#c70046]'
                            : 'bg-[#f4f4f6] text-[#37003c] hover:bg-[#00ff87]'
                        }`}
                      >
                        {pendingOut ? '×' : '⇄'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Replacement picker */}
      {selectingFor && (
        <Modal
          open={!!selectingFor}
          onClose={() => setSelectingFor(null)}
          title={`Replace ${selectingFor.players.display_name ?? selectingFor.players.name}`}
        >
          <PlayerBrowser
            players={allPlayers}
            excludeIds={excludeIds}
            budget={budgetForSlot}
            positionLock={selectingFor.players.position}
            onSelect={chooseReplacement}
          />
        </Modal>
      )}
    </div>
  )
}
