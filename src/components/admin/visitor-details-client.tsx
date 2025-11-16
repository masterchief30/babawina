'use client'

import { useState, useMemo, Fragment } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react'
import type { VisitorData, PageVisit } from '@/app/admin/analytics/visitors/page'

interface Props {
  visitors: VisitorData[]
}

export function VisitorDetailsClient({ visitors }: Props) {
  const [sortBy, setSortBy] = useState<keyof VisitorData>('lastVisit')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCountry, setFilterCountry] = useState<string>('all')
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // Format duration helper
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-ZA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Show full IP address
  const formatIp = (ip: string) => {
    if (ip === 'unknown') return 'Unknown'
    return ip
  }

  // Toggle expanded row
  const toggleRow = (userId: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
    }
    setExpandedRows(newExpanded)
  }

  // Format page name for display
  const formatPageName = (path: string) => {
    // If it's already formatted (contains "Ends:" or looks like a title), return as-is
    if (path.includes('(Ends:') || (!path.startsWith('/') && !path.includes('/'))) {
      return path
    }
    
    // Otherwise format based on path
    if (path === '/' || path === '') return '🏠 Landing Page'
    if (path.startsWith('/play/')) return `🎮 Competition Page`
    if (path === '/profile') return '👤 Profile'
    if (path === '/signup') return '✍️ Sign Up'
    if (path === '/login') return '🔐 Login'
    if (path === '/signup-successful') return '✅ Signup Success'
    return path
  }

  // Get unique countries for filter
  const countries = useMemo(() => {
    const uniqueCountries = new Set<string>()
    visitors.forEach(v => {
      if (v.country) uniqueCountries.add(v.country)
    })
    return Array.from(uniqueCountries).sort()
  }, [visitors])

  // Filter and sort visitors
  const filteredVisitors = useMemo(() => {
    let filtered = visitors

    // Filter by conversion status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(v => v.conversionStatus === filterStatus)
    }

    // Filter by country
    if (filterCountry !== 'all') {
      filtered = filtered.filter(v => v.country === filterCountry)
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortBy]
      const bVal = b[sortBy]
      
      // Handle null values (put them at the end)
      if (aVal === null && bVal === null) return 0
      if (aVal === null) return 1
      if (bVal === null) return -1
      
      // Compare non-null values
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [visitors, sortBy, sortOrder, filterStatus, filterCountry])

  // Handle column sort
  const handleSort = (column: keyof VisitorData) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'converted':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">CONVERTED</span>
      case 'engaged':
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800">ENGAGED</span>
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-600">BROWSING</span>
    }
  }

  // Visit type badge
  const getVisitTypeBadge = (type: string) => {
    if (type === 'first') {
      return <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">FIRST VISIT</span>
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">RETURNING</span>
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
            { id: 'overview', label: 'Overview', href: '/admin/analytics' },
            { id: 'sources', label: 'Traffic Sources', href: '/admin/analytics' },
            { id: 'funnel', label: 'Conversion Funnel', href: '/admin/analytics' },
            { id: 'pages', label: 'Top Pages', href: '/admin/analytics' },
            { id: 'visitors', label: 'Visitor Details', href: '/admin/analytics/visitors' },
          ].map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors cursor-pointer font-medium ${
                tab.id === 'visitors'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Visitor Count Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Total Unique Visitors</p>
            <p className="text-3xl font-bold">{visitors.length}</p>
          </div>
          <div className="text-sm opacity-90">
            Track individual visitors with IP addresses and geographic data
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex gap-4 items-center">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="converted">Converted</option>
              <option value="engaged">Engaged</option>
              <option value="browsing">Browsing</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Country:</label>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredVisitors.length} of {visitors.length} visitors
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th 
                    onClick={() => handleSort('userId')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    User
                  </th>
                  <th 
                    onClick={() => handleSort('firstVisit')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    First Visit
                  </th>
                  <th 
                    onClick={() => handleSort('lastVisit')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Last Visit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th 
                    onClick={() => handleSort('country')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Country
                  </th>
                  <th 
                    onClick={() => handleSort('city')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    City
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Visit Type
                  </th>
                  <th 
                    onClick={() => handleSort('totalVisits')}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Visits
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Device
                  </th>
                  <th 
                    onClick={() => handleSort('pagesViewed')}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Pages
                  </th>
                  <th 
                    onClick={() => handleSort('sessionDuration')}
                    className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVisitors.map((visitor) => {
                  const isExpanded = expandedRows.has(visitor.userId)
                  return (
                    <Fragment key={visitor.userId}>
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => toggleRow(visitor.userId)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                            <span className="font-semibold text-gray-900">
                              User {visitor.userId}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(visitor.firstVisit)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(visitor.lastVisit)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-700">
                          {formatIp(visitor.ipAddress)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {visitor.country || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                          {visitor.city || 'Unknown'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getVisitTypeBadge(visitor.visitType)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-semibold text-gray-900">
                          {visitor.totalVisits}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                          {visitor.device}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                          {visitor.pagesViewed}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-600">
                          {formatDuration(visitor.sessionDuration)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(visitor.conversionStatus)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 capitalize">
                          {visitor.trafficSource}
                        </td>
                      </motion.tr>
                      
                      {/* Expanded Page Journey Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={13} className="px-4 py-4 bg-gray-50">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-gray-900 mb-3">
                                📊 Page Journey ({visitor.pageJourney?.length || 0} pages visited)
                              </h4>
                              {visitor.pageJourney && visitor.pageJourney.length > 0 ? (
                                <div className="space-y-2">
                                  {visitor.pageJourney.map((page, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-xs font-semibold text-gray-400 min-w-[30px]">
                                          #{idx + 1}
                                        </span>
                                        <div>
                                          <div className="font-medium text-gray-900">
                                            {formatPageName(page.path)}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {formatDate(page.timestamp)}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="text-right">
                                          <div className="text-sm font-semibold text-gray-700">
                                            {formatDuration(page.timeSpent)}
                                          </div>
                                          <div className="text-xs text-gray-500">time spent</div>
                                        </div>
                                        {idx === visitor.pageJourney.length - 1 && (
                                          <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800">
                                            EXIT
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-sm">No page journey data available</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredVisitors.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No visitors found matching your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

