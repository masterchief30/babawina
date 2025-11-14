/**
 * API Route: Save Payment Method
 * Saves a payment method after successful Setup Intent confirmation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe, getPaymentMethod } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { userId, setupIntentId } = body

    if (!userId || !setupIntentId) {
      return NextResponse.json(
        { error: 'User ID and Setup Intent ID are required' },
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

    // Retrieve the Setup Intent from Stripe
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)

    if (setupIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Setup Intent has not succeeded yet' },
        { status: 400 }
      )
    }

    const paymentMethodId = setupIntent.payment_method as string

    if (!paymentMethodId) {
      return NextResponse.json(
        { error: 'No payment method found in Setup Intent' },
        { status: 400 }
      )
    }

    // Get payment method details from Stripe
    const paymentMethod = await getPaymentMethod(paymentMethodId)

    if (!paymentMethod.card) {
      return NextResponse.json(
        { error: 'Payment method is not a card' },
        { status: 400 }
      )
    }

    const customerId = setupIntent.customer as string

    // Check if this payment method already exists
    const { data: existingMethods } = await supabase
      .from('user_payment_methods')
      .select('id')
      .eq('user_id', userId)
      .eq('stripe_payment_method_id', paymentMethodId)

    if (existingMethods && existingMethods.length > 0) {
      console.log('Payment method already exists, returning existing')
      return NextResponse.json({
        success: true,
        paymentMethodId: existingMethods[0].id,
      })
    }

    // Check if user already has 3 payment methods (maximum allowed)
    const { count: methodCount } = await supabase
      .from('user_payment_methods')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (methodCount !== null && methodCount >= 3) {
      return NextResponse.json(
        { error: 'Maximum 3 payment methods allowed. Please delete one before adding another.' },
        { status: 400 }
      )
    }

    // Set all other payment methods for this user to non-default
    await supabase
      .from('user_payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId)

    // Save payment method to database
    const { data: savedMethod, error: saveError } = await supabase
      .from('user_payment_methods')
      .insert({
        user_id: userId,
        stripe_payment_method_id: paymentMethodId,
        stripe_customer_id: customerId,
        card_brand: paymentMethod.card.brand,
        card_last4: paymentMethod.card.last4,
        card_exp_month: paymentMethod.card.exp_month,
        card_exp_year: paymentMethod.card.exp_year,
        is_default: true,
      })
      .select('id')
      .single()

    if (saveError) {
      console.error('Error saving payment method:', saveError)
      return NextResponse.json(
        { error: 'Failed to save payment method' },
        { status: 500 }
      )
    }

    console.log('✅ Payment method saved successfully for user:', userId)

    return NextResponse.json({
      success: true,
      paymentMethodId: savedMethod.id,
      cardBrand: paymentMethod.card.brand,
      cardLast4: paymentMethod.card.last4,
    })
  } catch (error) {
    console.error('❌ Error saving payment method:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to save payment method',
      },
      { status: 500 }
    )
  }
}

