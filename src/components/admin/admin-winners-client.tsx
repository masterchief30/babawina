"use client"

import { useState } from "react"
import { Trophy, Calendar, Target, Search, Mail, User } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Winner {
  competition_id: string
  competition_title: string
  prize_short: string
  prize_value_rand: number
  status: string
  ends_at: string
  winner_email: string
  winner_display_name: string | null
  winner_user_id: string
  guess_x: number
  guess_y: number
  distance: number
  won_at: string
}

interface AdminWinnersClientProps {
  winners: Winner[]
}

export function AdminWinnersClient({ winners }: AdminWinnersClientProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `R${(price / 1000).toFixed(0)}k`
    }
    return `R${price}`
  }

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(2)} px`
  }

  // Filter winners based on search query
  const filteredWinners = winners.filter(winner => 
    winner.competition_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    winner.winner_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    winner.winner_display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Competition Winners</h1>
          <p className="text-gray-600">
            {filteredWinners.length} winner{filteredWinners.length !== 1 ? 's' : ''} announced
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by competition or winner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Winners List */}
      {filteredWinners.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No winners found' : 'No winners yet'}
          </h3>
          <p className="text-gray-600">
            {searchQuery 
              ? `No winners match "${searchQuery}"`
              : 'Winners will appear here once competitions are closed and judged'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredWinners.map((winner) => (
            <div 
              key={`${winner.competition_id}-${winner.winner_user_id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Competition Header */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {winner.competition_title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {winner.prize_short} • {formatPrice(winner.prize_value_rand)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Ended {formatDate(winner.ends_at)}</span>
                  </div>
                </div>
              </div>

              {/* Winner Details */}
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Winner Info */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Winner
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {winner.winner_display_name 
                          ? winner.winner_display_name.charAt(0).toUpperCase()
                          : winner.winner_email.charAt(0).toUpperCase()
                        }
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {winner.winner_display_name || 'No name'}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="w-3 h-3" />
                          {winner.winner_email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guess Coordinates */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Winning Guess
                    </h4>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">X:</span> {winner.guess_x.toFixed(2)}%
                      </div>
                      <div className="text-sm text-gray-700">
                        <span className="font-medium">Y:</span> {winner.guess_y.toFixed(2)}%
                      </div>
                      <div className="text-sm text-emerald-700 font-semibold">
                        Distance: {formatDistance(winner.distance)}
                      </div>
                    </div>
                  </div>

                  {/* Submission Date */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Submitted
                    </h4>
                    <div className="text-sm text-gray-700">
                      {new Date(winner.won_at).toLocaleDateString('en-ZA', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

