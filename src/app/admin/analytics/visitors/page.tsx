import { createClient } from "@supabase/supabase-js"
import { VisitorDetailsClient } from "@/components/admin/visitor-details-client"

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
  title: "Visitor Details - BabaWina Admin",
  description: "Detailed visitor tracking with IP addresses and geographic data",
}

export interface PageVisit {
  path: string
  timestamp: string
  timeSpent: number // seconds spent on this page
}

export interface VisitorData {
  userId: number
  firstVisit: string
  lastVisit: string
  ipAddress: string
  country: string | null
  city: string | null
  visitType: 'first' | 'returning'
  totalVisits: number
  device: string
  browser: string
  pagesViewed: number
  sessionDuration: number
  conversionStatus: 'converted' | 'engaged' | 'browsing'
  trafficSource: string
  lastPage: string
  pageJourney: PageVisit[] // NEW: Track their page-by-page journey
  email: string | null // NEW: Email for converted users only
}

async function fetchVisitorData(): Promise<VisitorData[]> {
  const GO_LIVE_DATE = '2025-11-15T10:00:00Z'
  const supabase = createAdminClient()

  try {
    // Get all sessions grouped by IP address (treating each unique IP as a "user")
    const { data: sessions, error: sessionsError } = await supabase
      .from('analytics_sessions')
      .select('*')
      .gte('created_at', GO_LIVE_DATE)
      .order('created_at', { ascending: true })

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return []
    }

    // Get all events for conversion tracking
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('session_id, event_name, page_path, created_at, event_data')
      .gte('created_at', GO_LIVE_DATE)

    if (eventsError) {
      console.error('Error fetching events:', eventsError)
    }

    // Group sessions by IP address
    const visitorMap = new Map<string, any>()
    
    sessions?.forEach((session, index) => {
      const ip = session.ip_address || 'unknown'
      
      if (!visitorMap.has(ip)) {
        // First time seeing this IP
        visitorMap.set(ip, {
          userId: visitorMap.size + 1, // Sequential numbering
          firstVisit: session.created_at,
          lastVisit: session.last_seen_at || session.created_at,
          ipAddress: ip,
          country: session.country,
          city: session.city,
          totalVisits: 1,
          device: session.device_type,
          browser: session.browser,
          trafficSource: session.utm_source || 'direct',
          sessionIds: [session.session_id],
          didSignup: session.did_signup || false,
          didPlaceBet: session.did_place_bet || false,
          didAddPayment: session.did_add_payment || false,
          supabaseUserId: session.user_id || null, // Track Supabase user ID for email lookup
        })
      } else {
        // Returning visitor
        const visitor = visitorMap.get(ip)
        visitor.totalVisits++
        visitor.lastVisit = session.last_seen_at || session.created_at
        visitor.sessionIds.push(session.session_id)
        visitor.didSignup = visitor.didSignup || session.did_signup || false
        visitor.didPlaceBet = visitor.didPlaceBet || session.did_place_bet || false
        visitor.didAddPayment = visitor.didAddPayment || session.did_add_payment || false
        // Update user ID if we found one
        visitor.supabaseUserId = visitor.supabaseUserId || session.user_id || null
      }
    })

    // Fetch emails for converted users
    const userIds = Array.from(visitorMap.values())
      .filter(v => v.supabaseUserId && (v.didSignup || v.didPlaceBet || v.didAddPayment))
      .map(v => v.supabaseUserId)
    
    const emailMap = new Map<string, string>()
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds)
      
      users?.forEach(user => {
        if (user.email) {
          emailMap.set(user.id, user.email)
        }
      })
    }

    // Calculate pages viewed and session duration for each visitor
    const visitors: VisitorData[] = Array.from(visitorMap.values()).map(visitor => {
      // Count page views for this visitor's sessions
      const visitorEvents = events?.filter(e => 
        visitor.sessionIds.includes(e.session_id)
      ) || []
      
      // Include both 'page_view' and 'competition_viewed' events as page views
      const pageViews = visitorEvents.filter(e => 
        e.event_name === 'page_view' || e.event_name === 'competition_viewed'
      )
      const lastPageEvent = pageViews[pageViews.length - 1]
      
      // Calculate total session duration
      const visitorSessions = sessions?.filter(s => 
        visitor.sessionIds.includes(s.session_id)
      ) || []
      
      const totalDuration = visitorSessions.reduce((sum, s) => 
        sum + (s.session_duration_seconds || 0), 0
      )

      // Determine conversion status
      let conversionStatus: 'converted' | 'engaged' | 'browsing' = 'browsing'
      if (visitor.didSignup || visitor.didPlaceBet || visitor.didAddPayment) {
        conversionStatus = 'converted'
      } else if (pageViews.length > 3 || totalDuration > 60) {
        conversionStatus = 'engaged'
      }

      // Build page journey (ordered page visits with time spent on each)
      const sortedPageViews = pageViews.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      
      const pageJourney: PageVisit[] = sortedPageViews.map((pv, index) => {
        // Calculate time spent: difference between this page view and the next one
        let timeSpent = 0
        if (index < sortedPageViews.length - 1) {
          const currentTime = new Date(pv.created_at).getTime()
          const nextTime = new Date(sortedPageViews[index + 1].created_at).getTime()
          timeSpent = Math.round((nextTime - currentTime) / 1000) // convert to seconds
        } else {
          // For the last page, calculate remaining time from total duration
          // Sum up all previous page times
          const previousPagesTime = sortedPageViews
            .slice(0, index)
            .reduce((sum, _, idx) => {
              if (idx < sortedPageViews.length - 1) {
                const curr = new Date(sortedPageViews[idx].created_at).getTime()
                const next = new Date(sortedPageViews[idx + 1].created_at).getTime()
                return sum + Math.round((next - curr) / 1000)
              }
              return sum
            }, 0)
          
          // Remaining time = total duration - time spent on previous pages
          timeSpent = Math.max(0, totalDuration - previousPagesTime)
        }
        
        // Get friendly page name from event data if available (for competitions)
        let displayPath = pv.page_path || '/'
        if (pv.event_data?.competition_title) {
          // Competition page with title and end date
          const endDate = pv.event_data.end_date 
            ? new Date(pv.event_data.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : ''
          displayPath = endDate 
            ? `🎮 ${pv.event_data.competition_title} (Ends: ${endDate})`
            : `🎮 ${pv.event_data.competition_title}`
        } else if (pv.event_data?.page_title) {
          displayPath = pv.event_data.page_title
        }
        
        return {
          path: displayPath,
          timestamp: pv.created_at,
          timeSpent
        }
      })

      // Format last page name
      let lastPageDisplay = lastPageEvent?.page_path || '/'
      if (lastPageEvent?.event_data?.competition_title) {
        const endDate = lastPageEvent.event_data.end_date 
          ? new Date(lastPageEvent.event_data.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : ''
        lastPageDisplay = endDate 
          ? `🎮 ${lastPageEvent.event_data.competition_title} (Ends: ${endDate})`
          : `🎮 ${lastPageEvent.event_data.competition_title}`
      } else if (lastPageEvent?.event_data?.page_title) {
        lastPageDisplay = lastPageEvent.event_data.page_title
      }

      // Get email if user converted
      const email = (conversionStatus === 'converted' && visitor.supabaseUserId) 
        ? emailMap.get(visitor.supabaseUserId) || null 
        : null

      return {
        userId: visitor.userId,
        firstVisit: visitor.firstVisit,
        lastVisit: visitor.lastVisit,
        ipAddress: visitor.ipAddress,
        country: visitor.country,
        city: visitor.city,
        visitType: visitor.totalVisits > 1 ? 'returning' : 'first',
        totalVisits: visitor.totalVisits,
        device: visitor.device || 'unknown',
        browser: visitor.browser || 'unknown',
        pagesViewed: pageViews.length,
        sessionDuration: totalDuration,
        conversionStatus,
        trafficSource: visitor.trafficSource,
        lastPage: lastPageDisplay,
        pageJourney, // NEW: Include page journey
        email, // NEW: Email for converted users only
      }
    })

    // Sort by last visit (most recent first = newest visitors at top)
    return visitors.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime())

  } catch (error) {
    console.error('Error fetching visitor data:', error)
    return []
  }
}

export default async function VisitorsPage() {
  const visitors = await fetchVisitorData()

  return <VisitorDetailsClient visitors={visitors} />
}

