"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Edit, Trash2, Eye, Play, Users, Trophy, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

interface AdminCompetitionTileProps {
  id: string
  title: string
  prize_short: string
  prize_value_rand: number
  entry_price_rand: number
  image_inpainted_path?: string
  display_photo_path?: string
  display_photo_alt?: string
  status: 'draft' | 'live' | 'closed' | 'judged'
  starts_at: string
  ends_at: string
  created_at: string
  entry_count?: number
  onDelete?: () => void
}

export function AdminCompetitionTile({
  id,
  title,
  prize_short,
  prize_value_rand,
  entry_price_rand,
  image_inpainted_path,
  display_photo_path,
  display_photo_alt,
  status,
  starts_at,
  ends_at,
  created_at,
  entry_count = 0
}: AdminCompetitionTileProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  // Format price display
  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `R${(price / 1000).toFixed(0)}k`
    }
    return `R${price}`
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'closed':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'judged':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Image URL - prioritize display photo, then inpainted photo, then placeholder
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this competition? This action cannot be undone.')) {
      return
    }
    
    setIsDeleting(true)
    // TODO: Implement delete functionality
    console.log('Delete competition:', id)
  }

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-gray-100 w-3/4">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 33vw"
          onError={(e) => {
            console.error('Image failed to load:', imageUrl)
            e.currentTarget.src = '/placeholder-competition.svg'
          }}
        />
        
        {/* Status Badge */}
        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(status)}`}>
          {status.toUpperCase()}
        </div>

        {/* Entry Count */}
        {entry_count > 0 && (
          <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium">
            <Users className="w-3 h-3 inline mr-1" />
            {entry_count}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {title}
        </h3>

        {/* Prize Description */}
        <p className="text-sm text-gray-600 mb-3">
          {prize_short}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Trophy className="w-4 h-4" />
            <span>{formatPrice(prize_value_rand)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-xs">Entry:</span>
            <span className="font-medium text-orange-600">
              {entry_price_rand === 0 ? 'FREE' : formatPrice(entry_price_rand)}
            </span>
          </div>
        </div>

        {/* Dates */}
        <div className="text-xs text-gray-500 mb-4 space-y-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>Starts: {formatDate(starts_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>Ends: {formatDate(ends_at)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            asChild
          >
            <Link href={`/admin/competitions/edit/${id}`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  )
}
