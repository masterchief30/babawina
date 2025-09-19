import { EnhancedCompetitionForm } from "@/components/admin/enhanced-competition-form"

export const metadata = {
  title: "Create Competition - BabaWina Admin",
  description: "Create a new competition with AI-powered image processing and normalization",
}

export default function CreateCompetitionPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create Competition
        </h1>
      </div>

      <EnhancedCompetitionForm />
    </div>
  )
}
