'use server'

import { createServiceClient } from '@/lib/supabase/server'
import type { Fixture } from '@/types'
import { revalidatePath } from 'next/cache'

type FixtureInput = {
  gameweek_id: string
  home_team_id: string
  away_team_id: string
  kickoff_time: string
}

export async function createFixture(data: FixtureInput) {
  const supabase = await createServiceClient()
  const { data: fixture, error } = await supabase
    .from('fixtures')
    .insert({ ...data, played: false })
    .select('*, gameweeks(*), home_team:real_teams!home_team_id(*), away_team:real_teams!away_team_id(*)')
    .single()
  revalidatePath('/admin/fixtures')
  return { data: fixture as Fixture | null, error: error?.message ?? null }
}

export async function updateFixture(id: string, data: FixtureInput) {
  const supabase = await createServiceClient()
  const { error } = await supabase.from('fixtures').update(data).eq('id', id)
  revalidatePath('/admin/fixtures')
  return { error: error?.message ?? null }
}

export async function markPlayed(id: string, home_score: number, away_score: number) {
  const supabase = await createServiceClient()
  const { error } = await supabase
    .from('fixtures')
    .update({ played: true, home_score, away_score })
    .eq('id', id)
  revalidatePath('/admin/fixtures')
  revalidatePath('/admin/stats')
  return { error: error?.message ?? null }
}

export async function deleteFixture(id: string) {
  const supabase = await createServiceClient()
  await supabase.from('fixtures').delete().eq('id', id)
  revalidatePath('/admin/fixtures')
}
