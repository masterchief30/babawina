"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowLeft, ShoppingCart, Trophy, CreditCard, CheckCircle, Info, PartyPopper, Target } from "lucide-react"
import Link from "next/link"

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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
  }, [user, loading, router])

  // Load checkout data from localStorage
  useEffect(() => {
    try {
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
      } else {
        // No checkout data, redirect back to competitions
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
    if (!user || entries.length === 0) return
    
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

      // Clear localStorage
      localStorage.removeItem('checkoutData')
      
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

  // Loading state
  if (loading) {
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
            <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Competitions</span>
            </Link>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b">
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6" />
                    Your Entries
                  </h1>
                </div>
                
                <div className="divide-y">
                  {entries.map((entry) => (
                    <div key={entry.competitionId} className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Competition Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={entry.imageUrl}
                            alt={entry.competitionTitle}
                            className="w-20 h-20 object-contain rounded-lg bg-gray-100"
                          />
                        </div>
                        
                        {/* Competition Details */}
                        <div className="flex-grow">
                          <h3 className="font-bold text-gray-900 mb-1">
                            {entry.competitionTitle}
                          </h3>
                          <p className="text-gray-600 text-sm mb-3">
                            {entry.prizeShort}
                          </p>
                          
                          {/* Entry Coordinates List */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-gray-700 text-sm">Your Guess Locations:</h4>
                            {entry.entries.map((gameEntry, index) => (
                              <div key={gameEntry.id} className="flex items-center justify-between bg-gray-50 rounded p-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  <span className="text-gray-700">
                                    Entry #{index + 1}
                                  </span>
                                </div>
                                <div className="text-gray-600">
                                  {formatPrice(entry.entryPrice)}
                                </div>
                              </div>
                            ))}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-2"
                              onClick={() => removeEntry(entry.competitionId)}
                            >
                              Remove All Entries
                            </Button>
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {formatPrice(entry.entryPrice)} each
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            {formatPrice(entry.entryPrice * entry.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
                  <h2 className="text-white font-bold text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Order Summary
                  </h2>
                </div>
                
                <div className="p-6">
                  {/* Order Details */}
                  <div className="space-y-3 mb-6">
                    {entries.map((entry) => (
                      <div key={entry.competitionId} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {entry.competitionTitle.substring(0, 30)}...
                        </span>
                        <span className="font-medium">
                          {entry.quantity}x {formatPrice(entry.entryPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-blue-600">{formatPrice(total)}</span>
                    </div>
                  </div>
                  
                  
                  {/* Checkout Button */}
                  <Button
                    className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Test For Free
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
