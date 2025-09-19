"use client"

import { useState } from "react"
import { User } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { formatCurrency, generateSlug } from "@/lib/utils"
import { 
  Upload, 
  Target, 
  Wand2, 
  Save, 
  Clock, 
  Trophy, 
  FileText,
  Eye,
  Settings
} from "lucide-react"
import Link from "next/link"

interface Competition {
  id: string
  title: string
  slug: string
  prize_short: string
  prize_value_rand: number
  entry_price_rand: number
  image_raw_path: string | null
  image_mask_path: string | null
  image_inpainted_path: string | null
  status: 'draft' | 'live' | 'closed' | 'judged'
  starts_at: string
  ends_at: string
  judged_x: number | null
  judged_y: number | null
  detect_confidence: number | null
  image_width: number | null
  image_height: number | null
  processing_status: 'idle' | 'processing' | 'ready' | 'needs_review'
  created_at: string
}

interface AdminDashboardProps {
  competitions: Competition[]
  user: User
}

export function AdminDashboard({ competitions, user }: AdminDashboardProps) {
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleCreateCompetition = async (formData: FormData) => {
    const title = formData.get("title") as string
    const prizeShort = formData.get("prize_short") as string
    const prizeValue = parseInt(formData.get("prize_value") as string)
    const entryPrice = parseInt(formData.get("entry_price") as string)
    const startsAt = formData.get("starts_at") as string
    const endsAt = formData.get("ends_at") as string

    try {
      const { error } = await supabase
        .from("competitions")
        .insert({
          title,
          slug: generateSlug(title),
          prize_short: prizeShort,
          prize_value_rand: prizeValue,
          entry_price_rand: entryPrice,
          starts_at: startsAt,
          ends_at: endsAt,
          created_by: user.id,
          status: "draft"
        })

      if (error) throw error

      toast({
        title: "Competition created",
        description: "New competition has been created successfully.",
      })

      setShowCreateForm(false)
      window.location.reload()
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create competition",
        variant: "destructive",
      })
    }
  }

  const handleUploadPhoto = async (competitionId: string, file: File) => {
    try {
      setIsProcessing(true)
      
      // Upload to Supabase storage
      const fileName = `${competitionId}-${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from("competition-raw")
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Update competition with image path
      const { error: updateError } = await supabase
        .from("competitions")
        .update({ 
          image_raw_path: fileName,
          processing_status: "idle"
        })
        .eq("id", competitionId)

      if (updateError) throw updateError

      toast({
        title: "Photo uploaded",
        description: "Raw photo has been uploaded successfully.",
      })

      window.location.reload()
    } catch (error: unknown) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleGetCoordinates = async (competition: Competition) => {
    if (!competition.image_raw_path) return

    try {
      setIsProcessing(true)

      // Update status to processing
      await supabase
        .from("competitions")
        .update({ processing_status: "processing" })
        .eq("id", competition.id)

      // Call ball processor API
      const response = await fetch("/api/ball-processor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-raw/${competition.image_raw_path}`,
          do_inpaint: false
        })
      })

      const result = await response.json()

      if (!result.ok) throw new Error(result.error)

      // Update competition with detection results
      const { error } = await supabase
        .from("competitions")
        .update({
          judged_x: result.centroid.x,
          judged_y: result.centroid.y,
          detect_confidence: result.confidence,
          image_width: result.image_size.width,
          image_height: result.image_size.height,
          image_mask_path: result.mask_url,
          processing_status: "needs_review"
        })
        .eq("id", competition.id)

      if (error) throw error

      toast({
        title: "Coordinates detected",
        description: `Ball detected with ${(result.confidence * 100).toFixed(1)}% confidence.`,
      })

      window.location.reload()
    } catch (error: unknown) {
      toast({
        title: "Detection failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })

      // Reset processing status
      await supabase
        .from("competitions")
        .update({ processing_status: "idle" })
        .eq("id", competition.id)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleInpaintImage = async (competition: Competition) => {
    if (!competition.image_raw_path) return

    try {
      setIsProcessing(true)

      // Update status to processing
      await supabase
        .from("competitions")
        .update({ processing_status: "processing" })
        .eq("id", competition.id)

      // Call ball processor API with inpainting
      const response = await fetch("/api/ball-processor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-raw/${competition.image_raw_path}`,
          do_inpaint: true
        })
      })

      const result = await response.json()

      if (!result.ok) throw new Error(result.error)

      // Update competition with inpainted image
      const { error } = await supabase
        .from("competitions")
        .update({
          image_inpainted_path: result.inpainted_url,
          processing_status: "ready"
        })
        .eq("id", competition.id)

      if (error) throw error

      toast({
        title: "Image inpainted",
        description: "Ball has been removed from the image successfully.",
      })

      window.location.reload()
    } catch (error: unknown) {
      toast({
        title: "Inpainting failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })

      // Reset processing status
      await supabase
        .from("competitions")
        .update({ processing_status: "idle" })
        .eq("id", competition.id)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSetLive = async (competitionId: string) => {
    try {
      const { error } = await supabase
        .from("competitions")
        .update({ status: "live" })
        .eq("id", competitionId)

      if (error) throw error

      toast({
        title: "Competition is now live",
        description: "Users can now submit entries.",
      })

      window.location.reload()
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold text-primary">
              BabaWina
            </Link>
            <span className="text-sm bg-accent text-accent-foreground px-2 py-1 rounded">
              Admin
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, Admin
            </span>
            <Button onClick={() => setShowCreateForm(true)} variant="accent">
              Create Competition
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Create Competition Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg border p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Competition</h2>
            <form action={handleCreateCompetition} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Competition Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Win a PlayStation 5 for R30"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prize_short">Prize Name</Label>
                  <Input
                    id="prize_short"
                    name="prize_short"
                    placeholder="PlayStation 5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="prize_value">Prize Value (ZAR)</Label>
                  <Input
                    id="prize_value"
                    name="prize_value"
                    type="number"
                    placeholder="12000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="entry_price">Entry Price (ZAR)</Label>
                  <Input
                    id="entry_price"
                    name="entry_price"
                    type="number"
                    placeholder="30"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="starts_at">Start Date</Label>
                  <Input
                    id="starts_at"
                    name="starts_at"
                    type="datetime-local"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="ends_at">End Date</Label>
                  <Input
                    id="ends_at"
                    name="ends_at"
                    type="datetime-local"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Competition</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Competitions List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Competitions</h2>
          
          {competitions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No competitions yet. Create your first competition to get started.
            </div>
          ) : (
            <div className="grid gap-6">
              {competitions.map((competition) => (
                <div key={competition.id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{competition.title}</h3>
                      <p className="text-muted-foreground">
                        {competition.prize_short} • {formatCurrency(competition.prize_value_rand)} • 
                        Entry: {formatCurrency(competition.entry_price_rand)}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Status: {competition.status}</span>
                        <span>Processing: {competition.processing_status}</span>
                        {competition.detect_confidence && (
                          <span>Confidence: {(competition.detect_confidence * 100).toFixed(1)}%</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCompetition(
                          selectedCompetition?.id === competition.id ? null : competition
                        )}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        {selectedCompetition?.id === competition.id ? "Hide" : "Manage"}
                      </Button>
                    </div>
                  </div>

                  {selectedCompetition?.id === competition.id && (
                    <div className="border-t pt-4 space-y-4">
                      {/* Upload Photo */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label htmlFor={`photo-${competition.id}`}>Upload Unprocessed Photo</Label>
                          <Input
                            id={`photo-${competition.id}`}
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUploadPhoto(competition.id, file)
                            }}
                          />
                        </div>
                        <Button
                          variant="outline"
                          disabled={!competition.image_raw_path}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {competition.image_raw_path ? "Uploaded" : "Upload Photo"}
                        </Button>
                      </div>

                      {/* AI Processing Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={() => handleGetCoordinates(competition)}
                          disabled={!competition.image_raw_path || isProcessing}
                          variant="outline"
                        >
                          <Target className="w-4 h-4 mr-2" />
                          Get Coordinates (AI)
                        </Button>
                        
                        <Button
                          onClick={() => handleInpaintImage(competition)}
                          disabled={!competition.image_raw_path || isProcessing}
                          variant="outline"
                        >
                          <Wand2 className="w-4 h-4 mr-2" />
                          Remove Ball (AI Inpaint)
                        </Button>

                        <Button
                          onClick={() => handleSetLive(competition.id)}
                          disabled={competition.processing_status !== "ready" || competition.status === "live"}
                          variant="accent"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Set Live
                        </Button>
                      </div>

                      {/* Processing Status */}
                      {isProcessing && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                          Processing...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
