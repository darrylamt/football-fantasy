'use client'

import { useState } from 'react'
import type { FantasyTeam, Gameweek, Player, FantasyPick } from '@/types'
import PlayerBrowser from '@/components/players/PlayerBrowser'
import { formatPrice } from '@/lib/utils/format'
import { makeTransfer } from './actions'

type PickWithPlayer = FantasyPick & { players: Player }

const posColor: Record<string, string> = {
  GK: 'text-yellow-600', DEF: 'text-blue-500', MID: 'text-green-600', FWD: 'text-red-500',
}

export default function TransfersClient({
  fantasyTeam,
  gameweek,
  picks: initialPicks,
  allPlayers,
}: {
  fantasyTeam: FantasyTeam
  gameweek: Gameweek
  picks: PickWithPlayer[]
  allPlayers: Player[]
}) {
  const [picks, setPicks] = useState(initialPicks)
  const [playerOut, setPlayerOut] = useState<PickWithPlayer | null>(null)
  const [playerIn, setPlayerIn] = useState<Player | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isDeadlinePast = new Date(gameweek.deadline) <= new Date()
  const freeTransfers = fantasyTeam.free_transfers ?? 1
  const priceDiff = playerIn && playerOut ? Number(playerIn.price) - Number(playerOut.players.price) : 0
  const transferCost = freeTransfers > 0 ? 0 : 4
  const newBank = Number(fantasyTeam.bank) - priceDiff
  const currentIds = picks.map(p => p.player_id)

  function selectOut(pick: PickWithPlayer) {
    setPlayerOut(prev => prev?.id === pick.id ? null : pick)
    setPlayerIn(null)
    setError(''); setSuccess('')
  }

  function selectIn(player: Player) {
    setPlayerIn(prev => prev?.id === player.id ? null : player)
    setError(''); setSuccess('')
  }

  async function handleConfirm() {
    if (!playerOut || !playerIn) return
    if (newBank < 0) { setError('Insufficient budget for this transfer.'); return }
    setSaving(true); setError(''); setSuccess('')

    const result = await makeTransfer(fantasyTeam.id, gameweek.id, playerOut.player_id, playerIn.id, transferCost)
    setSaving(false)

    if (result.error) { setError(result.error); return }

    setPicks(prev => prev.map(p =>
      p.id === playerOut.id ? { ...p, player_id: playerIn.id, players: playerIn } : p
    ))
    setSuccess(`${playerOut.players.display_name ?? playerOut.players.name} → ${playerIn.display_name ?? playerIn.name} confirmed`)
    setPlayerOut(null); setPlayerIn(null)
  }

  const starting = picks.filter(p => p.is_starting).sort((a, b) => {
    const order = ['GK', 'DEF', 'MID', 'FWD']
    return order.indexOf(a.players.position) - order.indexOf(b.players.position)
  })
  const bench = picks.filter(p => !p.is_starting).sort((a, b) => (a.bench_order ?? 0) - (b.bench_order ?? 0))

  function SquadPlayer({ pick }: { pick: PickWithPlayer }) {
    const selected = playerOut?.id === pick.id
    return (
      <button
        disabled={isDeadlinePast}
        onClick={() => selectOut(pick)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 last:border-0 text-left transition-colors ${
          selected ? 'bg-gray-50' : 'hover:bg-gray-50'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: pick.players.real_teams?.primary_color ?? '#d1d5db' }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-900 truncate">{pick.players.display_name ?? pick.players.name}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {pick.players.real_teams?.short_name}
            {' · '}
            <span className={`font-medium ${posColor[pick.players.position]}`}>{pick.players.position}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm text-gray-900">{formatPrice(pick.players.price)}</div>
          {selected && <div className="text-xs text-red-500 font-medium">Transfer out</div>}
        </div>
      </button>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-barlow font-black text-3xl text-gray-900">Transfers</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gameweek {gameweek.number}</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-gray-400">Free transfers </span>
            <span className="font-medium text-gray-900">{freeTransfers === 0 ? '∞' : freeTransfers}</span>
          </div>
          <div>
            <span className="text-gray-400">Bank </span>
            <span className={`font-medium ${Number(fantasyTeam.bank) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
              {formatPrice(Number(fantasyTeam.bank))}
            </span>
          </div>
        </div>
      </div>

      {isDeadlinePast && (
        <div className="border border-gray-200 rounded-md px-4 py-3 text-sm text-gray-500">
          Deadline has passed — transfers are locked for this gameweek.
        </div>
      )}

      {playerOut && (
        <div className="bg-white border border-gray-100 rounded-lg p-4 space-y-4">
          <h2 className="text-sm font-medium text-gray-900">Select replacement</h2>

          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-gray-500">{playerOut.players.display_name ?? playerOut.players.name}</span>
            <span className="text-gray-300">→</span>
            {playerIn
              ? <span className="font-medium text-gray-900">{playerIn.display_name ?? playerIn.name}</span>
              : <span className="text-gray-400 italic">pick a player below</span>
            }
          </div>

          {playerIn && (
            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              <span>Bank after: <span className={newBank < 0 ? 'text-red-600 font-medium' : 'text-gray-900 font-medium'}>{formatPrice(newBank)}</span></span>
              <span>Cost: <span className={transferCost > 0 ? 'text-red-600 font-medium' : 'text-gray-900 font-medium'}>{transferCost > 0 ? `-${transferCost} pts` : 'Free'}</span></span>
            </div>
          )}

          {error && <div className="border border-red-200 rounded-md px-3 py-2 text-red-600 text-sm">{error}</div>}
          {success && <div className="border border-gray-200 rounded-md px-3 py-2 text-gray-600 text-sm">{success}</div>}

          {playerIn && (
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={saving || newBank < 0}
                className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Confirming…' : 'Confirm transfer'}
              </button>
              <button
                onClick={() => { setPlayerOut(null); setPlayerIn(null) }}
                className="border border-gray-200 text-gray-600 text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          <PlayerBrowser
            players={allPlayers}
            excludeIds={currentIds}
            budget={Number(fantasyTeam.bank) + Number(playerOut.players.price)}
            onSelect={selectIn}
            highlightId={playerIn?.id}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-gray-400 mb-2">Starting XI — click to transfer out</p>
          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
            {starting.map(p => <SquadPlayer key={p.id} pick={p} />)}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-2">Bench</p>
          <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
            {bench.map(p => <SquadPlayer key={p.id} pick={p} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
