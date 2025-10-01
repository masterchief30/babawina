'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowRight, Target } from 'lucide-react'
import { entryPreservation } from '@/lib/entry-preservation'

export default function SignupSuccessfulPage() {
  const [showConfetti, setShowConfetti] = useState(false)
  const [hasPreservedEntries, setHasPreservedEntries] = useState(false)
  const [preservedData, setPreservedData] = useState<any>(null)

  useEffect(() => {
    // Start confetti animation immediately
    setShowConfetti(true)
    
    // Check for preserved entries
    const preserved = entryPreservation.loadEntries()
    if (preserved && preserved.entries.length > 0) {
      setHasPreservedEntries(true)
      setPreservedData(preserved)
      console.log('✅ Found preserved entries during signup success:', preserved)
    }
    
    // Stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

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

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {/* Main confetti pieces */}
          {Array.from({ length: 60 }).map((_, i) => {
            const colors = ['#FBBF24', '#F59E0B', '#2563EB', '#1D4ED8', '#10B981', '#059669', '#EF4444', '#DC2626']
            const shapes = ['rounded-full', 'rounded-sm']
            
            return (
              <motion.div
                key={`confetti-${i}`}
                className={`absolute w-3 h-3 ${shapes[i % 2]} shadow-lg`}
                style={{
                  backgroundColor: colors[i % colors.length],
                  left: `${Math.random() * 100}%`,
                }}
                initial={{
                  y: -20,
                  x: 0,
                  rotate: 0,
                  opacity: 1,
                }}
                animate={{
                  y: typeof window !== 'undefined' ? window.innerHeight + 50 : 800,
                  x: (Math.random() - 0.5) * 200,
                  rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
                  opacity: [1, 1, 0.8, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
            )
          })}

          {/* Larger confetti pieces */}
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={`large-confetti-${i}`}
              className="absolute w-6 h-6 rounded-full shadow-lg"
              style={{
                background: `linear-gradient(45deg, #FBBF24, #F59E0B)`,
                left: `${Math.random() * 100}%`,
              }}
              initial={{
                y: -20,
                x: 0,
                rotate: 0,
                scale: 1,
              }}
              animate={{
                y: typeof window !== 'undefined' ? window.innerHeight + 50 : 800,
                x: (Math.random() - 0.5) * 300,
                rotate: 720,
                scale: [1, 1.2, 0.8],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                delay: Math.random() * 1.5,
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

            {/* Entry Preservation Status */}
            {hasPreservedEntries && preservedData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl"
              >
                <div className="text-center mb-2">
                  <h3 className="font-bold text-green-800">Check your email and confirm your account! 🎯</h3>
                </div>
              </motion.div>
            )}


            {/* Footer Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 text-center"
            >
              <p className="text-sm text-gray-500">
                Didn&apos;t receive the email? Check your spam folder.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
