"use client"

import { useState } from "react"
// import { useRouter } from "next/navigation" // Unused
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Shield, CheckCircle, XCircle } from "lucide-react"

const ADMIN_EMAIL = "mg@gogaudi.de"

export function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error'
    message: string
  }>({ show: false, type: 'success', message: '' })
  // const router = useRouter() // Unused

  // Show notification for 0.3 seconds
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 300) // 0.3 seconds
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if email is the allowed admin email
    if (email !== ADMIN_EMAIL) {
      showNotification('error', 'Access Denied - Unauthorized Email')
      return
    }

    setIsLoading(true)
    console.log('🔐 Starting admin login for:', email)

    try {
      // Add timeout to login attempt
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout')), 10000)
      )

      console.log('📡 Calling Supabase auth...')
      const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any

      if (error) {
        console.error('❌ Login error:', error)
        throw error
      }

      console.log('✅ Login successful!')
      if (error) throw error

      // Check if user exists and make them admin
      if (data.user) {
        // First check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          // If error is not "not found", throw it
          throw profileError
        }

        if (!profile) {
          // Create profile if it doesn't exist
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              email: data.user.email!,
              display_name: "Admin User",
              role: "admin"
            })

          if (insertError) throw insertError
        } else if (profile.role !== "admin") {
          // Update role to admin if not already
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ role: "admin" })
            .eq("id", data.user.id)

          if (updateError) throw updateError
        }

        showNotification('success', 'Login Successful!')

        // Redirect after notification
        setTimeout(() => {
          window.location.replace("/admin/dashboard")
        }, 350)
      }
    } catch (err: any) {
      console.error('💥 Login failed:', err)
      if (err.message === 'Login timeout') {
        showNotification('error', 'Login Timeout - Check Supabase Connection')
      } else {
        showNotification('error', 'Login Failed - Invalid Credentials')
      }
    } finally {
      setIsLoading(false)
      console.log('🔄 Login attempt finished')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
          <p className="text-gray-600 mt-2">
            Authorized personnel only
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your admin email"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="mt-1"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Only <strong>{ADMIN_EMAIL}</strong> is authorized for admin access.
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Custom Notification - White box with green tick or red X */}
      {notification.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            {notification.type === 'success' ? (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            )}
            <p className="text-lg font-semibold text-gray-900">
              {notification.message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
