/**
 * Client-side Stripe configuration
 * Safe to import in client components
 */

import { loadStripe, Stripe } from '@stripe/stripe-js'

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error(
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables'
  )
}

// Singleton Stripe instance
let stripePromise: Promise<Stripe | null>

/**
 * Get Stripe.js instance (client-side only)
 * This is a singleton that loads Stripe.js once and caches it
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    )
  }
  return stripePromise
}

/**
 * Format card brand for display
 */
export function formatCardBrand(brand: string): string {
  const brandMap: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
  }

  return brandMap[brand.toLowerCase()] || brand.charAt(0).toUpperCase() + brand.slice(1)
}

/**
 * Format card expiry for display
 */
export function formatCardExpiry(month: number, year: number): string {
  const paddedMonth = month.toString().padStart(2, '0')
  return `${paddedMonth}/${year}`
}

/**
 * Check if card is expired
 */
export function isCardExpired(month: number, year: number): boolean {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1 // JavaScript months are 0-indexed

  if (year < currentYear) {
    return true
  }

  if (year === currentYear && month < currentMonth) {
    return true
  }

  return false
}

/**
 * Get card brand icon/emoji
 */
export function getCardBrandIcon(brand: string): string {
  const iconMap: Record<string, string> = {
    visa: '💳',
    mastercard: '💳',
    amex: '💳',
    discover: '💳',
    diners: '💳',
    jcb: '💳',
    unionpay: '💳',
  }

  return iconMap[brand.toLowerCase()] || '💳'
}

/**
 * Format currency for display (client-side)
 */
export function formatCurrency(
  amountCents: number,
  currency: string = 'ZAR'
): string {
  const amount = amountCents / 100

  if (currency.toUpperCase() === 'ZAR') {
    return `R${amount.toFixed(2)}`
  }

  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount)
}

/**
 * Validate card element is complete
 */
export function isCardElementComplete(element: any): boolean {
  return element && element.complete && !element.error
}

