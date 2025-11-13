/**
 * API Route: Submit Batch of Entries
 * Handles batch submission with "Buy 2 Get 1 Free" per session
 * Charges once for all paid entries in the batch
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { chargePaymentMethod, randToCents } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface EntryData {
  x: number
  y: number
}

interface RequestBody {
  userId: string
  competitionId: string
  entries: EntryData[]
}

export async function POST(request: NextRequest) {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📦 BATCH SUBMISSION API')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Parse request body
    const body: RequestBody = await request.json()
    const { userId, competitionId, entries } = body

    console.log('👤 User ID:', userId)
    console.log('🎯 Competition ID:', competitionId)
    console.log('📦 Number of entries:', entries?.length)

    if (!userId || !competitionId || !entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (entries.length === 0) {
      return NextResponse.json(
        { error: 'No entries provided' },
        { status: 400 }
      )
    }

    // Validate all entry coordinates
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      if (
        typeof entry.x !== 'number' ||
        typeof entry.y !== 'number' ||
        entry.x < 0 ||
        entry.x > 1 ||
        entry.y < 0 ||
        entry.y > 1
      ) {
        return NextResponse.json(
          { error: `Invalid coordinates for entry ${i + 1}` },
          { status: 400 }
        )
      }
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
      console.error('❌ Competition not found:', compError)
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      )
    }

    console.log('🏆 Competition:', competition.title)
    console.log('💰 Entry price:', competition.entry_price_rand, 'RAND')

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

    // ═══════════════════════════════════════════════════════
    // CALCULATE "BUY 2 GET 1 FREE" FOR THIS BATCH ONLY
    // ═══════════════════════════════════════════════════════
    const entriesWithPricing = entries.map((entry, index) => {
      const position = index + 1
      const isFree = position % 3 === 0 // Every 3rd is free
      return {
        ...entry,
        isFree,
        position,
      }
    })

    const paidCount = entriesWithPricing.filter(e => !e.isFree).length
    const freeCount = entriesWithPricing.filter(e => e.isFree).length
    const totalAmount = paidCount * competition.entry_price_rand

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💵 PRICING BREAKDOWN (THIS BATCH ONLY)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 Total entries:', entries.length)
    console.log('💳 Paid entries:', paidCount)
    console.log('🎁 Free entries:', freeCount)
    console.log('💰 Total charge:', totalAmount, 'RAND')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    entriesWithPricing.forEach(e => {
      console.log(`  Position ${e.position}: ${e.isFree ? '🎁 FREE' : '💳 R' + competition.entry_price_rand}`)
    })

    let transactionId: string | null = null
    let paymentIntentId: string | null = null

    // ═══════════════════════════════════════════════════════
    // CHARGE FOR ALL PAID ENTRIES (IF ANY)
    // ═══════════════════════════════════════════════════════
    if (paidCount > 0 && competition.entry_price_rand > 0) {
      console.log('\n💳 CHARGING CARD FOR', paidCount, 'PAID ENTRIES...')

      // Get user's default payment method
      const { data: paymentMethod, error: pmError } = await supabase
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single()

      if (pmError || !paymentMethod) {
        console.error('❌ No payment method found:', pmError)
        return NextResponse.json(
          { error: 'No payment method found. Please add a payment method first.' },
          { status: 400 }
        )
      }

      // Calculate total amount in cents
      const amountCents = randToCents(totalAmount)

      console.log('💳 Charging:', amountCents, 'cents (R' + totalAmount + ')')

      // Charge the card ONCE for all paid entries
      try {
        const paymentIntent = await chargePaymentMethod({
          customerId: paymentMethod.stripe_customer_id,
          paymentMethodId: paymentMethod.stripe_payment_method_id,
          amountCents,
          currency: 'ZAR',
          description: `${paidCount} entries for ${competition.title}`,
          metadata: {
            user_id: userId,
            competition_id: competitionId,
            paid_entries: paidCount.toString(),
            free_entries: freeCount.toString(),
            total_entries: entries.length.toString(),
          },
        })

        paymentIntentId = paymentIntent.id

        console.log('✅ Payment successful!')
        console.log('   Payment Intent:', paymentIntent.id)
        console.log('   Amount charged:', amountCents, 'cents')

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
            entries_purchased: paidCount,
            stripe_receipt_url: (paymentIntent as any).charges?.data[0]?.receipt_url || null,
          })
          .select('id')
          .single()

        if (transError) {
          console.error('❌ Error creating transaction:', transError)
          return NextResponse.json(
            { error: 'Payment processed but failed to record. Please contact support.' },
            { status: 500 }
          )
        }

        transactionId = transaction.id
        console.log('✅ Transaction record created:', transactionId)
      } catch (paymentError) {
        console.error('❌ Payment failed:', paymentError)
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
    } else {
      console.log('🎁 All entries are free - no payment required')

      // Create a free transaction record
      const { data: transaction, error: transError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          competition_id: competitionId,
          amount_cents: 0,
          currency: 'ZAR',
          status: 'succeeded',
          was_free: true,
          entries_purchased: entries.length,
        })
        .select('id')
        .single()

      if (transError) {
        console.error('❌ Error creating free transaction:', transError)
        return NextResponse.json(
          { error: 'Failed to create transaction record' },
          { status: 500 }
        )
      }

      transactionId = transaction.id
    }

    // ═══════════════════════════════════════════════════════
    // INSERT ALL ENTRIES INTO DATABASE
    // ═══════════════════════════════════════════════════════
    console.log('\n📝 SAVING', entries.length, 'ENTRIES TO DATABASE...')

    // Get current entry count for this user+competition to set entry_number
    const { count: existingCount } = await supabase
      .from('competition_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('competition_id', competitionId)

    const startingEntryNumber = (existingCount || 0) + 1

    const entriesToInsert = entriesWithPricing.map((entry, index) => ({
      competition_id: competitionId,
      user_id: userId,
      guess_x: entry.x,
      guess_y: entry.y,
      transaction_id: transactionId,
      was_free_entry: entry.isFree,
      entry_price_paid: entry.isFree ? 0 : competition.entry_price_rand,
      entry_number: startingEntryNumber + index,
    }))

    console.log('📋 Entries to insert:', JSON.stringify(entriesToInsert, null, 2))

    const { data: insertedEntries, error: entryError } = await supabase
      .from('competition_entries')
      .insert(entriesToInsert)
      .select('id')

    if (entryError) {
      console.error('❌ Error saving entries:', entryError)
      console.error('❌ Full error details:', JSON.stringify(entryError, null, 2))
      console.error('❌ Tried to insert:', JSON.stringify(entriesToInsert, null, 2))
      return NextResponse.json(
        { error: 'Failed to save entries', details: entryError.message || entryError },
        { status: 500 }
      )
    }

    console.log('✅ All entries saved!')
    console.log('   Entry IDs:', insertedEntries?.map(e => e.id).join(', '))

    // ═══════════════════════════════════════════════════════
    // UPDATE COUNTER FOR STATISTICS (OPTIONAL)
    // ═══════════════════════════════════════════════════════
    // Note: Counter is now just for stats, not for pricing logic
    const { data: counter } = await supabase
      .from('user_submission_counters')
      .select('*')
      .eq('user_id', userId)
      .eq('competition_id', competitionId)
      .single()

    if (counter) {
      await supabase
        .from('user_submission_counters')
        .update({
          paid_submissions: counter.paid_submissions + paidCount,
          free_submissions: counter.free_submissions + freeCount,
          total_submissions: counter.total_submissions + entries.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', counter.id)
    } else {
      await supabase
        .from('user_submission_counters')
        .insert({
          user_id: userId,
          competition_id: competitionId,
          paid_submissions: paidCount,
          free_submissions: freeCount,
          total_submissions: entries.length,
        })
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ BATCH SUBMISSION COMPLETE!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    return NextResponse.json({
      success: true,
      entriesSubmitted: entries.length,
      paidEntries: paidCount,
      freeEntries: freeCount,
      totalCharged: totalAmount,
      transactionId,
      paymentIntentId,
      entryIds: insertedEntries?.map(e => e.id) || [],
    })
  } catch (error) {
    console.error('❌ Error processing batch submission:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to process submission',
      },
      { status: 500 }
    )
  }
}

