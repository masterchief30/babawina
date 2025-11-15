"use client"

import { CompetitionTile } from "./competition-tile"
import { ComingSoonTile } from "./coming-soon-tile"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

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

interface CompetitionTilesGridProps {
  initialCompetitions: Competition[]
}

export function CompetitionTilesGrid({ initialCompetitions }: CompetitionTilesGridProps) {
  console.log('🎮 CompetitionTilesGrid received:', initialCompetitions.length, 'competitions')

  if (initialCompetitions.length === 0) {
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Live Competitions */}
        {initialCompetitions.map((competition, index) => (
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
        
        {/* Coming Soon Tiles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: initialCompetitions.length * 0.1 }}
        >
          <ComingSoonTile
            title="NEXT BIG PRIZE"
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (initialCompetitions.length + 1) * 0.1 }}
        >
          <ComingSoonTile
            title="MORE TO COME"
          />
        </motion.div>
      </div>

      {/* View All Button - Mobile-friendly */}
      {initialCompetitions.length >= 9 && (
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