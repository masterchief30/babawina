"use client"

/**
 * Play Competition Client Component
 * Cart-style: Add multiple bets, then submit all at once with Stripe
 */

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Trophy, Target, Minus, ShoppingCart, Gift, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PaymentMethodModal } from "../payment/payment-method-modal"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

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

export function PlayCompetitionClient({ competition, userId }: PlayCompetitionClientProps) {
  const { toast } = useToast()
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [showCoordinates, setShowCoordinates] = useState(false)
  const [gameEntries, setGameEntries] = useState<GameEntry[]>([])
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedEntriesCount, setSubmittedEntriesCount] = useState(0) // Count of already-submitted entries
  const [submissionStatus, setSubmissionStatus] = useState<{
    nextIsFree: boolean
    paidSubmissions: number
    freeSubmissions: number
    submissionsUntilFree: number
    hasPaymentMethod: boolean
  } | null>(null)

  // Log user authentication status on mount
  useEffect(() => {
    console.log('🎮 PlayCompetitionClient mounted')
    console.log('👤 User ID from props:', userId)
    console.log('🔐 User authenticated:', userId ? 'YES' : 'NO')
  }, [userId])

  // Load existing entries from database if user is logged in
  useEffect(() => {
    if (!userId) {
      console.log('⏭️ Skipping entry loading - no user ID')
      return
    }

    async function loadExistingEntries() {
      try {
        console.log('📥 Loading existing entries for user:', userId)
        const { data, error } = await supabase
          .from('competition_entries')
          .select('id, guess_x, guess_y, created_at')
          .eq('user_id', userId)
          .eq('competition_id', competition.id)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('❌ Error loading entries:', error)
          return
        }

        if (data && data.length > 0) {
          console.log(`✅ Loaded ${data.length} existing entries`)
          
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
          
          // Clear localStorage now that entries are loaded from database
          const { entryPreservation } = await import('@/lib/entry-preservation')
          entryPreservation.clearEntries()
          console.log('🧹 Cleared localStorage after loading entries from database')
          
          toast({
            title: "Welcome back! 🎯",
            description: `Your ${data.length} bet${data.length !== 1 ? 's' : ''} ${data.length !== 1 ? 'have' : 'has'} been loaded.`,
            duration: 5000,
          })
        } else {
          console.log('ℹ️ No existing entries found')
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

  // Calculate pricing with "Buy 2 Get 1 Free"
  const calculatePricing = () => {
    const startingTotalCount = submissionStatus?.totalSubmissions || 0
    let paidCount = 0
    let freeCount = 0
    
    // Only count entries that are NOT already submitted
    const pendingEntries = gameEntries.filter(entry => !entry.submitted)
    
    pendingEntries.forEach((_, index) => {
      // Calculate absolute position including already submitted entries
      const absolutePosition = startingTotalCount + submittedEntriesCount + index + 1
      
      // Every 3rd entry is free (3, 6, 9, 12...)
      const isFree = absolutePosition % 3 === 0
      
      if (isFree) {
        freeCount++
      } else {
        paidCount++
      }
    })

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
    console.log('🚀 SUBMIT ALL clicked')
    console.log('👤 User ID:', userId)
    console.log('📦 Entries count:', gameEntries.length)
    console.log('💰 Pricing:', pricing)
    console.log('📊 Submission status:', submissionStatus)

    // Check if user is authenticated
    if (!userId) {
      console.log('❌ No user ID - redirecting to signup')
      window.location.href = '/signup'
      return
    }

    console.log('✅ User is authenticated')

    // Check if there are entries
    if (gameEntries.length === 0) {
      console.log('❌ No entries to submit')
      toast({
        title: 'No entries',
        description: 'Please place at least one guess first',
        variant: 'destructive'
      })
      return
    }

    console.log('✅ Has entries to submit')

    // Check if user has payment method (if paid entries exist)
    if (pricing.paidCount > 0 && !submissionStatus?.hasPaymentMethod) {
      console.log('💳 User needs to add payment method')
      console.log('   Paid count:', pricing.paidCount)
      console.log('   Has payment method:', submissionStatus?.hasPaymentMethod)
      // Show payment modal to add card
      setShowPaymentModal(true)
      return
    }

    console.log('✅ User has payment method or all entries are free')
    console.log('📤 Proceeding to submit entries...')

    // Submit all entries
    await processSubmissions()
  }

  // Process all submissions (after payment method is confirmed)
  const processSubmissions = async () => {
    setIsSubmitting(true)

    try {
      // Submit each entry
      for (const entry of gameEntries) {
        const response = await fetch('/api/stripe/charge-saved-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            competitionId: competition.id,
            entryData: {
              x: entry.x / 100, // Convert back to 0-1 range
              y: entry.y / 100
            }
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Submission failed')
        }
      }

      // All submissions successful!
      toast({
        title: '🎉 All Entries Submitted!',
        description: `${gameEntries.length} entries submitted successfully!`,
        duration: 5000
      })

      // Clear entries
      setGameEntries([])

      // Refresh submission status
      if (userId) {
        const response = await fetch(
          `/api/user/submission-status?userId=${userId}&competitionId=${competition.id}`
        )
        if (response.ok) {
          const data = await response.json()
          setSubmissionStatus(data)
        }
      }
    } catch (error) {
      console.error('Error submitting entries:', error)
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'Failed to submit entries',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle payment method added
  const handlePaymentMethodAdded = async () => {
    setShowPaymentModal(false)
    
    toast({
      title: 'Payment method saved!',
      description: 'Submitting your entries...'
    })

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
                <p className="text-gray-600">
                  Click anywhere on the image to place your guess where the ball is hidden!
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  You can place multiple guesses - they'll be listed on the right.
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
                {/* Prize Display */}
                <div className="mb-4">
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
                    <h4 className="font-semibold text-gray-900 mb-2 text-xs uppercase tracking-wide">ENTRIES ({gameEntries.length})</h4>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {gameEntries.map((entry, index) => {
                        const startingTotalCount = submissionStatus?.totalSubmissions || 0
                        const absolutePosition = startingTotalCount + index + 1
                        const isFree = absolutePosition % 3 === 0
                        const isSubmitted = entry.submitted === true

                        return (
                          <div 
                            key={entry.id} 
                            className={`flex items-center justify-between text-xs px-2 py-1.5 rounded ${
                              isSubmitted 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              {isSubmitted && (
                                <Check className="w-3 h-3 text-green-600" />
                              )}
                              <span className={`font-medium ${isSubmitted ? 'text-green-700' : 'text-gray-600'}`}>
                                #{index + 1}
                              </span>
                              {isSubmitted && (
                                <span className="text-[9px] uppercase tracking-wide text-green-600 font-bold">
                                  Saved
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isFree && !isSubmitted ? (
                                <span className="text-green-600 font-bold flex items-center gap-0.5 text-xs">
                                  <Gift className="w-3 h-3" />
                                  FREE
                                </span>
                              ) : !isSubmitted ? (
                                <span className="text-gray-900 font-semibold text-xs">
                                  {formatPrice(competition.entry_price_rand)}
                                </span>
                              ) : null}
                              {!isSubmitted && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => removeEntry(entry.id)}
                                >
                                  <Minus className="w-3 h-3" />
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
    </div>
  )
}

