'use client'

import { useState } from 'react'
import type { FantasyTeam, Gameweek, Player, FantasyPick } from '@/types'
import PlayerBrowser from '@/components/players/PlayerBrowser'
import { formatPrice } from '@/lib/utils/format'
import { makeTransfer } from './actions'

type PickWithPlayer = FantasyPick & { players: Player }

const posBadge: Record<string, string> = {
  GK: 'bg-yellow-100 text-yellow-700',
  DEF: 'bg-blue-100 text-blue-700',
  MID: 'bg-green-100 text-green-700',
  FWD: 'bg-red-100 text-red-700',
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

    // Update local state
    setPicks(prev => prev.map(p =>
      p.id === playerOut.id ? { ...p, player_id: playerIn.id, players: playerIn } : p
    ))
    setSuccess(`${playerOut.players.display_name ?? playerOut.players.name} → ${playerIn.display_name ?? playerIn.name} confirmed!`)
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
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
          selected
            ? 'border-red-400 bg-red-50 ring-1 ring-red-300'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: pick.players.real_teams?.primary_color ?? '#d1d5db' }} />
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 truncate">{pick.players.display_name ?? pick.players.name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <span>{pick.players.real_teams?.short_name}</span>
            <span className={`font-barlow font-bold uppercase px-1.5 rounded ${posBadge[pick.players.position]}`}>{pick.players.position}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-barlow font-bold text-green-600 text-sm">{formatPrice(pick.players.price)}</div>
          <div className="text-xs text-gray-400">{pick.players.total_points} pts</div>
        </div>
        {selected && <span className="text-red-500 text-xs font-bold ml-1">OUT</span>}
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-barlow font-black text-4xl uppercase text-gray-900">Transfers</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gameweek {gameweek.number}</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm text-center">
            <div className="text-xs font-semibold uppercase text-gray-400">Free Transfers</div>
            <div className="font-barlow font-black text-2xl text-green-600">{freeTransfers === 0 ? '∞' : freeTransfers}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm text-center">
            <div className="text-xs font-semibold uppercase text-gray-400">Bank</div>
            <div className={`font-barlow font-black text-2xl ${Number(fantasyTeam.bank) < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatPrice(Number(fantasyTeam.bank))}
            </div>
          </div>
        </div>
      </div>

      {isDeadlinePast && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700 text-sm font-semibold">
          Deadline has passed — transfers are locked for this gameweek.
        </div>
      )}

      {/* Transfer panel */}
      {playerOut && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="font-barlow font-bold uppercase text-gray-900">Select Replacement</h2>

          {/* Transfer preview */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              <span className="text-red-500 font-bold text-sm">OUT</span>
              <span className="font-semibold text-gray-900 text-sm">{playerOut.players.display_name ?? playerOut.players.name}</span>
              <span className="text-green-600 font-barlow font-bold text-sm">{formatPrice(playerOut.players.price)}</span>
            </div>
            <span className="text-gray-400 font-bold">→</span>
            {playerIn ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <span className="text-green-600 font-bold text-sm">IN</span>
                <span className="font-semibold text-gray-900 text-sm">{playerIn.display_name ?? playerIn.name}</span>
                <span className="text-green-600 font-barlow font-bold text-sm">{formatPrice(playerIn.price)}</span>
              </div>
            ) : (
              <div className="text-gray-400 text-sm italic">pick a player below</div>
            )}
          </div>

          {playerIn && (
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="text-gray-600">
                Budget after: <strong className={newBank < 0 ? 'text-red-600' : 'text-green-600'}>{formatPrice(newBank)}</strong>
              </span>
              <span className="text-gray-600">
                Transfer cost: <strong className={transferCost > 0 ? 'text-red-600' : 'text-gray-900'}>{transferCost > 0 ? `-${transferCost} pts` : 'Free'}</strong>
              </span>
            </div>
          )}

          {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-600 text-sm">{error}</div>}
          {success && <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-700 text-sm font-semibold">✓ {success}</div>}

          {playerIn && (
            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={saving || newBank < 0}
                className="bg-green-600 text-white font-barlow font-black uppercase px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Confirming…' : 'Confirm Transfer'}
              </button>
              <button onClick={() => { setPlayerOut(null); setPlayerIn(null) }} className="bg-gray-100 text-gray-700 font-barlow font-bold uppercase px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-colors">
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
        {/* Starting XI */}
        <div>
          <h2 className="font-barlow font-bold uppercase text-gray-700 mb-3">Starting XI — click to transfer out</h2>
          <div className="space-y-1.5">
            {starting.map(p => <SquadPlayer key={p.id} pick={p} />)}
          </div>
        </div>

        {/* Bench */}
        <div>
          <h2 className="font-barlow font-bold uppercase text-gray-700 mb-3">Bench</h2>
          <div className="space-y-1.5">
            {bench.map(p => <SquadPlayer key={p.id} pick={p} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
