import { createClient } from "@supabase/supabase-js"
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client"

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
  title: "Admin Dashboard - BabaWina",
  description: "Monitor revenue, users, and competition metrics",
}

interface DashboardMetrics {
  revenue: {
    today: number
    week: number
    month: number
    allTime: number
    todayTransactions: number
    weekTransactions: number
    monthTransactions: number
    allTimeTransactions: number
    stripeFees: number
  }
  users: {
    total: number
    todaySignups: number
    weekSignups: number
    monthSignups: number
    withPaymentMethods: number
    activeUsers: number
  }
  competitions: {
    live: number
    todayEntries: number
    weekEntries: number
    monthEntries: number
    allTimeEntries: number
    freeEntries: number
    paidEntries: number
    mostPopular: { title: string; entries: number } | null
  }
}

async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createAdminClient()
  
  // Go-live date: Nov 15, 2025 11:00 AM German time (10:00 UTC)
  const GO_LIVE_DATE = '2025-11-15T10:00:00Z'
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const monthAgo = new Date(today)
  monthAgo.setDate(monthAgo.getDate() - 30)

  try {
    // Fetch Revenue Data - Only real Stripe transactions from go-live onwards
    const { data: allTransactions } = await supabase
      .from('transactions')
      .select('amount_rand, created_at')
      .eq('status', 'succeeded')
      .not('stripe_payment_intent_id', 'is', null) // Only real Stripe transactions
      .gte('created_at', GO_LIVE_DATE)

    const todayTransactions = allTransactions?.filter(t => 
      new Date(t.created_at) >= today
    ) || []
    
    const weekTransactions = allTransactions?.filter(t => 
      new Date(t.created_at) >= weekAgo
    ) || []
    
    const monthTransactions = allTransactions?.filter(t => 
      new Date(t.created_at) >= monthAgo
    ) || []

    const totalRevenue = allTransactions?.reduce((sum, t) => sum + (t.amount_rand || 0), 0) || 0
    
    const revenue = {
      today: todayTransactions.reduce((sum, t) => sum + (t.amount_rand || 0), 0),
      week: weekTransactions.reduce((sum, t) => sum + (t.amount_rand || 0), 0),
      month: monthTransactions.reduce((sum, t) => sum + (t.amount_rand || 0), 0),
      allTime: totalRevenue,
      todayTransactions: todayTransactions.length,
      weekTransactions: weekTransactions.length,
      monthTransactions: monthTransactions.length,
      allTimeTransactions: allTransactions?.length || 0,
      stripeFees: totalRevenue * 0.26, // 26% of gross revenue
    }

    // Fetch User Data - Only from go-live onwards
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', GO_LIVE_DATE)

    const { data: usersWithPayment } = await supabase
      .from('user_payment_methods')
      .select('user_id')
      .gte('created_at', GO_LIVE_DATE)

    const { data: activeUsers } = await supabase
      .from('competition_entries')
      .select('user_id')
      .gte('created_at', GO_LIVE_DATE)

    const uniqueActiveUsers = new Set(activeUsers?.map(e => e.user_id) || [])

    const users = {
      total: allUsers?.length || 0,
      todaySignups: allUsers?.filter(u => new Date(u.created_at) >= today).length || 0,
      weekSignups: allUsers?.filter(u => new Date(u.created_at) >= weekAgo).length || 0,
      monthSignups: allUsers?.filter(u => new Date(u.created_at) >= monthAgo).length || 0,
      withPaymentMethods: usersWithPayment?.length || 0,
      activeUsers: uniqueActiveUsers.size,
    }

    // Fetch Competition Data
    const { data: liveCompetitions } = await supabase
      .from('competitions')
      .select('id')
      .eq('status', 'live')

    const { data: allEntries } = await supabase
      .from('competition_entries')
      .select('created_at, was_free_entry, competition_id')
      .gte('created_at', GO_LIVE_DATE) // Only entries from go-live onwards

    const todayEntries = allEntries?.filter(e => new Date(e.created_at) >= today) || []
    const weekEntries = allEntries?.filter(e => new Date(e.created_at) >= weekAgo) || []
    const monthEntries = allEntries?.filter(e => new Date(e.created_at) >= monthAgo) || []

    const freeEntries = allEntries?.filter(e => e.was_free_entry).length || 0
    const paidEntries = (allEntries?.length || 0) - freeEntries

    // Find most popular competition
    const competitionCounts = new Map<string, number>()
    allEntries?.forEach(entry => {
      const count = competitionCounts.get(entry.competition_id) || 0
      competitionCounts.set(entry.competition_id, count + 1)
    })

    let mostPopular: { title: string; entries: number } | null = null
    if (competitionCounts.size > 0) {
      const mostPopularId = Array.from(competitionCounts.entries())
        .sort((a, b) => b[1] - a[1])[0][0]
      
      const { data: comp } = await supabase
        .from('competitions')
        .select('title')
        .eq('id', mostPopularId)
        .single()

      if (comp) {
        mostPopular = {
          title: comp.title,
          entries: competitionCounts.get(mostPopularId) || 0
        }
      }
    }

    const competitions = {
      live: liveCompetitions?.length || 0,
      todayEntries: todayEntries.length,
      weekEntries: weekEntries.length,
      monthEntries: monthEntries.length,
      allTimeEntries: allEntries?.length || 0,
      freeEntries,
      paidEntries,
      mostPopular,
    }

    return { revenue, users, competitions }

  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    // Return empty metrics on error
    return {
      revenue: {
        today: 0,
        week: 0,
        month: 0,
        allTime: 0,
        todayTransactions: 0,
        weekTransactions: 0,
        monthTransactions: 0,
        allTimeTransactions: 0,
        stripeFees: 0,
      },
      users: {
        total: 0,
        todaySignups: 0,
        weekSignups: 0,
        monthSignups: 0,
        withPaymentMethods: 0,
        activeUsers: 0,
      },
      competitions: {
        live: 0,
        todayEntries: 0,
        weekEntries: 0,
        monthEntries: 0,
        allTimeEntries: 0,
        freeEntries: 0,
        paidEntries: 0,
        mostPopular: null,
      },
    }
  }
}

export default async function AdminDashboardPage() {
  const metrics = await fetchDashboardMetrics()

  return <AdminDashboardClient metrics={metrics} />
}
