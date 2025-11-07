import { createClient } from '@supabase/supabase-js'
import { HomePage } from "@/components/home/home-page"

// Server component - fetches competitions server-side
export default async function Home() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // Use anon client for public data (respects RLS)
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const now = new Date().toISOString()
  console.log('🏠 Server: Fetching live competitions at', now)

  // Fetch live competitions server-side
  const { data: competitions, error } = await supabase
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
    .eq('status', 'live')
    .lte('starts_at', now) // Only show if start date has arrived
    .gte('ends_at', now)   // Only show if not expired
    .order('ends_at', { ascending: true })
    .limit(9)

  if (error) {
    console.error('🏠 Server: Error fetching competitions:', error)
  } else {
    console.log('🏠 Server: Fetched', competitions?.length || 0, 'competitions')
    if (competitions && competitions.length > 0) {
      console.log('🏠 Server: Competition details:', competitions.map(c => ({
        title: c.title,
        status: c.status,
        starts_at: c.starts_at,
        ends_at: c.ends_at
      })))
    } else {
      console.log('⚠️ No competitions found with status=live, starts_at <=', now, ', ends_at >=', now)
    }
  }

  return <HomePage initialCompetitions={competitions || []} />
}
