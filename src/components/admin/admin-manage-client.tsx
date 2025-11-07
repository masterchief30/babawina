"use client"

import { useState } from "react"
import { AdminCompetitionTile } from "./admin-competition-tile"
import { Button } from "@/components/ui/button"
import { Plus, Filter } from "lucide-react"
import Link from "next/link"

interface Competition {
  id: string
  title: string
  prize_short: string
  prize_value_rand: number
  entry_price_rand: number
  image_inpainted_path: string | null
  display_photo_path: string | null
  display_photo_alt: string | null
  status: 'draft' | 'live' | 'closed' | 'judged'
  starts_at: string
  ends_at: string
  created_at: string
}

interface AdminManageClientProps {
  initialCompetitions: Competition[]
}

export function AdminManageClient({ initialCompetitions }: AdminManageClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Filter competitions based on status
  const filteredCompetitions = statusFilter === 'all' 
    ? initialCompetitions
    : initialCompetitions.filter(c => c.status === statusFilter)

  const counts = {
    all: initialCompetitions.length,
    draft: initialCompetitions.filter(c => c.status === 'draft').length,
    live: initialCompetitions.filter(c => c.status === 'live').length,
    closed: initialCompetitions.filter(c => c.status === 'closed').length,
    judged: initialCompetitions.filter(c => c.status === 'judged').length,
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Competitions</h1>
          <p className="text-gray-600">
            {filteredCompetitions.length} competition{filteredCompetitions.length !== 1 ? 's' : ''} 
            {statusFilter !== 'all' && ` (${statusFilter})`}
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/admin/competitions">
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <Filter className="w-5 h-5 text-gray-500" />
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: `All (${counts.all})` },
            { value: 'draft', label: `Draft (${counts.draft})` },
            { value: 'live', label: `Live (${counts.live})` },
            { value: 'closed', label: `Closed (${counts.closed})` },
            { value: 'judged', label: `Judged (${counts.judged})` },
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === filter.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Competitions Grid */}
      {filteredCompetitions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">
            {statusFilter === 'all' 
              ? 'No competitions yet. Create your first one!'
              : `No ${statusFilter} competitions.`}
          </p>
          <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700">
            <Link href="/admin/competitions">
              <Plus className="w-4 h-4 mr-2" />
              Create Competition
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCompetitions.map(competition => (
            <AdminCompetitionTile
              key={competition.id}
              id={competition.id}
              title={competition.title}
              prize_short={competition.prize_short}
              prize_value_rand={competition.prize_value_rand}
              entry_price_rand={competition.entry_price_rand}
              image_inpainted_path={competition.image_inpainted_path}
              display_photo_path={competition.display_photo_path}
              display_photo_alt={competition.display_photo_alt}
              status={competition.status}
              starts_at={competition.starts_at}
              ends_at={competition.ends_at}
            />
          ))}
        </div>
      )}
    </div>
  )
}

