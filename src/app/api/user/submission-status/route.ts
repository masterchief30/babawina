/**
 * API Route: Get Submission Status
 * Returns submission counter info and whether next submission is free
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const competitionId = searchParams.get('competitionId')

    if (!userId || !competitionId) {
      return NextResponse.json(
        { error: 'User ID and Competition ID are required' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Get submission counter
    const { data: counter, error: counterError } = await supabase
      .from('user_submission_counters')
      .select('*')
      .eq('user_id', userId)
      .eq('competition_id', competitionId)
      .single()

    if (counterError) {
      // Counter doesn't exist yet - this is the first submission
      if (counterError.code === 'PGRST116') {
        return NextResponse.json({
          nextSubmissionFree: false,
          paidSubmissions: 0,
          freeSubmissions: 0,
          totalSubmissions: 0,
          submissionsUntilFree: 2,
          hasPaymentMethod: false, // Will be checked separately
        })
      }

      console.error('Error fetching counter:', counterError)
      return NextResponse.json(
        { error: 'Failed to fetch submission status' },
        { status: 500 }
      )
    }

    // Calculate submissions until next free
    const submissionsUntilFree = counter.next_submission_free
      ? 0
      : 2 - counter.paid_submissions

    // Check if user has a payment method
    const { data: paymentMethods } = await supabase
      .from('user_payment_methods')
      .select('id')
      .eq('user_id', userId)
      .eq('is_default', true)
      .limit(1)

    const hasPaymentMethod = paymentMethods && paymentMethods.length > 0

    return NextResponse.json({
      nextSubmissionFree: counter.next_submission_free,
      paidSubmissions: counter.paid_submissions,
      freeSubmissions: counter.free_submissions,
      totalSubmissions: counter.total_submissions,
      submissionsUntilFree,
      hasPaymentMethod,
    })
  } catch (error) {
    console.error('❌ Error getting submission status:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get submission status',
      },
      { status: 500 }
    )
  }
}

