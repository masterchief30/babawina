import { createClient } from '@supabase/supabase-js'
import { AdminWinnersClient } from '@/components/admin/admin-winners-client'

export default async function AdminWinnersPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Fetch all winning entries with competition and user details
  const { data: winningEntries, error: entriesError } = await supabaseAdmin
    .from('competition_entries')
    .select('*')
    .eq('is_winner', true)

  if (entriesError) {
    console.error('Error fetching winners:', entriesError)
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Winners</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Error loading winners: {entriesError.message}</p>
        </div>
      </div>
    )
  }

  // Fetch competitions
  const { data: competitions } = await supabaseAdmin
    .from('competitions')
    .select('id, title, prize_short, prize_value_rand, status, ends_at')
    .in('status', ['closed', 'judged'])

  // Fetch profiles
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, email, display_name')

  // Combine the data
  const winnersData = winningEntries?.map(entry => {
    const competition = competitions?.find(c => c.id === entry.competition_id)
    const profile = profiles?.find(p => p.id === entry.user_id)
    
    return {
      competition_id: entry.competition_id,
      competition_title: competition?.title || 'Unknown Competition',
      prize_short: competition?.prize_short || '',
      prize_value_rand: competition?.prize_value_rand || 0,
      status: competition?.status || 'unknown',
      ends_at: competition?.ends_at || new Date().toISOString(),
      winner_email: profile?.email || 'Unknown',
      winner_display_name: profile?.display_name,
      winner_user_id: entry.user_id,
      guess_x: entry.guess_x,
      guess_y: entry.guess_y,
      distance: entry.distance_to_ball || 0,
      won_at: entry.created_at
    }
  }).filter(w => w.competition_title !== 'Unknown Competition') || []

  return <AdminWinnersClient winners={winnersData} />
}
