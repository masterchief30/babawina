import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata = {
  title: "Admin Dashboard - BabaWina",
  description: "Manage competitions and process images",
}

export default async function AdminPage() {
  // Redirect to admin dashboard
  redirect("/admin/dashboard")
}
