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
    // Get initial session with FAST localStorage check first
    const getInitialSession = async () => {
      try {
        console.log('🔐 Checking for session...')
        
        // FAST PATH: Check localStorage directly (instant!)
        const authData = localStorage.getItem('sb-auth-token')
        if (authData) {
          try {
            const parsed = JSON.parse(authData)
            const token = parsed?.access_token || parsed?.currentSession?.access_token
            const storedUser = parsed?.user || parsed?.currentSession?.user
            
            if (token && storedUser) {
              console.log('⚡ Fast path: Found valid session in localStorage')
              setSession(parsed.currentSession || parsed)
              setUser(storedUser)
              setLoading(false)
              return // Exit early - we're logged in!
            }
          } catch (e) {
            console.log('⚠️ Failed to parse localStorage auth, trying Supabase...')
          }
        }
        
        // SLOW PATH: Fall back to Supabase getSession() with timeout
        console.log('🔍 No localStorage session, trying Supabase getSession()...')
        const startTime = Date.now()
        
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
        
        const { data: { session } } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any
        
        const elapsed = Date.now() - startTime
        console.log(`✅ Supabase session retrieved in ${elapsed}ms:`, session ? 'Logged in' : 'Guest')
        
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.warn('⏰ Session check timed out or failed - proceeding as guest')
        setSession(null)
        setUser(null)
      } finally {
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
    console.log('🚪 Logging out...')
    
    // IMMEDIATELY clear local state - don't wait for Supabase
    setSession(null)
    setUser(null)
    
    // Clear localStorage
    try {
      localStorage.removeItem('sb-auth-token')
      console.log('🗑️ Cleared localStorage')
    } catch (e) {
      console.error('Failed to clear localStorage:', e)
    }
    
    try {
      // Try to sign out from Supabase with timeout
      console.log('📡 Calling Supabase signOut...')
      
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      )
      
      await Promise.race([signOutPromise, timeoutPromise])
      console.log('✅ Supabase signOut successful')
    } catch (error) {
      console.log('⚠️ Supabase signOut timed out or failed (not critical)')
      // Not critical - local state already cleared
    }
    
    // Redirect to home
    console.log('✅ Logout complete - redirecting to home')
    window.location.href = '/'
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
