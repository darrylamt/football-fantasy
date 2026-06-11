'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ChipType, FantasyPick, Player } from '@/types'

type PickWithPlayer = FantasyPick & { players: Player }

export async function saveSquad(fantasyTeamId: string, gameweekId: string, picks: PickWithPlayer[]) {
  const supabase = await createClient()

  // Delete existing picks for this GW
  await supabase
    .from('fantasy_picks')
    .delete()
    .eq('fantasy_team_id', fantasyTeamId)
    .eq('gameweek_id', gameweekId)

  // Insert new picks
  const rows = picks.map(pick => ({
    fantasy_team_id: fantasyTeamId,
    gameweek_id: gameweekId,
    player_id: pick.player_id,
    is_starting: pick.is_starting,
    bench_order: pick.bench_order ?? null,
    is_captain: pick.is_captain,
    is_vice_captain: pick.is_vice_captain,
    points_scored: 0,
  }))

  const { error } = await supabase.from('fantasy_picks').insert(rows)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/squad')
  return { error: null }
}

/** Activates a chip for the given gameweek. Each chip can be used once a season. */
export async function playChip(fantasyTeamId: string, gameweekId: string, chip: ChipType) {
  const supabase = await createClient()

  const { data: gw } = await supabase.from('gameweeks').select('deadline').eq('id', gameweekId).single()
  if (!gw) return { error: 'Gameweek not found' }
  if (new Date(gw.deadline) <= new Date()) return { error: 'Deadline has passed' }

  const { error } = await supabase.from('chips_used').insert({
    fantasy_team_id: fantasyTeamId,
    gameweek_id: gameweekId,
    chip,
  })
  if (error) {
    if (error.code === '23505') return { error: 'You have already used this chip this season' }
    return { error: error.message }
  }

  revalidatePath('/squad')
  revalidatePath('/transfers')
  return { error: null }
}

/** Cancels a chip before the deadline. */
export async function cancelChip(fantasyTeamId: string, gameweekId: string, chip: ChipType) {
  const supabase = await createClient()

  const { data: gw } = await supabase.from('gameweeks').select('deadline').eq('id', gameweekId).single()
  if (!gw) return { error: 'Gameweek not found' }
  if (new Date(gw.deadline) <= new Date()) return { error: 'Deadline has passed — chip is locked in' }

  const { error } = await supabase
    .from('chips_used')
    .delete()
    .eq('fantasy_team_id', fantasyTeamId)
    .eq('gameweek_id', gameweekId)
    .eq('chip', chip)
  if (error) return { error: error.message }

  revalidatePath('/squad')
  revalidatePath('/transfers')
  return { error: null }
}
