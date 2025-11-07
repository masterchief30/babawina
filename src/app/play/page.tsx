import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { PlayPage } from "@/components/game/play-page"

export const metadata = {
  title: "Play - BabaWina",
  description: "Place your crosshair where you think the ball is and win the prize!",
}

export default async function Play() {
  const supabase = await createServerSupabaseClient()
  
  // Allow access without authentication - users can play without signing up
  const { data: { user } } = await supabase.auth.getUser()

  // Get current live competition (must have started and not ended)
  const { data: competition } = await supabase
    .from("competitions")
    .select("*")
    .eq("status", "live")
    .lte("starts_at", new Date().toISOString()) // Only show if start date has arrived
    .gte("ends_at", new Date().toISOString())   // Only show if not expired
    .single()

  if (!competition) {
    redirect("/")
  }

  // Check if user already has an entry for this competition (only if authenticated)
  let existingEntry = null
  if (user) {
    const { data } = await supabase
      .from("entries")
      .select("*")
      .eq("competition_id", competition.id)
      .eq("user_id", user.id)
      .single()
    existingEntry = data
  }

  return (
    <PlayPage 
      competition={competition}
      user={user}
      hasExistingEntry={!!existingEntry}
    />
  )
}
