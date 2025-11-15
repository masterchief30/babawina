'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Mail, Lock, Check } from 'lucide-react'
import { entryPreservation, saveTempEntriesToDB } from '@/lib/entry-preservation'
import { supabase } from '@/lib/supabase'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function SignupPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { trackEvent } = useAnalytics()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [confirmedAge, setConfirmedAge] = useState(false)
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  })
  const [isSigningUp, setIsSigningUp] = useState(false) // Track if signup is in progress
  const [isRedirecting, setIsRedirecting] = useState(false) // Track if redirecting to competition

  // Redirect if already authenticated (but not during signup process)
  useEffect(() => {
    if (!loading && user && !isSigningUp) {
      console.log('👤 Already authenticated, redirecting to home')
      window.location.href = '/'
    }
  }, [user, loading, isSigningUp])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear errors when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = { email: '', password: '' }
    let isValid = true

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email) {
      newErrors.email = 'Email address is required'
      isValid = false
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
      isValid = false
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
      isValid = false
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form first
    if (!validateForm()) {
      return
    }
    
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions')
      return
    }
    if (!confirmedAge) {
      alert('Please confirm you are older than 18 years')
      return
    }
    
    setIsLoading(true)
    setIsSigningUp(true) // Prevent redirect during signup
    
    try {
      // Import Supabase client
      const { supabase } = await import('@/lib/supabase')
      
      // Associate entries with email before signup
      entryPreservation.associateWithEmail(formData.email)
      console.log('✅ Entries associated with email during signup')
      
      // Get submission token from localStorage
      const submissionToken = localStorage.getItem('submissionToken')
      console.log('🎯 Including submission token in signup:', submissionToken)
      
      // Simple signup with token in callback URL
      const callbackUrl = submissionToken 
        ? `${window.location.origin}/auth/callback?token=${submissionToken}`
        : `${window.location.origin}/auth/callback`
      
      console.log('🚀 Starting signup process...')
      console.log('📧 Email:', formData.email)
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: callbackUrl
        }
      })
      
      console.log('📦 Signup response:', { data, error })
      console.log('👤 User created:', data?.user?.id)
      console.log('🔐 Session created:', !!data?.session)
      console.log('✉️ Email confirmation required:', data?.user?.identities?.length === 0)

      if (error) {
        console.error('Signup error:', error)
        setIsSigningUp(false) // Reset on error
        
        // Handle specific error cases with user-friendly messages
        if (error.message.includes('email rate limit exceeded')) {
          console.error('Rate limit exceeded - try again in 1-2 minutes or use a different email')
          alert('Too many signup attempts. Please wait 1-2 minutes or try with a different email address.')
        } else if (error.message.includes('User already registered')) {
          alert('This email is already registered. Please try signing in instead.')
        } else if (error.message.includes('Invalid email')) {
          alert('Please enter a valid email address.')
        } else if (error.message.includes('Password')) {
          alert('Password must be at least 6 characters long.')
        } else {
          console.error('Full error object:', error)
          alert(`Signup failed: ${error.message}\n\nPlease check the console for more details.`)
        }
      } else {
        console.log('✅ Signup successful!')
        console.log('📋 User data:', {
          id: data?.user?.id,
          email: data?.user?.email,
          confirmed: data?.user?.confirmed_at
        })
        console.log('🔑 Session exists:', !!data?.session)
        console.log('📍 Session ID:', entryPreservation.getSessionId())
        
        // Store session in localStorage immediately for fast access
        if (data?.session && data?.user) {
          try {
            localStorage.setItem('sb-auth-token', JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at,
              currentSession: data.session,
              user: data.user
            }))
            console.log('💾 Session stored in localStorage')
            console.log('✅ User IS logged in - session ready for redirect')
          } catch (e) {
            console.error('Failed to store session:', e)
          }
        } else {
          console.warn('⚠️ No session in signup response - user may not be logged in!')
        }
        
        // Track signup event
        trackEvent('signup', {
          user_id: data?.user?.id,
        })
        
        // Check if there's a submission token - if yes, redirect to competition
        const submissionToken = localStorage.getItem('submissionToken')
        if (submissionToken) {
          console.log('🎫 Found submission token, loading competition...')
          try {
            const { data: pendingBet } = await supabase
              .from('pending_bets')
              .select('competition_id')
              .eq('submission_token', submissionToken)
              .limit(1)
              .single()
            
            if (pendingBet?.competition_id) {
              console.log('✅ Redirecting directly to competition:', pendingBet.competition_id)
              
              // Show loading modal
              setIsRedirecting(true)
              
              // Wait longer for session to be fully persisted
              console.log('⏳ Waiting 2 seconds for session to persist...')
              await new Promise(resolve => setTimeout(resolve, 2000))
              console.log('🔄 Now redirecting...')
              window.location.href = `/play/${pendingBet.competition_id}`
              return
            }
          } catch (error) {
            console.warn('⚠️ Could not load competition, going to success page')
          }
        }
        
        // Default: redirect to success page
        console.log('↪️ Redirecting to /signup-successful')
        window.location.href = '/signup-successful'
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred. Please try again.')
      setIsSigningUp(false) // Reset on error
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
          
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-20 w-full max-w-7xl mt-20 mb-8 flex items-center justify-center gap-20">
        {/* Mascot Image - Desktop Only */}
        <div className="hidden lg:flex justify-center flex-shrink-0">
          <img 
            src="/images/hero/mascot_full01.png" 
            alt="BabaWina Mascot" 
            className="w-96 h-auto object-contain"
          />
        </div>

        {/* Signup Form */}
        <div className="w-full lg:w-[440px] flex-shrink-0">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Join BabaWina!</h1>
            <p className="text-gray-600">Create your account and start winning</p>
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
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`pl-10 h-12 border-2 focus:border-blue-600 rounded-xl ${
                    errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="e.g. support@babawina.co.za"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email}</p>
              )}
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
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`pl-10 pr-10 h-12 border-2 focus:border-blue-600 rounded-xl ${
                    errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Age Confirmation Checkbox */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setConfirmedAge(!confirmedAge)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  confirmedAge 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 hover:border-blue-600'
                }`}
              >
                {confirmedAge && <Check className="w-3 h-3" />}
              </button>
              <p className="text-sm text-gray-600 leading-relaxed">
                I confirm I am older than 18 years
              </p>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  agreedToTerms 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 hover:border-blue-600'
                }`}
              >
                {agreedToTerms && <Check className="w-3 h-3" />}
              </button>
              <p className="text-sm text-gray-600 leading-relaxed">
                I agree to the{' '}
                <Link href="/legal/terms" className="text-blue-600 hover:text-blue-700 font-medium">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link href="/legal/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
                  Privacy Policy
                </Link>
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !agreedToTerms || !confirmedAge}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-xl shadow-lg text-base disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isLoading && (
                <div className="w-5 h-5 relative">
                  {/* Fidget Spinner Animation */}
                  <div className="absolute inset-0">
                    <div className="w-5 h-5 border-2 border-white/20 rounded-full relative">
                      {/* Center circle */}
                      <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                      
                      {/* Three spinning circles */}
                      <div className="absolute top-0 left-1/2 w-1.5 h-1.5 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-spin origin-center" style={{animationDuration: '1s'}}></div>
                      <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-white rounded-full transform -translate-x-1/2 translate-y-1/2 animate-spin origin-center" style={{animationDuration: '1s', animationDelay: '0.33s'}}></div>
                      <div className="absolute top-1/2 right-0 w-1.5 h-1.5 bg-white rounded-full transform translate-x-1/2 -translate-y-1/2 animate-spin origin-center" style={{animationDuration: '1s', animationDelay: '0.66s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500 font-medium">or</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
        </div>
      </div>
      
      {/* Loading Modal - Shows immediately on Sign Up click */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-12 shadow-2xl max-w-md mx-4 text-center">
            {/* Fidget Spinner */}
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 relative">
                <div className="absolute inset-0 border-4 border-amber-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-transparent border-t-amber-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                {/* Center dot */}
                <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-amber-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            </div>
            
            {/* Text */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {isRedirecting ? 'Account Created! 🎉' : 'Creating your account...'}
            </h3>
            <p className="text-gray-600">
              {isRedirecting ? 'Taking you to your competition...' : 'Please wait...'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
