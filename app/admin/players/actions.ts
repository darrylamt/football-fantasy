'use server'

import { createServiceClient } from '@/lib/supabase/server'
import type { Player, Position } from '@/types'
import { revalidatePath } from 'next/cache'

type PlayerInput = { name: string; display_name: string; position: Position; team_id: string; price: number; status: string; news: string }

export async function createPlayer(data: PlayerInput) {
  const supabase = await createServiceClient()
  const { data: player, error } = await supabase.from('players').insert(data).select('*, real_teams(*)').single()
  revalidatePath('/admin/players')
  return { data: player as (Player & { real_teams?: any }) | null, error: error?.message ?? null }
}

export async function updatePlayer(id: string, data: PlayerInput) {
  const supabase = await createServiceClient()
  const { error } = await supabase.from('players').update(data).eq('id', id)
  revalidatePath('/admin/players')
  return { error: error?.message ?? null }
}

export async function deletePlayer(id: string) {
  const supabase = await createServiceClient()
  await supabase.from('players').delete().eq('id', id)
  revalidatePath('/admin/players')
}
