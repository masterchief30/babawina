"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CountdownTimer } from "@/components/ui/countdown-timer"
import { CompetitionTilesGrid } from "@/components/landing/competition-tiles-grid"
import { AuthModal } from "@/components/auth/auth-modal"
import { useAuth } from "@/components/auth/auth-provider"
import { formatCurrency } from "@/lib/utils"
import { Trophy, Target, Users, Shield, CheckCircle } from "lucide-react"

// Mock data for current competition - in real app this would come from Supabase
const mockCompetition = {
  id: "1",
  title: "Win a PlayStation 5 for R30",
  prize_short: "PlayStation 5",
  prize_value_rand: 12000,
  entry_price_rand: 30,
  ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  status: "live" as const,
}

export function HomePage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, loading } = useAuth()

  const handlePlayNow = () => {
    if (!user) {
      setShowAuthModal(true)
    } else {
      // Redirect to game page
      window.location.href = "/play"
    }
  }

  const handleAuthSuccess = () => {
    setShowAuthModal(false)
    // Redirect to game page after successful auth
    window.location.href = "/play"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-primary">
            BabaWina
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/winners" className="text-sm font-medium hover:text-accent transition-colors">
              Winners
            </Link>
            <Link href="/account" className="text-sm font-medium hover:text-accent transition-colors">
              Account
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Welcome back!
                </span>
                <Button onClick={handlePlayNow} variant="accent">
                  Play Now
                </Button>
              </div>
            ) : (
              <Button onClick={handlePlayNow} variant="accent">
                Play Now
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6">
            Win Big with BabaWina
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Play Spot-the-Ball. Get closest to the ball's true position and win the prize.
          </p>
        </div>
      </section>

      {/* Competition Tiles */}
      <CompetitionTilesGrid />

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-primary mb-12">
            How it works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Sign up or log in</h3>
              <p className="text-muted-foreground">
                Create your account or sign in to get started. It's quick and easy.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Place your crosshair</h3>
              <p className="text-muted-foreground">
                Zoom in and place your crosshair where you think the centre of the ball is.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Win the prize</h3>
              <p className="text-muted-foreground">
                When the competition ends, the closest entry wins. Simple.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-accent" />
                <h3 className="text-lg font-semibold">Fair & Transparent</h3>
              </div>
              <p className="text-muted-foreground">
                All competitions are judged fairly. Closest to the ball's true position wins. 
                Judging footage available on request.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="h-6 w-6 text-accent" />
                <h3 className="text-lg font-semibold">Proudly South African</h3>
              </div>
              <p className="text-muted-foreground">
                Built for South Africans, by South Africans. 
                Local support and ZAR prizes you can actually use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">BabaWina</h3>
              <p className="text-sm text-muted-foreground">
                South Africa's premier Spot-the-Ball competition platform.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2">
                <Link href="/legal/terms" className="block text-sm text-muted-foreground hover:text-accent">
                  Terms of Service
                </Link>
                <Link href="/legal/privacy" className="block text-sm text-muted-foreground hover:text-accent">
                  Privacy Policy
                </Link>
                <Link href="/legal/responsible" className="block text-sm text-muted-foreground hover:text-accent">
                  Responsible Play
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2">
                <a 
                  href="mailto:support@babawina.co.za" 
                  className="block text-sm text-muted-foreground hover:text-accent"
                >
                  support@babawina.co.za
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Play Responsibly</h4>
              <p className="text-sm text-muted-foreground">
                18+ only. Play responsibly.
              </p>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2025 BabaWina. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}
