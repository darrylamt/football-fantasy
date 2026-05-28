'use server'

import { createClient } from '@/lib/supabase/server'
import type { FantasyPick, Player } from '@/types'

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

  return { error: null }
}
