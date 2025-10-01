/**
 * Entry Preservation System
 * 
 * This system ensures that game entries are preserved throughout the signup
 * and email confirmation process, providing multiple fallback mechanisms.
 */

export interface GameEntry {
  id: string
  x: number
  y: number
  timestamp: number
}

export interface PreservedEntryData {
  sessionId: string
  competitionId: string
  competitionTitle: string
  prizeShort: string
  entryPrice: number
  entries: GameEntry[]
  imageUrl: string
  createdAt: number
  userEmail?: string // Set during signup
  submissionToken?: string // Unique token for this submission
}

export interface TempEntry {
  id?: string
  session_id: string
  competition_id: string
  competition_title: string
  prize_short: string
  entry_price: number
  entries_data: GameEntry[]
  image_url: string
  user_email?: string
  created_at?: string
  expires_at: string
}

// Generate unique session ID for anonymous users
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Generate unique submission token
export function generateSubmissionToken(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`
}

// Get or create session ID
export function getSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId()
  
  let sessionId = localStorage.getItem('babawina_session_id')
  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem('babawina_session_id', sessionId)
  }
  return sessionId
}

// Storage keys
const STORAGE_KEYS = {
  CHECKOUT_DATA: 'checkoutData',
  PRESERVED_ENTRIES: 'preservedEntries',
  SESSION_ID: 'babawina_session_id',
  BACKUP_ENTRIES: 'backupEntries'
} as const

/**
 * Enhanced entry preservation with multiple storage mechanisms
 */
export class EntryPreservationManager {
  private sessionId: string

  constructor() {
    this.sessionId = getSessionId()
  }

  /**
   * Save entries with multiple fallback storage mechanisms
   */
  saveEntries(data: Omit<PreservedEntryData, 'sessionId' | 'createdAt'>): void {
    const preservedData: PreservedEntryData = {
      ...data,
      sessionId: this.sessionId,
      createdAt: Date.now()
    }

    try {
      // Primary storage: localStorage
      localStorage.setItem(STORAGE_KEYS.CHECKOUT_DATA, JSON.stringify({
        competitionId: data.competitionId,
        competitionTitle: data.competitionTitle,
        prizeShort: data.prizeShort,
        entryPrice: data.entryPrice,
        entries: data.entries,
        imageUrl: data.imageUrl
      }))

      // Secondary storage: preserved entries with session tracking
      localStorage.setItem(STORAGE_KEYS.PRESERVED_ENTRIES, JSON.stringify(preservedData))

      // Tertiary storage: sessionStorage as backup
      sessionStorage.setItem(STORAGE_KEYS.BACKUP_ENTRIES, JSON.stringify(preservedData))

      console.log('✅ Entries saved with session ID:', this.sessionId)
    } catch (error) {
      console.error('❌ Failed to save entries:', error)
      // Fallback to sessionStorage only
      try {
        sessionStorage.setItem(STORAGE_KEYS.BACKUP_ENTRIES, JSON.stringify(preservedData))
      } catch (fallbackError) {
        console.error('❌ All storage mechanisms failed:', fallbackError)
      }
    }
  }

  /**
   * Load preserved entries from any available storage
   */
  loadEntries(): PreservedEntryData | null {
    try {
      // Try primary preserved entries first
      const preserved = localStorage.getItem(STORAGE_KEYS.PRESERVED_ENTRIES)
      if (preserved) {
        const data = JSON.parse(preserved) as PreservedEntryData
        console.log('✅ Loaded entries from preserved storage:', data.sessionId)
        return data
      }

      // Fallback to checkout data format
      const checkoutData = localStorage.getItem(STORAGE_KEYS.CHECKOUT_DATA)
      if (checkoutData) {
        const data = JSON.parse(checkoutData)
        const preservedData: PreservedEntryData = {
          sessionId: this.sessionId,
          competitionId: data.competitionId,
          competitionTitle: data.competitionTitle,
          prizeShort: data.prizeShort,
          entryPrice: data.entryPrice,
          entries: data.entries,
          imageUrl: data.imageUrl,
          createdAt: Date.now()
        }
        console.log('✅ Loaded entries from checkout data')
        return preservedData
      }

      // Last resort: sessionStorage backup
      const backup = sessionStorage.getItem(STORAGE_KEYS.BACKUP_ENTRIES)
      if (backup) {
        const data = JSON.parse(backup) as PreservedEntryData
        console.log('✅ Loaded entries from backup storage:', data.sessionId)
        return data
      }

      return null
    } catch (error) {
      console.error('❌ Failed to load entries:', error)
      return null
    }
  }

  /**
   * Associate entries with user email during signup
   */
  associateWithEmail(email: string): void {
    try {
      const preserved = this.loadEntries()
      if (preserved) {
        preserved.userEmail = email
        localStorage.setItem(STORAGE_KEYS.PRESERVED_ENTRIES, JSON.stringify(preserved))
        sessionStorage.setItem(STORAGE_KEYS.BACKUP_ENTRIES, JSON.stringify(preserved))
        console.log('✅ Associated entries with email:', email)
      }
    } catch (error) {
      console.error('❌ Failed to associate entries with email:', error)
    }
  }

  /**
   * Clear all preserved entries after successful submission
   */
  clearEntries(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CHECKOUT_DATA)
      localStorage.removeItem(STORAGE_KEYS.PRESERVED_ENTRIES)
      sessionStorage.removeItem(STORAGE_KEYS.BACKUP_ENTRIES)
      console.log('✅ Cleared all preserved entries')
    } catch (error) {
      console.error('❌ Failed to clear entries:', error)
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Check if entries exist and are not expired (24 hours)
   */
  hasValidEntries(): boolean {
    const preserved = this.loadEntries()
    if (!preserved) return false

    const expirationTime = 24 * 60 * 60 * 1000 // 24 hours
    const isExpired = Date.now() - preserved.createdAt > expirationTime

    if (isExpired) {
      console.log('⚠️ Entries expired, clearing...')
      this.clearEntries()
      return false
    }

    return preserved.entries.length > 0
  }
}

// Singleton instance
export const entryPreservation = new EntryPreservationManager()

/**
 * Save bets immediately to database with submission token
 */
export async function saveBetsWithToken(data: Omit<PreservedEntryData, 'sessionId' | 'createdAt' | 'submissionToken'>): Promise<string | null> {
  try {
    const { supabase } = await import('@/lib/supabase')
    const submissionToken = generateSubmissionToken()
    
    console.log('💾 Saving bets immediately with token:', submissionToken)
    
    // Save each bet individually with the same token
    const betsToSave = data.entries.map((gameEntry, index) => ({
      submission_token: submissionToken,
      competition_id: data.competitionId,
      competition_title: data.competitionTitle,
      prize_short: data.prizeShort,
      entry_price: data.entryPrice,
      guess_x: gameEntry.x,
      guess_y: gameEntry.y,
      entry_number: index + 1,
      image_url: data.imageUrl,
      status: 'pending_confirmation', // Not confirmed yet
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    }))

    const { error } = await supabase
      .from('pending_bets')
      .insert(betsToSave)

    if (error) {
      console.error('❌ Failed to save bets with token:', error)
      return null
    }

    console.log('✅ Bets saved with token:', submissionToken)
    return submissionToken
  } catch (error) {
    console.error('❌ Error saving bets with token:', error)
    return null
  }
}

/**
 * Load bets by submission token
 */
export async function loadBetsByToken(token: string): Promise<PreservedEntryData | null> {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    const { data: bets, error } = await supabase
      .from('pending_bets')
      .select('*')
      .eq('submission_token', token)
      .eq('status', 'pending_confirmation')
      .gt('expires_at', new Date().toISOString())

    if (error || !bets || bets.length === 0) {
      console.log('ℹ️ No pending bets found for token:', token)
      return null
    }

    // Convert back to PreservedEntryData format
    const firstBet = bets[0]
    const entries = bets.map(bet => ({
      id: `entry-${bet.entry_number}`,
      x: bet.guess_x,
      y: bet.guess_y,
      timestamp: new Date(bet.created_at).getTime()
    }))

    const preservedData: PreservedEntryData = {
      sessionId: 'token-based',
      competitionId: firstBet.competition_id,
      competitionTitle: firstBet.competition_title,
      prizeShort: firstBet.prize_short,
      entryPrice: firstBet.entry_price,
      entries: entries,
      imageUrl: firstBet.image_url,
      createdAt: new Date(firstBet.created_at).getTime(),
      submissionToken: token
    }

    console.log('✅ Loaded bets by token:', token, preservedData)
    return preservedData
  } catch (error) {
    console.error('❌ Error loading bets by token:', error)
    return null
  }
}

/**
 * Confirm bets and move to permanent storage
 */
export async function confirmBets(token: string, userId: string): Promise<boolean> {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Get pending bets
    const { data: pendingBets, error: fetchError } = await supabase
      .from('pending_bets')
      .select('*')
      .eq('submission_token', token)
      .eq('status', 'pending_confirmation')

    if (fetchError || !pendingBets || pendingBets.length === 0) {
      console.log('ℹ️ No pending bets found for confirmation:', token)
      return false
    }

    // Move to permanent competition_entries table
    const entriesToSave = pendingBets.map(bet => ({
      competition_id: bet.competition_id,
      user_id: userId,
      guess_x: bet.guess_x,
      guess_y: bet.guess_y,
      entry_price_paid: bet.entry_price,
      entry_number: bet.entry_number
    }))

    const { error: insertError } = await supabase
      .from('competition_entries')
      .insert(entriesToSave)

    if (insertError) {
      console.error('❌ Failed to confirm bets:', insertError)
      return false
    }

    // Mark pending bets as confirmed
    const { error: updateError } = await supabase
      .from('pending_bets')
      .update({ status: 'confirmed', confirmed_user_id: userId })
      .eq('submission_token', token)

    if (updateError) {
      console.error('❌ Failed to update bet status:', updateError)
    }

    console.log('✅ Successfully confirmed bets for token:', token)
    return true
  } catch (error) {
    console.error('❌ Error confirming bets:', error)
    return false
  }
}

/**
 * Database operations for temporary entries
 * This is an optional backup mechanism - the system works without it
 */
export async function saveTempEntriesToDB(data: PreservedEntryData): Promise<boolean> {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    const tempEntry: Omit<TempEntry, 'id' | 'created_at'> = {
      session_id: data.sessionId,
      competition_id: data.competitionId,
      competition_title: data.competitionTitle,
      prize_short: data.prizeShort,
      entry_price: data.entryPrice,
      entries_data: data.entries,
      image_url: data.imageUrl,
      user_email: data.userEmail,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }

    const { error } = await supabase
      .from('temp_entries')
      .upsert(tempEntry, { 
        onConflict: 'session_id,competition_id',
        ignoreDuplicates: false 
      })

    if (error) {
      // Check if it's a table doesn't exist error
      if (error.message?.includes('relation "temp_entries" does not exist')) {
        console.warn('⚠️ temp_entries table not found - database backup disabled. Run the migration to enable this feature.')
        return false
      }
      console.error('❌ Failed to save temp entries to DB:', error)
      return false
    }

    console.log('✅ Saved temp entries to database')
    return true
  } catch (error) {
    console.error('❌ Database error saving temp entries:', error)
    return false
  }
}

/**
 * Load temp entries from database by session ID
 */
export async function loadTempEntriesFromDB(sessionId: string): Promise<PreservedEntryData | null> {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    const { data, error } = await supabase
      .from('temp_entries')
      .select('*')
      .eq('session_id', sessionId)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      console.log('ℹ️ No temp entries found in database for session:', sessionId)
      return null
    }

    const preservedData: PreservedEntryData = {
      sessionId: data.session_id,
      competitionId: data.competition_id,
      competitionTitle: data.competition_title,
      prizeShort: data.prize_short,
      entryPrice: data.entry_price,
      entries: data.entries_data,
      imageUrl: data.image_url,
      userEmail: data.user_email || undefined,
      createdAt: new Date(data.created_at || Date.now()).getTime()
    }

    console.log('✅ Loaded temp entries from database')
    return preservedData
  } catch (error) {
    console.error('❌ Database error loading temp entries:', error)
    return null
  }
}

/**
 * Migrate temporary entries to permanent entries after email confirmation
 * This function gracefully handles the case where temp_entries table doesn't exist
 */
export async function migrateTempEntries(userId: string, email: string): Promise<boolean> {
  try {
    const { supabase } = await import('@/lib/supabase')
    
    // Find temp entries for this email
    const { data: tempEntries, error: fetchError } = await supabase
      .from('temp_entries')
      .select('*')
      .eq('user_email', email)
      .gt('expires_at', new Date().toISOString())

    if (fetchError) {
      // Check if it's a table doesn't exist error
      if (fetchError.message?.includes('relation "temp_entries" does not exist')) {
        console.log('ℹ️ temp_entries table not found - skipping database migration')
        return true // Not an error, table just doesn't exist yet
      }
      console.error('❌ Error fetching temp entries:', fetchError)
      return false
    }

    if (!tempEntries || tempEntries.length === 0) {
      console.log('ℹ️ No temp entries found for email:', email)
      return true // Not an error, just no entries to migrate
    }

    // Migrate each temp entry
    for (const tempEntry of tempEntries) {
      const entriesToSave = tempEntry.entries_data.map((gameEntry: GameEntry, index: number) => ({
        competition_id: tempEntry.competition_id,
        user_id: userId,
        guess_x: gameEntry.x,
        guess_y: gameEntry.y,
        entry_price_paid: tempEntry.entry_price,
        entry_number: index + 1
      }))

      const { error: insertError } = await supabase
        .from('competition_entries')
        .insert(entriesToSave)

      if (insertError) {
        console.error('❌ Failed to migrate temp entry:', insertError)
        continue // Try to migrate other entries
      }

      // Delete the temp entry after successful migration
      await supabase
        .from('temp_entries')
        .delete()
        .eq('id', tempEntry.id)

      console.log('✅ Migrated temp entry for competition:', tempEntry.competition_title)
    }

    return true
  } catch (error) {
    console.error('❌ Error migrating temp entries:', error)
    return false
  }
}
