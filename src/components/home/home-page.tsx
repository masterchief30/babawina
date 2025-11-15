"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CompetitionTilesGrid } from "@/components/landing/competition-tiles-grid"
import { useAuth } from "@/contexts/AuthContext"
import { Trophy, Target, Users, ArrowRight, Rocket, Zap, CheckCircle, Sparkles } from "lucide-react"
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
  const [entryCount, setEntryCount] = useState(0)
  const { user, loading, signOut } = useAuth()

  // Real visit counter - increments on each page visit, resets at midnight
  useEffect(() => {
    const incrementVisitCounter = async () => {
      try {
        // Call API to increment today's visit count
        const response = await fetch('/api/increment-visit', {
          method: 'POST',
        })
        
        if (response.ok) {
          const data = await response.json()
          setEntryCount(data.count || 0)
        } else {
          // Fallback: just display current count without incrementing
          const fallbackResponse = await fetch('/api/increment-visit', {
            method: 'GET',
          })
          if (fallbackResponse.ok) {
            const data = await fallbackResponse.json()
            setEntryCount(data.count || 0)
          }
        }
      } catch (error) {
        console.error('Error fetching visit count:', error)
        // Silent fail - don't show counter if error
        setEntryCount(0)
      }
    }

    incrementVisitCounter()
  }, [])

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
    <div className="min-h-screen bg-white overflow-x-hidden w-full max-w-full">
      
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
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold px-3 lg:px-6 py-2 rounded-full text-xs sm:text-sm transition-all"
                  >
                    Log In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button 
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold px-3 lg:px-6 py-2 rounded-full shadow-lg text-xs sm:text-sm"
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
              Win great prizes for R15. Pure skill. No luck needed.
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

            {/* Live Entry Counter - URGENCY */}
            {entryCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-6 inline-flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-full shadow-lg"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-xl"
                >
                  🔥
                </motion.span>
                <span className="font-black text-base sm:text-lg">
                  {entryCount} {entryCount === 1 ? 'person' : 'people'} playing today!
                </span>
              </motion.div>
            )}

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

      {/* Testimonials Section - SUPER COOL */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              Meet Our Winners!
            </h2>
            <p className="text-base md:text-xl text-blue-100 max-w-2xl mx-auto">
              We started 3rd November and already have 3 winners
            </p>
          </motion.div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                image: "/images/hero/001.jpg",
                name: "Carey",
                location: "Cape Town",
                prize: "PS5",
                quote: "Won my PS5 last month. Took about 2 weeks to arrive. Pretty happy with it.",
                rating: 5
              },
              {
                image: "/images/hero/003.jpeg",
                name: "Thando",
                location: "Cape Town",
                prize: "PS5",
                quote: "Tried it out and actually won. Good way to spend R15.",
                rating: 5
              },
              {
                image: "/images/hero/002.jpeg",
                name: "Andrew",
                location: "Cape Town",
                prize: "PS5",
                quote: "Was skeptical at first but it's legit. Got lucky on my third entry.",
                rating: 5
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group"
              >
                <div className="bg-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-2">
                  {/* Image */}
                  <div className="relative h-64 md:h-72 overflow-hidden bg-gradient-to-br from-amber-400 to-amber-500">
                    <Image
                      src={testimonial.image}
                      alt={`${testimonial.name} - Winner`}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      style={{
                        filter: 'contrast(1.05) saturate(1.15) brightness(1.02) blur(0.3px)',
                        imageRendering: 'auto',
                        objectPosition: testimonial.image.includes('003.jpeg') ? 'center 25%' : 'center center'
                      }}
                      quality={75}
                    />
                    {/* Subtle Phone Camera Effects */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle at center, transparent 60%, rgba(0,0,0,0.15) 100%)',
                        mixBlendMode: 'multiply'
                      }}
                    />
                    {/* Very Light Grain for Phone Texture */}
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-15 mix-blend-overlay"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                        backgroundSize: '250px 250px'
                      }}
                    />
                    {/* Winner Badge */}
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
                      <Trophy className="w-3 h-3" />
                      WINNER
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Stars */}
                    <div className="flex gap-1 mb-3">
                      {[...Array(testimonial.rating)].map((_, starIndex) => (
                        <svg
                          key={starIndex}
                          className="w-5 h-5 text-amber-400 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-4 italic">
                      "{testimonial.quote}"
                    </p>

                    {/* Author */}
                    <div className="border-t border-gray-100 pt-4">
                      <div className="font-bold text-gray-900 text-base md:text-lg">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {testimonial.location}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold">
                        <Sparkles className="w-3 h-3" />
                        Won: {testimonial.prize}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <p className="text-white text-lg md:text-xl font-semibold mb-4">
              Your turn to win! 🎉
            </p>
            <Button
              onClick={handlePlayNow}
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold px-10 py-6 rounded-full text-lg shadow-2xl inline-flex items-center gap-3 group"
            >
              <Trophy className="w-5 h-5" />
              Start Playing Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
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
              Three simple steps to win big prizes
            </p>
          </motion.div>
          
          <div className="grid sm:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: Trophy,
                title: "Choose Your Competition",
                bullets: [
                  "Browse live competitions for amazing prizes",
                  "Pick the one you want to enter",
                  "See exactly what you're playing for"
                ],
                color: "from-blue-600 to-blue-700"
              },
              {
                icon: Target,
                title: "Place Your Best Guess",
                bullets: [
                  "Study the photo carefully",
                  "Click where the ball center is hidden",
                  "Only R15 per entry - enter as many times as you want!"
                ],
                color: "from-amber-500 to-amber-600"
              },
              {
                icon: Sparkles,
                title: "Win Great Prizes!",
                bullets: [
                  "Every Friday at 18:00 PM we announce the winner",
                  "Closest guess to the ball wins the prize",
                  "New competition starts immediately after!"
                ],
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
                <h3 className="text-lg md:text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                <ul className="text-left space-y-2 max-w-xs mx-auto">
                  {step.bullets.map((bullet, bulletIndex) => (
                    <li key={bulletIndex} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm md:text-base text-gray-700">{bullet}</span>
                    </li>
                  ))}
                </ul>
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
            {/* Stripe Security Badge */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-sm text-gray-400">🔒 Secured by</span>
              <svg className="h-6 w-auto" viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg">
                <path fill="#6772e5" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.93 0 1.85 6.29.97 6.29 5.88z"/>
              </svg>
            </div>
            
            <p className="text-xs md:text-sm text-gray-500 mb-2">
              © 2025 BabaWina • Made with love in ZA 🇿🇦 • 18+ Only
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}

