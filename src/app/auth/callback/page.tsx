'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { migrateTempEntries, entryPreservation, loadBetsByToken, confirmBets } from '@/lib/entry-preservation'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('🚀 Auth callback page loaded!')
      console.log('📍 Current URL:', window.location.href)
      console.log('🔗 URL params:', window.location.search)
      
      // Extract token from URL
      const urlParams = new URLSearchParams(window.location.search)
      const submissionToken = urlParams.get('token')
      console.log('🎯 Submission token from URL:', submissionToken)
      
      try {
        console.log('🔍 Getting session from Supabase...')
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/login?error=confirmation_failed')
          return
        }

        if (data.session) {
          // User is confirmed and logged in
          console.log('User confirmed and logged in:', data.session.user)
          
          // Handle bet confirmation with token-based system
          let entriesSaved = false
          try {
            // First try token-based approach
            if (submissionToken) {
              console.log('🎯 Confirming bets with token:', submissionToken)
              entriesSaved = await confirmBets(submissionToken, data.session.user.id)
              
              if (entriesSaved) {
                console.log('✅ Successfully confirmed bets with token')
                // Clear localStorage token
                localStorage.removeItem('submissionToken')
              } else {
                console.log('⚠️ Token-based confirmation failed, trying fallback methods')
              }
            }
            
            // Always try localStorage entries (since pending_bets table might not exist yet)
            if (!entriesSaved) {
              console.log('🔍 Checking for preserved entries in localStorage...')
              const preserved = entryPreservation.loadEntries()
              console.log('📦 Preserved entries found:', preserved)
              
              if (preserved && preserved.entries.length > 0) {
                console.log('💾 Saving entries to database for confirmed user:', {
                  competitionId: preserved.competitionId,
                  entriesCount: preserved.entries.length,
                  userId: data.session.user.id
                })
                
                const entriesToSave = preserved.entries.map((gameEntry, index) => ({
                  competition_id: preserved.competitionId,
                  user_id: data.session.user.id,
                  guess_x: gameEntry.x,
                  guess_y: gameEntry.y,
                  entry_price_paid: preserved.entryPrice,
                  entry_number: index + 1
                }))

                console.log('📝 Entries to save:', entriesToSave)

                const { error: insertError } = await supabase
                  .from('competition_entries')
                  .insert(entriesToSave)

                if (insertError) {
                  console.error('❌ Failed to save entries:', insertError)
                  console.error('❌ Insert error details:', insertError.message, insertError.details)
                } else {
                  console.log('✅ Successfully saved entries from localStorage')
                  entriesSaved = true
                  // Clear local storage after successful save
                  entryPreservation.clearEntries()
                }
              }
            }
            
            // Final fallback: Try temp entries migration
            if (!entriesSaved) {
              console.log('🔄 Trying temp entries migration...')
              await migrateTempEntries(data.session.user.id, data.session.user.email!)
            }
            
          } catch (error) {
            console.error('❌ Error saving entries:', error)
          }
          
          // Always redirect to profile competitions tab after email confirmation
          console.log('🚀 Redirecting to profile competitions tab')
          router.push('/profile?tab=competitions&confirmed=true')
        } else {
          // No session, redirect to login
          router.push('/login')
        }
      } catch (error) {
        console.error('Unexpected auth callback error:', error)
        router.push('/login?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 border border-white/20 text-center max-w-md w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Confirming your account...</h1>
        <p className="text-gray-600">Please wait while we verify your email address.</p>
      </div>
    </div>
  )
}
