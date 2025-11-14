"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Users, CreditCard, Trophy, DollarSign, Target, Award, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type TimePeriod = '24h' | '7d' | '30d' | 'all'

interface DashboardMetrics {
  revenue: {
    today: number
    week: number
    month: number
    allTime: number
    todayTransactions: number
    weekTransactions: number
    monthTransactions: number
    allTimeTransactions: number
    stripeFees: number
  }
  users: {
    total: number
    todaySignups: number
    weekSignups: number
    monthSignups: number
    withPaymentMethods: number
    activeUsers: number
  }
  competitions: {
    live: number
    todayEntries: number
    weekEntries: number
    monthEntries: number
    allTimeEntries: number
    freeEntries: number
    paidEntries: number
    mostPopular: { title: string; entries: number } | null
  }
}

interface Props {
  metrics: DashboardMetrics
}

export function AdminDashboardClient({ metrics }: Props) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7d')

  // Get revenue based on selected period
  const getRevenueForPeriod = () => {
    switch (timePeriod) {
      case '24h': return metrics.revenue.today
      case '7d': return metrics.revenue.week
      case '30d': return metrics.revenue.month
      case 'all': return metrics.revenue.allTime
    }
  }

  // Get transactions for period
  const getTransactionsForPeriod = () => {
    switch (timePeriod) {
      case '24h': return metrics.revenue.todayTransactions
      case '7d': return metrics.revenue.weekTransactions
      case '30d': return metrics.revenue.monthTransactions
      case 'all': return metrics.revenue.allTimeTransactions
    }
  }

  // Get entries for period
  const getEntriesForPeriod = () => {
    switch (timePeriod) {
      case '24h': return metrics.competitions.todayEntries
      case '7d': return metrics.competitions.weekEntries
      case '30d': return metrics.competitions.monthEntries
      case 'all': return metrics.competitions.allTimeEntries
    }
  }

  // Get signups for period
  const getSignupsForPeriod = () => {
    switch (timePeriod) {
      case '24h': return metrics.users.todaySignups
      case '7d': return metrics.users.weekSignups
      case '30d': return metrics.users.monthSignups
      case 'all': return metrics.users.total
    }
  }

  // Calculate average order value
  const avgOrderValue = getTransactionsForPeriod() > 0 
    ? getRevenueForPeriod() / getTransactionsForPeriod() 
    : 0

  // Calculate conversion rate (signups -> paid users)
  const conversionRate = metrics.users.total > 0
    ? (metrics.users.withPaymentMethods / metrics.users.total) * 100
    : 0

  // Calculate free vs paid ratio
  const freeVsPaidRatio = metrics.competitions.paidEntries > 0
    ? (metrics.competitions.freeEntries / metrics.competitions.paidEntries) * 100
    : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-ZA').format(num)
  }

  const periodLabels = {
    '24h': 'Last 24 Hours',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    'all': 'All Time'
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 text-base sm:text-lg">
          Monitor your platform's performance and key metrics
        </p>
      </div>

      {/* Time Period Filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        {(['24h', '7d', '30d', 'all'] as TimePeriod[]).map((period) => (
          <button
            key={period}
            onClick={() => setTimePeriod(period)}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
              timePeriod === period
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {periodLabels[period]}
          </button>
        ))}
      </div>

      {/* Revenue Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Revenue
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-sm font-semibold opacity-90 mb-2">Total Revenue</p>
            <p className="text-3xl sm:text-4xl font-black mb-1">{formatCurrency(getRevenueForPeriod())}</p>
            <div className="flex items-center gap-1 text-xs opacity-80">
              <TrendingUp className="w-3 h-3" />
              <span>{getTransactionsForPeriod()} transactions</span>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-sm font-semibold text-gray-600 mb-2">Avg Order Value</p>
            <p className="text-3xl sm:text-4xl font-black text-gray-900 mb-1">{formatCurrency(avgOrderValue)}</p>
            <p className="text-xs text-gray-500">per transaction</p>
          </div>

          {/* Stripe Fees */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-sm font-semibold text-gray-600 mb-2">Stripe Fees</p>
            <p className="text-3xl sm:text-4xl font-black text-red-600 mb-1">{formatCurrency(metrics.revenue.stripeFees)}</p>
            <p className="text-xs text-gray-500">all time</p>
          </div>

          {/* Net Revenue */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-sm font-semibold text-gray-600 mb-2">Net Revenue</p>
            <p className="text-3xl sm:text-4xl font-black text-gray-900 mb-1">
              {formatCurrency(metrics.revenue.allTime - metrics.revenue.stripeFees)}
            </p>
            <p className="text-xs text-gray-500">after fees</p>
          </div>

        </div>
      </div>

      {/* Users Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          Users
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* New Signups */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-sm font-semibold opacity-90 mb-2">New Signups</p>
            <p className="text-3xl sm:text-4xl font-black mb-1">{formatNumber(getSignupsForPeriod())}</p>
            <div className="flex items-center gap-1 text-xs opacity-80">
              <TrendingUp className="w-3 h-3" />
              <span>{timePeriod === 'all' ? 'total users' : 'in period'}</span>
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-sm font-semibold text-gray-600 mb-2">Total Users</p>
            <p className="text-3xl sm:text-4xl font-black text-gray-900 mb-1">{formatNumber(metrics.users.total)}</p>
            <p className="text-xs text-gray-500">all time</p>
          </div>

          {/* Users with Payment */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-gray-600" />
              <p className="text-sm font-semibold text-gray-600">Payment Methods</p>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-gray-900 mb-1">{formatNumber(metrics.users.withPaymentMethods)}</p>
            <p className="text-xs text-green-600 font-semibold">{conversionRate.toFixed(1)}% conversion</p>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-sm font-semibold text-gray-600 mb-2">Active Users</p>
            <p className="text-3xl sm:text-4xl font-black text-gray-900 mb-1">{formatNumber(metrics.users.activeUsers)}</p>
            <p className="text-xs text-gray-500">placed entries</p>
          </div>

        </div>
      </div>

      {/* Competitions & Entries Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-600" />
          Competitions & Entries
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Entries */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
            <p className="text-sm font-semibold opacity-90 mb-2">Total Entries</p>
            <p className="text-3xl sm:text-4xl font-black mb-1">{formatNumber(getEntriesForPeriod())}</p>
            <div className="flex items-center gap-1 text-xs opacity-80">
              <Target className="w-3 h-3" />
              <span>{timePeriod === 'all' ? 'all time' : 'in period'}</span>
            </div>
          </div>

          {/* Live Competitions */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-sm font-semibold text-gray-600 mb-2">Live Competitions</p>
            <p className="text-3xl sm:text-4xl font-black text-gray-900 mb-1">{formatNumber(metrics.competitions.live)}</p>
            <p className="text-xs text-green-600 font-semibold">● Active Now</p>
          </div>

          {/* Paid Entries */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-sm font-semibold text-gray-600 mb-2">Paid Entries</p>
            <p className="text-3xl sm:text-4xl font-black text-green-600 mb-1">{formatNumber(metrics.competitions.paidEntries)}</p>
            <p className="text-xs text-gray-500">all time</p>
          </div>

          {/* Free Entries */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <p className="text-sm font-semibold text-gray-600 mb-2">Free Entries</p>
            <p className="text-3xl sm:text-4xl font-black text-blue-600 mb-1">{formatNumber(metrics.competitions.freeEntries)}</p>
            <p className="text-xs text-gray-500">{freeVsPaidRatio.toFixed(0)}% of paid</p>
          </div>

        </div>
      </div>

      {/* Insights Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          Insights
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Most Popular Competition */}
          {metrics.competitions.mostPopular && (
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5" />
                <p className="text-sm font-semibold opacity-90">Most Popular Competition</p>
              </div>
              <p className="text-xl font-black mb-1 line-clamp-1">{metrics.competitions.mostPopular.title}</p>
              <p className="text-sm opacity-80">{formatNumber(metrics.competitions.mostPopular.entries)} entries</p>
            </div>
          )}

          {/* Buy 2 Get 1 Free Impact */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <p className="text-sm font-semibold text-gray-600">"Buy 2 Get 1 Free" Impact</p>
            </div>
            <p className="text-3xl font-black text-gray-900 mb-1">{formatCurrency(metrics.competitions.freeEntries * 10)}</p>
            <p className="text-xs text-gray-500">Value given to customers (R10/entry)</p>
          </div>

        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/create">
          <Button className="w-full h-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl text-base font-bold flex items-center justify-center gap-3 shadow-lg">
            <Trophy className="w-5 h-5" />
            Create Competition
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Link href="/admin/manage">
          <Button className="w-full h-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl text-base font-bold flex items-center justify-center gap-3 shadow-lg">
            <Target className="w-5 h-5" />
            Manage Competitions
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Link href="/admin/winners">
          <Button className="w-full h-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-xl text-base font-bold flex items-center justify-center gap-3 shadow-lg">
            <Award className="w-5 h-5" />
            View Winners
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

    </div>
  )
}

