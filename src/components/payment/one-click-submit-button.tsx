"use client"

/**
 * One-Click Submit Button
 * Handles the entire submission flow:
 * - Check if payment method exists
 * - Check if submission is free
 * - Charge card or submit free entry
 * - Show payment modal if needed
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { PaymentMethodModal } from './payment-method-modal'
import { Loader2, Sparkles } from 'lucide-react'

interface OneClickSubmitButtonProps {
  userId: string | null
  competitionId: string
  competitionTitle: string
  entryPrice: number
  entryData: {
    x: number
    y: number
  } | null
  onSuccess: () => void
  disabled?: boolean
}

export function OneClickSubmitButton({
  userId,
  competitionId,
  competitionTitle,
  entryPrice,
  entryData,
  onSuccess,
  disabled = false,
}: OneClickSubmitButtonProps) {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<{
    nextIsFree: boolean
    hasPaymentMethod: boolean
  } | null>(null)

  // Handle the submission process
  const handleSubmit = async () => {
    // Check if user is authenticated
    if (!userId) {
      // Redirect to signup
      window.location.href = '/signup'
      return
    }

    // Check if entry data exists
    if (!entryData) {
      toast({
        title: 'No position selected',
        description: 'Please place your crosshair on the image first',
        variant: 'destructive',
      })
      return
    }

    setIsProcessing(true)

    try {
      // Get submission status
      const statusResponse = await fetch(
        `/api/user/submission-status?userId=${userId}&competitionId=${competitionId}`
      )

      if (!statusResponse.ok) {
        throw new Error('Failed to check submission status')
      }

      const status = await statusResponse.json()
      setSubmissionStatus(status)

      // Check if this is a free submission
      if (status.nextSubmissionFree) {
        // FREE SUBMISSION - submit immediately
        await submitEntry(true)
        return
      }

      // PAID SUBMISSION - check if payment method exists
      if (!status.hasPaymentMethod) {
        // Need to add payment method first
        setShowPaymentModal(true)
        setIsProcessing(false)
        return
      }

      // Has payment method - charge and submit
      await submitEntry(false)
    } catch (error) {
      console.error('Error submitting:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to submit entry',
        variant: 'destructive',
      })
      setIsProcessing(false)
    }
  }

  // Submit the entry (with or without payment)
  const submitEntry = async (isFree: boolean) => {
    try {
      const response = await fetch('/api/stripe/charge-saved-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          competitionId,
          entryData,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Submission failed')
      }

      const result = await response.json()

      // Show success message
      if (result.wasFree) {
        toast({
          title: '🎉 FREE Entry Submitted!',
          description: `You've used your free entry! Next ${result.submissionsUntilFree} will be paid.`,
          duration: 5000,
        })
      } else {
        const nextFreeMessage = result.nextSubmissionFree
          ? 'Your next entry is FREE! 🎁'
          : `${result.submissionsUntilFree} more until FREE entry`

        toast({
          title: '✅ Entry Submitted!',
          description: `Charged R${entryPrice.toFixed(2)} • ${nextFreeMessage}`,
          duration: 5000,
        })
      }

      // Call success callback
      onSuccess()
    } catch (error) {
      console.error('Error submitting entry:', error)
      toast({
        title: 'Submission Failed',
        description:
          error instanceof Error ? error.message : 'Failed to submit entry',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle payment method added successfully
  const handlePaymentMethodAdded = async () => {
    setShowPaymentModal(false)
    
    // Now submit the entry
    toast({
      title: 'Payment method saved!',
      description: 'Submitting your entry...',
    })

    // Wait a moment for the user to see the success message
    setTimeout(async () => {
      setIsProcessing(true)
      try {
        await submitEntry(false)
      } catch (error) {
        // Error already handled in submitEntry
      }
    }, 500)
  }

  // Determine button text and appearance
  const getButtonContent = () => {
    if (isProcessing) {
      return (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Processing...
        </>
      )
    }

    if (!userId) {
      return 'Sign Up to Submit'
    }

    if (submissionStatus?.nextSubmissionFree) {
      return (
        <>
          <Sparkles className="w-5 h-5 mr-2" />
          Submit FREE Entry! 🎁
        </>
      )
    }

    return `Submit Entry - R${entryPrice.toFixed(2)}`
  }

  const getButtonClassName = () => {
    if (submissionStatus?.nextSubmissionFree) {
      return 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg py-6'
    }

    return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg py-6'
  }

  return (
    <>
      <Button
        onClick={handleSubmit}
        disabled={disabled || isProcessing || !entryData}
        className={`w-full ${getButtonClassName()}`}
        size="lg"
      >
        {getButtonContent()}
      </Button>

      {/* Payment Method Modal */}
      {showPaymentModal && userId && (
        <PaymentMethodModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setIsProcessing(false)
          }}
          onSuccess={handlePaymentMethodAdded}
          userId={userId}
          entryPrice={entryPrice}
        />
      )}
    </>
  )
}

