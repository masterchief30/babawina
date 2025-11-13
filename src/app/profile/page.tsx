import React, { Suspense } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import ProfileClientContent from '@/components/profile/profile-client-content'

export default async function ProfilePage() {
  // Server-side: Get user and fetch competitions using SSR-compatible client
  const cookieStore = await cookies()
  
  // Debug: Check what cookies are available
  console.log('🍪 Server (Profile): Available cookies:', cookieStore.getAll().map(c => c.name))
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // Server components can't set cookies during render
          // This is needed for type compatibility but won't be called
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Ignore errors - we can't set cookies in server components
          }
        },
        remove(name: string, options: any) {
          // Server components can't remove cookies during render
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Ignore errors
          }
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  console.log('🔐 Server (Profile): getUser result:', user ? `User ID: ${user.id}` : 'No user')
  if (userError) {
    console.error('❌ Server (Profile): getUser error:', userError)
  }

  let userCompetitions: any[] = []

  if (user) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🏠 Server (Profile): Fetching competitions for user:', user.id)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    try {
      // Fetch user entries
      console.log('📥 Querying competition_entries...')
      const { data: userEntries, error: entriesError } = await supabase
        .from('competition_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (entriesError) {
        console.error('❌ Error fetching entries:', entriesError)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      }

      console.log('📊 Fetched entries:', userEntries?.length || 0)
      
      if (userEntries && userEntries.length > 0) {
        console.log('✅ Found', userEntries.length, 'entries')
        // Get unique competition IDs
        const competitionIds = [...new Set(userEntries.map(entry => entry.competition_id))]
        
        // Fetch competitions
        const { data: competitions } = await supabase
          .from('competitions')
          .select('*')
          .in('id', competitionIds)

        // Group entries by competition
        const competitionStatsMap = new Map()
        
        userEntries.forEach((entry: any) => {
          const competition = competitions?.find(c => c.id === entry.competition_id)
          if (!competition) return
          
          const competitionId = competition.id
          
          if (!competitionStatsMap.has(competitionId)) {
            competitionStatsMap.set(competitionId, {
              competition: {
                id: competition.id,
                title: competition.title || 'Untitled Competition',
                prize_name: competition.prize_short || competition.title || 'Prize',
                display_photo_path: competition.display_photo_path,
                ends_at: competition.ends_at,
                is_active: competition.status === 'live'
              },
              entry_count: 0,
              total_spent: 0,
              entries: []
            })
          }
          
          const stats = competitionStatsMap.get(competitionId)
          stats.entry_count += 1
          
          // Calculate price: if was_free_entry is true, price is 0, otherwise use competition price
          const entryPrice = entry.was_free_entry ? 0 : (competition.entry_price_rand || 0)
          stats.total_spent += entryPrice
          
          stats.entries.push({
            id: entry.id,
            competition_id: entry.competition_id,
            guess_x: entry.guess_x,
            guess_y: entry.guess_y,
            entry_price_paid: entryPrice,
            was_free_entry: entry.was_free_entry,
            created_at: entry.created_at,
            is_winner: entry.is_winner,
            competition: stats.competition
          })
        })

        userCompetitions = Array.from(competitionStatsMap.values())
        console.log('✅ Server: Grouped into', userCompetitions.length, 'competitions')
        console.log('📋 Competition details:', userCompetitions.map(c => ({
          title: c.competition.title,
          entry_count: c.entry_count,
          total_spent: c.total_spent
        })))
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      } else {
        console.log('❌ No entries found for user')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      }
    } catch (error) {
      console.error('❌ Server: Error fetching competitions:', error)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    }
  } else {
    console.log('❌ Server: No user detected')
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading profile...</p>
      </div>
    </div>}>
      <ProfileClientContent initialCompetitions={userCompetitions} />
    </Suspense>
  )
}
