import { createClient } from '@supabase/supabase-js'
import { EditCompetitionForm } from "@/components/admin/edit-competition-form"
import { notFound } from 'next/navigation'

interface EditCompetitionPageProps {
  params: Promise<{
    id: string
  }>
}

export const metadata = {
  title: "Edit Competition - BabaWina Admin",
  description: "Edit an existing competition with AI-powered image processing",
}

export default async function EditCompetitionPage({ params }: EditCompetitionPageProps) {
  const { id } = await params
  
  console.log('📝 EDIT PAGE LOADED - Competition ID:', id)
  console.log('📝 Full URL path: /admin/competitions/edit/' + id)
  
  // Fetch competition data server-side
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('🏢 Server: Fetching competition', id)

  const { data: competition, error } = await supabaseAdmin
    .from('competitions')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !competition) {
    console.error('❌ Server: Competition not found:', error)
    notFound()
  }

  console.log('✅ Server: Loaded competition:', competition.title)
  
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Edit Competition
        </h1>
        <p className="text-gray-600">
          Update competition details and manage photo processing.
        </p>
      </div>

      <EditCompetitionForm initialData={competition} />
    </div>
  )
}
