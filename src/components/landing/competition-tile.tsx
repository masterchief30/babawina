"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Trophy, Clock, Users } from "lucide-react"

interface CompetitionTileProps {
  id: string
  title: string
  prize_short: string
  prize_value_rand: number
  entry_price_rand: number
  image_inpainted_path?: string
  display_photo_path?: string
  display_photo_alt?: string
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
  prize_value_rand,
  entry_price_rand,
  image_inpainted_path,
  display_photo_path,
  display_photo_alt,
  status,
  ends_at,
  entry_count = 0,
  featured = false
}: CompetitionTileProps) {
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

  // Determine status badge
  const getStatusBadge = () => {
    if (status !== 'live') return null
    
    const totalHours = timeRemaining.days * 24 + timeRemaining.hours
    
    if (totalHours < 24) {
      return (
        <div className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wide shadow-lg">
          ENDS SOON
        </div>
      )
    }
    
    if (timeRemaining.days <= 7) {
      const daysText = timeRemaining.days === 1 ? 'DAY' : 'DAYS'
      return (
        <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wide shadow-lg">
          ENDS IN {timeRemaining.days} {daysText}
        </div>
      )
    }
    
    return (
      <div className="absolute top-4 left-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-md text-sm font-bold uppercase tracking-wide shadow-lg">
        LIVE
      </div>
    )
  }

  // Format price display
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `R${(price / 1000).toFixed(0)}k`
    }
    return `R${price}`
  }

  // Image URL - prioritize display photo, fallback to inpainted photo, then placeholder
  const getImageUrl = () => {
    if (display_photo_path) {
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-display/${display_photo_path}`
    }
    if (image_inpainted_path) {
      // Handle both full URLs and filenames for backward compatibility
      if (image_inpainted_path.startsWith('http')) {
        return image_inpainted_path
      }
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-inpainted/${image_inpainted_path}`
    }
    return '/placeholder-competition.svg'
  }

  const imageUrl = getImageUrl()
  const imageAlt = display_photo_alt || `${title} competition image`

  return (
    <Link href={`/play/${id}`}>
      <div className={`
        group relative bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer
        transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-2xl
        border border-gray-100 max-w-sm mx-auto
      `}>
        {/* Hero Image Section */}
        <div className={`relative ${featured ? 'h-64' : 'h-48'} overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600`}>
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes={featured ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
          />
          
          {/* Status Badge */}
          {getStatusBadge()}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        {/* Content Section */}
        <div className="p-6 bg-white">
          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight">
            {title}
          </h3>
          
          {/* Prize Description */}
          <p className="text-gray-600 mb-4 text-sm leading-relaxed">
            {prize_short}
          </p>

          {/* Price Section */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                STARTING FROM
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(prize_value_rand)}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                TICKET PRICE
              </div>
              <div className="text-2xl font-bold text-orange-500">
                {entry_price_rand === 0 ? 'Free entry' : formatPrice(entry_price_rand)}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex gap-3">
            <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform active:scale-95 text-center">
              {entry_price_rand === 0 ? 'SIGN UP AND GET A FREE TICKET »' : 'ENTER NOW'}
            </button>
            {entry_price_rand > 0 && (
              <button className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg transition-all duration-200">
                <Trophy className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
