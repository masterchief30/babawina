"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Zap } from "lucide-react"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/AuthContext"

interface CompetitionTileProps {
  id: string
  title: string
  prize_short: string
  prize_value_rand: number
  entry_price_rand: number
  image_inpainted_path?: string | null
  display_photo_path?: string | null
  display_photo_alt?: string | null
  status: 'live' | 'draft' | 'closed' | 'judged'
  starts_at: string
  ends_at: string
  entry_count?: number
  featured?: boolean
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

export function CompetitionTile({
  id,
  title,
  prize_short,
  // prize_value_rand, // Unused
  entry_price_rand,
  image_inpainted_path,
  display_photo_path,
  display_photo_alt,
  // status, // Unused
  ends_at,
  // entry_count = Math.floor(Math.random() * 500) + 100, // Unused
  featured = false
}: CompetitionTileProps) {
  const { user } = useAuth()
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  })

  // Calculate time remaining
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime()
      const endTime = new Date(ends_at).getTime()
      const difference = endTime - now

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        })
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      setTimeRemaining({ days, hours, minutes, seconds, isExpired: false })
    }

    calculateTimeRemaining()
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
  }, [ends_at])

  // Format price display
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `R${(price / 1000).toFixed(0)}k`
    }
    return `R${price}`
  }

  // Format time display - show day name
  const formatTimeDisplay = () => {
    const endDate = new Date(ends_at)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return `Ends ${dayNames[endDate.getDay()]}`
  }

  // Image URL - prioritize display photo over inpainted/game photo
  const getImageUrl = () => {
    if (display_photo_path) {
      if (display_photo_path.startsWith('http')) {
        return display_photo_path
      }
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-display/${display_photo_path}`
    }
    
    if (image_inpainted_path) {
      if (image_inpainted_path.startsWith('http')) {
        return image_inpainted_path
      }
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-inpainted/${image_inpainted_path}`
    }
    
    return '/placeholder-competition.svg'
  }

  const imageUrl = getImageUrl()
  const imageAlt = display_photo_alt || `${title} competition image`

  // Handle click based on authentication status
  const handleTileClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault()
      window.location.href = '/login'
    }
    // If user is authenticated, let the Link handle navigation to /play/${id}
  }

  return (
    <Link href={`/play/${id}`} className="block cursor-pointer" onClick={handleTileClick}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        className="group relative bg-white rounded-lg overflow-hidden cursor-pointer transition-shadow duration-300 hover:shadow-2xl h-full mx-auto shadow-lg"
        style={{ maxWidth: '336px' }}
      >
        {/* Time Badge - Green gradient */}
        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider shadow-lg">
          {formatTimeDisplay().toUpperCase()}
        </div>

        {/* Image Section - Full width, auto height to preserve aspect ratio */}
        <div className="relative w-full bg-white">
          <Image
            src={imageUrl}
            alt={imageAlt}
            width={400}
            height={300}
            className="w-full h-auto"
            loading={featured ? "eager" : "lazy"}
          />
        </div>

        {/* Title - Green background with gradient, white text - Fixed height */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 px-2 py-2 h-8 lg:h-14 flex items-center justify-center">
          <h3 className="text-white font-bold text-xs lg:text-base uppercase tracking-wide text-center drop-shadow-sm leading-tight">
            {title.replace(/^Win (a|an) /i, 'WIN ')} for {formatPrice(entry_price_rand)}
          </h3>
        </div>

        {/* Content Section - Cleaner spacing */}
        <div className="p-4 lg:p-6 bg-gradient-to-b from-white to-gray-50">
          {/* Prize Name */}
          <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-2 lg:mb-4 uppercase tracking-wide text-center">
            {prize_short}
          </h3>

          {/* Ticket Price - Center aligned with gradient text */}
          <div className="text-center mb-4 lg:mb-6">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 lg:mb-2 font-semibold">Ticket Price</p>
            <p className="text-2xl lg:text-3xl font-black bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              {formatPrice(entry_price_rand)}
            </p>
          </div>

          {/* Play Now - Outlined button that fills on hover */}
          <motion.div 
            className="relative w-full overflow-hidden rounded-lg cursor-pointer group/button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 opacity-0 group-hover/button:opacity-100 transition-opacity duration-300" />
            <div className="relative w-full border-2 border-blue-600 text-blue-600 group-hover/button:text-white group-hover/button:border-transparent font-bold py-3 lg:py-4 px-4 rounded-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition-all duration-300">
              <Zap className="w-4 h-4" />
              <span>PLAY NOW</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Link>
  )
}