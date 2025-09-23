"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CompetitionTilesGrid } from "@/components/landing/competition-tiles-grid"
import { useAuth } from "@/contexts/AuthContext"
import { Trophy, Target, Users, ArrowRight, Crown, Rocket } from "lucide-react"
import { motion } from "framer-motion"
import { User } from "@supabase/supabase-js"

// Soccer Ball Component (Mobile + Desktop)
function MobileSoccerBall({ user }: { user: User | null }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [showConfetti, setShowConfetti] = useState(false)
  
  useEffect(() => {
    const getScreenWidth = () => window.innerWidth
    
    const updatePosition = () => {
      const screenWidth = getScreenWidth()
      // Remove unused screenHeight variable
      
      console.log('Updating ball position...') // Debug log
      
      // Different positioning for mobile vs desktop
      if (screenWidth < 1024) {
        // Mobile: anywhere in golden section
        const newPos = {
          x: Math.random() * (screenWidth - 80),
          y: Math.random() * 250 + 100
        }
        console.log('Mobile position:', newPos) // Debug log
        setPosition(newPos)
      } else {
        // Desktop: avoid the photo areas, stay in center-upper area
        const newPos = {
          x: Math.random() * (screenWidth * 0.6) + (screenWidth * 0.2), // Center 60% of screen
          y: Math.random() * 200 + 80 // Upper area, avoid photos
        }
        console.log('Desktop position:', newPos) // Debug log
        setPosition(newPos)
      }
    }
    
    // Initial position
    updatePosition()
    
    // Set up interval: 1.4s visible + 3s break = 4.4s total cycle
    const interval = setInterval(updatePosition, 4400) // 4.4 seconds total cycle
    
    return () => clearInterval(interval)
  }, [])

  const handleBallClick = () => {
    // Show confetti animation
    setShowConfetti(true)
    
    // Hide confetti after animation
    setTimeout(() => {
      setShowConfetti(false)
    }, 2000)
    
    // Only redirect to signup if user is not signed in
    if (!user) {
      setTimeout(() => {
        window.location.href = '/signup'
      }, 1000)
    }
  }

  return (
    <>
      {/* Spectacular Confetti Rain Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
          {/* Main confetti pieces */}
          {[...Array(60)].map((_, i) => {
            const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 400
            const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 600
            const startX = Math.random() * screenWidth
            const endX = startX + (Math.random() - 0.5) * 200 // Slight horizontal drift
            const delay = Math.random() * 0.5 // Stagger the start times
            
            return (
              <motion.div
                key={`confetti-${i}-${Date.now()}`}
                initial={{
                  opacity: 1,
                  scale: Math.random() * 0.5 + 0.5, // Random size 0.5-1.0
                  x: startX,
                  y: -20, // Start above screen
                  rotate: Math.random() * 360
                }}
                animate={{
                  opacity: [1, 1, 0.8, 0],
                  scale: [null, null, 0.8, 0.3],
                  x: endX,
                  y: screenHeight + 50, // Fall below screen
                  rotate: Math.random() * 720 + 360 // Multiple spins
                }}
                transition={{
                  duration: 3 + Math.random() * 2, // 3-5 seconds fall time
                  delay: delay,
                  ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for realistic fall
                }}
                className={`absolute w-3 h-3 ${
                  ['bg-yellow-400', 'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-indigo-500'][i % 8]
                } shadow-lg`}
                style={{
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px', // Mix of circles and squares
                  boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                }}
              />
            )
          })}
          
          {/* Larger celebration pieces */}
          {[...Array(15)].map((_, i) => {
            const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 400
            const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 600
            
            return (
              <motion.div
                key={`big-confetti-${i}-${Date.now()}`}
                initial={{
                  opacity: 1,
                  scale: 1,
                  x: Math.random() * screenWidth,
                  y: -30,
                  rotate: 0
                }}
                animate={{
                  opacity: [1, 1, 0],
                  scale: [1, 1.2, 0.5],
                  y: screenHeight + 100,
                  rotate: Math.random() * 1080 + 360
                }}
                transition={{
                  duration: 4 + Math.random() * 1.5,
                  delay: Math.random() * 0.8,
                  ease: "easeOut"
                }}
                className={`absolute w-6 h-6 ${
                  ['bg-gradient-to-br from-yellow-400 to-orange-500', 
                   'bg-gradient-to-br from-blue-500 to-purple-600',
                   'bg-gradient-to-br from-green-400 to-emerald-500',
                   'bg-gradient-to-br from-pink-500 to-rose-600'][i % 4]
                } rounded-full shadow-xl`}
                style={{
                  boxShadow: '0 6px 12px rgba(0,0,0,0.3)'
                }}
              />
            )
          })}
        </div>
      )}
      
      {/* Soccer Ball */}
      <motion.div
        key={`ball-${position.x}-${position.y}-${Date.now()}`}
        className="absolute cursor-pointer hover:cursor-pointer select-none z-10"
        style={{
          left: position.x,
          top: position.y,
          pointerEvents: 'auto' // Make sure it can be clicked
        }}
        onClick={handleBallClick}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {/* Visibility Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0]
          }}
          transition={{
            duration: 1.4, // 1.4 seconds visible
            repeat: Infinity,
            repeatDelay: 3, // 3 seconds break
            ease: "easeInOut",
            times: [0, 0.15, 0.85, 1] // Quick fade in/out, long visibility
          }}
        >
          {/* Continuous Spin Animation */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1, // 1 full rotation per second
              repeat: Infinity,
              ease: "linear" // Constant speed
            }}
          >
            <Image
              src="/images/hero/Soccerball.svg.png"
              alt="Soccer ball"
              width={48}
              height={48}
              className="w-12 h-12 lg:w-10 lg:h-10 drop-shadow-lg pointer-events-none"
              onError={(e) => {
                // Fallback to different possible names
                const img = e.target as HTMLImageElement
                if (img.src.includes('Soccerball.svg.png')) {
                  img.src = '/soccerball.png'
                } else if (img.src.includes('soccerball.png')) {
                  img.src = '/soccer-ball.png'
                }
              }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  )
}

