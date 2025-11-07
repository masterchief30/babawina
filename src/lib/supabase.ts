import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client with proper auth configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sb-auth-token'
  }
})

// Server-side Supabase client with service role (for admin operations)
export const getSupabaseAdmin = () => {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          role: 'user' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          role?: 'user' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          role?: 'user' | 'admin'
          created_at?: string
        }
      }
      competitions: {
        Row: {
          id: string
          title: string
          slug: string
          prize_short: string
          prize_value_rand: number
          entry_price_rand: number
          image_raw_path: string | null
          image_mask_path: string | null
          image_inpainted_path: string | null
          status: 'draft' | 'live' | 'closed' | 'judged'
          starts_at: string
          ends_at: string
          judged_x: number | null
          judged_y: number | null
          detect_confidence: number | null
          image_width: number | null
          image_height: number | null
          processing_status: 'idle' | 'processing' | 'ready' | 'needs_review'
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          prize_short: string
          prize_value_rand: number
          entry_price_rand: number
          image_raw_path?: string | null
          image_mask_path?: string | null
          image_inpainted_path?: string | null
          status?: 'draft' | 'live' | 'closed' | 'judged'
          starts_at: string
          ends_at: string
          judged_x?: number | null
          judged_y?: number | null
          detect_confidence?: number | null
          image_width?: number | null
          image_height?: number | null
          processing_status?: 'idle' | 'processing' | 'ready' | 'needs_review'
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          prize_short?: string
          prize_value_rand?: number
          entry_price_rand?: number
          image_raw_path?: string | null
          image_mask_path?: string | null
          image_inpainted_path?: string | null
          status?: 'draft' | 'live' | 'closed' | 'judged'
          starts_at?: string
          ends_at?: string
          judged_x?: number | null
          judged_y?: number | null
          detect_confidence?: number | null
          image_width?: number | null
          image_height?: number | null
          processing_status?: 'idle' | 'processing' | 'ready' | 'needs_review'
          created_by?: string
          created_at?: string
        }
      }
      entries: {
        Row: {
          id: string
          competition_id: string
          user_id: string
          x: number
          y: number
          distance: number | null
          created_at: string
          ip_hash: string
        }
        Insert: {
          id?: string
          competition_id: string
          user_id: string
          x: number
          y: number
          distance?: number | null
          created_at?: string
          ip_hash: string
        }
        Update: {
          id?: string
          competition_id?: string
          user_id?: string
          x?: number
          y?: number
          distance?: number | null
          created_at?: string
          ip_hash?: string
        }
      }
      winners: {
        Row: {
          id: string
          competition_id: string
          user_id: string
          rank: number
          distance: number
          announced_at: string
        }
        Insert: {
          id?: string
          competition_id: string
          user_id: string
          rank: number
          distance: number
          announced_at?: string
        }
        Update: {
          id?: string
          competition_id?: string
          user_id?: string
          rank?: number
          distance?: number
          announced_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
