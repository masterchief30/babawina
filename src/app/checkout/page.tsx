"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowLeft, ShoppingCart, Trophy, CreditCard, CheckCircle, Info, PartyPopper, Target } from "lucide-react"
import Link from "next/link"
import { entryPreservation, saveTempEntriesToDB, saveBetsWithToken } from "@/lib/entry-preservation"

interface CheckoutEntry {
  competitionId: string
  competitionTitle: string
  prizeShort: string
  entryPrice: number
  quantity: number
  imageUrl: string
  entries: GameEntry[]
}

interface GameEntry {
  id: string
  x: number
  y: number
  timestamp: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [entries, setEntries] = useState<CheckoutEntry[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Don't auto-redirect to signup - let user see checkout page and click button
  // This effect is removed to allow unauthenticated users to see the checkout page

  // Handle browser back button - redirect to landing page
  useEffect(() => {
    const handlePopState = () => {
      // When user clicks browser back button, go to landing page
      window.location.href = '/'
    }
    
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Load checkout data from localStorage or preserved entries
  useEffect(() => {
    try {
      // Try to load from preserved entries first (more robust)
      const preserved = entryPreservation.loadEntries()
      if (preserved) {
        const entry: CheckoutEntry = {
          competitionId: preserved.competitionId,
          competitionTitle: preserved.competitionTitle,
          prizeShort: preserved.prizeShort,
          entryPrice: preserved.entryPrice,
          quantity: preserved.entries.length,
          imageUrl: preserved.imageUrl,
          entries: preserved.entries
        }
        setEntries([entry])
        console.log('✅ Loaded entries from preservation system')
        return
      }

      // Fallback to original checkout data format
      const checkoutDataStr = localStorage.getItem('checkoutData')
      if (checkoutDataStr) {
        const checkoutData = JSON.parse(checkoutDataStr)
        const entry: CheckoutEntry = {
          competitionId: checkoutData.competitionId,
          competitionTitle: checkoutData.competitionTitle,
          prizeShort: checkoutData.prizeShort,
          entryPrice: checkoutData.entryPrice,
          quantity: checkoutData.entries.length,
          imageUrl: checkoutData.imageUrl,
          entries: checkoutData.entries
        }
        setEntries([entry])
        console.log('✅ Loaded entries from checkout data')
      } else {
        // No checkout data, redirect back to competitions
        console.log('ℹ️ No entries found, redirecting to home')
        router.push('/')
      }
    } catch (error) {
      console.error('Error loading checkout data:', error)
      router.push('/')
    }
  }, [router])

  // Calculate totals
  const subtotal = entries.reduce((sum, entry) => sum + (entry.entryPrice * entry.quantity), 0)
  const total = subtotal // No additional fees for beta

  // Format price in Rand
  const formatPrice = (priceInCents: number) => {
    const rand = priceInCents / 100
    return `R${rand.toFixed(2)}`
  }

  // Handle checkout process
  const handleCheckout = async () => {
    // If user is not authenticated, save bets and redirect to signup
    if (!user) {
      // Save bets to localStorage when "PLAY FOR FREE" is clicked
      if (entries.length > 0) {
        const entry = entries[0]
        
        // Try to save with token, but fallback to localStorage if it fails
        try {
          const submissionToken = await saveBetsWithToken({
            competitionId: entry.competitionId,
            competitionTitle: entry.competitionTitle,
            prizeShort: entry.prizeShort,
            entryPrice: entry.entryPrice,
            entries: entry.entries,
            imageUrl: entry.imageUrl
          })
          
          if (submissionToken) {
            localStorage.setItem('submissionToken', submissionToken)
            console.log('✅ Bets saved to database with token:', submissionToken)
          } else {
            console.log('⚠️ Token save failed, using localStorage fallback')
          }
        } catch (error) {
          console.log('⚠️ Database not ready, using localStorage fallback:', error)
        }
      }
      
      console.log('🔄 Redirecting to signup after saving bets')
      router.push('/signup')
      return
    }
    
    if (entries.length === 0) return
    
    setIsProcessing(true)
    
    try {
      // Save all entries to the database
      const entry = entries[0] // We only have one competition per checkout
      const entriesToSave = entry.entries.map((gameEntry, index) => ({
        competition_id: entry.competitionId,
        user_id: user.id,
        guess_x: gameEntry.x,
        guess_y: gameEntry.y,
        entry_price_paid: entry.entryPrice,
        entry_number: index + 1
      }))

      console.log('Saving entries to database:', entriesToSave)

      const { data, error } = await supabase
        .from('competition_entries')
        .insert(entriesToSave)

      if (error) {
        console.error('Error saving entries:', error)
        console.error('Error details:', error.message, error.details, error.hint)
        alert(`Error saving your entries: ${error.message}. Please try again.`)
        setIsProcessing(false)
        return
      }

      console.log('Entries saved successfully:', data)

      // Clear all preserved entries
      entryPreservation.clearEntries()
      
      // Show success modal
      const entryText = entry.entries.length === 1 ? 'entry' : 'entries'
      setSuccessMessage(`${entry.entries.length} ${entryText} submitted successfully!`)
      setShowSuccessModal(true)
      
      // Auto redirect after 3 seconds
      setTimeout(() => {
        router.push('/')
      }, 3000)
      
    } catch (error) {
      console.error('Checkout error:', error)
      alert('An error occurred during checkout. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Update quantity
  const updateQuantity = (competitionId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    
    setEntries(prev => prev.map(entry => 
      entry.competitionId === competitionId 
        ? { ...entry, quantity: newQuantity }
        : entry
    ))
  }

  // Remove entry
  const removeEntry = (competitionId: string) => {
    setEntries(prev => prev.filter(entry => entry.competitionId !== competitionId))
  }

  // Loading state - only show loading if we're still checking auth AND haven't loaded entries yet
  if (loading && entries.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-24 w-24 border-4 border-transparent border-t-blue-600 border-r-amber-500"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div></div>
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-500" />
              <span className="font-bold text-gray-900">Checkout</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {entries.length === 0 ? (
          // Empty cart
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Add some competition entries to get started!</p>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Browse Competitions
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Prize Showcase */}
            <div className="lg:col-span-2">
              {entries.map((entry) => (
                <div key={entry.competitionId} className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-xl overflow-hidden mb-6 h-full">
                  
                  {/* Hero Section with Large Prize Image */}
                  <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      {/* Large Prize Image */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <img
                            src={entry.imageUrl}
                            alt={entry.competitionTitle}
                            className="w-32 h-32 md:w-40 md:h-40 object-contain rounded-2xl bg-white/10 backdrop-blur-sm p-4 shadow-2xl"
                          />
                        </div>
                      </div>
                      
                      {/* Prize Details */}
                      <div className="flex-grow text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-black mb-2">
                          {entry.prizeShort}
                        </h1>
                        <p className="text-xl text-blue-100 mb-4">
                          Worth thousands of Rands!
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-lg">
                          <Trophy className="w-6 h-6 text-yellow-400" />
                          <span className="font-semibold">You could win this!</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Your Entries Section */}
                  <div className="p-6 flex-grow">
                    <div className="flex items-center gap-3 mb-4">
                      <Target className="w-6 h-6 text-blue-600" />
                      <h2 className="text-xl font-bold text-gray-900">Your {entry.entries.length} Winning Chances</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {entry.entries.map((gameEntry, index) => (
                        <div key={gameEntry.id} className="bg-white rounded-lg p-4 border-2 border-blue-100 hover:border-blue-300 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">Entry #{index + 1}</div>
                              <div className="text-sm text-green-600 font-medium">FREE</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                  </div>
                </div>
              ))}
            </div>

            {/* Exciting Action Panel */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-2xl overflow-hidden sticky top-8 border-2 border-green-200 h-full flex flex-col">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white text-center">
                  <div className="text-4xl mb-2">🎯</div>
                  <h2 className="text-2xl font-black mb-1">Ready to Win?</h2>
                  <p className="text-green-100 text-sm">Your entries are locked in!</p>
                </div>
                
                {/* Prize Summary - Flex grow to match height */}
                <div className="p-6 space-y-4 flex-grow flex flex-col justify-between">
                  <div className="space-y-4">
                    {entries.map((entry) => (
                      <div key={entry.competitionId} className="bg-white rounded-xl p-4 border border-green-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                            <Trophy className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 text-lg">
                              {entry.prizeShort}
                            </div>
                            <div className="text-green-600 font-semibold text-sm">
                              {entry.quantity} entries • FREE
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-black text-green-700 mb-1">
                            R0.00
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            Usually R{entry.entryPrice * entry.quantity}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* CTA Button - Always at bottom */}
                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-black py-6 px-8 text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 rounded-2xl border-4 border-white mt-6"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 border-3 border-white border-t-transparent rounded-full"
                        />
                        <span>Setting up your win...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5" />
                        <span>PLAY FOR FREE</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl"
          >
            {/* Celebration Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <PartyPopper className="w-10 h-10 text-white" />
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Entries Submitted!
              </h2>
              <p className="text-gray-600 mb-6">
                {successMessage}
              </p>
              
              {/* Target Icon */}
              <div className="flex items-center justify-center gap-2 text-blue-600 mb-6">
                <Target className="w-5 h-5" />
                <span className="font-semibold">Good luck finding the ball!</span>
              </div>

              {/* Auto redirect message */}
              <p className="text-sm text-gray-500">
                Redirecting to home page in 3 seconds...
              </p>
            </motion.div>

            {/* Confetti Effect */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 1, 
                    y: 0, 
                    x: Math.random() * 400 - 200,
                    rotate: 0 
                  }}
                  animate={{ 
                    opacity: 0, 
                    y: -200, 
                    rotate: 360 
                  }}
                  transition={{ 
                    duration: 2, 
                    delay: Math.random() * 0.5,
                    ease: "easeOut" 
                  }}
                  className={`absolute top-1/2 left-1/2 w-3 h-3 ${
                    ['bg-yellow-400', 'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500'][i % 5]
                  } rounded-full`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
