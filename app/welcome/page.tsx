import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WelcomeClient from './WelcomeClient'

export default async function WelcomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: team } = await supabase
    .from('fantasy_teams')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (team) redirect('/')

  // Club name chosen during registration, recovered from user metadata
  const suggestedName = (user.user_metadata?.team_name as string | undefined) ?? ''

  return <WelcomeClient suggestedName={suggestedName} email={user.email ?? ''} />
}
