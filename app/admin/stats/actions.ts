'use server'

import { createServiceClient } from '@/lib/supabase/server'
import type { PlayerGameweekStats, Position } from '@/types'
import { calculatePoints } from '@/lib/game/points'
import { revalidatePath } from 'next/cache'

type StatsInput = {
  player_id: string
  gameweek_id: string
  fixture_id: string
  minutes: number
  goals: number
  assists: number
  clean_sheet: boolean
  saves: number
  penalty_saves: number
  yellow_cards: number
  red_cards: number
  own_goals: number
  bonus: number
  position: Position
}

export async function upsertPlayerStats(input: StatsInput) {
  const supabase = await createServiceClient()
  const { position, ...statsData } = input
  const calculated_points = calculatePoints(statsData, position)

  const { data, error } = await supabase
    .from('player_gameweek_stats')
    .upsert({ ...statsData, calculated_points }, { onConflict: 'player_id,gameweek_id' })
    .select()
    .single()

  revalidatePath('/admin/stats')
  return { data: data as PlayerGameweekStats | null, error: error?.message ?? null }
}

export async function getFixturePlayers(fixtureId: string, gameweekId: string) {
  const supabase = await createServiceClient()
  const { data: fixture } = await supabase
    .from('fixtures')
    .select('home_team_id, away_team_id')
    .eq('id', fixtureId)
    .single()

  if (!fixture) return { players: [], stats: [] }

  const { data: players } = await supabase
    .from('players')
    .select('*')
    .in('team_id', [fixture.home_team_id, fixture.away_team_id])
    .order('position')
    .order('name')

  const { data: stats } = await supabase
    .from('player_gameweek_stats')
    .select('*')
    .eq('gameweek_id', gameweekId)
    .eq('fixture_id', fixtureId)

  return { players: players ?? [], stats: stats ?? [] }
}
