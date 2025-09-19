"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { generateSlug } from "@/lib/utils"
import { Upload, Target, Wand2, Save, Eye } from "lucide-react"
import Image from "next/image"

interface CompetitionData {
  title: string
  prize_short: string
  prize_value_rand: number
  entry_price_rand: number
  is_free: boolean
  starts_at: string
  ends_at: string
  per_user_entry_limit: number
  status: 'draft' | 'live' | 'closed' | 'judged'
}

interface ProcessingResult {
  centroid: { x: number; y: number }
  bbox: { x: number; y: number; w: number; h: number }
  confidence: number
  mask_url: string
  inpainted_url?: string
  image_size: { width: number; height: number }
}

export function CreateCompetitionForm() {
  const [formData, setFormData] = useState<CompetitionData>({
    title: "",
    prize_short: "",
    prize_value_rand: 0,
    entry_price_rand: 0,
    is_free: false,
    starts_at: "",
    ends_at: "",
    per_user_entry_limit: 1,
    status: 'draft'
  })

  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageRawPath, setImageRawPath] = useState<string | null>(null)
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const [inpaintedImageUrl, setInpaintedImageUrl] = useState<string | null>(null)
  const [showComparison, setShowComparison] = useState(false)

  const { toast } = useToast()

  // File upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPG, PNG, or WEBP files only.",
        variant: "destructive"
      })
      return
    }

    // Validate file size (8MB)
    if (file.size > 8 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 8MB.",
        variant: "destructive"
      })
      return
    }

    setUploadedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Validate dimensions
    const img = new window.Image()
    img.onload = () => {
      if (img.width < 1280 || img.height < 720) {
        toast({
          title: "Image too small",
          description: "Minimum resolution: 1280×720 pixels.",
          variant: "destructive"
        })
        return
      }
      
      if (img.width > 6000 || img.height > 6000) {
        toast({
          title: "Image too large",
          description: "Maximum resolution: 6000×6000 pixels. Consider resizing.",
          variant: "destructive"
        })
        return
      }
    }
    img.src = URL.createObjectURL(file)
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  })

  // Upload to Supabase Storage
  const handleUploadToStorage = async () => {
    if (!uploadedFile) return

    try {
      const fileName = `${Date.now()}-${uploadedFile.name}`
      const { error } = await supabase.storage
        .from('competition-raw')
        .upload(fileName, uploadedFile)

      if (error) throw error

      setImageRawPath(fileName)
      toast({
        title: "Photo uploaded",
        description: "Raw photo uploaded successfully.",
      })
    } catch (error: unknown) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // AI Ball Detection
  const handleGetCoordinates = async () => {
    if (!imageRawPath) {
      toast({
        title: "No image",
        description: "Please upload an image first.",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/ball-processor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-raw/${imageRawPath}`,
          do_inpaint: false
        })
      })

      const result = await response.json()
      if (!result.ok) throw new Error(result.error)

      setProcessingResult(result)
      setDragPosition({ x: result.centroid.x, y: result.centroid.y })

      toast({
        title: "Ball detected",
        description: `Confidence: ${(result.confidence * 100).toFixed(1)}%`,
      })
    } catch (error: unknown) {
      toast({
        title: "Detection failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // AI Ball Removal
  const handleRemoveBall = async () => {
    if (!imageRawPath || !processingResult) {
      toast({
        title: "Prerequisites missing",
        description: "Please detect ball coordinates first.",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/ball-processor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-raw/${imageRawPath}`,
          do_inpaint: true
        })
      })

      const result = await response.json()
      if (!result.ok) throw new Error(result.error)

      setInpaintedImageUrl(result.inpainted_url)
      setShowComparison(true)

      toast({
        title: "Ball removed",
        description: "Inpainting completed successfully.",
      })
    } catch (error: unknown) {
      toast({
        title: "Inpainting failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Save Competition
  const handleSaveCompetition = async () => {
    // Validation
    if (!formData.title || !formData.prize_short) {
      toast({
        title: "Missing fields",
        description: "Title and Prize Name are required.",
        variant: "destructive"
      })
      return
    }

    if (new Date(formData.ends_at) <= new Date(formData.starts_at)) {
      toast({
        title: "Invalid dates",
        description: "End date must be after start date.",
        variant: "destructive"
      })
      return
    }

    if (formData.per_user_entry_limit < 1) {
      toast({
        title: "Invalid entry limit",
        description: "Entry limit must be at least 1.",
        variant: "destructive"
      })
      return
    }

    try {
      const competitionData = {
        title: formData.title,
        slug: generateSlug(formData.title),
        prize_short: formData.prize_short,
        prize_value_rand: formData.prize_value_rand,
        entry_price_rand: formData.is_free ? 0 : formData.entry_price_rand,
        starts_at: formData.starts_at,
        ends_at: formData.ends_at,
        status: formData.status,
        image_raw_path: imageRawPath,
        image_mask_path: processingResult?.mask_url,
        image_inpainted_path: inpaintedImageUrl,
        judged_x: dragPosition?.x || processingResult?.centroid.x,
        judged_y: dragPosition?.y || processingResult?.centroid.y,
        detect_confidence: processingResult?.confidence,
        image_width: processingResult?.image_size.width,
        image_height: processingResult?.image_size.height,
        processing_status: inpaintedImageUrl ? 'ready' : 'idle',
        created_by: 'admin-user-id' // Replace with actual user ID
      }

      const { error } = await supabase
        .from('competitions')
        .insert(competitionData)

      if (error) throw error

      toast({
        title: "Competition created",
        description: "Competition saved successfully!",
      })

      // Reset form
      setFormData({
        title: "",
        prize_short: "",
        prize_value_rand: 0,
        entry_price_rand: 0,
        is_free: false,
        starts_at: "",
        ends_at: "",
        per_user_entry_limit: 1,
        status: 'draft'
      })
      setUploadedFile(null)
      setImagePreview(null)
      setImageRawPath(null)
      setProcessingResult(null)
      setDragPosition(null)
      setInpaintedImageUrl(null)
      setShowComparison(false)

    } catch (error: unknown) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. Competition Details */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-6">Competition Details</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="title">Competition Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Win a PlayStation 5 for R30"
            />
          </div>

          <div>
            <Label htmlFor="prize_short">Prize Name *</Label>
            <Input
              id="prize_short"
              value={formData.prize_short}
              onChange={(e) => setFormData(prev => ({ ...prev, prize_short: e.target.value }))}
              placeholder="PlayStation 5"
            />
          </div>

          <div>
            <Label htmlFor="prize_value">Prize Value (R)</Label>
            <Input
              id="prize_value"
              type="number"
              value={formData.prize_value_rand}
              onChange={(e) => setFormData(prev => ({ ...prev, prize_value_rand: parseInt(e.target.value) || 0 }))}
              placeholder="12000"
            />
          </div>

          <div>
            <Label htmlFor="entry_price">Entry Price (R)</Label>
            <div className="space-y-2">
              <Input
                id="entry_price"
                type="number"
                value={formData.entry_price_rand}
                onChange={(e) => setFormData(prev => ({ ...prev, entry_price_rand: parseInt(e.target.value) || 0 }))}
                placeholder="30"
                disabled={formData.is_free}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_free}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    is_free: e.target.checked,
                    entry_price_rand: e.target.checked ? 0 : prev.entry_price_rand
                  }))}
                />
                <span className="text-sm">Free Entry</span>
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="starts_at">Start Date & Time</Label>
            <Input
              id="starts_at"
              type="datetime-local"
              value={formData.starts_at}
              onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="ends_at">End Date & Time</Label>
            <Input
              id="ends_at"
              type="datetime-local"
              value={formData.ends_at}
              onChange={(e) => setFormData(prev => ({ ...prev, ends_at: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="entry_limit">Entry Limit per User</Label>
            <Input
              id="entry_limit"
              type="number"
              min="1"
              value={formData.per_user_entry_limit}
              onChange={(e) => setFormData(prev => ({ ...prev, per_user_entry_limit: parseInt(e.target.value) || 1 }))}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'live' | 'closed' | 'judged' }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="draft">Draft</option>
              <option value="live">Live</option>
              <option value="closed">Closed</option>
              <option value="judged">Judged</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Upload Raw Photo */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-6">Upload Raw Photo</h2>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-emerald-600">Drop the photo here...</p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">Drag & drop a photo here, or click to browse</p>
              <p className="text-sm text-gray-500">JPG, PNG, WEBP • Max 8MB • Min 1280×720</p>
            </div>
          )}
        </div>

        {imagePreview && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Preview</h3>
              <div className="flex gap-2">
                <Button onClick={handleUploadToStorage} disabled={!!imageRawPath}>
                  {imageRawPath ? 'Uploaded' : 'Upload to Storage'}
                </Button>
              </div>
            </div>
            <div className="relative">
              <Image
                src={imagePreview}
                alt="Preview"
                width={400}
                height={300}
                className="rounded-lg border"
              />
              {uploadedFile && (
                <div className="mt-2 text-sm text-gray-600">
                  {uploadedFile.name} • {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Process Photo */}
      {imageRawPath && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-6">Process Photo (AI & Manual)</h2>
          
          <div className="flex gap-4 mb-6">
            <Button
              onClick={handleGetCoordinates}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Get Ball Coordinates (AI)
            </Button>

            <Button
              onClick={handleRemoveBall}
              disabled={isProcessing || !processingResult}
              className="flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              Remove Ball (AI Inpaint)
            </Button>
          </div>

          {processingResult && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">
                  Ball detected at ({processingResult.centroid.x.toFixed(1)}, {processingResult.centroid.y.toFixed(1)}) 
                  with {(processingResult.confidence * 100).toFixed(1)}% confidence
                </p>
              </div>

              {showComparison && inpaintedImageUrl && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Original</h4>
                    <Image
                      src={imagePreview!}
                      alt="Original"
                      width={300}
                      height={200}
                      className="rounded-lg border"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Ball Removed</h4>
                    <Image
                      src={inpaintedImageUrl}
                      alt="Inpainted"
                      width={300}
                      height={200}
                      className="rounded-lg border"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
              Processing...
            </div>
          )}
        </div>
      )}

      {/* 4. Save Competition */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Save Competition</h2>
          <Button
            onClick={handleSaveCompetition}
            className="flex items-center gap-2"
            variant="accent"
          >
            <Save className="w-4 h-4" />
            Save Competition
          </Button>
        </div>
      </div>
    </div>
  )
}
