"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { EnhancedCompetitionForm } from "./enhanced-competition-form"
import { useCenterNotification } from "@/hooks/use-center-notification"
import { CenterNotification } from "@/components/ui/center-notification"

interface EditCompetitionFormProps {
  competitionId: string
}

interface CompetitionData {
  id: string
  title: string
  prize_short: string
  prize_value_rand: number
  entry_price_rand: number
  is_free: boolean
  starts_at: string
  ends_at: string
  per_user_entry_limit: number
  status: 'draft' | 'live' | 'closed' | 'judged'
  image_raw_path?: string
  image_normalized_path?: string
  image_inpainted_path?: string
  display_photo_path?: string
  display_photo_alt?: string
  raw_image_width?: number
  raw_image_height?: number
  normalized_width?: number
  normalized_height?: number
  norm_scale_x?: number
  norm_scale_y?: number
  norm_offset_x?: number
  norm_offset_y?: number
  judged_x_norm?: number
  judged_y_norm?: number
  judged_u?: number
  judged_v?: number
  detect_confidence?: number
  processing_status?: string
}

export function EditCompetitionForm({ competitionId }: EditCompetitionFormProps) {
  const [competitionData, setCompetitionData] = useState<CompetitionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { notification, showError, close } = useCenterNotification()
  const router = useRouter()

  // Fetch competition data
  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        const { data, error } = await supabase
          .from('competitions')
          .select('*')
          .eq('id', competitionId)
          .single()

        if (error) throw error

        if (!data) {
          throw new Error('Competition not found')
        }

        setCompetitionData(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        showError("Failed to load competition", errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (competitionId) {
      fetchCompetition()
    }
  }, [competitionId, showError])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading competition...</p>
        </div>
      </div>
    )
  }

  if (error || !competitionData) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 rounded-xl p-8 max-w-md mx-auto">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-900 mb-2">
            Competition Not Found
          </h3>
          <p className="text-red-700 mb-6">
            {error || "The competition you're looking for doesn't exist."}
          </p>
          <button
            onClick={() => router.push('/admin/manage')}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Back to Manage
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <EnhancedCompetitionForm 
        editMode={true}
        initialData={competitionData}
        competitionId={competitionId}
      />
      
      {/* Center Notification */}
      <CenterNotification
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        description={notification.description}
        onClose={close}
      />
    </>
  )
}