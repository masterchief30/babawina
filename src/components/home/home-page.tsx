"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CompetitionTilesGrid } from "@/components/landing/competition-tiles-grid"
import { useAuth } from "@/contexts/AuthContext"
import { Trophy, Target, Users, ArrowRight, Rocket, Zap, CheckCircle, Sparkles, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"


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
      
      {/* Promo Banner - Simple Pricing */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-3 px-4 relative z-[90]"
      >
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
          <p className="font-bold text-sm sm:text-base md:text-lg">
            <span className="hidden sm:inline">🎮 Win a PS5 for only </span>
            <span className="text-yellow-300">R15 per entry!</span>
          </p>
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </motion.div>
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed left-0 right-0 z-[100] transition-all duration-500 ${
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

      {/* Hero Section - CLEANER */}
      <section className="relative min-h-[85vh] md:min-h-[90vh] overflow-hidden">
        {/* Golden Background - Simpler */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500" />

        {/* Winner with PS5 - Left Side, Desktop Only */}
        <div className="hidden lg:block absolute bottom-0 left-8 z-10">
          <Image
            src="/images/hero/model01.png"
            alt="Winner with PS5"
            width={350}
            height={450}
            className="h-[400px] xl:h-[450px] w-auto object-contain"
            style={{ filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.2))' }}
          />
        </div>

        {/* Mascot - Right Side, Desktop Only */}
        <div className="hidden xl:block absolute bottom-0 right-8 z-10">
          <Image
            src="/images/hero/mascot01.png"
            alt="BabaWina Mascot"
            width={350}
            height={420}
            className="h-[420px] w-auto object-contain"
            style={{ filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.2))' }}
          />
        </div>

        {/* Content - CLEANER */}
        <div className="relative z-40 container mx-auto px-4 sm:px-6 lg:px-8 min-h-[85vh] md:min-h-[90vh] flex items-center justify-center">
          <div className="w-full max-w-3xl mx-auto text-center py-20 sm:py-24">
            
            {/* Mini Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg mb-8"
            >
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs sm:text-sm font-bold text-gray-900">Live Competitions Now!</span>
            </motion.div>

            {/* Main Headline - CLEANER */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.1] mb-3">
                <span className="text-white drop-shadow-lg">Find The Ball.</span>
              </span>
              <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1]">
                <span className="text-blue-700 drop-shadow-md">Win Big Prizes.</span>
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-base sm:text-lg md:text-xl text-gray-900 font-semibold mb-8 drop-shadow-sm max-w-xl mx-auto"
            >
              South Africa's fairest competition platform
            </motion.p>

            {/* CTA Button - Single, Prominent */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <Button
                onClick={handlePlayNow}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-10 py-7 rounded-full text-lg md:text-xl shadow-2xl inline-flex items-center gap-3 group"
              >
                <Rocket className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-y-[-2px] transition-transform" />
                Play Now
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            {/* Trust Badges - Simpler */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap text-xs sm:text-sm text-gray-800 font-semibold"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Secure</span>
              </div>
              <div className="w-px h-4 bg-gray-700/30" />
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-blue-600" />
                <span>Instant</span>
              </div>
              <div className="w-px h-4 bg-gray-700/30" />
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span>Real Prizes</span>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Stats Section - SIMPLER */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-700 py-12 md:py-14">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">

            {/* Stats Grid - 3 columns, cleaner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
              {[
                { 
                  icon: Sparkles, 
                  value: "R15 per Entry", 
                  label: "Simple Pricing",
                  color: "text-yellow-300"
                },
                { 
                  icon: Zap, 
                  value: "Play Instantly", 
                  label: "No Waiting",
                  color: "text-green-300"
                },
                { 
                  icon: Trophy, 
                  value: "Real Prizes", 
                  label: "Guaranteed",
                  color: "text-amber-300"
                }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 md:p-6 text-center hover:bg-white/15 transition-all"
                >
                  <stat.icon className={`w-8 h-8 md:w-10 md:h-10 ${stat.color} mx-auto mb-3`} />
                  <div className="text-xl md:text-2xl font-black text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-blue-200 text-xs md:text-sm font-semibold uppercase tracking-wide">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Competitions Section */}
      <section id="competitions" className="py-14 md:py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-black mb-3 text-gray-900">
              Live Competitions
            </h2>
            <p className="text-gray-600 text-base md:text-lg">
              Choose a competition and start playing
            </p>
          </motion.div>
          <CompetitionTilesGrid initialCompetitions={initialCompetitions} />
        </div>
      </section>

      {/* How It Works - CLEANER */}
      <section className="py-14 md:py-16 px-4 bg-white">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              How It Works
            </h2>
            <p className="text-gray-600 text-base md:text-lg">
              Three simple steps to win
            </p>
          </motion.div>
          
          <div className="grid sm:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Users,
                title: "Sign Up Free",
                description: "Create account in 30 seconds",
                color: "from-blue-600 to-blue-700"
              },
              {
                icon: Target,
                title: "Find the Ball",
                description: "Click where the ball is hidden",
                color: "from-amber-500 to-amber-600"
              },
              {
                icon: Trophy,
                title: "Win Prize",
                description: "Closest guess wins",
                color: "from-green-500 to-green-600"
              }
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <step.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 text-gray-900">{step.title}</h3>
                <p className="text-sm md:text-base text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - CLEANER */}
      <section className="py-14 md:py-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Ready to Play?
            </h2>
            <p className="text-base md:text-lg text-blue-100 mb-6">
              Join South Africa's fairest competition platform
            </p>
            <Button
              onClick={handlePlayNow}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-10 py-6 rounded-full text-lg shadow-xl inline-flex items-center gap-3 group"
            >
              <Rocket className="w-5 h-5" />
              Start Playing
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer - CLEANER */}
      <footer className="bg-gray-900 text-white py-8 md:py-10 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image 
                  src="/images/hero/mascot002.png" 
                  alt="BabaWina Mascot" 
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-base font-bold">BabaWina</span>
            </div>
            
            {/* Links */}
            <div className="flex items-center gap-6 text-sm">
              <button 
                onClick={handlePlayNow}
                className="text-gray-400 hover:text-white transition-colors"
              >
                Competitions
              </button>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy
              </Link>
              <a href="mailto:support@babawina.co.za" className="text-gray-400 hover:text-white transition-colors">
                Support
              </a>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-xs md:text-sm text-gray-500 mb-2">
              © 2025 BabaWina • Made in South Africa 🇿🇦 • 18+ Only
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}

