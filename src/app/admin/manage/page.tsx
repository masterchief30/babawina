'use client'

import { AdminCompetitionsGrid } from "@/components/admin/admin-competitions-grid"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

export default function ManageCompetitionsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mountKey, setMountKey] = useState(0)
  
  useEffect(() => {
    // Check if user is logged in
    if (!loading && !user) {
      console.warn('⚠️ Not logged in - redirecting to admin login')
      router.push('/admin/login')
      return
    }
    
    // Update key on mount to force fresh data fetch
    setMountKey(Date.now())
    console.log('🔑 ManageCompetitionsPage mounted with key:', Date.now())
    console.log('👤 User:', user?.email)
  }, [user, loading, router])
  
  // Show loading while checking auth
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Checking authentication...</p>
          </div>
        </div>
      </div>
    )
  }
  
  // Don't render if not logged in (redirect will happen)
  if (!user) {
    return null
  }
  
  return <AdminCompetitionsGrid key={mountKey} />
}
