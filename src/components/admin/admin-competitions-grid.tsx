"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { AdminCompetitionTile } from "./admin-competition-tile"
import { Button } from "@/components/ui/button"
import { Plus, Filter, RefreshCw } from "lucide-react"
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
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch all competitions
  const fetchCompetitions = async () => {
    console.log('🚀 Starting fetchCompetitions...')
    console.log('📊 Current status filter:', statusFilter)
    
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Loading state set to true')
      
      // Try with display photo columns first
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
      
      // Check authentication status
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔐 Current session:', session ? `User: ${session.user.email}` : 'No session')
      
      let { data, error } = await query

      // Fallback: If error (likely missing columns), try without display photo fields
      if (error) {
        console.log('⚠️ Query failed, trying fallback without display_photo fields...')
        console.log('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        
        let fallbackQuery = supabase
          .from('competitions')
          .select(`
            id,
            title,
            prize_short,
            prize_value_rand,
            entry_price_rand,
            image_inpainted_path,
            status,
            starts_at,
            ends_at,
            created_at
          `)
          .order('created_at', { ascending: false })

        if (statusFilter !== 'all') {
          fallbackQuery = fallbackQuery.eq('status', statusFilter)
        }

        const fallbackResult = await fallbackQuery
        error = fallbackResult.error
        
        // Add null display photo fields to maintain compatibility
        if (fallbackResult.data) {
          data = fallbackResult.data.map(comp => ({
            ...comp,
            display_photo_path: null,
            display_photo_alt: null
          }))
        } else {
          data = null
        }
      }

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      console.log('✅ Query successful!')
      console.log('🔍 Admin fetched competitions:', data?.length || 0, 'competitions')
      
      if (data && data.length > 0) {
        console.log('📋 Competition details:', data.map(c => ({ 
          id: c.id, 
          title: c.title, 
          status: c.status
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
  }

  // Fetch competitions on mount and when filter changes
  useEffect(() => {
    console.log('🎬 useEffect triggered - fetching competitions')
    console.log('📊 Current status filter:', statusFilter)
    
    // Safety timeout - if loading takes more than 5 seconds, show error
    const timeoutId = setTimeout(() => {
      console.error('⏰ Loading timeout - stopping infinite load')
      setError('Loading timeout. Please refresh the page.')
      setLoading(false)
    }, 5000)
    
    fetchCompetitions().finally(() => {
      clearTimeout(timeoutId)
    })

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
          fetchCompetitions()
        }
      )
      .subscribe()

    return () => {
      console.log('🧹 Cleaning up real-time subscription')
      clearTimeout(timeoutId)
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  // Manual refresh handler
  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered')
    setIsRefreshing(true)
    await fetchCompetitions()
    setIsRefreshing(false)
  }

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
        
        {/* Centered Spinner */}
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-emerald-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          
          <p className="mt-6 text-lg font-medium text-gray-700 animate-pulse">
            Loading competitions...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Fetching competition data
          </p>
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
        <div className="flex gap-3">
          <Button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
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
