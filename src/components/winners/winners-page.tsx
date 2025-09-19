"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDistance, getInitials } from "@/lib/utils"
import { Trophy, Medal, Award, ArrowLeft, ExternalLink } from "lucide-react"

interface Winner {
  id: string
  rank: number
  distance: number
  announced_at: string
  profiles: {
    display_name: string | null
    email: string
  }
}

interface Competition {
  id: string
  title: string
  prize_short: string
  prize_value_rand: number
  entry_price_rand: number
  ends_at: string
  judged_x: number | null
  judged_y: number | null
  winners: Winner[]
}

interface WinnersPageProps {
  competitions: Competition[]
}

export function WinnersPage({ competitions }: WinnersPageProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-bold">{rank}</div>
    }
  }

  const getDisplayName = (winner: Winner) => {
    const name = winner.profiles.display_name || winner.profiles.email.split('@')[0]
    // For privacy, show only initials for non-first place
    if (winner.rank === 1) {
      return name
    }
    return getInitials(name)
  }

  const getLocation = (email: string) => {
    // Mock location based on email domain or random SA cities
    const cities = ["Cape Town", "Johannesburg", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein"]
    return cities[Math.floor(Math.random() * cities.length)]
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
            <Link href="/account" className="text-sm font-medium hover:text-accent transition-colors">
              Account
            </Link>
          </nav>

          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2">Winners</h1>
          <p className="text-xl text-muted-foreground text-center mb-12">
            Congratulations to our competition winners!
          </p>

          {competitions.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No Winners Yet</h2>
              <p className="text-muted-foreground mb-6">
                Be the first to win! Check out our current competitions.
              </p>
              <Link href="/">
                <Button variant="accent">
                  View Current Competitions
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-12">
              {competitions.map((competition) => (
                <div key={competition.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  {/* Competition Header */}
                  <div className="bg-gradient-to-r from-accent/10 to-accent/5 p-6 border-b">
                    <h2 className="text-2xl font-bold mb-2">{competition.title}</h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Prize: {competition.prize_short}</span>
                      <span>Value: {formatCurrency(competition.prize_value_rand)}</span>
                      <span>Ended: {new Date(competition.ends_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Winners List */}
                  <div className="p-6">
                    {competition.winners.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Winners will be announced soon.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {competition.winners
                          .sort((a, b) => a.rank - b.rank)
                          .map((winner) => (
                            <div
                              key={winner.id}
                              className={`flex items-center justify-between p-4 rounded-lg border ${
                                winner.rank === 1 
                                  ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200" 
                                  : "bg-muted/30"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                {getRankIcon(winner.rank)}
                                <div>
                                  <div className="font-semibold">
                                    {getDisplayName(winner)} • {getLocation(winner.profiles.email)}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Distance: {formatDistance(winner.distance)}
                                  </div>
                                </div>
                              </div>
                              
                              {winner.rank === 1 && (
                                <div className="text-right">
                                  <div className="text-lg font-bold text-accent">
                                    🎉 Winner!
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {competition.prize_short}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Transparency Note */}
                    <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <ExternalLink className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium mb-1">Fair & Transparent</p>
                          <p className="text-muted-foreground">
                            Closest to judged ball position wins. Judging footage available on request.
                            Contact{" "}
                            <a 
                              href="mailto:support@babawina.co.za" 
                              className="text-accent hover:underline"
                            >
                              support@babawina.co.za
                            </a>{" "}
                            for verification.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Next Competition Teaser */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-accent/10 to-accent/5 rounded-2xl p-8 border">
              <h2 className="text-2xl font-bold mb-4">Ready for the Next Challenge?</h2>
              <p className="text-muted-foreground mb-6">
                New competitions are starting soon. Don't miss your chance to win!
              </p>
              <Link href="/">
                <Button variant="accent" size="lg">
                  Play Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
