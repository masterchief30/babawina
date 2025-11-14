"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CompetitionTilesGrid } from "@/components/landing/competition-tiles-grid"
import { useAuth } from "@/contexts/AuthContext"
import { Trophy, Target, Users, ArrowRight, Crown, Rocket, Shield, Zap, CheckCircle, Sparkles, TrendingUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { User } from "@supabase/supabase-js"

// Soccer Ball Component (Keep the fun gimmick!)
function MobileSoccerBall({ user }: { user: User | null }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [showConfetti, setShowConfetti] = useState(false)
  
  useEffect(() => {
    const getScreenWidth = () => window.innerWidth
    
    const updatePosition = () => {
      const screenWidth = getScreenWidth()
      
      if (screenWidth < 1024) {
        const newPos = {
          x: Math.random() * (screenWidth - 80),
          y: Math.random() * 250 + 100
        }
        setPosition(newPos)
      } else {
        const newPos = {
          x: Math.random() * (screenWidth * 0.6) + (screenWidth * 0.2),
          y: Math.random() * 200 + 80
        }
        setPosition(newPos)
      }
    }
    
    updatePosition()
    const interval = setInterval(updatePosition, 4400)
    
    return () => clearInterval(interval)
  }, [])

  const handleBallClick = () => {
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 2000)
    
    if (!user) {
      setTimeout(() => {
        window.location.href = '/signup'
      }, 1000)
    }
  }

  return (
    <>
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
          {[...Array(60)].map((_, i) => {
            const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 400
            const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 600
            const startX = Math.random() * screenWidth
            const endX = startX + (Math.random() - 0.5) * 200
            const delay = Math.random() * 0.5
            
            return (
              <motion.div
                key={`confetti-${i}-${Date.now()}`}
                initial={{
                  opacity: 1,
                  scale: Math.random() * 0.5 + 0.5,
                  x: startX,
                  y: -20,
                  rotate: Math.random() * 360
                }}
                animate={{
                  opacity: [1, 1, 0.8, 0],
                  scale: [null, null, 0.8, 0.3],
                  x: endX,
                  y: screenHeight + 50,
                  rotate: Math.random() * 720 + 360
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: delay,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className={`absolute w-3 h-3 ${
                  ['bg-yellow-400', 'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'][i % 6]
                } shadow-lg`}
                style={{
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              />
            )
          })}
        </div>
      )}
      
      <motion.div
        key={`ball-${position.x}-${position.y}-${Date.now()}`}
        className="absolute cursor-pointer hover:cursor-pointer select-none z-10"
        style={{
          left: position.x,
          top: position.y,
          pointerEvents: 'auto'
        }}
        onClick={handleBallClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0]
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut",
            times: [0, 0.15, 0.85, 1]
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Image
              src="/images/hero/Soccerball.svg.png"
              alt="Soccer ball"
              width={48}
              height={48}
              className="w-12 h-12 lg:w-10 lg:h-10 drop-shadow-lg pointer-events-none"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  )
}

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

interface HomePageProps {
  initialCompetitions: Competition[]
}

export function HomePage({ initialCompetitions }: HomePageProps) {
  const [scrolled, setScrolled] = useState(false)
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handlePlayNow = () => {
    const competitionsSection = document.getElementById('competitions')
    if (competitionsSection) {
      competitionsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-24 w-24 border-4 border-transparent border-t-blue-600 border-r-amber-500"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      
      {/* Promo Banner - "Buy 2 Get 1 Free" */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center py-3 px-4 relative z-50"
      >
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          <p className="font-bold text-sm sm:text-base md:text-lg">
            <span className="hidden sm:inline">🎉 Limited Time Offer: </span>
            <span className="text-yellow-300">Buy 2 Entries, Get 1 FREE!</span>
          </p>
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </motion.div>
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed left-0 right-0 z-40 transition-all duration-500 ${
          scrolled 
            ? 'top-0 bg-white/95 backdrop-blur-xl shadow-lg' 
            : 'top-12 bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8 h-16 lg:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 lg:gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl overflow-hidden shadow-lg ring-2 ring-blue-100">
              <Image 
                src="/images/hero/mascot002.png" 
                alt="BabaWina Mascot" 
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-xl lg:text-2xl font-black bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                BabaWina
              </span>
              <span className="hidden lg:block text-[10px] text-gray-600 font-bold uppercase tracking-wider">
                Play Smart • Win Big
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/profile">
                  <Button 
                    variant="outline"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold px-4 lg:px-6 py-2 rounded-full text-sm transition-all"
                  >
                    Profile
                  </Button>
                </Link>
                <Button 
                  onClick={async () => {
                    await signOut()
                  }}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-4 lg:px-6 py-2 rounded-full shadow-lg text-sm"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button 
                    variant="outline"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold px-4 lg:px-6 py-2 rounded-full text-sm transition-all hidden sm:block"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold px-4 lg:px-6 py-2 rounded-full shadow-lg text-sm"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero Section - Redesigned */}
      <section className="relative min-h-[90vh] md:min-h-screen">
        {/* Golden Background with Modern Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-400">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='50' cy='50' r='1'/%3E%3Ccircle cx='25' cy='25' r='1'/%3E%3Ccircle cx='75' cy='75' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '100px 100px'
            }} />
          </div>

          {/* Animated Glow Effects */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-[150px] opacity-20"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[150px] opacity-20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.2, 0.25, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        {/* Football Animation */}
        <div className="absolute inset-0 pointer-events-none z-50">
          <MobileSoccerBall user={user} />
        </div>

        {/* Models and Mascot - Desktop Only */}
        <div className="hidden lg:block absolute left-0 right-0 z-20" style={{ bottom: '100px' }}>
          <div className="absolute bottom-0 left-8 z-10">
            <Image
              src="/images/hero/model01.png"
              alt="Winner with PS5"
              width={400}
              height={500}
              className="h-[500px] w-auto object-contain"
              style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.25))' }}
            />
          </div>
          
          <div className="absolute bottom-0 left-[380px] z-20">
            <Image
              src="/images/hero/model02.png"
              alt="Winner celebrating"
              width={400}
              height={504}
              className="h-[504px] w-auto object-contain"
              style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.2))' }}
            />
          </div>

          <div className="absolute bottom-0 right-8 xl:right-16 z-30">
            <Image
              src="/images/hero/mascot01.png"
              alt="BabaWina Mascot"
              width={400}
              height={480}
              className="h-[420px] xl:h-[480px] w-auto object-contain"
              style={{ filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.25))' }}
            />
          </div>
        </div>

        {/* Content - Redesigned */}
        <div className="relative z-40 container mx-auto px-4 lg:px-8 min-h-[90vh] md:min-h-screen flex items-center">
          <div className="w-full max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Main Content - Centered on mobile, left-center on desktop */}
              <div className="col-span-1 lg:col-span-6 lg:col-start-4 text-center pt-16 lg:pt-0">
                
                {/* Mini Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg mb-6"
                >
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-bold text-gray-900">Live Competitions Now!</span>
                </motion.div>

                {/* Main Headline - Power Statement */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-6"
                >
                  <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight mb-2">
                    <span className="text-white drop-shadow-lg">Find The Ball.</span>
                  </span>
                  <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      Win Big Prizes.
                    </span>
                  </span>
                </motion.h1>

                {/* Subheadline - Clear Benefit */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg sm:text-xl md:text-2xl text-gray-900 font-semibold mb-4 drop-shadow-sm"
                >
                  South Africa's fairest competition platform
                </motion.p>

                {/* Value Props - Quick Scan */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8"
                >
                  {[
                    { icon: CheckCircle, text: "Secure Payments" },
                    { icon: Zap, text: "Instant Play" },
                    { icon: Trophy, text: "Real Prizes" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-full shadow-md">
                      <item.icon className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-gray-900">{item.text}</span>
                    </div>
                  ))}
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <Button
                    onClick={handlePlayNow}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-8 py-6 rounded-full text-base md:text-lg shadow-2xl flex items-center gap-3 group"
                  >
                    <Rocket className="w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
                    Play Now
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>

                {/* Trust Badges */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-8 flex items-center justify-center gap-4 flex-wrap"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-800">
                    <Shield className="w-4 h-4" />
                    <span className="font-semibold">Stripe Secured</span>
                  </div>
                  <div className="w-px h-4 bg-gray-400" />
                  <div className="flex items-center gap-2 text-sm text-gray-800">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-semibold">POPIA Compliant</span>
                  </div>
                  <div className="w-px h-4 bg-gray-400" />
                  <div className="flex items-center gap-2 text-sm text-gray-800">
                    <span className="font-semibold">🇿🇦 SA Based</span>
                  </div>
                </motion.div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Stats Section (Redesigned with REAL honest messaging) */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-700 py-12 md:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
                Why Players Choose BabaWina
              </h2>
              <p className="text-blue-100 text-lg">
                Transparent. Fair. Exciting.
              </p>
            </motion.div>

            {/* Stats Grid - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {[
                { 
                  icon: Sparkles, 
                  value: "3 for 2", 
                  label: "Special Offer",
                  color: "text-yellow-400"
                },
                { 
                  icon: Trophy, 
                  value: "R10+", 
                  label: "Entry Price",
                  color: "text-amber-400"
                },
                { 
                  icon: Zap, 
                  value: "Instant", 
                  label: "Play Now",
                  color: "text-green-400"
                },
                { 
                  icon: Shield, 
                  value: "100%", 
                  label: "Secure",
                  color: "text-blue-300"
                }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/15 transition-all"
                >
                  <stat.icon className={`w-10 h-10 md:w-12 md:h-12 ${stat.color} mx-auto mb-3`} />
                  <div className="text-3xl md:text-4xl font-black text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-blue-200 text-sm font-semibold uppercase tracking-wide">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Competitions Section - MOVED HIGHER */}
      <section id="competitions" className="py-16 md:py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="inline-block bg-amber-100 text-amber-700 font-bold text-sm uppercase tracking-wider px-4 py-2 rounded-full mb-4">
              🎯 Live Competitions
            </span>
            <h2 className="text-3xl md:text-5xl font-black mb-4 bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
              Choose Your Prize
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Pick a competition, find the ball, win amazing prizes. It's that simple.
            </p>
          </motion.div>
          <CompetitionTilesGrid initialCompetitions={initialCompetitions} />
        </div>
      </section>

      {/* How It Works - Improved Design */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="inline-block bg-blue-100 text-blue-700 font-bold text-sm uppercase tracking-wider px-4 py-2 rounded-full mb-4">
              ⚡ Simple Process
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
              How To Win
            </h2>
            <p className="text-gray-600 text-lg">
              Three easy steps to your next big prize
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Sign Up Free",
                description: "Create your account in 30 seconds. No credit card required to start.",
                color: "from-blue-600 to-blue-700",
                step: "01"
              },
              {
                icon: Target,
                title: "Find the Ball",
                description: "Click where you think the ball is hidden. Buy 2 entries, get 1 FREE!",
                color: "from-amber-500 to-amber-600",
                step: "02"
              },
              {
                icon: Trophy,
                title: "Win & Collect",
                description: "Closest guess wins! Prizes delivered within 30 days.",
                color: "from-green-500 to-green-600",
                step: "03"
              }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -10 }}
                className="relative group"
              >
                <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border border-gray-100 h-full">
                  <div className="text-7xl font-black text-gray-100 absolute top-4 right-6 group-hover:text-gray-200 transition-colors">
                    {step.step}
                  </div>
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg relative z-10`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Improved */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Ready to Win?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join South Africa's most exciting competition platform. Play fair, win big.
            </p>
            <Button
              onClick={handlePlayNow}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black px-12 py-7 rounded-full text-lg shadow-2xl inline-flex items-center gap-3 group"
            >
              <Trophy className="w-6 h-6" />
              Start Playing Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            {/* Mini trust line */}
            <p className="text-blue-200 text-sm mt-6">
              🔒 Secure payments • 🇿🇦 Made in South Africa • ⚡ Instant access
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 lg:py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-blue-500">
                  <Image 
                    src="/images/hero/mascot002.png" 
                    alt="BabaWina Mascot" 
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-lg font-bold">BabaWina</span>
              </div>
              <p className="text-sm text-gray-400">
                South Africa's fairest competition platform. Play smart, win big.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-amber-400">Play</h4>
              <div className="space-y-2">
                <button 
                  onClick={handlePlayNow}
                  className="block text-sm text-gray-400 hover:text-amber-400 text-left transition-colors"
                >
                  Competitions
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-amber-400">Legal</h4>
              <div className="space-y-2">
                <Link href="/terms" className="block text-sm text-gray-400 hover:text-amber-400 transition-colors">
                  Terms & Conditions
                </Link>
                <Link href="/privacy" className="block text-sm text-gray-400 hover:text-amber-400 transition-colors">
                  Privacy Policy
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-amber-400">Contact</h4>
              <a href="mailto:support@babawina.co.za" className="block text-sm text-gray-400 hover:text-amber-400 transition-colors mb-4">
                support@babawina.co.za
              </a>
              <p className="text-sm text-gray-500">
                18+ Only • Play Responsibly
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2025 BabaWina. All rights reserved. Made with ❤️ in South Africa 🇿🇦
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}

