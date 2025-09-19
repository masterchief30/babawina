import { EditCompetitionForm } from "@/components/admin/edit-competition-form"

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

      <EditCompetitionForm competitionId={id} />
    </div>
  )
}
