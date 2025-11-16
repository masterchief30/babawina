import { createClient } from "@supabase/supabase-js"
import { AnalyticsDashboardClient } from "@/components/admin/analytics-dashboard-client"

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Create admin client with service role key
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export const metadata = {
  title: "Traffic & Analytics - BabaWina Admin",
  description: "Monitor traffic sources, user behavior, and conversion funnel",
}

interface AnalyticsMetrics {
  overview: {
    totalVisits: number
    uniqueVisitors: number
    avgSessionDuration: number
    bounceRate: number
    todayVisits: number
    weekVisits: number
  }
  sources: {
    source: string
    visitors: number
    signups: number
    bets: number
    conversionRate: number
  }[]
  funnel: {
    landing: number
    competitionView: number
    signup: number
    bet: number
    payment: number
  }
  topPages: {
    path: string
    views: number
  }[]
}

async function fetchAnalyticsMetrics(): Promise<AnalyticsMetrics> {
  const supabase = createAdminClient()
  
  // Go-live date
  const GO_LIVE_DATE = '2025-11-15T10:00:00Z'
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  try {
    // Fetch all sessions
    const { data: allSessions } = await supabase
      .from('analytics_sessions')
      .select('*')
      .gte('started_at', GO_LIVE_DATE)

    const todaySessions = allSessions?.filter(s => 
      new Date(s.started_at) >= today
    ) || []
    
    const weekSessions = allSessions?.filter(s => 
      new Date(s.started_at) >= weekAgo
    ) || []

    // Calculate overview metrics
    const totalVisits = allSessions?.length || 0
    const uniqueVisitors = new Set(allSessions?.map(s => s.user_id).filter(Boolean)).size
    const avgSessionDuration = totalVisits > 0 
      ? Math.round(allSessions?.reduce((sum, s) => sum + (s.session_duration_seconds || 0), 0) / totalVisits)
      : 0
    
    // Bounce rate = sessions with only 1 page view
    const { data: pageViews } = await supabase
      .from('analytics_events')
      .select('session_id')
      .eq('event_name', 'page_view')
      .gte('created_at', GO_LIVE_DATE)
    
    const sessionsWithOneView = new Set(
      pageViews?.filter(pv => 
        pageViews.filter(p => p.session_id === pv.session_id).length === 1
      ).map(pv => pv.session_id)
    ).size
    const bounceRate = totalVisits > 0 ? (sessionsWithOneView / totalVisits) * 100 : 0

    // Traffic sources
    const sourceGroups = allSessions?.reduce((acc: any, session) => {
      const source = session.utm_source || 'direct'
      if (!acc[source]) {
        acc[source] = { visitors: 0, signups: 0, bets: 0 }
      }
      acc[source].visitors++
      if (session.did_signup) acc[source].signups++
      if (session.did_place_bet) acc[source].bets++
      return acc
    }, {}) || {}

    const sources = Object.entries(sourceGroups).map(([source, data]: [string, any]) => ({
      source,
      visitors: data.visitors,
      signups: data.signups,
      bets: data.bets,
      conversionRate: (data.bets / data.visitors) * 100,
    })).sort((a, b) => b.visitors - a.visitors)

    // Conversion funnel
    const landing = totalVisits
    const competitionView = allSessions?.filter(s => s.did_view_competition).length || 0
    const signup = allSessions?.filter(s => s.did_signup).length || 0
    const bet = allSessions?.filter(s => s.did_place_bet).length || 0
    const payment = allSessions?.filter(s => s.did_add_payment).length || 0

    // Top pages
    // For competition pages, we need to check both page_view and competition_viewed events
    const { data: allPageViews } = await supabase
      .from('analytics_events')
      .select('page_path, event_data')
      .eq('event_name', 'page_view')
      .gte('created_at', GO_LIVE_DATE)

    const { data: allCompetitionViews } = await supabase
      .from('analytics_events')
      .select('page_path, event_data')
      .eq('event_name', 'competition_viewed')
      .gte('created_at', GO_LIVE_DATE)

    // Build a map of competition page paths to their titles (one title per path)
    const competitionTitleMap = new Map<string, string>()
    allCompetitionViews?.forEach(event => {
      if (event.page_path && event.event_data?.page_title && !competitionTitleMap.has(event.page_path)) {
        competitionTitleMap.set(event.page_path, event.event_data.page_title)
      }
    })

    const pageGroups = allPageViews?.reduce((acc: any, event) => {
      const path = event.page_path || '/'
      
      // For competition pages, use the mapped title if available
      let displayPath = path
      if (path.startsWith('/play/')) {
        displayPath = competitionTitleMap.get(path) || path
      }
      
      acc[displayPath] = (acc[displayPath] || 0) + 1
      return acc
    }, {}) || {}

    const topPages = Object.entries(pageGroups)
      .map(([path, views]) => ({ path, views: views as number }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)

    return {
      overview: {
        totalVisits,
        uniqueVisitors,
        avgSessionDuration: Math.round(avgSessionDuration),
        bounceRate: Math.round(bounceRate),
        todayVisits: todaySessions.length,
        weekVisits: weekSessions.length,
      },
      sources,
      funnel: {
        landing,
        competitionView,
        signup,
        bet,
        payment,
      },
      topPages,
    }

  } catch (error) {
    console.error('Error fetching analytics metrics:', error)
    // Return empty metrics on error
    return {
      overview: {
        totalVisits: 0,
        uniqueVisitors: 0,
        avgSessionDuration: 0,
        bounceRate: 0,
        todayVisits: 0,
        weekVisits: 0,
      },
      sources: [],
      funnel: {
        landing: 0,
        competitionView: 0,
        signup: 0,
        bet: 0,
        payment: 0,
      },
      topPages: [],
    }
  }
}

export default async function AnalyticsPage() {
  const metrics = await fetchAnalyticsMetrics()

  return <AnalyticsDashboardClient metrics={metrics} />
}

