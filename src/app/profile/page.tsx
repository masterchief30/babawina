'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, Lock, Trash2, ArrowLeft, Eye, EyeOff, CheckCircle, XCircle, Trophy, Target } from 'lucide-react'

interface Competition {
  id: string
  title: string
  prize_name: string
  display_photo_path: string | null
  end_date: string
  is_active: boolean
}

interface CompetitionEntry {
  id: string
  competition_id: string
  guess_x: number
  guess_y: number
  entry_price_paid: number
  created_at: string
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
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userCompetitions, setUserCompetitions] = useState<UserCompetitionStats[]>([])
  const [loadingCompetitions, setLoadingCompetitions] = useState(false)
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
      
      userEntries.forEach((entry: any) => {
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
              prize_name: competition.prize_name || competition.title || 'Prize',
              display_photo_path: competition.display_photo_path,
              end_date: competition.end_date,
              is_active: competition.is_active || false
            },
            entry_count: 0,
            total_spent: 0,
            entries: []
          })
        }
        
        const stats = competitionStatsMap.get(competitionId)!
        stats.entry_count += 1
        stats.total_spent += entry.entry_price_paid || 30
        stats.entries.push({
          id: entry.id,
          competition_id: entry.competition_id,
          guess_x: entry.guess_x,
          guess_y: entry.guess_y,
          entry_price_paid: entry.entry_price_paid || 30,
          created_at: entry.created_at,
          competition: stats.competition
        })
      })

      const competitionStats = Array.from(competitionStatsMap.values())
      console.log('Final competition stats:', competitionStats)
      setUserCompetitions(competitionStats)
      
    } catch (error: any) {
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
    } catch (error: any) {
      console.error('Password update error:', error)
      showNotification('error', error.message || 'Failed to update password')
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
    } catch (error: any) {
      console.error('Account deletion error:', error)
      showNotification('error', error.message || 'Failed to delete account')
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
                        <p className="text-gray-600">You haven't entered any competitions yet. Start playing to see your entries here!</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {userCompetitions.map((stats) => (
                          <div key={stats.competition.id} className="bg-gray-50 rounded-lg p-4 md:p-6">
                            <div className="flex flex-col md:flex-row gap-4">
                              {/* Competition Image */}
                              <div className="md:w-32 md:h-32 flex-shrink-0">
                                <img
                                  src={stats.competition.display_photo_path || '/placeholder-competition.jpg'}
                                  alt={stats.competition.prize_name}
                                  className="w-full h-32 object-contain rounded-lg bg-white"
                                />
                              </div>
                              
                              {/* Competition Details */}
                              <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                      {stats.competition.title}
                                    </h3>
                                    <p className="text-blue-600 font-medium mb-2">
                                      Prize: {stats.competition.prize_name}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-2">
                                      Ends: {new Date(stats.competition.end_date).toLocaleDateString('en-ZA', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        stats.competition.is_active
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {stats.competition.is_active ? 'Active' : 'Finished'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Entry Stats */}
                                  <div className="bg-white rounded-lg p-4 min-w-[200px]">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-blue-600 mb-1">
                                        {stats.entry_count}
                                      </div>
                                      <div className="text-sm text-gray-600 mb-3">
                                        {stats.entry_count === 1 ? 'Entry' : 'Entries'}
                                      </div>
                                      <div className="text-lg font-semibold text-gray-900">
                                        R{stats.total_spent}
                                      </div>
                                      <div className="text-xs text-gray-500">Total Spent</div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Entry Details */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Guesses:</h4>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {stats.entries.slice(0, 6).map((entry, index) => (
                                      <div key={entry.id} className="bg-white rounded p-2 text-xs">
                                        <div className="flex items-center justify-between">
                                          <span className="font-mono text-gray-700">
                                            #{index + 1}: ({entry.guess_x.toFixed(1)}%, {entry.guess_y.toFixed(1)}%)
                                          </span>
                                          <span className="text-gray-500">R{entry.entry_price_paid}</span>
                                        </div>
                                      </div>
                                    ))}
                                    {stats.entries.length > 6 && (
                                      <div className="bg-gray-100 rounded p-2 text-xs text-center text-gray-600">
                                        +{stats.entries.length - 6} more
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
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
                              Type "delete account" to confirm:
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
