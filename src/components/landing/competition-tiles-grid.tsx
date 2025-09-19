"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { CompetitionTile } from "./competition-tile"
import { TileSkeleton } from "./tile-skeleton"
import { motion } from "framer-motion"
import { Trophy, Sparkles } from "lucide-react"

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
  created_at: string
}

export function CompetitionTilesGrid() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch live competitions
  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        // First try with display photo fields
        let { data, error } = await supabase
          .from('competitions')
          .select(`
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
            created_at
          `)
          .eq('status', 'live')
          .gte('ends_at', new Date().toISOString())
          .order('ends_at', { ascending: true })
          .limit(9) // Show max 9 competitions for 3x3 grid

        // If error (likely missing columns), try without display photo fields
        if (error) {
          console.log('Display photo columns not found, using fallback query')
          const fallback = await supabase
            .from('competitions')
            .select(`
              id,
              title,
              prize_short,
              prize_value_rand,
              entry_price_rand,
              image_inpainted_path,
              status,
              starts_at,
              ends_at,
              created_at
            `)
            .eq('status', 'live')
            .gte('ends_at', new Date().toISOString())
            .order('ends_at', { ascending: true })
            .limit(9)

          if (fallback.error) throw fallback.error
          
          // Add null display photo fields to maintain compatibility
          data = fallback.data?.map(comp => ({
            ...comp,
            display_photo_path: null,
            display_photo_alt: null
          })) || []
        }

        setCompetitions(data || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load competitions')
        console.error('Error fetching competitions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCompetitions()

    // Set up real-time subscription
    const channel = supabase
      .channel('competitions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'competitions',
          filter: 'status=eq.live'
        },
        () => {
          // Refetch when competitions change
          fetchCompetitions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  if (loading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <TileSkeleton key={i} featured={i === 0} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
          <Trophy className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          Unable to load competitions
        </h2>
        <p className="text-gray-600 mb-6 text-sm md:text-base">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition-all"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (competitions.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-amber-100 rounded-full mb-6"
        >
          <Sparkles className="w-12 h-12 text-blue-600" />
        </motion.div>
        <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-4">
          New Competitions Coming Soon!
        </h2>
        <p className="text-base md:text-xl text-gray-600 mb-8">
          Check back in a few hours for exciting new prizes
        </p>
        <div className="bg-gradient-to-br from-blue-50 to-amber-50 rounded-3xl p-8 md:p-12 border-2 border-blue-200">
          <div className="text-5xl md:text-6xl mb-4">🎯</div>
          <p className="text-gray-600 text-sm md:text-base">
            Be the first to play when new games go live
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Competition Grid - Mobile-optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {competitions.map((competition, index) => (
          <motion.div
            key={competition.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <CompetitionTile
              id={competition.id}
              title={competition.title}
              prize_short={competition.prize_short}
              prize_value_rand={competition.prize_value_rand}
              entry_price_rand={competition.entry_price_rand}
              image_inpainted_path={competition.image_inpainted_path}
              display_photo_path={competition.display_photo_path}
              display_photo_alt={competition.display_photo_alt}
              status={competition.status}
              starts_at={competition.starts_at}
              ends_at={competition.ends_at}
              featured={index === 0} // Make first tile featured
            />
          </motion.div>
        ))}
      </div>

      {/* View All Button - Mobile-friendly */}
      {competitions.length >= 9 && (
        <div className="text-center mt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-sm md:text-base uppercase tracking-wider shadow-xl"
          >
            View All Competitions
          </motion.button>
        </div>
      )}
    </div>
  )
}