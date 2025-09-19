import { createServerSupabaseClient } from "@/lib/supabase-server"
import { WinnersPage } from "@/components/winners/winners-page"

export const metadata = {
  title: "Winners - BabaWina",
  description: "See who won our latest competitions and their winning entries.",
}

export default async function Winners() {
  const supabase = await createServerSupabaseClient()

  // Get all judged competitions with their winners
  const { data: competitions } = await supabase
    .from("competitions")
    .select(`
      *,
      winners (
        *,
        profiles (
          display_name,
          email
        )
      )
    `)
    .eq("status", "judged")
    .order("created_at", { ascending: false })

  return <WinnersPage competitions={competitions || []} />
}
