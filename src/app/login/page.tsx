'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Mail, Lock, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAnalytics } from '@/hooks/useAnalytics'

function LoginContent() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { trackEvent } = useAnalytics()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error'
    message: string
  }>({ show: false, type: 'success', message: '' })

  // Only clear stale sessions if user is actually trying to log in (not during redirect)
  useEffect(() => {
    // Only clear if we're not already authenticated and not loading
    if (!loading && !user) {
      console.log('🧹 Login page: Clearing any old sessions for fresh login')
      localStorage.removeItem('sb-auth-token')
    }
  }, [loading, user])

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: 'success', message: '' })
    }, 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      console.log('🔑 Starting login...')
      console.log('📧 Email:', email)
      
      // Add timeout to prevent hanging
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timed out after 10 seconds')), 10000)
      )
      
      const { data, error } = await Promise.race([
        loginPromise,
        timeoutPromise
      ]) as any

      console.log('📦 Login response:', { hasSession: !!data?.session, hasUser: !!data?.user, error })

      if (error) {
        console.error('❌ Login error:', error)
        throw error
      }

      if (data.user && data.session) {
        console.log('✅ Login successful!', data.user.email)
        console.log('🔐 Session:', !!data.session)
        
        // Track successful login
        trackEvent('login_success', { email })
        
        // Store session in localStorage for fast loading
        try {
          const sessionData = {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
            user: data.user
          }
          localStorage.setItem('sb-auth-token', JSON.stringify(sessionData))
          console.log('💾 Session stored in localStorage:', sessionData)
          
          // Double-check it was saved
          const saved = localStorage.getItem('sb-auth-token')
          console.log('✅ Verified saved session:', !!saved)
        } catch (e) {
          console.error('Failed to store session:', e)
        }
        
        showNotification('success', 'Login successful!')
        
        // Use Next.js router for smooth navigation (no full page reload)
        setTimeout(() => {
          console.log('🔄 Redirecting to home...')
          router.push('/')
          // Force a page refresh to reload AuthContext
          setTimeout(() => window.location.reload(), 100)
        }, 1000)
      } else {
        console.error('⚠️ No user in response')
        throw new Error('Login failed - no user returned')
      }
    } catch (error: unknown) {
      console.error('💥 Login error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      
      // Track failed login
      trackEvent('login_failed', { 
        email, 
        error: errorMessage 
      })
      
      showNotification('error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-400 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='50' cy='50' r='1'/%3E%3Ccircle cx='25' cy='25' r='1'/%3E%3Ccircle cx='75' cy='75' r='1'/%3E%3Ccircle cx='75' cy='25' r='1'/%3E%3Ccircle cx='25' cy='75' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }} />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4 lg:px-8 h-16 lg:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 lg:gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl overflow-hidden shadow-lg">
              <img 
                src="/images/hero/mascot002.png" 
                alt="BabaWina Mascot" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-xl lg:text-2xl font-black text-blue-600">
                BabaWina
              </span>
              <span className="hidden lg:block text-[10px] text-black font-bold uppercase tracking-wider">Play & Win</span>
            </div>
          </Link>
          
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-semibold">Back to Home</span>
          </Link>
        </div>
      </div>

      {/* Login Form */}
      <div className="relative z-20 w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Welcome Back!</h1>
            <p className="text-gray-600">Sign in to your BabaWina account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-2 border-gray-200 focus:border-blue-600 rounded-xl"
                  placeholder="e.g. support@babawina.co.za"
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-2 border-gray-200 focus:border-blue-600 rounded-xl"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Forgot your password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg text-base"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500 font-medium">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center min-w-[300px] pointer-events-auto"
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500 mb-4" />
            )}
            <p className="text-lg font-semibold text-gray-900 text-center">
              {notification.message}
            </p>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-400" />}>
      <LoginContent />
    </Suspense>
  )
}
