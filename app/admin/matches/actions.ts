'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { calculatePoints } from '@/lib/game/points'
import type { Position } from '@/types'
import { revalidatePath } from 'next/cache'

export type MatchPlayerRow = {
  player_id: string
  position: Position
  team_id: string
  minutes: number
  goals: number
  assists: number
  saves: number
  penalty_saves: number
  yellow_cards: number
  red_cards: number
  own_goals: number
  bonus: number
}

/**
 * Saves a full match in one go: final score, line-ups (who played and for
 * how long) and events (goals, assists, cards, saves, bonus).
 * Clean sheets are derived automatically from the score (60+ minutes and
 * team conceded 0). Points are calculated per player and season totals
 * are recomputed for everyone involved.
 */
export async function saveMatchResult(input: {
  fixtureId: string
  gameweekId: string
  homeTeamId: string
  homeScore: number
  awayScore: number
  rows: MatchPlayerRow[]
}) {
  const supabase = await createServiceClient()
  const { fixtureId, gameweekId, homeTeamId, homeScore, awayScore, rows } = input

  // 1. Fixture result
  const { error: fixErr } = await supabase
    .from('fixtures')
    .update({ played: true, home_score: homeScore, away_score: awayScore })
    .eq('id', fixtureId)
  if (fixErr) return { error: fixErr.message }

  // 2. Stats for everyone who played
  const statRows = rows
    .filter(r => r.minutes > 0)
    .map(r => {
      const conceded = r.team_id === homeTeamId ? awayScore : homeScore
      const clean_sheet = r.minutes >= 60 && conceded === 0
      const { position, team_id, ...stats } = r
      const full = { ...stats, clean_sheet, gameweek_id: gameweekId, fixture_id: fixtureId }
      return { ...full, calculated_points: calculatePoints(full, position) }
    })

  if (statRows.length > 0) {
    const { error } = await supabase
      .from('player_gameweek_stats')
      .upsert(statRows, { onConflict: 'player_id,gameweek_id' })
    if (error) return { error: error.message }
  }

  // 3. Players set back to 0 minutes: remove any previously saved stat row
  const zeroIds = rows.filter(r => r.minutes === 0).map(r => r.player_id)
  if (zeroIds.length > 0) {
    await supabase
      .from('player_gameweek_stats')
      .delete()
      .eq('gameweek_id', gameweekId)
      .in('player_id', zeroIds)
  }

  // 4. Recompute season totals for every player in this match
  const allIds = rows.map(r => r.player_id)
  const { data: sums } = await supabase
    .from('player_gameweek_stats')
    .select('player_id, calculated_points')
    .in('player_id', allIds)

  const totals = new Map<string, number>()
  for (const id of allIds) totals.set(id, 0)
  for (const s of sums ?? []) {
    totals.set(s.player_id, (totals.get(s.player_id) ?? 0) + (s.calculated_points ?? 0))
  }
  for (const [id, total] of totals) {
    const { error } = await supabase.from('players').update({ total_points: total }).eq('id', id)
    if (error) return { error: error.message }
  }

  revalidatePath('/admin/matches')
  revalidatePath('/admin/fixtures')
  revalidatePath('/admin/stats')
  revalidatePath('/results')
  revalidatePath('/fixtures')
  revalidatePath('/players')
  revalidatePath('/')
  return { error: null }
}