export function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handlePlayNow = () => {
    if (!user) {
      window.location.href = "/signup"
    } else {
      // Scroll to competitions section for signed-in users
      const competitionsSection = document.getElementById('competitions')
      if (competitionsSection) {
        competitionsSection.scrollIntoView({ behavior: 'smooth' })
      }
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
      
      {/* Test Banner */}
      <div className="bg-green-600 text-white text-center py-4 px-4 relative z-40">
        <p className="font-bold text-base md:text-lg font-mono tracking-wide">
          Test for free until 3 October 2025
        </p>
      </div>
      
      {/* Header - Minimal and Clean */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? 'top-0 bg-white/95 backdrop-blur-xl shadow-md' 
            : 'top-14 bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8 h-16 lg:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 lg:gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl overflow-hidden shadow-lg">
              <Image 
                src="/images/hero/mascot002.png" 
                alt="BabaWina Mascot" 
                width={48}
                height={48}
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
          
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {/* Navigation items removed for beta version */}
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              // Authenticated user buttons
              <>
                <Link href="/profile">
                  <Button 
                    variant="outline"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold px-4 lg:px-6 py-2 rounded-full text-sm transition-colors"
                  >
                    Profile
                  </Button>
                </Link>
                <Button 
                  onClick={async () => {
                    console.log('Logout button clicked, user:', user?.email)
                    try {
                      console.log('Calling signOut...')
                      await signOut()
                      console.log('SignOut completed successfully')
                      // The auth state change listener will handle the redirect
                    } catch (error) {
                      console.error('Logout error:', error)
                      // Fallback redirect if something goes wrong
                      window.location.href = '/'
                    }
                  }}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-4 lg:px-6 py-2 rounded-full shadow-lg text-sm"
                >
                  Logout
                </Button>
              </>
            ) : (
              // Guest user buttons
              <>
                <Link href="/login">
                  <Button 
                    variant="outline"
                    className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold px-4 lg:px-6 py-2 rounded-full text-sm transition-colors"
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

      {/* Hero Section - Modern Split Design */}
      <section className="relative min-h-screen">
        {/* Golden Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-400">
          {/* Subtle Pattern Overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='50' cy='50' r='1'/%3E%3Ccircle cx='25' cy='25' r='1'/%3E%3Ccircle cx='75' cy='75' r='1'/%3E%3Ccircle cx='75' cy='25' r='1'/%3E%3Ccircle cx='25' cy='75' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
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

        {/* Football Animation - Visible on all devices */}
        <div className="absolute inset-0 pointer-events-none z-50">
          <MobileSoccerBall user={user} />
        </div>

         {/* Models and Mascot positioned with bottom aligned to golden section end - Hidden on mobile */}
         <div className="hidden lg:block absolute left-0 right-0 z-20" style={{ bottom: '128px' }}>
           {/* Model 1 - Girl (Far Left) */}
           <div className="absolute bottom-0 left-8 z-10">
             <Image
               src="/images/hero/model01.png"
               alt="Winner with PS5"
               width={400}
               height={500}
               className="h-[500px] w-auto object-contain"
               style={{ 
                 filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.25))',
               }}
             />
           </div>
           
           {/* Model 2 - Man (Left-Center) */}
           <div className="absolute bottom-0 left-[380px] z-20">
             <Image
               src="/images/hero/model02.png"
               alt="Winner celebrating"
               width={400}
               height={504}
               className="h-[504px] w-auto object-contain"
               style={{ 
                 filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.2))',
               }}
             />
           </div>

           {/* Mascot - Right Side */}
           <div className="absolute bottom-0 right-8 xl:right-16 z-30">
             <Image
               src="/images/hero/mascot01.png"
               alt="BabaWina Mascot"
               width={400}
               height={480}
               className="h-[420px] xl:h-[480px] w-auto object-contain"
               style={{ 
                 filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.25))',
               }}
             />
           </div>
         </div>

        {/* Content */}
        <div className="relative z-40 container mx-auto px-4 lg:px-8 min-h-screen flex items-center lg:items-start lg:pt-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">

             {/* Center - Main Content */}
             <div className="col-span-1 lg:col-span-5 lg:col-start-5 text-center flex flex-col justify-center min-h-screen lg:min-h-0 lg:pt-0 relative z-50 -mt-32 lg:mt-0">
                 
                 {/* Content Container */}
                 <div className="relative z-10">

                  {/* Heading */}
                  <h1 className="mb-8 pb-4 text-center">
                    <span 
                      className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 leading-tight whitespace-nowrap text-white"
                    >
                      Find The Ball
              </span>
                    <span 
                      className="block text-2xl sm:text-3xl md:text-3xl lg:text-5xl xl:text-6xl font-black leading-tight pb-2 whitespace-nowrap text-blue-600"
                    >
                      Win Amazing Prizes
              </span>
                  </h1>


                  {/* CTAs - Show for all users */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handlePlayNow}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 md:px-8 py-4 md:py-6 rounded-full text-sm sm:text-base md:text-lg shadow-2xl flex items-center gap-3 group w-full sm:w-auto"
                      style={{ boxShadow: '0 20px 40px rgba(37, 99, 235, 0.3)' }}
                    >
                      <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
                      START PLAYING
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                  </div>
                  </div>
                </div>
                
                  </div>
                </div>
                
        {/* Bottom Wave Transition */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-600 to-transparent z-10" />
      </section>

      {/* Stats Section - Clean Integration */}
      <section className="relative bg-blue-600 py-8 -mt-32">
        <div className="relative z-20 container mx-auto px-4 lg:px-8">
          {/* Mobile: Only Description Text */}
          <div className="text-center lg:hidden py-4">
            <p className="text-lg text-white font-medium">
              South Africa&apos;s most exciting gaming competition. Winners every week!
            </p>
          </div>
          
          {/* Desktop: Description + Stats */}
          <div className="hidden lg:block">
            <div className="text-center mb-8">
              <p className="text-lg lg:text-xl text-white font-medium">
                South Africa&apos;s most exciting gaming competition. Winners every week!
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: "Test Players", value: "100+", icon: Users, color: "text-amber-400" },
                { label: "Future Prizes", value: "R1M+", icon: Trophy, color: "text-amber-400" },
                { label: "Winners Every Month", value: "10+", icon: Crown, color: "text-amber-400" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                  initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                  <stat.icon className={`w-12 h-12 ${stat.color} mx-auto mb-3`} />
                  <div className="text-4xl lg:text-5xl font-black text-white mb-1">
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

      {/* Competitions Section */}
      <section id="competitions" className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="text-amber-600 font-black text-sm uppercase tracking-wider">Try For Free</span>
            <h2 className="text-4xl md:text-5xl font-black mt-2 bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
              Live Competitions
            </h2>
            <p className="text-gray-600 mt-4 text-lg">Select a prize and start playing immediately</p>
          </motion.div>
          <CompetitionTilesGrid />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <span className="text-blue-600 font-black text-sm uppercase tracking-wider">Simple Process</span>
            <h2 className="text-4xl md:text-5xl font-black mt-2 text-gray-900">
              How To Win
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Sign Up",
                description: "Create your account in seconds",
                color: "from-blue-600 to-blue-700",
                step: "01"
              },
              {
                icon: Target,
                title: "Find the Ball",
                description: "Place your marker where you think it is",
                color: "from-amber-500 to-amber-600",
                step: "02"
              },
              {
                icon: Trophy,
                title: "Win Prizes",
                description: "Closest guess wins!",
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
                className="relative"
              >
                <div className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border border-gray-100">
                  <div className="text-6xl font-black text-gray-100 absolute top-4 right-6">{step.step}</div>
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


      {/* Final CTA - Show for all users */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-700 to-blue-600">
        <div className="container mx-auto max-w-4xl text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-5xl font-black text-white mb-6">
              Ready to Win Big?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              {user ? "Choose your competition and start playing!" : "Join thousands of winners today"}
            </p>
            <Button
              onClick={handlePlayNow}
              className="bg-amber-500 hover:bg-amber-600 text-white font-black px-12 py-7 rounded-full text-lg shadow-2xl inline-flex items-center gap-3"
            >
              <Trophy className="w-6 h-6" />
              START WINNING NOW
              <ArrowRight className="w-5 h-5" />
            </Button>
              </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 lg:py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-8 mb-6 lg:mb-8">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-2 lg:mb-4">
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl overflow-hidden">
                  <Image 
                    src="/images/hero/mascot002.png" 
                    alt="BabaWina Mascot" 
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-base lg:text-lg font-bold">BabaWina</span>
              </div>
              <p className="text-xs lg:text-sm text-gray-400 mb-4 lg:mb-0">
                South Africa&apos;s #1 gaming competition platform
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-2 lg:mb-4 text-amber-400 text-sm lg:text-base">Play</h4>
              <div className="space-y-1 lg:space-y-2 mb-4 lg:mb-0">
                <button 
                  onClick={() => {
                    const competitionsSection = document.getElementById('competitions')
                    if (competitionsSection) {
                      competitionsSection.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className="block text-xs lg:text-sm text-gray-400 hover:text-amber-400 text-left"
                >
                  Competitions
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-2 lg:mb-4 text-amber-400 text-sm lg:text-base">Legal</h4>
              <div className="space-y-1 lg:space-y-2 mb-4 lg:mb-0">
                <Link href="/terms" className="block text-xs lg:text-sm text-gray-400 hover:text-amber-400">
                  Terms & Conditions
                </Link>
                <Link href="/privacy" className="block text-xs lg:text-sm text-gray-400 hover:text-amber-400">
                  Privacy Policy
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-2 lg:mb-4 text-amber-400 text-sm lg:text-base">Contact</h4>
              <a href="mailto:support@babawina.co.za" className="block text-xs lg:text-sm text-gray-400 hover:text-amber-400 mb-2 lg:mb-0">
                support@babawina.co.za
              </a>
              <p className="text-xs lg:text-sm text-gray-500 mt-2 lg:mt-4">
                18+ Only • Play Responsibly
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-4 lg:pt-8 text-center">
            <p className="text-xs lg:text-sm text-gray-500">
              © 2025 BabaWina. All rights reserved. Made with ❤️ in South Africa 🇿🇦
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}