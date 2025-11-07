"use client"

import { useCenterNotification } from "@/hooks/use-center-notification"
import { CenterNotification } from "@/components/ui/center-notification"
import { EnhancedCompetitionForm } from "./enhanced-competition-form"

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

interface EditCompetitionFormProps {
  initialData: CompetitionData
}

export function EditCompetitionForm({ initialData }: EditCompetitionFormProps) {
  const { notification, close } = useCenterNotification()

  console.log('📝 EditCompetitionForm received initialData:', initialData ? {
    id: initialData.id,
    title: initialData.title,
    status: initialData.status
  } : 'undefined')

  return (
    <>
      <EnhancedCompetitionForm 
        editMode={true}
        initialData={initialData}
        competitionId={initialData.id}
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
