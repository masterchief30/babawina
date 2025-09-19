import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { PlayPage } from "@/components/game/play-page"

export const metadata = {
  title: "Play - BabaWina",
  description: "Place your crosshair where you think the ball is and win the prize!",
}

export default async function Play() {
  const supabase = await createServerSupabaseClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/")
  }

  // Get current live competition
  const { data: competition } = await supabase
    .from("competitions")
    .select("*")
    .eq("status", "live")
    .single()

  if (!competition) {
    redirect("/")
  }

  // Check if user already has an entry for this competition
  const { data: existingEntry } = await supabase
    .from("entries")
    .select("*")
    .eq("competition_id", competition.id)
    .eq("user_id", user.id)
    .single()

  return (
    <PlayPage 
      competition={competition}
      user={user}
      hasExistingEntry={!!existingEntry}
    />
  )
}
