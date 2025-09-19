"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowLeft, Target, Plus, Minus, ShoppingCart, Trophy, Clock } from "lucide-react"
import Link from "next/link"

interface Competition {
  id: string
  title: string
  prize_short: string
  prize_value_rand: number
  entry_price_rand: number
  image_inpainted_path: string | null
  image_normalized_path: string | null
  display_photo_path: string | null
  display_photo_alt: string | null
  status: 'live' | 'draft' | 'closed' | 'judged'
  starts_at: string
  ends_at: string
  description?: string
}

interface GameEntry {
  id: string
  x: number
  y: number
  timestamp: number
}

export default function PlayCompetitionPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [gameEntries, setGameEntries] = useState<GameEntry[]>([])
  const [isLoadingCompetition, setIsLoadingCompetition] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [showCoordinates, setShowCoordinates] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
  }, [user, loading, router])

  // Fetch competition data
  useEffect(() => {
    async function fetchCompetition() {
      if (!params.id) return

      try {
        const { data, error } = await supabase
          .from('competitions')
          .select('*')
          .eq('id', params.id)
          .eq('status', 'live')
          .single()

        if (error) {
          console.error('Error fetching competition:', error)
          router.push('/')
          return
        }

        setCompetition(data)
      } catch (error) {
        console.error('Error:', error)
        router.push('/')
      } finally {
        setIsLoadingCompetition(false)
      }
    }

    fetchCompetition()
  }, [params.id, router])

  // Handle mouse movement over image
  const handleMouseMove = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!competition) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    setCursorPosition({ x, y })
  }

  // Handle mouse enter - show coordinates
  const handleMouseEnter = () => {
    setShowCoordinates(true)
  }

  // Handle mouse leave - hide coordinates
  const handleMouseLeave = () => {
    setShowCoordinates(false)
  }

  // Handle image click to add entry
  const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
    if (!competition) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    console.log('Click coordinates:', { x, y }) // Debug log
    console.log('Rect:', rect) // Debug log
    console.log('Client coordinates:', { clientX: event.clientX, clientY: event.clientY }) // Debug log


    const newEntry: GameEntry = {
      id: `entry-${Date.now()}-${Math.random()}`,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      timestamp: Date.now()
    }

    setGameEntries(prev => [...prev, newEntry])
  }

  // Remove entry
  const removeEntry = (entryId: string) => {
    setGameEntries(prev => prev.filter(entry => entry.id !== entryId))
  }

  // Calculate total cost
  const totalCost = gameEntries.length * (competition?.entry_price_rand || 0)

  // Get game image URL (for the main game area - should be the football field image)
  const getGameImageUrl = () => {
    if (!competition) return '/placeholder-competition.svg'
    
    console.log('Competition data:', competition) // Debug log
    console.log('image_inpainted_path:', competition.image_inpainted_path) // Debug log
    
    // Use the inpainted image (football field with ball removed) for the game
    if (competition.image_inpainted_path) {
      console.log('Using inpainted image:', competition.image_inpainted_path) // Debug log
      return competition.image_inpainted_path
    }
    
    console.log('Using placeholder image') // Debug log
    return '/placeholder-competition.svg'
  }

  // Get product image URL (for the sidebar prize display)
  const getProductImageUrl = () => {
    if (!competition) return '/placeholder-competition.svg'
    
    // For the prize display, we want the product photo (Xbox, car, etc.)
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

  // Loading states
  if (loading || isLoadingCompetition) {
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

  if (!competition) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Competition not found</h1>
          <Link href="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
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
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{competition.title}</h1>
                <p className="text-gray-600">Click anywhere on the image to place your guess where the ball is hidden!</p>
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
                    className="max-w-full max-h-full object-contain"
                    onLoad={() => setImageLoaded(true)}
                    onClick={handleImageClick}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  />
                  
                  {/* Show crosshair markers for placed entries */}
                  {gameEntries.map((entry, index) => (
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
                      {/* Simple Crosshair marker - no center dot */}
                      <div className="relative">
                        {/* Horizontal line */}
                        <div className="absolute w-8 h-0.5 bg-red-500 shadow-lg" style={{ left: '-16px', top: '-1px' }} />
                        {/* Vertical line */}
                        <div className="absolute w-0.5 h-8 bg-red-500 shadow-lg" style={{ left: '-1px', top: '-16px' }} />
                      </div>
                    </motion.div>
                  ))}

                  {/* Coordinates display */}
                  {showCoordinates && (
                    <div className="absolute top-4 left-4 bg-black/80 text-white text-sm px-3 py-2 rounded-lg shadow-lg pointer-events-none z-20">
                      <div className="font-mono">
                        X: {cursorPosition.x.toFixed(1)}%
                      </div>
                      <div className="font-mono">
                        Y: {cursorPosition.y.toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tickets Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-8">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  DREAM CAR TICKETS
                </h2>
              </div>
              
              <div className="p-4">
                {/* Prize Display */}
                <div className="mb-6">
                  <div className="text-center mb-4">
                    <img
                      src={getProductImageUrl()}
                      alt={competition.title}
                      className="w-20 h-20 object-contain mx-auto rounded-lg"
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 text-center mb-2">
                    {competition.prize_short}
                  </h3>
                  <div className="text-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {gameEntries.length} of 1
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-orange-600 border-orange-600 hover:bg-orange-50"
                      disabled={gameEntries.length === 0}
                      onClick={() => {
                        if (gameEntries.length > 0) {
                          removeEntry(gameEntries[gameEntries.length - 1].id)
                        }
                      }}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-gray-600 px-2">In Play</span>
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={() => {
                        // Simulate a click in the center of the image
                        const centerEntry: GameEntry = {
                          id: `entry-${Date.now()}-${Math.random()}`,
                          x: 50,
                          y: 50,
                          timestamp: Date.now()
                        }
                        setGameEntries(prev => [...prev, centerEntry])
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full text-red-500 border-red-500 hover:bg-red-50"
                    disabled={gameEntries.length === 0}
                    onClick={() => setGameEntries([])}
                  >
                    Delete
                  </Button>
                  
                </div>

                {/* Entries List */}
                {gameEntries.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3">YOUR ENTRIES</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {gameEntries.map((entry, index) => (
                        <div key={entry.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Entry #{index + 1}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium">
                              {formatPrice(competition.entry_price_rand)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => removeEntry(entry.id)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Checkout Button */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(totalCost)}
                    </span>
                  </div>
                  
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3"
                    disabled={gameEntries.length === 0}
                    onClick={() => {
                      // Save entries to localStorage for checkout
                      const checkoutData = {
                        competitionId: competition.id,
                        competitionTitle: competition.title,
                        prizeShort: competition.prize_short,
                        entryPrice: competition.entry_price_rand,
                        entries: gameEntries,
                        imageUrl: getProductImageUrl()
                      }
                      localStorage.setItem('checkoutData', JSON.stringify(checkoutData))
                      window.location.href = '/checkout'
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    CHECKOUT →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
