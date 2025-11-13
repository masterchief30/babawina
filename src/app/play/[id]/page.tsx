import { redirect } from 'next/navigation'
import { PlayCompetitionClient } from '@/components/game/play-competition-client'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function PlayCompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Create server Supabase client (with cookie access)
  const supabase = await createServerSupabaseClient()

  // Fetch competition data
  const { data: competition, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('id', id)
    .eq('status', 'live')
    .lte('starts_at', new Date().toISOString())
    .gte('ends_at', new Date().toISOString())
    .single()

  if (error || !competition) {
    console.error('Competition not found:', error)
    redirect('/')
  }

  // Get user ID from session (if logged in)
  let userId: string | null = null

  try {
    console.log('🔍 Attempting to get user from server...')
    
    // Try getUser first
    const { data: userData, error: userError } = await supabase.auth.getUser()
    console.log('👤 getUser result:', userData.user ? 'USER FOUND' : 'NO USER', userError ? `Error: ${userError.message}` : '')
    
    if (userData.user) {
      userId = userData.user.id
      console.log('✅ Server detected logged-in user:', userId)
    } else {
      // Try getSession as fallback
      console.log('🔄 Trying getSession as fallback...')
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      console.log('🔑 getSession result:', sessionData.session ? 'SESSION FOUND' : 'NO SESSION', sessionError ? `Error: ${sessionError.message}` : '')
      
      if (sessionData.session) {
        userId = sessionData.session.user.id
        console.log('✅ Got user from session:', userId)
      } else {
        console.log('❌ No user found via getUser or getSession')
      }
    }
    
    console.log('🔐 Final User ID:', userId ? userId : 'Not logged in')
  } catch (error) {
    console.error('❌ Error getting user:', error)
    userId = null
  }

  return <PlayCompetitionClient competition={competition} userId={userId} />
}
