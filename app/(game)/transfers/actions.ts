'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function makeTransfer(
  fantasyTeamId: string,
  gameweekId: string,
  playerOutId: string,
  playerInId: string,
  transferCost: number
) {
  const supabase = await createClient()
  const service = await createServiceClient()

  // Get player prices
  const [{ data: pOut }, { data: pIn }] = await Promise.all([
    supabase.from('players').select('price').eq('id', playerOutId).single(),
    supabase.from('players').select('price').eq('id', playerInId).single(),
  ])

  if (!pOut || !pIn) return { error: 'Player not found' }

  // Get current pick for the outgoing player
  const { data: pick } = await supabase
    .from('fantasy_picks')
    .select('*')
    .eq('fantasy_team_id', fantasyTeamId)
    .eq('player_id', playerOutId)
    .eq('gameweek_id', gameweekId)
    .single()

  if (!pick) return { error: 'Player not in your squad this gameweek' }

  const priceDiff = Number(pIn.price) - Number(pOut.price)

  // Update pick: swap player
  const { error: pickErr } = await service
    .from('fantasy_picks')
    .update({ player_id: playerInId, points_scored: 0 })
    .eq('id', pick.id)

  if (pickErr) return { error: pickErr.message }

  // Update bank balance
  const { data: team } = await supabase.from('fantasy_teams').select('bank, free_transfers').eq('id', fantasyTeamId).single()
  if (team) {
    const newBank = Number(team.bank) - priceDiff
    const newFreeTransfers = Math.max(0, (team.free_transfers ?? 1) - 1)
    await service.from('fantasy_teams').update({
      bank: newBank,
      free_transfers: newFreeTransfers,
    }).eq('id', fantasyTeamId)
  }

  // Record transfer
  await service.from('transfers').insert({
    fantasy_team_id: fantasyTeamId,
    gameweek_id: gameweekId,
    player_out_id: playerOutId,
    player_in_id: playerInId,
    player_out_price: pOut.price,
    player_in_price: pIn.price,
    transfer_cost: transferCost,
  })

  revalidatePath('/transfers')
  revalidatePath('/squad')
  return { error: null }
}
