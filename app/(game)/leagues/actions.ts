'use server'

import { createClient } from '@/lib/supabase/server'
import { generateLeagueCode } from '@/lib/utils/format'
import { revalidatePath } from 'next/cache'

export async function createLeague(name: string, type: 'classic' | 'h2h') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: season } = await supabase.from('seasons').select('id').eq('is_active', true).single()
  if (!season) return { error: 'No active season' }

  const code = generateLeagueCode()
  const { data: league, error } = await supabase
    .from('leagues')
    .insert({ name, type, code, created_by: user.id, season_id: season.id })
    .select()
    .single()
  if (error) return { error: error.message }

  // Auto-join creator
  const { data: team } = await supabase.from('fantasy_teams').select('id').eq('user_id', user.id).single()
  if (team) await supabase.from('league_members').insert({ league_id: league.id, fantasy_team_id: team.id })

  revalidatePath('/leagues')
  return { data: league, error: null }
}

export async function joinLeague(code: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: league, error: leagueErr } = await supabase.from('leagues').select('*').eq('code', code.toUpperCase()).single()
  if (leagueErr || !league) return { error: 'League not found — check the code.' }

  const { data: team } = await supabase.from('fantasy_teams').select('id').eq('user_id', user.id).single()
  if (!team) return { error: 'You need a fantasy team first.' }

  const { error } = await supabase.from('league_members').insert({ league_id: league.id, fantasy_team_id: team.id })
  if (error) return { error: error.code === '23505' ? 'Already in this league.' : error.message }

  revalidatePath('/leagues')
  return { error: null, leagueName: league.name }
}
