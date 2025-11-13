/**
 * API Route: Create Setup Intent
 * Creates a Stripe Setup Intent for adding a payment method
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe, getOrCreateStripeCustomer, createSetupIntent } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, display_name, stripe_customer_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get or create Stripe customer
    let stripeCustomerId = profile.stripe_customer_id

    if (!stripeCustomerId) {
      console.log('Creating new Stripe customer for user:', userId)
      stripeCustomerId = await getOrCreateStripeCustomer({
        userId,
        email: profile.email,
        name: profile.display_name || undefined,
      })

      // Save customer ID to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId)

      if (updateError) {
        console.error('Error saving Stripe customer ID:', updateError)
        // Don't fail the request, customer is still created in Stripe
      }
    }

    // Create Setup Intent
    const clientSecret = await createSetupIntent(stripeCustomerId)

    console.log('✅ Setup Intent created for user:', userId)

    return NextResponse.json({
      clientSecret,
      customerId: stripeCustomerId,
    })
  } catch (error) {
    console.error('❌ Error creating Setup Intent:', error)
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create payment setup',
      },
      { status: 500 }
    )
  }
}

