'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, Lock, Trash2, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle, Trophy, ChevronDown, ChevronRight } from 'lucide-react'

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

export default function ProfilePage() {
  const { user, loading, signOut: authSignOut } = useAuth()
  const [activeTab, setActiveTab] = useState('account')
  const [, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userCompetitions, setUserCompetitions] = useState<UserCompetitionStats[]>([])
  const [loadingCompetitions, setLoadingCompetitions] = useState(false)
  const [expandedCompetitions, setExpandedCompetitions] = useState<Set<string>>(new Set())
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error'
    message: string
  }>({ show: false, type: 'success', message: '' })

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
  }, [user, loading])

  // Fetch user competitions when tab changes to competitions
  useEffect(() => {
    if (activeTab === 'competitions' && user) {
      fetchUserCompetitions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user])

  const fetchUserCompetitions = async () => {
    if (!user) return
    
    setLoadingCompetitions(true)
    try {
      console.log('Fetching competitions for user:', user.id)
      
      // Step 1: Get all user entries from competition_entries
      const { data: userEntries, error: entriesError } = await supabase
        .from('competition_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      console.log('User entries:', userEntries, 'Error:', entriesError)

      if (entriesError) {
        console.error('Error fetching entries:', entriesError)
        throw entriesError
      }

      if (!userEntries || userEntries.length === 0) {
        console.log('No entries found for user')
        setUserCompetitions([])
        return
      }

      // Step 2: Get unique competition IDs
      const competitionIds = [...new Set(userEntries.map(entry => entry.competition_id))]
      console.log('Competition IDs:', competitionIds)

      // Step 3: Fetch competition details for these IDs
      const { data: competitions, error: compError } = await supabase
        .from('competitions')
        .select('*')
        .in('id', competitionIds)

      console.log('Competitions:', competitions, 'Error:', compError)

      if (compError) {
        console.error('Error fetching competitions:', compError)
        throw compError
      }

      // Step 4: Group entries by competition and count them
      const competitionStatsMap = new Map<string, UserCompetitionStats>()
      
      userEntries.forEach((entry: Record<string, unknown>) => {
        const competition = competitions?.find(c => c.id === entry.competition_id)
        if (!competition) {
          console.warn('Competition not found for entry:', entry)
          return
        }
        
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
        
        const stats = competitionStatsMap.get(competitionId)!
        stats.entry_count += 1
        const entryPrice = (entry.entry_price_paid as number) || 0
        console.log('Entry price for entry:', entry.id, 'is:', entryPrice)
        stats.total_spent += entryPrice
        stats.entries.push({
          id: entry.id as string,
          competition_id: entry.competition_id as string,
          guess_x: entry.guess_x as number,
          guess_y: entry.guess_y as number,
          entry_price_paid: (entry.entry_price_paid as number) || 0,
          created_at: entry.created_at as string,
          is_winner: entry.is_winner as boolean | null,
          competition: stats.competition
        })
      })

      const competitionStats = Array.from(competitionStatsMap.values())
      console.log('Final competition stats:', competitionStats)
      setUserCompetitions(competitionStats)
      
    } catch (error: unknown) {
      console.error('Error fetching user competitions:', error)
      showNotification('error', 'Unable to load your competitions. Please try again.')
      setUserCompetitions([])
    } finally {
      setLoadingCompetitions(false)
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification({ show: false, type: 'success', message: '' })
    }, 3000)
  }

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
            <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-semibold text-sm md:text-base">Back to Home</span>
            </Link>
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
                    
                    {loadingCompetitions ? (
                      <div className="flex items-center justify-center py-12">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"
                        />
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
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Hat Prize</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">End Date</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Number Guesses</th>
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
                              const isFinished = isValidDate ? endDate < new Date() : true // Assume finished if invalid date
                              
                              console.log('Competition:', stats.competition.title, 'End date:', stats.competition.ends_at, 'Parsed:', endDate, 'Valid:', isValidDate, 'Finished:', isFinished, 'Has winner:', hasWinner)
                              
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
                                    R{stats.total_spent}
                                  </td>
                                  <td className="px-4 py-3">
                                    {/* Show win status based on is_winner field */}
                                    {hasWinner ? (
                                      <span className="text-green-600 font-semibold">
                                        Yes
                                      </span>
                                    ) : hasResults ? (
                                      <span className="text-red-600 font-semibold">
                                        No
                                      </span>
                                    ) : (
                                      <span className="text-yellow-600 font-semibold">
                                        Pending
                                      </span>
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
                                                  R{entry.entry_price_paid}
                                                </span>
                                                <span className={`text-sm font-semibold ${
                                                  entry.is_winner === true 
                                                    ? 'text-green-600' 
                                                    : entry.is_winner === false 
                                                      ? 'text-red-600' 
                                                      : 'text-yellow-600'
                                                }`}>
                                                  {entry.is_winner === true 
                                                    ? 'Yes' 
                                                    : entry.is_winner === false 
                                                      ? 'No' 
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

                {/* Change Password Tab */}
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

                {/* Delete Account Tab */}
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
    </div>
  )
}
