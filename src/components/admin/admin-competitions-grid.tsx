"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
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

export function AdminCompetitionsGrid() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Fetch all competitions
  const fetchCompetitions = useCallback(async () => {
    console.log('🚀 Starting fetchCompetitions...')
    console.log('📊 Current status filter:', statusFilter)
    
    try {
      setLoading(true)
      console.log('🔄 Loading state set to true')
      
      let query = supabase
        .from('competitions')
        .select(`
          id,
          title,
          prize_short,
          prize_value_rand,
          entry_price_rand,
          image_inpainted_path,
          display_photo_path,
          display_photo_alt,
          status,
          starts_at,
          ends_at,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        console.log('🎯 Applying status filter:', statusFilter)
        query = query.eq('status', statusFilter)
      }

      console.log('📡 Executing Supabase query...')
      const { data, error } = await query

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      console.log('✅ Query successful!')
      console.log('🔍 Admin fetched competitions:', data?.length || 0, 'competitions')
      console.log('📊 Status filter:', statusFilter)
      
      if (data && data.length > 0) {
        console.log('📋 Competition details:', data.map(c => ({ 
          id: c.id, 
          title: c.title, 
          status: c.status, 
          ends_at: c.ends_at,
          starts_at: c.starts_at
        })))
      } else {
        console.log('📭 No competitions found in database')
      }

      setCompetitions(data || [])
      console.log('💾 Competitions state updated')
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('💥 Error in fetchCompetitions:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
      console.log('🔄 Loading state set to false')
    }
  }, [statusFilter])

  useEffect(() => {
    console.log('🎬 useEffect triggered - fetching competitions')
    fetchCompetitions()

    // Set up real-time subscription
    const channel = supabase
      .channel('admin-competitions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'competitions'
        },
        () => {
          console.log('🔔 Real-time update received - refetching competitions')
          // Refetch when competitions change
          fetchCompetitions()
        }
      )
      .subscribe()

    return () => {
      console.log('🧹 Cleaning up real-time subscription')
      supabase.removeChannel(channel)
    }
  }, [fetchCompetitions])

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Competitions</h1>
          <Button asChild>
            <Link href="/admin/competitions">
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Unable to load competitions
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Competitions</h1>
          <p className="text-gray-600">
            {competitions.length} competition{competitions.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/admin/competitions">
            <Plus className="w-4 h-4 mr-2" />
            Create New Competition
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by status:</span>
        </div>
        <div className="flex gap-2">
          {['all', 'draft', 'live', 'closed', 'judged'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Competitions Grid */}
      {competitions.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-2xl p-12 max-w-md mx-auto">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {statusFilter === 'all' ? 'No competitions yet' : `No ${statusFilter} competitions`}
            </h3>
            <p className="text-gray-600 mb-6">
              {statusFilter === 'all' 
                ? 'Create your first competition to get started'
                : `No competitions with status "${statusFilter}" found`
              }
            </p>
            {statusFilter === 'all' && (
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <Link href="/admin/competitions">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Competition
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {competitions.map((competition) => (
            <AdminCompetitionTile
              key={competition.id}
              id={competition.id}
              title={competition.title}
              prize_short={competition.prize_short}
              prize_value_rand={competition.prize_value_rand}
              entry_price_rand={competition.entry_price_rand}
              image_inpainted_path={competition.image_inpainted_path || undefined}
              display_photo_path={competition.display_photo_path || undefined}
              display_photo_alt={competition.display_photo_alt || undefined}
              status={competition.status}
              starts_at={competition.starts_at}
              ends_at={competition.ends_at}
              onDelete={fetchCompetitions}
            />
          ))}
        </div>
      )}
    </div>
  )
}
