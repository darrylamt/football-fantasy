import { createClient } from '@/lib/supabase/server'
import TeamsClient from './TeamsClient'

export default async function TeamsPage() {
  const supabase = await createClient()
  const { data: teams } = await supabase.from('real_teams').select('*').order('name')
  return <TeamsClient teams={teams ?? []} />
}
