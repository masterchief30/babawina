import { createClient } from '@supabase/supabase-js'
import { AdminUsersClient } from '@/components/admin/admin-users-client'

// Disable caching to always show fresh data
export const revalidate = 0

// Server component that fetches users with admin privileges
export default async function UsersPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  // Use service role client that bypasses RLS
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Fetch users
  const { data: users, error: usersError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (usersError) {
    console.error('Error fetching users:', usersError)
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Users</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Error loading users: {usersError.message}</p>
        </div>
      </div>
    )
  }

  // Fetch all competition entries to get activity data
  const { data: entries } = await supabaseAdmin
    .from('competition_entries')
    .select('user_id, created_at')
    .order('created_at', { ascending: false })

  // Process users to include their entry activity
  const usersWithActivity = users?.map(user => {
    const userEntries = entries?.filter(e => e.user_id === user.id) || []
    const lastEntry = userEntries.length > 0 ? userEntries[0] : null
    
    return {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      role: user.role,
      created_at: user.created_at,
      last_entry_at: lastEntry?.created_at || null,
      entry_count: userEntries.length
    }
  }) || []

  return <AdminUsersClient initialUsers={usersWithActivity} />
}
