"use client"

import { useState } from "react"
import { User } from "@supabase/supabase-js"
import { GameCanvas } from "./game-canvas"
import { supabase } from "@/lib/supabase"
import { hashIP } from "@/lib/utils"
// import { useToast } from "@/hooks/use-toast" // Unused import
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface Competition {
  id: string
  title: string
  prize_short: string
  image_inpainted_path: string | null
  image_width: number | null
  image_height: number | null
  ends_at: string
  status: string
}

interface PlayPageProps {
  competition: Competition
  user: User | null
  hasExistingEntry: boolean
}

export function PlayPage({ competition, user, hasExistingEntry }: PlayPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Remove unused toast import since error handling is done in GameCanvas
  // const { toast } = useToast()

  const handleSubmitEntry = async (x: number, y: number) => {
    // If user is not authenticated, redirect to signup
    if (!user) {
      window.location.href = "/signup"
      return
    }

    if (hasExistingEntry) {
      throw new Error("You have already submitted an entry for this competition")
    }

    setIsSubmitting(true)
    
    try {
      // Get user's IP address (in production, you'd get this from headers)
      const ipHash = hashIP("127.0.0.1") // Mock IP for demo
      
      const { error } = await supabase
        .from("entries")
        .insert({
          competition_id: competition.id,
          user_id: user.id,
          x,
          y,
          ip_hash: ipHash,
        })

      if (error) throw error

      // Redirect to success page or home
      window.location.href = "/"
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit entry"
      throw new Error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // If no inpainted image is available, show message
  if (!competition.image_inpainted_path || !competition.image_width || !competition.image_height) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Competition Not Ready</h1>
          <p className="text-muted-foreground mb-6">
            This competition is still being prepared. Please check back later.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // If user already has an entry, show confirmation
  if (hasExistingEntry) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">Entry Submitted!</h1>
          <p className="text-muted-foreground mb-6">
            You&apos;ve already submitted your entry for this competition. 
            Check back when the countdown hits zero to see the results!
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="text-center">
            <h1 className="text-lg font-semibold">Place your marker</h1>
            <p className="text-sm text-muted-foreground">{competition.title}</p>
          </div>
          
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Game Canvas */}
      <GameCanvas
        imageUrl={competition.image_inpainted_path}
        imageWidth={competition.image_width}
        imageHeight={competition.image_height}
        onSubmit={handleSubmitEntry}
        disabled={isSubmitting}
      />
    </div>
  )
}
