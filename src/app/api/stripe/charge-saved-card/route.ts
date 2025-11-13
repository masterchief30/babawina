/**
 * API Route: Charge Saved Card
 * Handles charging saved payment method or processing free submissions
 * Implements "Buy 2 Get 1 Free" logic
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe, chargePaymentMethod, randToCents } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface RequestBody {
  userId: string
  competitionId: string
  entryData: {
    x: number
    y: number
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: RequestBody = await request.json()
    const { userId, competitionId, entryData } = body

    if (!userId || !competitionId || !entryData) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate entry coordinates
    if (
      typeof entryData.x !== 'number' ||
      typeof entryData.y !== 'number' ||
      entryData.x < 0 ||
      entryData.x > 1 ||
      entryData.y < 0 ||
      entryData.y > 1
    ) {
      return NextResponse.json(
        { error: 'Invalid entry coordinates' },
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

    // Get competition details
    const { data: competition, error: compError } = await supabase
      .from('competitions')
      .select('entry_price_rand, status, title, starts_at, ends_at')
      .eq('id', competitionId)
      .single()

    if (compError || !competition) {
      console.error('Competition not found:', compError)
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      )
    }

    // Check competition is live
    if (competition.status !== 'live') {
      return NextResponse.json(
        { error: 'Competition is not live' },
        { status: 400 }
      )
    }

    // Check competition dates
    const now = new Date().toISOString()
    if (now < competition.starts_at || now > competition.ends_at) {
      return NextResponse.json(
        { error: 'Competition is not currently active' },
        { status: 400 }
      )
    }

    // Get or create submission counter
    let { data: counter } = await supabase
      .from('user_submission_counters')
      .select('*')
      .eq('user_id', userId)
      .eq('competition_id', competitionId)
      .single()

    if (!counter) {
      // Create new counter
      const { data: newCounter, error: counterError } = await supabase
        .from('user_submission_counters')
        .insert({
          user_id: userId,
          competition_id: competitionId,
          paid_submissions: 0,
          free_submissions: 0,
          total_submissions: 0,
          next_submission_free: false,
        })
        .select()
        .single()

      if (counterError) {
        console.error('Error creating counter:', counterError)
        return NextResponse.json(
          { error: 'Failed to create submission counter' },
          { status: 500 }
        )
      }

      counter = newCounter
    }

    // Determine if this submission is free
    const isFreeSubmission = counter.next_submission_free
    let transactionId: string | null = null
    let paymentIntentId: string | null = null

    if (isFreeSubmission) {
      // FREE SUBMISSION - No payment required
      console.log('🎁 Processing FREE submission for user:', userId)

      // Create transaction record (free)
      const { data: transaction, error: transError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          competition_id: competitionId,
          amount_cents: 0,
          currency: 'ZAR',
          status: 'succeeded',
          was_free: true,
          entries_purchased: 1,
        })
        .select('id')
        .single()

      if (transError) {
        console.error('Error creating free transaction:', transError)
        return NextResponse.json(
          { error: 'Failed to create transaction record' },
          { status: 500 }
        )
      }

      transactionId = transaction.id

      // Update counter - reset to 0 paid after free submission
      await supabase
        .from('user_submission_counters')
        .update({
          paid_submissions: 0,
          free_submissions: counter.free_submissions + 1,
          total_submissions: counter.total_submissions + 1,
          next_submission_free: false,
        })
        .eq('id', counter.id)
    } else {
      // PAID SUBMISSION - Charge the card
      console.log('💳 Processing PAID submission for user:', userId)

      // Get user's default payment method
      const { data: paymentMethod, error: pmError } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single()

      if (pmError || !paymentMethod) {
        console.error('No payment method found:', pmError)
        return NextResponse.json(
          { error: 'No payment method found. Please add a payment method first.' },
          { status: 400 }
        )
      }

      // Calculate amount
      const amountCents = randToCents(competition.entry_price_rand)

      // Charge the card
      try {
        const paymentIntent = await chargePaymentMethod({
          customerId: paymentMethod.stripe_customer_id,
          paymentMethodId: paymentMethod.stripe_payment_method_id,
          amountCents,
          currency: 'ZAR',
          description: `Entry for ${competition.title}`,
          metadata: {
            user_id: userId,
            competition_id: competitionId,
          },
        })

        paymentIntentId = paymentIntent.id

        // Create transaction record
        const { data: transaction, error: transError } = await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            competition_id: competitionId,
            stripe_payment_intent_id: paymentIntent.id,
            stripe_charge_id: paymentIntent.latest_charge as string,
            amount_cents: amountCents,
            currency: 'ZAR',
            status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'processing',
            payment_method_id: paymentMethod.id,
            was_free: false,
            entries_purchased: 1,
            stripe_receipt_url: (paymentIntent as any).charges?.data[0]?.receipt_url || null,
          })
          .select('id')
          .single()

        if (transError) {
          console.error('Error creating transaction:', transError)
          // Payment was charged but transaction record failed
          // This should be logged and handled manually
          return NextResponse.json(
            { error: 'Payment processed but failed to record. Please contact support.' },
            { status: 500 }
          )
        }

        transactionId = transaction.id

        // Update counter - increment paid submissions
        const newPaidCount = counter.paid_submissions + 1
        const nextIsFree = newPaidCount % 2 === 0 // Every 2 paid = next is free

        await supabase
          .from('user_submission_counters')
          .update({
            paid_submissions: newPaidCount,
            total_submissions: counter.total_submissions + 1,
            next_submission_free: nextIsFree,
          })
          .eq('id', counter.id)

        console.log(`✅ Payment successful: R${competition.entry_price_rand}`)
      } catch (paymentError) {
        console.error('Payment failed:', paymentError)

        // Create failed transaction record
        await supabase.from('transactions').insert({
          user_id: userId,
          competition_id: competitionId,
          amount_cents: amountCents,
          currency: 'ZAR',
          status: 'failed',
          payment_method_id: paymentMethod.id,
          was_free: false,
          error_message:
            paymentError instanceof Error
              ? paymentError.message
              : 'Unknown payment error',
        })

        return NextResponse.json(
          {
            error:
              paymentError instanceof Error
                ? paymentError.message
                : 'Payment failed',
          },
          { status: 402 }
        )
      }
    }

    // Save entry to competition_entries
    const { data: entry, error: entryError } = await supabase
      .from('competition_entries')
      .insert({
        competition_id: competitionId,
        user_id: userId,
        guess_x: entryData.x,
        guess_y: entryData.y,
        entry_price_paid: isFreeSubmission ? 0 : competition.entry_price_rand,
        entry_number: counter.total_submissions + 1,
        transaction_id: transactionId,
        was_free_entry: isFreeSubmission,
      })
      .select()
      .single()

    if (entryError) {
      console.error('Error saving entry:', entryError)
      return NextResponse.json(
        { error: 'Failed to save entry' },
        { status: 500 }
      )
    }

    // Get updated counter for response
    const { data: updatedCounter } = await supabase
      .from('user_submission_counters')
      .select('*')
      .eq('id', counter.id)
      .single()

    const submissionsUntilFree = updatedCounter?.next_submission_free
      ? 0
      : 2 - (updatedCounter?.paid_submissions || 0)

    console.log('✅ Entry submitted successfully:', entry.id)

    return NextResponse.json({
      success: true,
      entryId: entry.id,
      transactionId,
      wasFree: isFreeSubmission,
      nextSubmissionFree: updatedCounter?.next_submission_free || false,
      paidSubmissions: updatedCounter?.paid_submissions || 0,
      freeSubmissions: updatedCounter?.free_submissions || 0,
      totalSubmissions: updatedCounter?.total_submissions || 0,
      submissionsUntilFree,
      paymentIntentId,
    })
  } catch (error) {
    console.error('❌ Error processing submission:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to process submission',
      },
      { status: 500 }
    )
  }
}

