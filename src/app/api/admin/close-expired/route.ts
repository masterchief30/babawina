/**
 * API Route: Close Expired Competitions
 * Automatically closes competitions that have passed their end date
 * and calculates winners if judged coordinates are set
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST() {
  try {
    console.log('🔄 Checking for expired competitions...')

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Call the database function to close expired competitions
    const { data, error } = await supabase.rpc('close_expired_competitions')

    if (error) {
      console.error('❌ Error closing competitions:', error)
      return NextResponse.json(
        { error: 'Failed to close expired competitions', details: error.message },
        { status: 500 }
      )
    }

    const results = data || []
    
    if (results.length === 0) {
      console.log('✅ No expired competitions to close')
      return NextResponse.json({
        success: true,
        message: 'No expired competitions found',
        results: []
      })
    }

    // Log results
    console.log(`✅ Processed ${results.length} competition(s):`)
    results.forEach((result: any) => {
      console.log(`  - ${result.competition_title}: ${result.action_taken}`)
      if (result.winner_user_id) {
        console.log(`    Winner: ${result.winner_user_id} (distance: ${result.winner_distance})`)
      }
    })

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} competition(s)`,
      results: results.map((r: any) => ({
        competitionId: r.competition_id,
        title: r.competition_title,
        action: r.action_taken,
        winnerId: r.winner_user_id,
        winnerDistance: r.winner_distance,
      })),
    })
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

// Allow GET requests too (for easy manual testing)
export async function GET() {
  return POST()
}

