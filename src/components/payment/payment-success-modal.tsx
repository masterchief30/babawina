"use client"

/**
 * Payment Success Modal with Confetti & Lion Animation
 * Smooth, mobile-friendly celebration screen
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Sparkles } from 'lucide-react'

interface PaymentSuccessModalProps {
  isOpen: boolean
  amountCharged: number
  entryCount: number
  onClose?: () => void
}

// Generate confetti pieces
const generateConfetti = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100, // Random x position (%)
    delay: Math.random() * 0.3, // Stagger animation
    rotation: Math.random() * 360, // Random rotation
    duration: 2 + Math.random() * 2, // 2-4 seconds fall time
    color: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F'][Math.floor(Math.random() * 6)]
  }))
}

export function PaymentSuccessModal({ 
  isOpen, 
  amountCharged, 
  entryCount,
  onClose 
}: PaymentSuccessModalProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(3) // Show celebration for 3 seconds
  const [confetti] = useState(() => generateConfetti(typeof window !== 'undefined' && window.innerWidth < 768 ? 30 : 50))

  useEffect(() => {
    if (!isOpen) return

    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [isOpen])

  // Separate effect for redirect to avoid state update during render
  useEffect(() => {
    if (!isOpen) return
    if (countdown <= 0) {
      router.push('/profile?tab=competitions')
    }
  }, [countdown, isOpen, router])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl"
        >
          {/* Confetti Rain */}
          {confetti.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{ 
                y: -20, 
                x: `${piece.x}vw`,
                rotate: 0,
                opacity: 1
              }}
              animate={{ 
                y: '120vh', 
                rotate: piece.rotation,
                opacity: [1, 1, 0]
              }}
              transition={{ 
                duration: piece.duration,
                delay: piece.delay,
                ease: 'linear'
              }}
              className="absolute w-3 h-3 md:w-4 md:h-4"
              style={{ 
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '0%'
              }}
            />
          ))}

          {/* Success Content */}
          <motion.div
            initial={{ scale: 0, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ 
              type: 'spring',
              stiffness: 200,
              damping: 20,
              delay: 0.2
            }}
            className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 md:gap-8 px-4 sm:px-6 w-full max-w-lg mx-auto"
          >
            {/* Success Icon with Glow */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ 
                delay: 0.3, 
                duration: 0.5,
                type: 'tween',
                ease: 'easeOut'
              }}
              className="relative mt-4 sm:mt-0"
            >
              <div className="absolute inset-0 bg-green-400/30 blur-2xl sm:blur-3xl rounded-full" />
              <CheckCircle2 className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-green-400 relative z-10" />
            </motion.div>

            {/* Lion Mascot */}
            <motion.div
              initial={{ scale: 0, y: 50, rotate: -20 }}
              animate={{ 
                scale: [0, 1.2, 1],
                y: 0,
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                delay: 0.4,
                duration: 0.6,
                type: 'tween',
                ease: [0.34, 1.56, 0.64, 1] // Bouncy easing
              }}
              className="relative -my-2 sm:my-0"
            >
              <div className="absolute inset-0 bg-yellow-400/20 blur-xl sm:blur-2xl rounded-full" />
              <Image
                src="/images/hero/mascot01.png"
                alt="BabaWina Lion"
                width={160}
                height={160}
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-56 md:h-56 lg:w-64 lg:h-64 object-contain relative z-10 drop-shadow-2xl"
              />
            </motion.div>

            {/* Success Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="text-center space-y-3 md:space-y-4 w-full"
            >
              <div className="flex items-center justify-center gap-2 flex-wrap px-2">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-400 flex-shrink-0" />
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">
                  Payment Successful!
                </h2>
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-400 flex-shrink-0" />
              </div>
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm border border-green-400/30 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-6 mx-2"
              >
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-green-400">
                  R{amountCharged.toFixed(2)} charged
                </p>
                <p className="text-xs sm:text-sm md:text-base text-green-300/80 mt-1">
                  {entryCount} {entryCount === 1 ? 'entry' : 'entries'} submitted
                </p>
              </motion.div>
            </motion.div>

            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.3 }}
              className="text-center px-4"
            >
              <p className="text-white/80 text-xs sm:text-sm md:text-base">
                Redirecting to your profile in
              </p>
              <motion.p
                key={countdown}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-yellow-400 drop-shadow-lg mt-1 sm:mt-2"
              >
                {countdown}
              </motion.p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Payment Processing Modal (Loading State)
 * Shows while payment is being processed
 */
export function PaymentProcessingModal({ isOpen }: { isOpen: boolean }) {
  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
    >
      <motion.div className="flex flex-col items-center gap-4 sm:gap-6 px-4 sm:px-6 max-w-md w-full">
        {/* Animated Spinner */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 1.5, repeat: Infinity, ease: 'linear' },
            scale: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-4 border-transparent border-t-yellow-400 border-r-yellow-500 border-b-amber-500"
        />
        
        {/* Processing Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-1 sm:space-y-2"
        >
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white px-2">
            Processing your payment...
          </h3>
          <p className="text-xs sm:text-sm md:text-base text-white/60 px-2">
            Please wait, this will only take a moment
          </p>
        </motion.div>

        {/* Pulsing Dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-400"
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

