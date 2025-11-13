'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowRight, Target } from 'lucide-react'
import { entryPreservation } from '@/lib/entry-preservation'

// Generate confetti positions on client side only to avoid hydration errors
const generateConfettiPositions = (count: number) => {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    x: (Math.random() - 0.5) * 200,
    rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
    duration: 3 + Math.random() * 2,
    delay: Math.random() * 2,
  }))
}

const generateLargeConfettiPositions = (count: number) => {
  return Array.from({ length: count }, () => ({
    left: Math.random() * 100,
    x: (Math.random() - 0.5) * 300,
    duration: 4 + Math.random() * 2,
    delay: Math.random() * 1.5,
  }))
}

export default function SignupSuccessfulPage() {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(true)
  const [hasPreservedEntries, setHasPreservedEntries] = useState(false)
  const [preservedData, setPreservedData] = useState<any>(null)
  const [countdown, setCountdown] = useState(3)
  const [confettiPositions, setConfettiPositions] = useState<any[]>([])
  const [largeConfettiPositions, setLargeConfettiPositions] = useState<any[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Mark as mounted and generate confetti positions on client side only
    setIsMounted(true)
    setConfettiPositions(generateConfettiPositions(60))
    setLargeConfettiPositions(generateLargeConfettiPositions(15))
    
    // Check for preserved entries
    const preserved = entryPreservation.loadEntries()
    if (preserved && preserved.entries.length > 0) {
      setHasPreservedEntries(true)
      setPreservedData(preserved)
      console.log('✅ Found preserved entries during signup success:', preserved)
    }
    
    // Stop confetti after 5 seconds
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false)
    }, 5000)

    // Countdown timer - just decrement the counter
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => {
      clearTimeout(confettiTimer)
      clearInterval(countdownInterval)
    }
  }, [])

  // Separate effect for navigation when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      // Redirect to preserved competition or home
      if (preservedData && preservedData.competitionId) {
        console.log('🎯 Redirecting to competition:', preservedData.competitionId)
        router.push(`/play/${preservedData.competitionId}`)
      } else {
        console.log('🏠 Redirecting to home')
        router.push('/')
      }
    }
  }, [countdown, preservedData, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-400 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='50' cy='50' r='1'/%3E%3Ccircle cx='25' cy='25' r='1'/%3E%3Ccircle cx='75' cy='75' r='1'/%3E%3Ccircle cx='75' cy='25' r='1'/%3E%3Ccircle cx='25' cy='75' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }} />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4 lg:px-8 h-16 lg:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 lg:gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl overflow-hidden shadow-lg">
              <img 
                src="/images/hero/mascot002.png" 
                alt="BabaWina Mascot" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-xl lg:text-2xl font-black text-blue-600">
                BabaWina
              </span>
              <span className="hidden lg:block text-[10px] text-black font-bold uppercase tracking-wider">Play & Win</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Confetti Animation - Only render after mount to avoid hydration errors */}
      {showConfetti && isMounted && confettiPositions.length > 0 && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {/* Main confetti pieces */}
          {confettiPositions.map((position, i) => {
            const colors = ['#FBBF24', '#F59E0B', '#2563EB', '#1D4ED8', '#10B981', '#059669', '#EF4444', '#DC2626']
            const shapes = ['rounded-full', 'rounded-sm']
            
            return (
              <motion.div
                key={`confetti-${i}`}
                className={`absolute w-3 h-3 ${shapes[i % 2]} shadow-lg`}
                style={{
                  backgroundColor: colors[i % colors.length],
                  left: `${position.left}%`,
                }}
                initial={{
                  y: -20,
                  x: 0,
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  y: window.innerHeight + 50,
                  x: position.x,
                  rotate: position.rotate,
                  opacity: [1, 1, 0.8, 0],
                }}
                transition={{
                  duration: position.duration,
                  delay: position.delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
            )
          })}

          {/* Larger confetti pieces */}
          {largeConfettiPositions.map((position, i) => (
            <motion.div
              key={`large-confetti-${i}`}
              className="absolute w-6 h-6 rounded-full shadow-lg"
              style={{
                background: `linear-gradient(45deg, #FBBF24, #F59E0B)`,
                left: `${position.left}%`,
              }}
              initial={{
                y: -20,
                x: 0,
                rotate: 0,
                scale: 1,
              }}
              animate={{
                y: window.innerHeight + 50,
                x: position.x,
                rotate: 720,
                scale: [1, 1.2, 0.8],
              }}
              transition={{
                duration: position.duration,
                delay: position.delay,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-4xl flex flex-col lg:flex-row items-center justify-center gap-12 mt-20 mb-8">
        
        {/* Celebrating Mascot */}
        <motion.div 
          className="flex-shrink-0"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <img 
            src="/images/hero/mascot_full02.png" 
            alt="BabaWina Mascot Celebrating" 
            className="w-80 lg:w-96 h-auto object-contain"
          />
        </motion.div>

        {/* Success Message */}
        <div className="flex-1 max-w-lg text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl p-8 border border-white/20"
          >
            {/* Success Header */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4, type: "spring", bounce: 0.4 }}
              className="text-center mb-6"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-3xl lg:text-4xl font-black text-gray-900 mb-2">
                Congratulations!
              </h1>
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 text-center"
            >
              <p className="text-lg text-gray-700 mb-4">
                Your account is ready! 🎊
              </p>
            </motion.div>

            {/* Entry Preservation Status */}
            {hasPreservedEntries && preservedData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">🎯</div>
                  <h3 className="font-bold text-blue-900 text-xl mb-2">
                    Your {preservedData.entries.length} bet{preservedData.entries.length !== 1 ? 's' : ''} {preservedData.entries.length !== 1 ? 'are' : 'is'} saved!
                  </h3>
                  <p className="text-blue-700 font-medium">
                    Redirecting to your competition in <span className="text-2xl font-black text-blue-600">{countdown}</span>...
                  </p>
                </div>
              </motion.div>
            )}

            {/* No preserved entries - going home */}
            {!hasPreservedEntries && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl"
              >
                <div className="text-center">
                  <p className="text-amber-800 font-medium">
                    Redirecting to home in <span className="text-xl font-black text-amber-600">{countdown}</span>...
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
