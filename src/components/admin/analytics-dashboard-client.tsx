'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Eye, 
  Clock, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface AnalyticsMetrics {
  overview: {
    totalVisits: number
    uniqueVisitors: number
    avgSessionDuration: number
    bounceRate: number
    todayVisits: number
    weekVisits: number
  }
  sources: {
    source: string
    visitors: number
    signups: number
    bets: number
    conversionRate: number
  }[]
  funnel: {
    landing: number
    competitionView: number
    signup: number
    bet: number
    payment: number
  }
  topPages: {
    path: string
    views: number
  }[]
}

interface Props {
  metrics: AnalyticsMetrics
}

export function AnalyticsDashboardClient({ metrics }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'funnel' | 'pages' | 'visitors'>('overview')

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  // Convert page paths to friendly names
  const formatPageName = (path: string): string => {
    if (path === '/' || path === '') return 'Landing Page'
    // If path already contains formatted competition info (e.g. "Win PS5 (Ends: 22/11/2025)"), return as-is
    if (path.includes('(Ends:')) return path
    if (path.startsWith('/play/')) return 'Competition Page'
    if (path === '/profile') return 'Profile Page'
    if (path === '/terms') return 'Terms & Conditions'
    if (path === '/privacy') return 'Privacy Policy'
    if (path === '/signup') return 'Sign Up Page'
    if (path === '/login') return 'Login Page'
    if (path === '/signup-successful') return 'Signup Success'
    if (path === '/admin') return 'Admin Panel'
    if (path.startsWith('/admin/')) {
      if (path.includes('dashboard')) return 'Admin Dashboard'
      if (path.includes('analytics')) return 'Admin Analytics'
      if (path.includes('manage')) return 'Manage Competitions'
      if (path.includes('users')) return 'Admin Users'
      return 'Admin - ' + path.split('/').pop()
    }
    return path
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Traffic & Analytics
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Monitor traffic sources, user behavior, and conversion funnel
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'sources', label: 'Traffic Sources' },
            { id: 'funnel', label: 'Conversion Funnel' },
            { id: 'pages', label: 'Top Pages' },
            { id: 'visitors', label: 'Visitor Details' },
          ].map((tab) => {
            if (tab.id === 'visitors') {
              // Special case: Visitor Details navigates to separate page
              return (
                <Link
                  key={tab.id}
                  href="/admin/analytics/visitors"
                  className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition-colors cursor-pointer font-medium"
                >
                  {tab.label}
                </Link>
              )
            }
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Total Visits</p>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.overview.totalVisits}</p>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Unique Visitors</p>
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.overview.uniqueVisitors}</p>
                <p className="text-xs text-gray-500 mt-1">Registered users</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Avg Session</p>
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {formatDuration(metrics.overview.avgSessionDuration)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Time on site</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Bounce Rate</p>
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics.overview.bounceRate.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">Single page visits</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Today's Traffic</h3>
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <p className="text-4xl font-bold">{metrics.overview.todayVisits}</p>
                <p className="text-blue-100 text-sm mt-2">visits today</p>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Last 7 Days</h3>
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <p className="text-4xl font-bold">{metrics.overview.weekVisits}</p>
                <p className="text-green-100 text-sm mt-2">visits this week</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Traffic Sources Tab */}
        {activeTab === 'sources' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Traffic Sources</h2>
              <p className="text-gray-600 text-sm mt-1">Where your visitors are coming from</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visitors
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Signups
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conv. Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.sources.map((source, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900 capitalize">{source.source}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {source.visitors}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {source.signups}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                        {source.bets}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 ${
                          source.conversionRate > 10 ? 'text-green-600' : 
                          source.conversionRate > 5 ? 'text-amber-600' : 
                          'text-gray-600'
                        }`}>
                          {source.conversionRate.toFixed(1)}%
                          {source.conversionRate > 10 && <ArrowUpRight className="w-3 h-3" />}
                          {source.conversionRate < 5 && <ArrowDownRight className="w-3 h-3" />}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Conversion Funnel Tab */}
        {activeTab === 'funnel' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Conversion Funnel</h2>
              <p className="text-gray-600 text-sm mt-1">Track user journey from landing to payment</p>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Landing Page', value: metrics.funnel.landing, color: 'blue' },
                { label: 'Viewed Competition', value: metrics.funnel.competitionView, color: 'green' },
                { label: 'Signed Up', value: metrics.funnel.signup, color: 'purple' },
                { label: 'Placed Bet', value: metrics.funnel.bet, color: 'amber' },
                { label: 'Added Payment', value: metrics.funnel.payment, color: 'red' },
              ].map((step, idx) => {
                const percentage = metrics.funnel.landing > 0 
                  ? ((step.value / metrics.funnel.landing) * 100).toFixed(1) 
                  : 0
                const width = `${percentage}%`

                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{step.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-600">{step.value} visitors</span>
                        <span className={`text-${step.color}-600 font-semibold min-w-[60px] text-right`}>
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full bg-gradient-to-r from-${step.color}-400 to-${step.color}-600`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Top Pages Tab */}
        {activeTab === 'pages' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Top Pages</h2>
              <p className="text-gray-600 text-sm mt-1">Most visited pages</p>
            </div>

            <div className="p-6">
              <div className="space-y-3">
                {metrics.topPages.map((page, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 font-semibold text-sm">#{idx + 1}</span>
                      <span className="font-medium text-gray-900">{formatPageName(page.path)}</span>
                    </div>
                    <span className="text-gray-600 font-semibold">{page.views} views</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

