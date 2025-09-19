"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CompetitionTilesGrid } from "@/components/landing/competition-tiles-grid"
import { AuthModal } from "@/components/auth/auth-modal"
import { useAuth } from "@/components/auth/auth-provider"
import { Trophy, Target, Users, Shield, CheckCircle, Sparkles, Zap, Star, ArrowRight, Play, Crown, Gift, Clock, TrendingUp, Award, Gamepad2, Rocket } from "lucide-react"
import { motion } from "framer-motion"

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

// Floating particle component
function FloatingParticle({ delay = 0 }) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{
        background: `linear-gradient(135deg, #2563eb, #fbbf24)`,
        boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)',
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
      animate={{
        y: [-20, 20],
        x: [-20, 20],
        scale: [1, 1.5, 1],
        opacity: [0.2, 0.5, 0.2],
      }}
      transition={{
        duration: 8 + Math.random() * 4,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }}
    />
  )
}

export function HomePage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, loading } = useAuth()

  // Track scroll for header effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handlePlayNow = () => {
    if (!user) {
      setShowAuthModal(true)
    } else {
      window.location.href = "/play"
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    window.location.href = "/play"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 overflow-x-hidden">
      {/* Animated Background with Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-blue-400 rounded-full blur-[120px] opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-amber-400 rounded-full blur-[120px] opacity-20"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Floating Particles - Reduced from 15 to 6 */}
        {[...Array(6)].map((_, i) => (
          <FloatingParticle key={i} delay={i * 0.5} />
        ))}
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/90 backdrop-blur-xl shadow-xl border-b border-blue-100' 
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
              <Trophy className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <span className="text-2xl font-black bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                BabaWina
              </span>
              <span className="block text-xs text-amber-600 font-bold uppercase tracking-wider">Play & Win</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/competitions" className="group relative">
              <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                Competitions
              </span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-amber-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="/winners" className="group relative">
              <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                Winners
              </span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-amber-500 group-hover:w-full transition-all duration-300" />
            </Link>
            <Link href="/how-to-play" className="group relative">
              <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                How To Play
              </span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-amber-500 group-hover:w-full transition-all duration-300" />
            </Link>
          </nav>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={handlePlayNow}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black px-8 py-3 rounded-full shadow-xl shadow-amber-500/25 flex items-center gap-2 text-sm uppercase tracking-wider"
            >
              <Gamepad2 className="w-5 h-5" />
              Play Now
            </Button>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="text-center space-y-6"
          >
            {/* Badge */}
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-100 to-amber-100 border-2 border-amber-300 rounded-full"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-blue-700">⚡ New Competitions Daily</span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-7xl font-black leading-tight"
            >
              <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
                Spot The Ball.
              </span>
              <br />
              <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 bg-clip-text text-transparent animate-pulse">
                Win Big Prizes.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 max-w-2xl mx-auto font-medium"
            >
              South Africa's most exciting gaming competition. 
              Entry from just R30. Winners every week!
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handlePlayNow}
                  className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black px-12 py-7 rounded-full text-lg shadow-2xl shadow-blue-500/30 flex items-center gap-3 uppercase tracking-wider"
                >
                  <Rocket className="w-6 h-6" />
                  Start Playing
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
              
              <Link href="#competitions">
                <Button
                  variant="outline"
                  className="border-2 border-amber-300 text-amber-700 hover:border-amber-500 hover:text-amber-800 hover:bg-amber-50 px-10 py-7 rounded-full text-lg font-bold"
                >
                  View Prizes
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Quick Stats Bar */}
      <section className="py-12 px-4 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fbbf24' fill-opacity='0.1'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }} />
        </div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { label: "Active Players", value: "12,847", icon: Users },
              { label: "Total Prizes", value: "R3.2M", icon: Trophy },
              { label: "Winners This Month", value: "47", icon: Crown },
              { label: "Live Games", value: "8", icon: Gamepad2 }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <div className="text-3xl font-black text-white">
                  {stat.value}
                </div>
                <div className="text-blue-200 text-sm font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Competition Tiles Section */}
      <section id="competitions" className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="text-amber-600 font-black text-sm uppercase tracking-wider">Choose Your Game</span>
            <h2 className="text-4xl md:text-5xl font-black mt-2 bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
              Live Competitions
            </h2>
            <p className="text-gray-600 mt-4 text-lg font-medium">Select a prize and start playing immediately</p>
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
            <span className="text-blue-600 font-black text-sm uppercase tracking-wider">Easy as 1-2-3</span>
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
                title: "Spot the Ball",
                description: "Place your marker where you think the ball is",
                color: "from-amber-500 to-amber-600",
                step: "02"
              },
              {
                icon: Trophy,
                title: "Win Prizes",
                description: "Closest guess wins the prize!",
                color: "from-blue-600 to-amber-600",
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
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border-2 border-gray-100 hover:border-purple-200 hover:shadow-2xl transition-all">
                  <div className="text-5xl md:text-6xl font-black text-gray-100 mb-4">{step.step}</div>
                  <div className={`w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                  >
                    <step.icon className="w-7 h-7 md:w-10 md:h-10 text-white" />
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm md:text-base">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-blue-50 via-white to-amber-50">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-10 md:mb-12"
          >
            <span className="text-blue-600 font-black text-xs md:text-sm uppercase tracking-wider">Why Trust Us</span>
            <h2 className="text-3xl md:text-5xl font-black mt-2 text-gray-900">
              Play With Confidence
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: "100% Secure",
                description: "Bank-level security",
                gradient: "from-blue-600 to-blue-700"
              },
              {
                icon: Award,
                title: "Licensed",
                description: "Fully legal in SA",
                gradient: "from-amber-500 to-amber-600"
              },
              {
                icon: TrendingUp,
                title: "Fast Payouts",
                description: "48 hour guarantee",
                gradient: "from-blue-600 to-amber-600"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-xl border-2 border-gray-100"
              >
                <div className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${item.gradient} rounded-xl md:rounded-2xl flex items-center justify-center mb-4`}>
                  <item.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2 text-gray-900">{item.title}</h3>
                <p className="text-gray-600 text-sm md:text-base">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile-Optimized CTA */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4 md:mb-6">
              Ready to Win?
            </h2>
            <p className="text-lg md:text-xl text-blue-100 mb-6 md:mb-8">
              Join thousands winning daily
            </p>
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <Button
                onClick={handlePlayNow}
                className="bg-amber-500 hover:bg-amber-600 text-white font-black px-8 md:px-12 py-6 md:py-7 rounded-full text-base md:text-lg shadow-2xl flex items-center gap-3 uppercase tracking-wider"
              >
                <Trophy className="w-5 h-5 md:w-6 md:h-6" />
                Play Now
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mobile-Friendly Footer */}
      <footer className="bg-gray-900 text-white py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-base md:text-lg font-bold">BabaWina</span>
                  <span className="block text-xs text-amber-400">SOUTH AFRICA</span>
                </div>
              </div>
              <p className="text-xs md:text-sm text-gray-400">
                SA's #1 gaming competition
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-3 md:mb-4 text-amber-400 text-sm">Play</h4>
              <div className="space-y-2">
                <Link href="/competitions" className="block text-xs md:text-sm text-gray-400 hover:text-amber-400 transition-colors">
                  Competitions
                </Link>
                <Link href="/winners" className="block text-xs md:text-sm text-gray-400 hover:text-amber-400 transition-colors">
                  Winners
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold mb-3 md:mb-4 text-amber-400 text-sm">Legal</h4>
              <div className="space-y-2">
                <Link href="/terms" className="block text-xs md:text-sm text-gray-400 hover:text-amber-400 transition-colors">
                  Terms
                </Link>
                <Link href="/privacy" className="block text-xs md:text-sm text-gray-400 hover:text-amber-400 transition-colors">
                  Privacy
                </Link>
              </div>
            </div>
            
            <div className="col-span-2 md:col-span-1">
              <h4 className="font-bold mb-3 md:mb-4 text-amber-400 text-sm">Support</h4>
              <div className="space-y-2">
                <a href="mailto:play@babawina.co.za" className="block text-xs md:text-sm text-gray-400 hover:text-amber-400 transition-colors">
                  play@babawina.co.za
                </a>
                <p className="text-xs md:text-sm text-gray-500 mt-4">
                  18+ Only • Play Responsibly
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-6 md:pt-8 text-center">
            <p className="text-xs md:text-sm text-gray-500">
              © 2025 BabaWina. Made in SA 🇿🇦
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile-Optimized Floating Action Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
        className="fixed bottom-6 right-6 md:hidden z-40"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePlayNow}
          className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full shadow-2xl flex items-center justify-center"
        >
          <Gamepad2 className="w-7 h-7 text-white" />
        </motion.button>
      </motion.div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}