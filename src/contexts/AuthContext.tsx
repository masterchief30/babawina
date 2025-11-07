'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {}
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Safety timeout - if auth takes more than 3 seconds, stop loading
    const timeoutId = setTimeout(() => {
      console.warn('⏰ Auth loading timeout - proceeding without session')
      setLoading(false)
    }, 3000)

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔐 Getting initial session...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('✅ Session retrieved:', session ? 'Logged in' : 'Guest')
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('❌ Error getting session:', error)
      } finally {
        clearTimeout(timeoutId) // Clear timeout if we finish in time
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'No user')
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Handle user confirmation and save entries
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🎯 User signed in, checking for preserved entries...')
          
          // Import entry preservation functions
          const { entryPreservation, migrateTempEntries } = await import('@/lib/entry-preservation')
          
          try {
            const preserved = entryPreservation.loadEntries()
            if (preserved && preserved.entries.length > 0) {
              console.log('💾 Found preserved entries, saving to database...')
              
              const entriesToSave = preserved.entries.map((gameEntry: any, index: number) => ({
                competition_id: preserved.competitionId,
                user_id: session.user.id,
                guess_x: gameEntry.x,
                guess_y: gameEntry.y,
                entry_price_paid: preserved.entryPrice,
                entry_number: index + 1
              }))

              const { error: insertError } = await supabase
                .from('competition_entries')
                .insert(entriesToSave)

              if (insertError) {
                console.error('❌ Failed to save entries in AuthContext:', insertError)
              } else {
                console.log('✅ Successfully saved entries in AuthContext')
                entryPreservation.clearEntries()
                
                // Redirect to profile competitions tab
                setTimeout(() => {
                  window.location.href = '/profile?tab=competitions&confirmed=true'
                }, 1000)
              }
            }
            
            // Also try to migrate temp entries
            await migrateTempEntries(session.user.id, session.user.email!)
            
          } catch (error) {
            console.error('❌ Error handling entries in AuthContext:', error)
          }
        }
        
        // If user signed out, ensure we're on the home page
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, ensuring clean state')
          setTimeout(() => {
            if (window.location.pathname !== '/') {
              window.location.href = '/'
            }
          }, 100)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    console.log('AuthContext signOut called')
    try {
      // Check if there's an active session first
      console.log('Checking for active session...')
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      console.log('Current session:', currentSession?.user?.email || 'No session')
      
      if (!currentSession) {
        // No active session, just clear local state
        console.log('No active session found, clearing local state')
        setSession(null)
        setUser(null)
        return
      }

      // Sign out from Supabase
      console.log('Signing out from Supabase...')
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.log('Supabase signOut error:', error)
        // If it's just a session missing error, don't throw - just clear local state
        if (error.message?.includes('session') || error.message?.includes('Auth session missing')) {
          console.log('Session already invalid, clearing local state')
          setSession(null)
          setUser(null)
          return
        }
        console.error('Error signing out:', error)
        throw error
      }
      
      // Clear local state
      console.log('Supabase signOut successful, clearing local state')
      setSession(null)
      setUser(null)
    } catch (error: unknown) {
      console.error('Sign out error:', error)
      // Even if there's an error, clear local state to ensure UI updates
      console.log('Clearing local state due to error')
      setSession(null)
      setUser(null)
      
      // Only throw if it's not a session-related error
      const errorMessage = error instanceof Error ? error.message : ''
      if (!errorMessage.includes('session') && !errorMessage.includes('Auth session missing')) {
        throw error
      }
    }
  }

  const value = {
    user,
    session,
    loading,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
