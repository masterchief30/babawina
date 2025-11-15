import { createClient } from '@supabase/supabase-js'
import { AdminManageClient } from '@/components/admin/admin-manage-client'

// Disable caching to always show fresh data
export const revalidate = 0

// Server component - fetches data server-side like Winners/Users pages
export default async function ManageCompetitionsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  // Use service role client that bypasses RLS - fast and reliable
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🏢 Server: Fetching competitions...')
  
  // Fetch all competitions server-side
  const { data: competitions, error } = await supabaseAdmin
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

  if (error) {
    console.error('❌ Server: Error fetching competitions:', error)
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage Competitions</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Error loading competitions: {error.message}</p>
        </div>
      </div>
    )
  }

  console.log('✅ Server: Fetched', competitions?.length || 0, 'competitions')

  return <AdminManageClient initialCompetitions={competitions || []} />
}
