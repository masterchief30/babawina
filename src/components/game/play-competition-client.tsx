"use client"

/**
 * Play Competition Client Component
 * Cart-style: Add multiple bets, then submit all at once with Stripe
 */

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Trophy, Target, ShoppingCart, Gift, Check, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PaymentMethodModal } from "../payment/payment-method-modal"
import { PaymentSuccessModal, PaymentProcessingModal } from "../payment/payment-success-modal"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { useAnalytics } from "@/hooks/useAnalytics"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Competition {
  id: string
  title: string
  prize_short: string
  prize_value_rand: number
  entry_price_rand: number
  image_inpainted_path: string | null
  display_photo_path: string | null
  display_photo_alt: string | null
  status: 'live' | 'draft' | 'closed' | 'judged'
  starts_at: string
  ends_at: string
}

interface GameEntry {
  id: string
  x: number
  y: number
  timestamp: number
  submitted?: boolean // True if already saved to database
}

interface PlayCompetitionClientProps {
  competition: Competition
  userId: string | null
}

export function PlayCompetitionClient({ competition, userId: serverUserId }: PlayCompetitionClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth() // Get user from AuthContext (client-side)
  const { trackEvent } = useAnalytics()
  
  // Use AuthContext user if available, otherwise fall back to server prop
  const userId = user?.id || serverUserId
  
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [showCoordinates, setShowCoordinates] = useState(false)
  const [gameEntries, setGameEntries] = useState<GameEntry[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successData, setSuccessData] = useState({ amountCharged: 0, entryCount: 0 })
  const [submittedEntriesCount, setSubmittedEntriesCount] = useState(0) // Count of already-submitted entries
  const [submissionStatus, setSubmissionStatus] = useState<{
    nextIsFree: boolean
    paidSubmissions: number
    freeSubmissions: number
    submissionsUntilFree: number
    hasPaymentMethod: boolean
  } | null>(null)

  // Log user authentication status on mount & track competition view
  useEffect(() => {
    console.log('🎮 PlayCompetitionClient mounted')
    console.log('👤 User ID from props:', userId)
    console.log('🔐 User authenticated:', userId ? 'YES' : 'NO')
    
    // Track competition view with detailed metadata
    trackEvent('competition_viewed', {
      competition_id: competition.id,
      competition_title: competition.title,
      competition_ends: competition.ends_at,
      page_title: `${competition.title} (Ends: ${new Date(competition.ends_at).toLocaleDateString('en-ZA')})`,
    })
  }, [userId, competition.id, competition.title, trackEvent])

  // Load existing entries from database if user is logged in
  useEffect(() => {
    if (!userId) {
      console.log('⏭️ Skipping entry loading - no user ID')
      return
    }

    async function loadExistingEntries() {
      try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📥 LOADING EXISTING BETS FROM DATABASE')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('👤 User ID:', userId)
        console.log('🎯 Competition ID:', competition.id)
        
        const { data, error } = await supabase
          .from('competition_entries')
          .select('id, guess_x, guess_y, created_at')
          .eq('user_id', userId)
          .eq('competition_id', competition.id)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('❌ DATABASE ERROR:', error)
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          return
        }

        if (data && data.length > 0) {
          console.log('✅ FOUND', data.length, 'EXISTING BETS IN DATABASE!')
          console.log('📋 Bet data:', data)
          
          // Convert database entries to game entries
          const existingEntries: GameEntry[] = data.map((entry) => ({
            id: entry.id,
            x: entry.guess_x,
            y: entry.guess_y,
            timestamp: new Date(entry.created_at).getTime(),
            submitted: true // Mark as already submitted
          }))

          setGameEntries(existingEntries)
          setSubmittedEntriesCount(existingEntries.length)
          console.log('💾 Loaded into game state:', existingEntries.length, 'bets')
          
          // Clear localStorage now that entries are loaded from database
          const { entryPreservation } = await import('@/lib/entry-preservation')
          entryPreservation.clearEntries()
          console.log('🧹 Cleared localStorage (bets now in DB)')
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        } else {
          console.log('ℹ️ No existing bets found in database')
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        }
      } catch (error) {
        console.error('❌ Error loading existing entries:', error)
      }
    }

    loadExistingEntries()
  }, [userId, competition.id, toast])

  // Fetch submission status if user is logged in
  useEffect(() => {
    if (!userId) {
      console.log('⏭️ Skipping submission status fetch - no user ID')
      return
    }

    async function fetchStatus() {
      try {
        console.log('📊 Fetching submission status for user:', userId)
        const response = await fetch(
          `/api/user/submission-status?userId=${userId}&competitionId=${competition.id}`
        )
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Submission status received:', data)
          setSubmissionStatus(data)
        } else {
          console.error('❌ Failed to fetch submission status:', response.status)
        }
      } catch (error) {
        console.error('❌ Error fetching submission status:', error)
      }
    }

    fetchStatus()
  }, [userId, competition.id])

  // Handle mouse movement
  const handleMouseMove = (event: React.MouseEvent<HTMLImageElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    setCursorPosition({ x, y })
  }

  // Handle image click to ADD entry to cart
  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height

    const newEntry: GameEntry = {
      id: `entry-${Date.now()}-${Math.random()}`,
      x: x * 100, // Convert to percentage for display
      y: y * 100,
      timestamp: Date.now()
    }

    setGameEntries(prev => [...prev, newEntry])
  }

  // Remove entry from cart
  const removeEntry = (entryId: string) => {
    setGameEntries(prev => prev.filter(entry => entry.id !== entryId))
  }

  // Calculate pricing - Simple R15 per entry
  const calculatePricing = () => {
    // Simple pricing: All entries are paid
    const pendingEntries = gameEntries.filter(entry => !entry.submitted)
    const paidCount = pendingEntries.length
    const freeCount = 0

    return {
      paidCount,
      freeCount,
      totalCost: paidCount * competition.entry_price_rand,
      pendingCount: pendingEntries.length
    }
  }

  const pricing = calculatePricing()

  // Handle submit all entries
  const handleSubmitAll = async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🚀 SUBMIT ALL CLICKED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👤 User ID:', userId || 'NOT LOGGED IN')
    console.log('📦 Total entries:', gameEntries.length)
    console.log('💰 Competition price:', competition.entry_price_rand, 'RAND')
    console.log('📊 Pricing breakdown:', {
      paidCount: pricing.paidCount,
      freeCount: pricing.freeCount,
      pendingCount: pricing.pendingCount,
      totalCost: pricing.totalCost
    })
    console.log('💳 Submission status:', {
      hasPaymentMethod: submissionStatus?.hasPaymentMethod,
      paidSubmissions: submissionStatus?.paidSubmissions,
      freeSubmissions: submissionStatus?.freeSubmissions
    })

    // Check if user is authenticated
    if (!userId) {
      console.log('❌ NO USER ID - REDIRECTING TO SIGNUP')
      window.location.href = '/signup'
      return
    }

    console.log('✅ User is authenticated')

    // Check if there are pending entries
    if (pricing.pendingCount === 0) {
      console.log('❌ No pending entries to submit')
      toast({
        title: 'No pending entries',
        description: 'All your bets have been submitted already',
      })
      return
    }

    console.log('✅ Has', pricing.pendingCount, 'pending entries to submit')

    // Check if competition requires payment
    const requiresPayment = competition.entry_price_rand > 0
    console.log('💵 Competition requires payment:', requiresPayment)

    // Check if user needs to add payment method
    if (requiresPayment && !submissionStatus?.hasPaymentMethod) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('💳 OPENING PAYMENT MODAL')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('   Reason: Competition costs', competition.entry_price_rand, 'RAND')
      console.log('   User has payment method:', false)
      // Show payment modal to add card
      setShowPaymentModal(true)
      return
    }

    console.log('✅ Payment method OK or competition is free')
    console.log('💬 SHOWING CONFIRMATION MODAL...')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Show confirmation modal before charging
    setShowConfirmationModal(true)
  }

  // Process all submissions (after payment method is confirmed)
  const processSubmissions = async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('💳 PROCESSING BATCH SUBMISSION')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    setShowConfirmationModal(false) // Close confirmation modal
    setIsSubmitting(true)
    setIsProcessing(true) // Show processing modal

    try {
      // Get only pending entries (not already submitted)
      const pendingEntries = gameEntries.filter(entry => !entry.submitted)
      console.log('📦 Pending entries to submit:', pendingEntries.length)
      console.log('👤 User ID:', userId)
      console.log('🎯 Competition ID:', competition.id)

      if (pendingEntries.length === 0) {
        console.log('❌ No pending entries')
        return
      }

      // Convert entries to API format
      const entriesForApi = pendingEntries.map(entry => ({
        x: entry.x / 100, // Convert back to 0-1 range
        y: entry.y / 100
      }))

      console.log('📤 Sending batch of', entriesForApi.length, 'entries to API...')
      
      // Submit ALL entries in ONE batch
      const response = await fetch('/api/stripe/submit-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          competitionId: competition.id,
          entries: entriesForApi
        })
      })

      console.log('📡 Response status:', response.status, response.statusText)

      if (!response.ok) {
        // Try to get error details
        let errorMessage = 'Submission failed'
        try {
          const error = await response.json()
          console.error('❌ API Error:', error)
          errorMessage = error.error || error.message || 'Submission failed'
        } catch (parseError) {
          // Response body might not be JSON
          const errorText = await response.text()
          console.error('❌ Response text:', errorText)
          errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('✅ Batch submission successful!')
      console.log('   Entries submitted:', result.entriesSubmitted)
      console.log('   Paid entries:', result.paidEntries)
      console.log('   Free entries:', result.freeEntries)
      console.log('   Total charged: R', result.totalCharged)
      console.log('   Transaction ID:', result.transactionId)

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`✅ ALL ${result.entriesSubmitted} ENTRIES SUBMITTED!`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      // Stop processing, show success animation!
      setIsProcessing(false)
      
      // Set success data for the modal
      setSuccessData({
        amountCharged: result.totalCharged || 0,
        entryCount: result.entriesSubmitted || 0
      })
      
      // Track bet placement
      trackEvent('bet_placed', {
        competition_id: competition.id,
        entry_count: result.entriesSubmitted,
        amount_charged: result.totalCharged,
      })
      
      // Show the success modal with confetti & lion animation
      setShowSuccessModal(true)

      // Clear only pending entries (keep submitted ones visible)
      setGameEntries(gameEntries.filter(entry => entry.submitted))
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ SUBMISSION FAILED')
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('Error:', error)
      setIsProcessing(false) // Stop processing modal
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to submit entries',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
      console.log('🏁 processSubmissions complete')
    }
  }

  // Handle payment method added
  const handlePaymentMethodAdded = async () => {
    setShowPaymentModal(false)
    
    // Payment method saved - no need to show notification
    // User will see the payment processing modal next

    // Update status to show payment method exists
    if (submissionStatus) {
      setSubmissionStatus({ ...submissionStatus, hasPaymentMethod: true })
    }

    // Process submissions
    await processSubmissions()
  }

  // Get game image URL
  const getGameImageUrl = () => {
    if (competition.image_inpainted_path) {
      return competition.image_inpainted_path
    }
    return '/placeholder-competition.svg'
  }

  // Get product image URL
  const getProductImageUrl = () => {
    if (competition.display_photo_path) {
      if (competition.display_photo_path.startsWith('http')) {
        return competition.display_photo_path
      }
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-display/${competition.display_photo_path}`
    }
    return '/placeholder-competition.svg'
  }

  // Format price
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `R${(price / 1000).toFixed(0)}k`
    }
    return `R${price}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Competitions</span>
            </Link>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span className="font-bold text-gray-900">{competition.title}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Game Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b">
                <p className="text-gray-900 font-bold">
                  Click anywhere on the image to place your guess where the ball is hidden!
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  You can place multiple guesses.
                </p>
              </div>

              {/* Game Image */}
              <div className="relative bg-gray-100">
                <div
                  className="relative select-none flex items-center justify-center"
                  style={{
                    aspectRatio: '16/9',
                    cursor: 'crosshair'
                  }}
                >
                  <img
                    src={getGameImageUrl()}
                    alt={`${competition.title} game field`}
                    className="max-w-full max-h-full object-contain cursor-crosshair"
                    onClick={handleImageClick}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setShowCoordinates(true)}
                    onMouseLeave={() => setShowCoordinates(false)}
                    draggable={false}
                  />

                  {/* Show all crosshairs */}
                  {gameEntries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${entry.x}%`,
                        top: `${entry.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className="relative">
                        {/* Horizontal line */}
                        <div className="absolute w-8 shadow-lg" style={{ left: '-16px', top: '0px', height: '0.5px', backgroundColor: '#ef4444' }} />
                        {/* Vertical line */}
                        <div className="absolute h-8 shadow-lg" style={{ left: '0px', top: '-16px', width: '0.5px', backgroundColor: '#ef4444' }} />
                      </div>
                    </motion.div>
                  ))}

                  {/* Coordinates display */}
                  {showCoordinates && (
                    <div className="absolute top-4 left-4 bg-black/80 text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none z-20">
                      <div className="font-mono">X: {cursorPosition.x.toFixed(1)}%</div>
                      <div className="font-mono">Y: {cursorPosition.y.toFixed(1)}%</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  YOUR BETS
                </h2>
              </div>

              <div className="p-4">
                {/* Prize Display - Hidden on mobile */}
                <div className="mb-4 hidden lg:block">
                  <div className="mb-2">
                    <img
                      src={getProductImageUrl()}
                      alt={competition.title}
                      className="w-full h-32 object-cover rounded-lg shadow-lg"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-center text-sm">
                    {competition.prize_short}
                  </h3>
                </div>

                {/* Entries List */}
                {gameEntries.length > 0 ? (
                  <div className="border-t pt-3 mb-3">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">ENTRIES ({gameEntries.length})</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {gameEntries.map((entry, index) => {
                        // Simple pricing - all entries are paid
                        const isSubmitted = entry.submitted === true

                        return (
                          <div 
                            key={entry.id} 
                            className={`flex items-center justify-between px-3 py-3 rounded-lg ${
                              isSubmitted 
                                ? 'bg-green-50 border-2 border-green-200' 
                                : 'bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isSubmitted && (
                                <Check className="w-4 h-4 text-green-600" />
                              )}
                              <span className={`font-bold text-sm ${isSubmitted ? 'text-green-700' : 'text-gray-700'}`}>
                                #{index + 1}
                              </span>
                              {isSubmitted && (
                                <span className="text-[10px] uppercase tracking-wide text-green-600 font-bold">
                                  Saved
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {!isSubmitted && (
                                <span className="text-gray-900 font-bold text-sm">
                                  {formatPrice(competition.entry_price_rand)}
                                </span>
                              )}
                              {!isSubmitted && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-7 px-2 text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors"
                                  onClick={() => removeEntry(entry.id)}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="border-t pt-3 mb-3 text-center text-gray-500 text-xs">
                    Click on the image to add entries
                  </div>
                )}

                {/* Pricing Summary */}
                {gameEntries.length > 0 && (
                  <div className="border-t pt-3 mb-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid entries:</span>
                      <span className="font-medium">{pricing.paidCount} × {formatPrice(competition.entry_price_rand)}</span>
                    </div>
                    {pricing.freeCount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          Free entries:
                        </span>
                        <span className="font-bold">{pricing.freeCount}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                      <span>Total:</span>
                      <span className="text-blue-600">{formatPrice(pricing.totalCost)}</span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  onClick={handleSubmitAll}
                  disabled={pricing.pendingCount === 0 || isSubmitting}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3"
                >
                  {(() => {
                    const buttonText = isSubmitting 
                      ? 'Submitting...' 
                      : !userId 
                        ? 'Sign Up to Submit' 
                        : pricing.pendingCount === 0
                          ? 'All Saved ✓'
                          : `SUBMIT ${pricing.pendingCount} ${pricing.pendingCount === 1 ? 'BET' : 'BETS'} →`
                    
                    console.log('🔘 Button text:', buttonText, '| User ID:', userId ? 'EXISTS' : 'NULL')
                    
                    if (isSubmitting) {
                      return 'Submitting...'
                    } else if (!userId) {
                      return 'Sign Up to Submit'
                    } else if (pricing.pendingCount === 0) {
                      return (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          All Saved
                        </>
                      )
                    } else {
                      return (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          SUBMIT {pricing.pendingCount} {pricing.pendingCount === 1 ? 'BET' : 'BETS'} →
                        </>
                      )
                    }
                  })()}
                </Button>

                {pricing.pendingCount > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setGameEntries(prev => prev.filter(entry => entry.submitted))}
                    className="w-full mt-2 text-red-500 border-red-500 hover:bg-red-50"
                  >
                    Clear Pending
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && userId && (
        <PaymentMethodModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentMethodAdded}
          userId={userId}
          entryPrice={competition.entry_price_rand}
        />
      )}

      {/* Payment Confirmation Modal */}
      <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-600" />
              Ready to Pay?
            </DialogTitle>
            <DialogDescription className="text-base pt-4">
              You&apos;re about to submit <strong>{pricing.pendingCount} {pricing.pendingCount === 1 ? 'bet' : 'bets'}</strong> for this competition.
            </DialogDescription>
          </DialogHeader>

          {/* Pricing Breakdown */}
          <div className="space-y-3 py-4">
            {pricing.paidCount > 0 && (
              <div className="flex justify-between items-center text-gray-700">
                <span>Paid entries:</span>
                <span className="font-semibold">{pricing.paidCount} × R{competition.entry_price_rand}</span>
              </div>
            )}
            
            {pricing.freeCount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="flex items-center gap-1">
                  <Gift className="w-4 h-4" />
                  Free entries:
                </span>
                <span className="font-semibold">{pricing.freeCount} × FREE</span>
              </div>
            )}
            
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total:</span>
                <span className="text-blue-600">R{pricing.totalCost}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              onClick={() => processSubmissions()}
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
            >
              {isSubmitting ? (
                'Processing...'
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Yes, Continue with Payment
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowConfirmationModal(false)}
              disabled={isSubmitting}
              className="w-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Processing Modal (Loading Spinner) */}
      <PaymentProcessingModal isOpen={isProcessing} />

      {/* Payment Success Modal (Confetti + Lion Animation) */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        amountCharged={successData.amountCharged}
        entryCount={successData.entryCount}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  )
}

