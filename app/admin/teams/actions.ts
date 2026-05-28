'use server'

import { createServiceClient } from '@/lib/supabase/server'
import type { RealTeam } from '@/types'
import { revalidatePath } from 'next/cache'

export async function createTeam(data: { name: string; short_name: string; primary_color: string }) {
  const supabase = await createServiceClient()
  const { data: team, error } = await supabase.from('real_teams').insert(data).select().single()
  revalidatePath('/admin/teams')
  return { data: team as RealTeam | null, error: error?.message ?? null }
}

export async function updateTeam(id: string, data: { name: string; short_name: string; primary_color: string }) {
  const supabase = await createServiceClient()
  const { error } = await supabase.from('real_teams').update(data).eq('id', id)
  revalidatePath('/admin/teams')
  return { error: error?.message ?? null }
}

export async function deleteTeam(id: string) {
  const supabase = await createServiceClient()
  await supabase.from('real_teams').delete().eq('id', id)
  revalidatePath('/admin/teams')
}
