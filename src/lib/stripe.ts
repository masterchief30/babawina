/**
 * Server-side Stripe configuration
 * DO NOT import this file in client components!
 */

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

// Initialize Stripe with secret key (server-side only)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
  appInfo: {
    name: 'Babawina Competition Platform',
    version: '1.0.0',
  },
})

/**
 * Create or retrieve a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(params: {
  userId: string
  email: string
  name?: string
}): Promise<string> {
  const { userId, email, name } = params

  try {
    // Check if customer already exists
    const existingCustomers = await stripe.customers.list({
      email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0].id
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: {
        supabase_user_id: userId,
      },
    })

    return customer.id
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    throw new Error('Failed to create payment customer')
  }
}

/**
 * Create a Setup Intent for adding a payment method
 */
export async function createSetupIntent(customerId: string): Promise<string> {
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', // Allows charging without user present
    })

    return setupIntent.client_secret!
  } catch (error) {
    console.error('Error creating Setup Intent:', error)
    throw new Error('Failed to create payment setup')
  }
}

/**
 * Charge a saved payment method
 */
export async function chargePaymentMethod(params: {
  customerId: string
  paymentMethodId: string
  amountCents: number
  currency?: string
  description?: string
  metadata?: Record<string, string>
}): Promise<Stripe.PaymentIntent> {
  const {
    customerId,
    paymentMethodId,
    amountCents,
    currency = 'zar',
    description,
    metadata,
  } = params

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: currency.toLowerCase(),
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true, // Indicates charging without user present
      confirm: true, // Automatically confirm the payment
      description: description || 'Competition entry',
      metadata: metadata || {},
    })

    return paymentIntent
  } catch (error) {
    console.error('Error charging payment method:', error)
    
    // Check if it's a Stripe error
    if (error instanceof Stripe.errors.StripeError) {
      throw new Error(error.message)
    }
    
    throw new Error('Payment failed. Please try again.')
  }
}

/**
 * Retrieve payment method details
 */
export async function getPaymentMethod(
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    return paymentMethod
  } catch (error) {
    console.error('Error retrieving payment method:', error)
    throw new Error('Failed to retrieve payment method')
  }
}

/**
 * Detach (delete) a payment method
 */
export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<void> {
  try {
    await stripe.paymentMethods.detach(paymentMethodId)
  } catch (error) {
    console.error('Error detaching payment method:', error)
    throw new Error('Failed to remove payment method')
  }
}

/**
 * Convert amount in Rand to cents
 */
export function randToCents(amountRand: number): number {
  return Math.round(amountRand * 100)
}

/**
 * Convert amount in cents to Rand
 */
export function centsToRand(amountCents: number): number {
  return amountCents / 100
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amountCents: number,
  currency: string = 'ZAR'
): string {
  const amount = centsToRand(amountCents)
  
  if (currency.toUpperCase() === 'ZAR') {
    return `R${amount.toFixed(2)}`
  }
  
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

