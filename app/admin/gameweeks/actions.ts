'use server'

import { createServiceClient } from '@/lib/supabase/server'
import type { Gameweek, Position } from '@/types'
import { revalidatePath } from 'next/cache'
import { scoreTeamPicks, type ScorablePick, type PlayerGwResult } from '@/lib/game/scoring'

export async function createGameweek(data: { season_id: string; number: number; deadline: string }) {
  const supabase = await createServiceClient()
  const { data: gw, error } = await supabase.from('gameweeks').insert(data).select().single()
  revalidatePath('/admin/gameweeks')
  return { data: gw as Gameweek | null, error: error?.message ?? null }
}

export async function updateGameweekStatus(id: string, status: Gameweek['status']) {
  const supabase = await createServiceClient()
  await supabase.from('gameweeks').update({ status }).eq('id', id)
  revalidatePath('/admin/gameweeks')
}

export async function setCurrentGameweek(id: string) {
  const supabase = await createServiceClient()
  // Unset all, then set this one
  await supabase.from('gameweeks').update({ is_current: false }).neq('id', id)
  await supabase.from('gameweeks').update({ is_current: true }).eq('id', id)
  revalidatePath('/admin/gameweeks')
}

/**
 * Scores every fantasy team for the gameweek: applies auto-subs, captain
 * multipliers (vice fallback, triple captain), bench boost, writes
 * points_scored on every pick, marks the GW finished, then recomputes
 * total_points and overall_rank for all teams.
 */
export async function finalizeGameweek(gameweekId: string) {
  const supabase = await createServiceClient()

  const [{ data: statRows }, { data: pickRows, error: picksErr }, { data: chipRows }] = await Promise.all([
    supabase
      .from('player_gameweek_stats')
      .select('player_id, minutes, calculated_points')
      .eq('gameweek_id', gameweekId),
    supabase
      .from('fantasy_picks')
      .select('id, fantasy_team_id, gameweek_id, player_id, is_starting, bench_order, is_captain, is_vice_captain, points_scored, players(position)')
      .eq('gameweek_id', gameweekId),
    supabase
      .from('chips_used')
      .select('fantasy_team_id, chip')
      .eq('gameweek_id', gameweekId),
  ])

  if (picksErr) return { error: picksErr.message }

  const stats = new Map<string, PlayerGwResult>(
    (statRows ?? []).map(r => [r.player_id, { points: r.calculated_points ?? 0, minutes: r.minutes ?? 0 }])
  )

  // Group picks by fantasy team
  const byTeam = new Map<string, typeof pickRows>()
  for (const row of pickRows ?? []) {
    if (!byTeam.has(row.fantasy_team_id)) byTeam.set(row.fantasy_team_id, [])
    byTeam.get(row.fantasy_team_id)!.push(row)
  }

  const chipsByTeam = new Map<string, string[]>()
  for (const c of chipRows ?? []) {
    if (!chipsByTeam.has(c.fantasy_team_id)) chipsByTeam.set(c.fantasy_team_id, [])
    chipsByTeam.get(c.fantasy_team_id)!.push(c.chip)
  }

  for (const [teamId, rows] of byTeam) {
    const teamChips = chipsByTeam.get(teamId) ?? []
    const scorable: ScorablePick[] = (rows ?? []).map(r => ({
      id: r.id,
      player_id: r.player_id,
      is_starting: r.is_starting,
      bench_order: r.bench_order,
      is_captain: r.is_captain,
      is_vice_captain: r.is_vice_captain,
      position: ((r.players as any)?.position ?? 'MID') as Position,
      points_scored: 0,
    }))

    const { picks: scored } = scoreTeamPicks(scorable, stats, {
      tripleCaptain: teamChips.includes('triple_captain'),
      benchBoost: teamChips.includes('bench_boost'),
    })

    for (const pick of scored) {
      const { error } = await supabase
        .from('fantasy_picks')
        .update({
          is_starting: pick.is_starting,
          bench_order: pick.bench_order,
          is_captain: pick.is_captain,
          is_vice_captain: pick.is_vice_captain,
          points_scored: pick.points_scored,
        })
        .eq('id', pick.id)
      if (error) return { error: error.message }
    }
  }

  await supabase.from('gameweeks').update({ status: 'finished' }).eq('id', gameweekId)

  const recomputeError = await recomputeTotalsAndRanks(supabase)
  if (recomputeError) return { error: recomputeError }

  revalidatePath('/admin/gameweeks')
  revalidatePath('/')
  revalidatePath('/points')
  revalidatePath('/leagues')
  return { error: null }
}

async function recomputeTotalsAndRanks(supabase: Awaited<ReturnType<typeof createServiceClient>>) {
  const { data: finishedGws } = await supabase.from('gameweeks').select('id').eq('status', 'finished')
  const finishedIds = new Set((finishedGws ?? []).map(g => g.id))

  const [{ data: allPicks }, { data: boostChips }, { data: allTransfers }, { data: teams }] = await Promise.all([
    supabase.from('fantasy_picks').select('fantasy_team_id, gameweek_id, is_starting, points_scored'),
    supabase.from('chips_used').select('fantasy_team_id, gameweek_id').eq('chip', 'bench_boost'),
    supabase.from('transfers').select('fantasy_team_id, transfer_cost'),
    supabase.from('fantasy_teams').select('id'),
  ])

  const boostSet = new Set((boostChips ?? []).map(c => `${c.fantasy_team_id}:${c.gameweek_id}`))

  const totals = new Map<string, number>()
  for (const t of teams ?? []) totals.set(t.id, 0)

  for (const p of allPicks ?? []) {
    if (!finishedIds.has(p.gameweek_id)) continue
    const counts = p.is_starting || boostSet.has(`${p.fantasy_team_id}:${p.gameweek_id}`)
    if (!counts) continue
    totals.set(p.fantasy_team_id, (totals.get(p.fantasy_team_id) ?? 0) + (p.points_scored ?? 0))
  }

  for (const t of allTransfers ?? []) {
    totals.set(t.fantasy_team_id, (totals.get(t.fantasy_team_id) ?? 0) - (t.transfer_cost ?? 0))
  }

  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1])
  for (let i = 0; i < ranked.length; i++) {
    const [teamId, total] = ranked[i]
    const { error } = await supabase
      .from('fantasy_teams')
      .update({ total_points: total, overall_rank: i + 1 })
      .eq('id', teamId)
    if (error) return error.message
  }
  return null
}
