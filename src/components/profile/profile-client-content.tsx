'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'
import { User, Lock, Trash2, Eye, EyeOff, CheckCircle, XCircle, Trophy, ChevronDown, ChevronRight, ArrowLeft, CreditCard } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PaymentMethodModal } from '@/components/payment/payment-method-modal'
import { useToast } from '@/hooks/use-toast'

interface Competition {
  id: string
  title: string
  prize_name: string
  display_photo_path: string | null
  ends_at: string
  is_active: boolean
}

interface CompetitionEntry {
  id: string
  competition_id: string
  guess_x: number
  guess_y: number
  entry_price_paid: number
  created_at: string
  is_winner: boolean | null
  competition: Competition
}

interface UserCompetitionStats {
  competition: Competition
  entry_count: number
  total_spent: number
  entries: CompetitionEntry[]
}

interface PaymentMethod {
  id: string
  card_brand: string
  card_last4: string
  is_default: boolean
  created_at: string
}

interface ProfileClientContentProps {
  initialCompetitions: UserCompetitionStats[]
}

export default function ProfileClientContent({ initialCompetitions }: ProfileClientContentProps) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎨 ProfileClientContent rendered')
  console.log('📊 Received initialCompetitions:', initialCompetitions)
  console.log('📦 Competition count:', initialCompetitions?.length || 0)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  const { user, loading, signOut: authSignOut } = useAuth()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('account')
  const [, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userCompetitions, setUserCompetitions] = useState<UserCompetitionStats[]>(initialCompetitions)
  const [isLoadingCompetitions, setIsLoadingCompetitions] = useState(false)
  const [expandedCompetitions, setExpandedCompetitions] = useState<Set<string>>(new Set())
  
  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoadingPayments, setIsLoadingPayments] = useState(false)
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)
  
  console.log('💾 userCompetitions state:', userCompetitions)
  console.log('📊 State length:', userCompetitions?.length || 0)
  
  // Fetch competitions client-side if server-side fetch failed (no user detected)
  useEffect(() => {
    console.log('🔍 useEffect triggered:', {
      hasUser: !!user,
      userId: user?.id,
      competitionsLength: userCompetitions.length,
      isLoading: isLoadingCompetitions,
      activeTab: activeTab
    })
    
    // Only fetch when on competitions tab AND not already loading
    if (user && userCompetitions.length === 0 && !isLoadingCompetitions && activeTab === 'competitions') {
      console.log('✅ All conditions met! Fetching competitions for user:', user.id)
      setIsLoadingCompetitions(true)
      
      const fetchCompetitions = async () => {
        console.log('🚀 fetchCompetitions function called!')
        try {
          console.log('📞 Bypassing Supabase client, using direct REST API...')
          
          // Get auth token from localStorage
          const authData = localStorage.getItem('sb-auth-token')
          console.log('🔑 Auth data in localStorage:', authData ? 'EXISTS' : 'MISSING')
          
          if (!authData) {
            throw new Error('No auth token found in localStorage - please log in again')
          }
          
          const session = JSON.parse(authData)
          let accessToken = session?.access_token
          const refreshToken = session?.refresh_token
          console.log('🎫 Access token:', accessToken ? 'EXISTS' : 'MISSING')
          console.log('🔄 Refresh token:', refreshToken ? 'EXISTS' : 'MISSING')
          
          if (!accessToken) {
            throw new Error('No access token in session - please log in again')
          }
          
          // Check if token is expired (basic check)
          const expiresAt = session?.expires_at
          if (expiresAt) {
            const isExpired = Date.now() / 1000 > expiresAt
            console.log('⏰ Token expired?', isExpired)
            
            if (isExpired && refreshToken) {
              console.log('🔄 Token expired, attempting refresh...')
              try {
                const refreshResponse = await fetch(
                  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
                  {
                    method: 'POST',
                    headers: {
                      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ refresh_token: refreshToken })
                  }
                )
                
                if (refreshResponse.ok) {
                  const newSession = await refreshResponse.json()
                  accessToken = newSession.access_token
                  // Update localStorage
                  localStorage.setItem('sb-auth-token', JSON.stringify(newSession))
                  console.log('✅ Token refreshed successfully!')
                } else {
                  console.error('❌ Token refresh failed:', refreshResponse.status)
                  throw new Error('Session expired - please log in again')
                }
              } catch (refreshError) {
                console.error('❌ Token refresh error:', refreshError)
                throw new Error('Session expired - please log in again')
              }
            }
          }
          
          // Direct REST API call with timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000)
          
          console.log('🌐 Fetching from REST API...')
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/competition_entries?user_id=eq.${user.id}&order=created_at.desc&select=*`,
            {
              headers: {
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              signal: controller.signal
            }
          )
          
          clearTimeout(timeoutId)
          console.log('📡 Response received:', response.status)
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`)
          }
          
          const userEntries = await response.json()
          const entriesError = null

          console.log('📊 Supabase response received!')
          console.log('   Data:', userEntries?.length || 0, 'entries')
          console.log('   Error:', entriesError)
          
          if (entriesError) {
            console.error('❌ Error fetching entries:', entriesError)
            throw entriesError
          }

          console.log('📊 Client-side: Fetched', userEntries?.length || 0, 'entries')

          if (userEntries && userEntries.length > 0) {
            const competitionIds = [...new Set(userEntries.map((entry: any) => entry.competition_id))]
            console.log('🏆 Fetching', competitionIds.length, 'competitions...')
            
            // Fetch competitions via REST API too
            const compResponse = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/competitions?id=in.(${competitionIds.join(',')})&select=*`,
              {
                headers: {
                  'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            )
            
            if (!compResponse.ok) {
              throw new Error(`Competitions API error: ${compResponse.status}`)
            }
            
            const competitions = await compResponse.json()
            console.log('✅ Fetched', competitions?.length || 0, 'competitions')

            const competitionStatsMap = new Map()
            
            userEntries.forEach((entry: any) => {
              const competition = competitions?.find((c: any) => c.id === entry.competition_id)
              if (!competition) return
              
              const competitionId = competition.id
              
              if (!competitionStatsMap.has(competitionId)) {
                competitionStatsMap.set(competitionId, {
                  competition: {
                    id: competition.id,
                    title: competition.title || 'Untitled Competition',
                    prize_name: competition.prize_short || competition.title || 'Prize',
                    display_photo_path: competition.display_photo_path,
                    ends_at: competition.ends_at,
                    is_active: competition.status === 'live'
                  },
                  entry_count: 0,
                  total_spent: 0,
                  entries: []
                })
              }
              
              const stats = competitionStatsMap.get(competitionId)
              stats.entry_count += 1
              
              const entryPrice = entry.was_free_entry ? 0 : (competition.entry_price_rand || 0)
              stats.total_spent += entryPrice
              
              stats.entries.push({
                id: entry.id,
                competition_id: entry.competition_id,
                guess_x: entry.guess_x,
                guess_y: entry.guess_y,
                entry_price_paid: entryPrice,
                was_free_entry: entry.was_free_entry,
                created_at: entry.created_at,
                is_winner: entry.is_winner,
                competition: stats.competition
              })
            })

            const fetchedCompetitions = Array.from(competitionStatsMap.values())
            console.log('✅ Client-side: Grouped into', fetchedCompetitions.length, 'competitions')
            setUserCompetitions(fetchedCompetitions)
          }
        } catch (error) {
          console.error('❌ Client-side: Error fetching competitions:', error)
          console.error('❌ Full error:', JSON.stringify(error, null, 2))
        } finally {
          console.log('🏁 Fetch complete, setting isLoading to false')
          setIsLoadingCompetitions(false)
        }
      }

      console.log('📞 About to call fetchCompetitions()...')
      fetchCompetitions().then(() => {
        console.log('✅ fetchCompetitions() completed')
      }).catch((err) => {
        console.error('❌ fetchCompetitions() threw error:', err)
      })
    } else {
      console.log('❌ Conditions not met:', {
        hasUser: !!user,
        isEmpty: userCompetitions.length === 0,
        notLoading: !isLoadingCompetitions,
        onCompetitionsTab: activeTab === 'competitions'
      })
    }
  }, [user, userCompetitions.length, isLoadingCompetitions, activeTab])
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error'
    message: string
  }>({ show: false, type: 'success', message: '' })

  // Set initial tab based on URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab')
    console.log('🔗 URL tab parameter:', tab)
    if (tab && ['account', 'competitions', 'password'].includes(tab)) {
      console.log('✅ Setting active tab to:', tab)
      setActiveTab(tab)
    } else {
      console.log('ℹ️ Using default tab: account')
    }
  }, [searchParams])
  
  console.log('📑 Current activeTab:', activeTab)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
  }, [user, loading])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: 'success', message: '' })
    }, 3000)
  }

  // Fetch payment methods using direct REST API (avoids timeout issues)
  const fetchPaymentMethods = useCallback(async () => {
    if (!user?.id) {
      console.log('💳 No user ID, skipping payment fetch')
      return
    }
    
    console.log('💳 Fetching payment methods for user:', user.id)
    setIsLoadingPayments(true)
    try {
      // Get token from localStorage (fast path)
      const storedSession = localStorage.getItem('sb-auth-token')
      if (!storedSession) {
        throw new Error('No auth session found')
      }
      
      const session = JSON.parse(storedSession)
      let accessToken = session?.access_token
      
      if (!accessToken) {
        throw new Error('No access token found')
      }
      
      // Direct REST API call
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const url = `${supabaseUrl}/rest/v1/user_payment_methods?user_id=eq.${user.id}&select=id,card_brand,card_last4,is_default,created_at&order=created_at.desc`
      
      console.log('💳 Fetching from REST API:', url)
      
      const response = await fetch(url, {
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        // If unauthorized, try refreshing token
        if (response.status === 401) {
          console.log('💳 Token expired, refreshing...')
          const { data: refreshData } = await supabase.auth.refreshSession()
          if (refreshData?.session) {
            accessToken = refreshData.session.access_token
            localStorage.setItem('sb-auth-token', JSON.stringify(refreshData.session))
            
            // Retry with new token
            const retryResponse = await fetch(url, {
              headers: {
                'apikey': supabaseKey!,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            })
            
            if (!retryResponse.ok) {
              throw new Error(`HTTP ${retryResponse.status}`)
            }
            
            const data = await retryResponse.json()
            console.log('💳 Payment methods fetched (after refresh):', data)
            console.log('💳 Number of payment methods:', data?.length || 0)
            setPaymentMethods(data || [])
            return
          }
        }
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      console.log('💳 Payment methods fetched:', data)
      console.log('💳 Number of payment methods:', data?.length || 0)
      setPaymentMethods(data || [])
    } catch (error) {
      console.error('💳 Error fetching payment methods:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load payment methods',
        variant: 'destructive'
      })
    } finally {
      setIsLoadingPayments(false)
    }
  }, [user?.id, toast])

  // Set payment method as default using direct REST API
  const setDefaultPaymentMethod = async (paymentMethodId: string) => {
    try {
      // Get token from localStorage
      const storedSession = localStorage.getItem('sb-auth-token')
      if (!storedSession) {
        throw new Error('No auth session found')
      }
      
      const session = JSON.parse(storedSession)
      const accessToken = session?.access_token
      
      if (!accessToken) {
        throw new Error('No access token found')
      }
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      // First, set all payment methods to non-default
      const unsetUrl = `${supabaseUrl}/rest/v1/user_payment_methods?user_id=eq.${user?.id}`
      await fetch(unsetUrl, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ is_default: false }),
      })
      
      // Then set the selected one as default
      const setUrl = `${supabaseUrl}/rest/v1/user_payment_methods?id=eq.${paymentMethodId}`
      const response = await fetch(setUrl, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ is_default: true }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      // Silently refresh the list
      fetchPaymentMethods()
    } catch (error) {
      console.error('Error setting default payment method:', error)
      toast({
        title: 'Error',
        description: 'Failed to set default payment method',
        variant: 'destructive'
      })
    }
  }

  // Delete payment method using direct REST API
  const deletePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) return
    
    try {
      // Get token from localStorage
      const storedSession = localStorage.getItem('sb-auth-token')
      if (!storedSession) {
        throw new Error('No auth session found')
      }
      
      const session = JSON.parse(storedSession)
      const accessToken = session?.access_token
      
      if (!accessToken) {
        throw new Error('No access token found')
      }
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      const url = `${supabaseUrl}/rest/v1/user_payment_methods?id=eq.${paymentMethodId}`
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      // Silently refresh the list - no success notification needed
      fetchPaymentMethods()
    } catch (error) {
      console.error('Error deleting payment method:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete payment method',
        variant: 'destructive'
      })
    }
  }

  // Fetch payment methods when tab is opened
  useEffect(() => {
    if (activeTab === 'payment' && user?.id) {
      fetchPaymentMethods()
    }
  }, [activeTab, user?.id, fetchPaymentMethods])

  const toggleCompetitionExpansion = (competitionId: string) => {
    setExpandedCompetitions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(competitionId)) {
        newSet.delete(competitionId)
      } else {
        newSet.add(competitionId)
      }
      return newSet
    })
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      showNotification('error', 'New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      showNotification('error', 'Password must be at least 6 characters long')
      return
    }

    setIsUpdatingPassword(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw error
      }

      showNotification('success', 'Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: unknown) {
      console.error('Password update error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password'
      showNotification('error', errorMessage)
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== 'delete account') {
      showNotification('error', 'Please type "delete account" to confirm')
      return
    }

    setIsDeletingAccount(true)

    try {
      // First, delete the user from Supabase Auth
      const { error } = await supabase.rpc('delete_user')
      
      if (error) {
        throw error
      }

      // Sign out and redirect
      await authSignOut()
      showNotification('success', 'Account deleted successfully')
      
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (error: unknown) {
      console.error('Account deletion error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account'
      showNotification('error', errorMessage)
    } finally {
      setIsDeletingAccount(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-400 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-400">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl shadow-md">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Back to Competitions Button */}
            <Link 
              href="/#competitions"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm md:text-base font-semibold hidden sm:inline">Back to Competitions</span>
              <span className="text-sm font-semibold sm:hidden">Back</span>
            </Link>
            
            {/* Logo */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/images/hero/mascot002.png" 
                alt="BabaWina Mascot" 
                className="w-6 h-6 md:w-8 md:h-8 object-contain"
              />
              <span className="text-lg md:text-xl font-bold text-blue-600">BabaWina</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 md:px-8 py-6">
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Your Profile</h1>
                <p className="text-blue-100 text-sm md:text-base break-all">{user.email}</p>
              </div>
            </div>

            {/* Tabbed Layout */}
            <div className="flex flex-col lg:flex-row">
              {/* Left Sidebar Navigation */}
              <div className="lg:w-64 bg-gray-50 border-r border-gray-200">
                <nav className="p-4 space-y-2">
                  <button
                    onClick={() => setActiveTab('account')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors cursor-pointer ${
                      activeTab === 'account'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Account Information</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('competitions')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors cursor-pointer ${
                      activeTab === 'competitions'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Trophy className="w-5 h-5" />
                    <span className="font-medium">Competitions</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('payment')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors cursor-pointer ${
                      activeTab === 'payment'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="font-medium">Payment Methods</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors cursor-pointer ${
                      activeTab === 'password'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Lock className="w-5 h-5" />
                    <span className="font-medium">Change Password</span>
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('delete')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors cursor-pointer ${
                      activeTab === 'delete'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="font-medium">Delete Account</span>
                  </button>
                </nav>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-4 md:p-8">
                {/* Account Information Tab */}
                {activeTab === 'account' && (
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6">Account Information</h2>
                    <div className="bg-gray-50 rounded-lg p-4 md:p-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Email Address</Label>
                          <p className="text-lg text-gray-900 mt-1 break-all">{user.email}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Account Created</Label>
                          <p className="text-lg text-gray-900 mt-1">
                            {new Date(user.created_at).toLocaleDateString('en-ZA', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Account Status</Label>
                          <p className="text-lg text-green-600 mt-1 font-semibold">Active</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Competitions Tab */}
                {activeTab === 'competitions' && (
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6">Your Competitions</h2>
                    
                    {(() => {
                      console.log('🏆 Rendering competitions tab')
                      console.log('📊 userCompetitions:', userCompetitions)
                      console.log('📦 Length:', userCompetitions?.length)
                      console.log('🔄 isLoadingCompetitions:', isLoadingCompetitions)
                      console.log('❓ Is empty?', userCompetitions.length === 0)
                      return null
                    })()}
                    
                    {isLoadingCompetitions ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your competitions...</p>
                      </div>
                    ) : userCompetitions.length === 0 ? (
                      <div className="text-center py-12">
                        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Competitions Yet</h3>
                        <p className="text-gray-600">You haven&apos;t entered any competitions yet. Start playing to see your entries here!</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full bg-white rounded-lg shadow-sm">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Prize</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">End Date</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Guesses</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Spent</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Win</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {userCompetitions.map((stats) => {
                              const hasWinner = stats.entries.some(entry => entry.is_winner === true)
                              const hasResults = stats.entries.some(entry => entry.is_winner !== null)
                              const endDate = new Date(stats.competition.ends_at)
                              const isValidDate = !isNaN(endDate.getTime())
                              const isFinished = isValidDate ? endDate < new Date() : true
                              
                              const isExpanded = expandedCompetitions.has(stats.competition.id)
                              
                              return (
                                <React.Fragment key={stats.competition.id}>
                                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleCompetitionExpansion(stats.competition.id)}>
                                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                                      <div className="flex items-center gap-2">
                                        {isExpanded ? (
                                          <ChevronDown className="w-4 h-4 text-gray-400" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4 text-gray-400" />
                                        )}
                                        {stats.competition.title}
                                      </div>
                                    </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {stats.competition.prize_name}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-700">
                                    {isValidDate ? endDate.toLocaleDateString('en-ZA', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    }) : 'TBD'}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                      stats.competition.is_active && !isFinished
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {stats.competition.is_active && !isFinished ? 'Active' : 'Finished'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                                    {stats.entry_count}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                                    R{stats.total_spent.toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {hasWinner ? (
                                      <span className="text-green-600 font-semibold">Yes</span>
                                    ) : hasResults ? (
                                      <span className="text-red-600 font-semibold">No</span>
                                    ) : (
                                      <span className="text-yellow-600 font-semibold">Pending</span>
                                    )}
                                  </td>
                                </tr>
                                
                                {/* Expanded section showing individual entries */}
                                {isExpanded && (
                                  <tr>
                                    <td colSpan={7} className="px-4 py-3 bg-gray-50">
                                      <div className="space-y-2">
                                        <h4 className="font-semibold text-gray-700 text-sm mb-3">Individual Entries:</h4>
                                        <div className="grid gap-2">
                                          {stats.entries.map((entry, index) => (
                                            <div key={entry.id} className="flex items-center justify-between bg-white rounded p-3 shadow-sm">
                                              <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                  {index + 1}
                                                </span>
                                                <span className="text-sm text-gray-700">
                                                  Entry #{index + 1}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                  {new Date(entry.created_at).toLocaleDateString()}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-600">
                                                  R{entry.entry_price_paid.toFixed(2)}
                                                </span>
                                                <span className={`text-sm font-semibold ${
                                                  entry.is_winner === true 
                                                    ? 'text-green-600' 
                                                    : entry.is_winner === false 
                                                      ? 'text-red-600' 
                                                      : 'text-yellow-600'
                                                }`}>
                                                  {entry.is_winner === true 
                                                    ? 'Winner!' 
                                                    : entry.is_winner === false 
                                                      ? 'Not Won' 
                                                      : 'Pending'}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                                </React.Fragment>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Methods Tab */}
                {activeTab === 'payment' && (
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6">Payment Methods</h2>
                    
                    {isLoadingPayments ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    ) : paymentMethods.length === 0 ? (
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">No payment methods saved</p>
                        <Button onClick={() => setShowAddPaymentModal(true)}>
                          Add Payment Method
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-4 flex items-center gap-4">
                          <Button 
                            onClick={() => setShowAddPaymentModal(true)}
                            disabled={paymentMethods.length >= 3}
                          >
                            Add New Payment Method
                          </Button>
                          {paymentMethods.length >= 3 && (
                            <p className="text-sm text-amber-600">
                              Maximum 3 payment methods allowed. Delete one to add another.
                            </p>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          {paymentMethods.map((method) => (
                            <div 
                              key={method.id}
                              className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                  <CreditCard className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900 capitalize">
                                      {method.card_brand} •••• {method.card_last4}
                                    </p>
                                    {method.is_default && (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    Added {new Date(method.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {!method.is_default && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDefaultPaymentMethod(method.id)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                  >
                                    Set as Default
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deletePaymentMethod(method.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Password Tab - Same as before */}
                {activeTab === 'password' && (
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6">Change Password</h2>
                    <div className="max-w-md">
                      <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <div>
                          <Label htmlFor="newPassword">New Password</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password"
                              className="pr-10"
                              required
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm new password"
                              className="pr-10"
                              required
                              minLength={6}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={isUpdatingPassword || !newPassword || !confirmPassword}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
                        >
                          {isUpdatingPassword ? (
                            <div className="flex items-center gap-2">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                              />
                              Updating Password...
                            </div>
                          ) : (
                            'Update Password'
                          )}
                        </Button>
                      </form>
                    </div>
                  </div>
                )}

                {/* Delete Account Tab - Same as before */}
                {activeTab === 'delete' && (
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-red-600 mb-6">Delete Account</h2>
                    <div className="max-w-md">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-800 text-sm">
                          <strong>Warning:</strong> This action cannot be undone. This will permanently delete your account and all associated data.
                        </p>
                      </div>

                      {!showDeleteConfirm ? (
                        <Button
                          onClick={() => setShowDeleteConfirm(true)}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 py-3"
                        >
                          Delete My Account
                        </Button>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="deleteConfirmation" className="text-red-700">
                              Type &quot;delete account&quot; to confirm:
                            </Label>
                            <Input
                              id="deleteConfirmation"
                              type="text"
                              value={deleteConfirmation}
                              onChange={(e) => setDeleteConfirmation(e.target.value)}
                              placeholder="delete account"
                              className="border-red-300 focus:border-red-500"
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Button
                              onClick={handleDeleteAccount}
                              disabled={isDeletingAccount || deleteConfirmation.toLowerCase() !== 'delete account'}
                              className="bg-red-600 hover:bg-red-700 text-white py-3"
                            >
                              {isDeletingAccount ? (
                                <div className="flex items-center gap-2">
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                                  />
                                  Deleting...
                                </div>
                              ) : (
                                'Confirm Delete'
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                setShowDeleteConfirm(false)
                                setDeleteConfirmation('')
                              }}
                              variant="outline"
                              className="border-gray-300 text-gray-700 hover:bg-gray-50 py-3"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

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
      
      {/* Payment Method Modal */}
      {showAddPaymentModal && user && (
        <PaymentMethodModal
          isOpen={showAddPaymentModal}
          onClose={() => setShowAddPaymentModal(false)}
          userId={user.id}
          onSuccess={() => {
            setShowAddPaymentModal(false)
            fetchPaymentMethods() // Refresh the list
          }}
        />
      )}
    </div>
  )
}

