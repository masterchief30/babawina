import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { AccountPage } from "@/components/account/account-page"

export const metadata = {
  title: "My Account - BabaWina",
  description: "Manage your account, view your entries, and track your competition history.",
}

export default async function Account() {
  const supabase = await createServerSupabaseClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Get user's entries with competition details
  const { data: entries } = await supabase
    .from("entries")
    .select(`
      *,
      competitions (
        title,
        prize_short,
        status,
        ends_at
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <AccountPage 
      user={user}
      profile={profile}
      entries={entries || []}
    />
  )
}
