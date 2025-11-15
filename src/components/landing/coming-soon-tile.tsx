"use client"

import { motion } from "framer-motion"
import { Lock, Zap } from "lucide-react"

interface ComingSoonTileProps {
  title: string
}

export function ComingSoonTile({ 
  title
}: ComingSoonTileProps) {
  return (
    <div className="block cursor-default">
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ duration: 0.3 }}
        className="group relative bg-white rounded-lg overflow-hidden h-full mx-auto shadow-lg"
        style={{ maxWidth: '336px' }}
      >
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/20 to-amber-500/20 animate-pulse z-0" />
        
        {/* Coming Soon Badge - Sleek gradient */}
        <div className="absolute top-3 left-3 z-30 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider shadow-xl flex items-center gap-1 backdrop-blur-sm">
          <Lock className="w-3 h-3" />
          COMING SOON
        </div>

        {/* Shimmer Overlay */}
        <motion.div
          className="absolute inset-0 z-5"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
          animate={{
            backgroundPosition: ['200% 0', '-200% 0'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Glass Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/20 backdrop-blur-[2px] z-10 pointer-events-none" />
        
        {/* Question Mark in Center - Mystery! */}
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              scale: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              },
              rotate: {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            className="relative"
          >
            {/* Glow effect behind question mark */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-blue-500 blur-2xl opacity-40 scale-150" />
            
            <div className="relative bg-white rounded-full w-20 h-20 lg:w-24 lg:h-24 shadow-2xl border-3 border-white/80 flex items-center justify-center">
              <span className="text-5xl lg:text-6xl font-black bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-none pb-1">
                ?
              </span>
            </div>
          </motion.div>
        </div>

        {/* Image Section - Gradient background (EXACT same height as live tile) */}
        <div className="relative w-full bg-gradient-to-br from-slate-200 via-gray-100 to-slate-300 overflow-hidden">
          <div className="w-full aspect-[4/3] flex items-center justify-center relative">
            {/* Animated gradient orbs */}
            <motion.div
              className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-purple-400/30 to-blue-400/30 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-br from-amber-400/30 to-orange-400/30 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.5, 0.3, 0.5],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            <div className="text-7xl opacity-40 z-10">🎁</div>
          </div>
        </div>

        {/* Title - Vibrant gradient */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 px-2 py-2 h-8 lg:h-14 flex items-center justify-center relative overflow-hidden">
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
              repeatDelay: 2
            }}
          />
          <h3 className="relative text-white font-bold text-xs lg:text-base uppercase tracking-wide text-center drop-shadow-lg leading-tight">
            {title}
          </h3>
        </div>

        {/* Content Section - SUPER COMPACT */}
        <div className="p-2 lg:p-3 bg-gradient-to-b from-white to-gray-50">
          {/* Prize Name - MINIMAL */}
          <h3 className="text-base lg:text-lg font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-0.5 lg:mb-1 uppercase tracking-wide text-center">
            MYSTERY PRIZE
          </h3>

          {/* Price-style section - MINIMAL */}
          <div className="text-center mb-2 lg:mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0 font-semibold">Coming Soon</p>
            <p className="text-2xl lg:text-3xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              ???
            </p>
          </div>

          {/* Play Now Button - MINIMAL padding */}
          <motion.div 
            className="relative w-full overflow-hidden rounded-lg group/button cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 opacity-0 group-hover/button:opacity-100 transition-opacity duration-300" />
            <div className="relative w-full border-2 border-purple-600 bg-gradient-to-br from-purple-50 to-blue-50 text-purple-700 group-hover/button:text-white group-hover/button:border-transparent font-bold py-2 lg:py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition-all duration-300">
              <Zap className="w-4 h-4" />
              <span>PLAY NOW</span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

