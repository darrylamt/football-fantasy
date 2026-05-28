'use server'

import { createServiceClient } from '@/lib/supabase/server'
import type { Gameweek } from '@/types'
import { revalidatePath } from 'next/cache'

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
