'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface TransferMove {
  outId: string
  inId: string
}

/**
 * Applies a basket of transfers FPL-style:
 * - replacements must be same position
 * - max 3 players per club in the resulting squad
 * - bank must cover the net price difference
 * - hits: 4 points per transfer beyond the free allowance
 *   (free_transfers = 0 means unlimited, i.e. before the first deadline;
 *    an active wildcard for this GW makes everything free)
 */
export async function makeTransfers(fantasyTeamId: string, gameweekId: string, moves: TransferMove[]) {
  if (moves.length === 0) return { error: 'No transfers to make' }

  const supabase = await createClient()
  const service = await createServiceClient()

  // Ownership check via RLS read
  const { data: team } = await supabase
    .from('fantasy_teams')
    .select('id, bank, free_transfers')
    .eq('id', fantasyTeamId)
    .single()
  if (!team) return { error: 'Team not found' }

  const { data: gameweek } = await supabase.from('gameweeks').select('deadline').eq('id', gameweekId).single()
  if (!gameweek) return { error: 'Gameweek not found' }
  if (new Date(gameweek.deadline) <= new Date()) return { error: 'Deadline has passed' }

  const { data: picks } = await supabase
    .from('fantasy_picks')
    .select('id, player_id, players(id, position, price, team_id)')
    .eq('fantasy_team_id', fantasyTeamId)
    .eq('gameweek_id', gameweekId)
  if (!picks?.length) return { error: 'No squad found for this gameweek' }

  const inIds = moves.map(m => m.inId)
  const { data: playersIn } = await supabase
    .from('players')
    .select('id, position, price, team_id')
    .in('id', inIds)
  const inMap = new Map((playersIn ?? []).map(p => [p.id, p]))

  // Validate and price the basket
  let netSpend = 0
  const pickByPlayer = new Map(picks.map(p => [p.player_id, p]))
  for (const move of moves) {
    const pick = pickByPlayer.get(move.outId)
    if (!pick) return { error: 'Player to transfer out is not in your squad' }
    const pIn = inMap.get(move.inId)
    if (!pIn) return { error: 'Replacement player not found' }
    const pOut = (pick.players as any)
    if (pIn.position !== pOut.position) return { error: 'Replacements must play the same position' }
    if (pickByPlayer.has(move.inId)) return { error: 'Player is already in your squad' }
    netSpend += Number(pIn.price) - Number(pOut.price)
  }

  const newBank = Number(team.bank) - netSpend
  if (newBank < 0) return { error: 'Insufficient budget for these transfers' }

  // Max 3 per club after all moves
  const clubCounts: Record<string, number> = {}
  const outSet = new Set(moves.map(m => m.outId))
  for (const p of picks) {
    if (outSet.has(p.player_id)) continue
    const teamId = (p.players as any).team_id
    clubCounts[teamId] = (clubCounts[teamId] ?? 0) + 1
  }
  for (const move of moves) {
    const teamId = inMap.get(move.inId)!.team_id
    clubCounts[teamId] = (clubCounts[teamId] ?? 0) + 1
    if (clubCounts[teamId] > 3) return { error: 'Maximum 3 players from the same club' }
  }

  // Wildcard active for this GW?
  const { data: chips } = await supabase
    .from('chips_used')
    .select('chip')
    .eq('fantasy_team_id', fantasyTeamId)
    .eq('gameweek_id', gameweekId)
  const wildcardActive = (chips ?? []).some(c => c.chip === 'wildcard_1' || c.chip === 'wildcard_2' || c.chip === 'free_hit')

  const ft = team.free_transfers ?? 1
  const unlimited = ft === 0 || wildcardActive
  const paidCount = unlimited ? 0 : Math.max(0, moves.length - ft)
  const newFreeTransfers = unlimited ? ft : Math.max(0, ft - moves.length)

  // Apply: swap player on each pick
  for (const move of moves) {
    const pick = pickByPlayer.get(move.outId)!
    const { error } = await service
      .from('fantasy_picks')
      .update({ player_id: move.inId, points_scored: 0 })
      .eq('id', pick.id)
    if (error) return { error: error.message }
  }

  await service.from('fantasy_teams').update({
    bank: newBank,
    free_transfers: newFreeTransfers,
  }).eq('id', fantasyTeamId)

  // Record transfers — hits attach to the last `paidCount` moves
  const rows = moves.map((move, i) => {
    const pOut = (pickByPlayer.get(move.outId)!.players as any)
    const pIn = inMap.get(move.inId)!
    return {
      fantasy_team_id: fantasyTeamId,
      gameweek_id: gameweekId,
      player_out_id: move.outId,
      player_in_id: move.inId,
      player_out_price: pOut.price,
      player_in_price: pIn.price,
      transfer_cost: i >= moves.length - paidCount ? 4 : 0,
    }
  })
  await service.from('transfers').insert(rows)

  revalidatePath('/transfers')
  revalidatePath('/squad')
  return { error: null, cost: paidCount * 4 }
}
