"use client"

/**
 * Submission Status Banner
 * Shows "Buy 2 Get 1 Free" progress
 */

import { motion } from 'framer-motion'
import { Gift, Zap } from 'lucide-react'

interface SubmissionStatusBannerProps {
  nextIsFree: boolean
  paidSubmissions: number
  freeSubmissions: number
  submissionsUntilFree: number
  entryPrice: number
}

export function SubmissionStatusBanner({
  nextIsFree,
  paidSubmissions,
  freeSubmissions,
  submissionsUntilFree,
  entryPrice,
}: SubmissionStatusBannerProps) {
  // Don't show banner if user hasn't made any submissions yet
  if (paidSubmissions === 0 && freeSubmissions === 0) {
    return null
  }

  if (nextIsFree) {
    // Next submission is FREE!
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-4 shadow-lg"
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
              <Gift className="w-6 h-6" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Your Next Entry is FREE! 🎉</h3>
            <p className="text-sm opacity-90">
              You've earned a free submission! No charge for your next entry.
            </p>
          </div>
        </div>

        {/* Progress Visualization */}
        <div className="mt-3 flex items-center space-x-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" />
            </div>
          ))}
          <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 0.5 }}
              className="h-full bg-white rounded-full"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Gift className="w-3 h-3 text-green-600" />
            </div>
          </div>
        </div>

        <div className="mt-2 text-xs opacity-75 text-center">
          Paid: {paidSubmissions} • Free: {freeSubmissions} • Total: {paidSubmissions + freeSubmissions}
        </div>
      </motion.div>
    )
  }

  // Show progress to next free submission
  const progress = (paidSubmissions % 2) / 2 // 0%, 50%, or 100%

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Buy 2 Get 1 FREE!</h3>
        </div>
        <div className="text-sm font-medium text-blue-600">
          {submissionsUntilFree} more until FREE
        </div>
      </div>

      {/* Progress Visualization */}
      <div className="flex items-center space-x-2 mb-2">
        {[0, 1].map((i) => {
          const isPaid = i < (paidSubmissions % 2)
          return (
            <div
              key={i}
              className={`flex-1 h-3 rounded-full overflow-hidden transition-all duration-300 ${
                isPaid ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              {isPaid && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-blue-600"
                />
              )}
            </div>
          )
        })}
        <div className="flex-1 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full overflow-hidden opacity-30 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <Gift className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <div>
          <span className="font-medium">This entry:</span> R{entryPrice.toFixed(2)}
        </div>
        <div>
          <span className="font-medium">Total submissions:</span> {paidSubmissions + freeSubmissions}
        </div>
      </div>

      {paidSubmissions % 2 === 1 && (
        <div className="mt-2 text-xs text-center text-purple-700 font-medium">
          ⚡ One more paid entry and your next one is FREE!
        </div>
      )}
    </motion.div>
  )
}

