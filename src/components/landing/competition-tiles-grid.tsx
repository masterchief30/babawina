"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { CompetitionTile } from "./competition-tile"
import { TileSkeleton } from "./tile-skeleton"

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
          .limit(6) // Show max 6 competitions

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
            .limit(6)

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
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Live Competitions
          </h2>
          <p className="text-xl text-gray-600">
            Join now and win amazing prizes!
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <TileSkeleton key={i} featured={i === 0} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Unable to load competitions
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (competitions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            No Live Competitions
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            New competitions are coming soon! Check back later.
          </p>
          <div className="bg-gray-100 rounded-2xl p-12">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-gray-500">
              Be the first to know when new competitions go live
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Live Competitions
        </h2>
        <p className="text-xl text-gray-600">
          Play Spot-the-Ball and win amazing prizes!
        </p>
      </div>

      {/* Competition Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-max">
        {competitions.map((competition, index) => (
          <CompetitionTile
            key={competition.id}
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
        ))}
      </div>

    </div>
  )
}
