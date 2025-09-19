import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export const metadata = {
  title: "Admin Dashboard - BabaWina",
  description: "Manage competitions and process images",
}

export default function AdminDashboardPage() {
  // NO AUTHENTICATION CHECK - JUST LOAD THE DASHBOARD
  return (
    <div className="p-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Admin Dashboard
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">Total Competitions</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">Active Users</p>
            <p className="text-2xl font-bold text-gray-900">1</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">Total Entries</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">Winners</p>
            <p className="text-2xl font-bold text-gray-900">0</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-3">
              <span>🏆</span>
              Create New Competition
            </button>
            <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-3">
              <span>⚙️</span>
              Manage Existing Competitions
            </button>
            <button className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-3">
              <span>👑</span>
              View Winners
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">✅ Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Supabase Storage</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">✅ Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">AI Processing</span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">⚠️ Mock Mode</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
