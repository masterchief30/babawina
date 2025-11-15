"use client"

/**
 * Payment Method Modal
 * Embedded Stripe payment form for adding a card
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { CardElement, Elements, useStripe, useElements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe-client'
import { Loader2, CreditCard, Lock } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'

interface PaymentMethodModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
  entryPrice?: number  // Optional - only needed when adding payment from competition page
}

function PaymentForm({
  onClose,
  onSuccess,
  userId,
  entryPrice,
}: Omit<PaymentMethodModalProps, 'isOpen'>) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const { trackEvent } = useAnalytics()
  const [isProcessing, setIsProcessing] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Create Setup Intent on mount
  useEffect(() => {
    async function createSetupIntent() {
      try {
        setIsLoading(true)
        
        const response = await fetch('/api/stripe/create-setup-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create payment setup')
        }

        const data = await response.json()
        setClientSecret(data.clientSecret)
      } catch (error) {
        console.error('Error creating setup intent:', error)
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to initialize payment',
          variant: 'destructive',
        })
        onClose()
      } finally {
        setIsLoading(false)
      }
    }

    createSetupIntent()
  }, [userId, onClose, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setIsProcessing(true)

    try {
      const cardElement = elements.getElement(CardElement)

      if (!cardElement) {
        throw new Error('Card element not found')
      }

      // Confirm the Setup Intent
      const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (error) {
        throw new Error(error.message || 'Payment setup failed')
      }

      if (setupIntent.status !== 'succeeded') {
        throw new Error('Payment setup was not successful')
      }

      // Save payment method to database
      const saveResponse = await fetch('/api/stripe/save-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          setupIntentId: setupIntent.id,
        }),
      })

      if (!saveResponse.ok) {
        const error = await saveResponse.json()
        throw new Error(error.error || 'Failed to save payment method')
      }

      const saveData = await saveResponse.json()

      // Track payment method added
      trackEvent('payment_added', {
        user_id: userId,
      })

      // Silently close modal - no success notification needed
      onSuccess()
    } catch (error) {
      console.error('Error setting up payment:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add payment method',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600">Setting up secure payment...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <CreditCard className="inline w-4 h-4 mr-1" />
          Card Details
        </label>
        <div className="border rounded-lg p-4 bg-gray-50">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                },
                invalid: {
                  color: '#9e2146',
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>

      {/* Simple Pricing Info - Only show when there's a competition context */}
      {entryPrice !== undefined && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                💳
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Simple Pricing</h4>
              <p className="text-sm text-gray-600">
                Entry price: <span className="font-semibold text-gray-900">R{entryPrice.toFixed(2)}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Pay once, use for all your entries. Fast and easy! 🎯
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Notice */}
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <Lock className="w-3 h-3" />
        <span>Secured by Stripe • Your card details are encrypted</span>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>Continue</>
          )}
        </Button>
      </div>
    </form>
  )
}

export function PaymentMethodModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
  entryPrice,
}: PaymentMethodModalProps) {
  const stripePromise = getStripe()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Add Payment Method</DialogTitle>
          <DialogDescription className="text-gray-600">
            Add a card for instant competition entries
          </DialogDescription>
        </DialogHeader>

        <Elements stripe={stripePromise}>
          <PaymentForm
            onClose={onClose}
            onSuccess={onSuccess}
            userId={userId}
            entryPrice={entryPrice}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  )
}

