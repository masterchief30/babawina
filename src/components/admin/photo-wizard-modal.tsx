"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { 
  cropAndNormalizeImage,
  getImageDimensions,
  validateMobileUpload,
  validateMobileDimensions,
  normalizedToUnitCoords,
  type NormalizationTransform,
  type ImageDimensions,
} from "@/lib/image-utils"
import { 
  Wand2, Save, 
  CheckCircle, Zap, RefreshCw
} from "lucide-react"
import NextImage from "next/image"

interface PhotoWizardModalProps {
  isOpen: boolean
  onClose: () => void
  file: File | null
  onComplete: (data: {
    competitionId: string
    rawPath: string
    normalizedPath: string
    inpaintedPath: string
    coordinates: { x: number; y: number; u: number; v: number }
    transform: NormalizationTransform
  }) => void
}

interface WizardData {
  competitionId: string
  rawPath: string
  normalizedPath: string
  normalizedBlob: Blob | null
  normalizedImageUrl: string
  coordinates: { x: number; y: number; u: number; v: number } | null
  inpaintedPath: string
  transform: NormalizationTransform | null
}

interface AiResult {
  ok: boolean
  centroid?: { x: number; y: number }
  confidence?: number
  error?: string
}

type WizardStep = 1 | 2 | 3 | 4

export function PhotoWizardModal({ isOpen, onClose, file, onComplete }: PhotoWizardModalProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [wizardData, setWizardData] = useState<WizardData>({
    competitionId: '',
    rawPath: '',
    normalizedPath: '',
    normalizedBlob: null,
    normalizedImageUrl: '',
    coordinates: null,
    inpaintedPath: '',
    transform: null
  })
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [, setIsSavingFinal] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null)
  const [manualCoords, setManualCoords] = useState<{ x: number; y: number } | null>(null)
  const [aiResult, setAiResult] = useState<AiResult | null>(null)
  const [inpaintedPreview, setInpaintedPreview] = useState<string | null>(null)
  
  // Crop drag states
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [cropPosition, setCropPosition] = useState({ top: 20, left: 15, width: 70, height: 60 })
  
  // Ball detection states
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number } | null>(null)
  const [showMouseCrosshair, setShowMouseCrosshair] = useState(false)
  const [savingCoordinates, setSavingCoordinates] = useState(false)
  const [detectingBall, setDetectingBall] = useState(false)

  const { toast } = useToast()

  // Crop drag handlers
  const handleCropMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return
    
    e.preventDefault()
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    
    // Convert pixel movement to percentage movement
    const containerWidth = 800 // Image width
    const containerHeight = 600 // Image height
    const deltaPercentX = (deltaX / containerWidth) * 100
    const deltaPercentY = (deltaY / containerHeight) * 100
    
    setCropPosition(prev => {
      const newLeft = Math.max(0, Math.min(100 - prev.width, prev.left + deltaPercentX))
      const newTop = Math.max(0, Math.min(100 - prev.height, prev.top + deltaPercentY))
      
      return {
        ...prev,
        left: newLeft,
        top: newTop
      }
    })
    
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleCropMouseUp = () => {
    setIsDragging(false)
    setDragStart(null)
  }

  // Initialize wizard when file changes
  useEffect(() => {
    if (!file || !isOpen) return

    const validation = validateMobileUpload(file)
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive"
      })
      return
    }

    const url = URL.createObjectURL(file)
    setImageUrl(url)

    getImageDimensions(file).then((dimensions) => {
      const dimensionValidation = validateMobileDimensions(dimensions.width, dimensions.height)
      if (!dimensionValidation.valid) {
        toast({
          title: "Invalid dimensions", 
          description: dimensionValidation.error,
          variant: "destructive"
        })
        return
      }

      setImageDimensions(dimensions)
      
      // Generate competition ID
      const competitionId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      setWizardData(prev => ({ ...prev, competitionId }))
    })

    return () => URL.revokeObjectURL(url)
  }, [file, isOpen, toast])

  // Step 1: Save Raw Photo
  const handleSaveRaw = async () => {
    if (!file || !wizardData.competitionId) return

    setIsProcessing(true)
    try {
      // Check auth before upload
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated. Please refresh the page and log in again.')
      }

      const fileName = `${wizardData.competitionId}_raw.${file.name.split('.').pop()}`
      
      console.log('🏈 Raw photo upload - User:', session.user.email)
      console.log('📦 File size:', file.size, 'bytes')
      console.log('📁 Target: competition-raw/', fileName)
      
      const { error } = await supabase.storage
        .from('competition-raw')
        .upload(fileName, file)

      if (error) {
        console.error('❌ Raw photo upload failed:', error.message)
        throw error
      }

      console.log('✅ Raw photo uploaded successfully')
      setWizardData(prev => ({ ...prev, rawPath: fileName }))
      
      // Show success message for 2 seconds, then move to next step
      setTimeout(() => {
        setCurrentStep(2)
        setIsProcessing(false)
      }, 2000)
      
    } catch (error: unknown) {
      console.error('💥 Raw photo exception:', error)
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      })
      setIsProcessing(false)
    }
  }

  // Step 2: Save Cropped Photo  
  const handleSaveCropped = async () => {
    if (!file || !imageDimensions) return

    // Convert cropPosition percentages to pixel coordinates
    const cropAreaPixels = {
      x: (cropPosition.left / 100) * imageDimensions.width,
      y: (cropPosition.top / 100) * imageDimensions.height,
      width: (cropPosition.width / 100) * imageDimensions.width,
      height: (cropPosition.height / 100) * imageDimensions.height
    }

    setIsProcessing(true)
    try {
      // Check auth before upload
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated. Please refresh the page and log in again.')
      }

      const { blob, transform } = await cropAndNormalizeImage(file, cropAreaPixels, imageDimensions)
      const fileName = `${wizardData.competitionId}_normalized.jpg`
      
      console.log('✂️ Cropped photo upload - User:', session.user.email)
      console.log('📦 Blob size:', blob.size, 'bytes')
      console.log('📁 Target: competition-images/normalized/', fileName)
      
      const { error } = await supabase.storage
        .from('competition-images')
        .upload(`normalized/${fileName}`, blob)

      if (error) {
        console.error('❌ Cropped photo upload failed:', error.message)
        throw error
      }

      console.log('✅ Cropped photo uploaded successfully')
      const url = URL.createObjectURL(blob)
      
      setWizardData(prev => ({
        ...prev,
        normalizedPath: `normalized/${fileName}`,
        normalizedBlob: blob,
        normalizedImageUrl: url,
        transform
      }))
      
      // Show success message for 2 seconds, then move to next step
      setTimeout(() => {
        setCurrentStep(3)
        setIsProcessing(false)
      }, 2000)
    } catch (error: unknown) {
      console.error('💥 Cropped photo exception:', error)
      toast({
        title: "Crop failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      })
      setIsProcessing(false)
    }
  }

  // Step 3: Detect Ball with AI
  const handleDetectWithAI = async () => {
    if (!wizardData.normalizedPath) return

    setDetectingBall(true)
    try {
      const response = await fetch('/api/ball-processor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-images/${wizardData.normalizedPath}`,
          do_inpaint: false,
          competition_id: wizardData.competitionId
        })
      })

      const result = await response.json()
      if (!result.ok) throw new Error(result.error)

      setAiResult(result)
      // Clear any manual coordinates since AI has now set the position
      setManualCoords(null)
    } catch (error: unknown) {
      toast({
        title: "Detection failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      })
    } finally {
      setDetectingBall(false)
    }
  }

  // Step 3: Save Coordinates
  const handleSaveCoordinates = () => {
    const coords = manualCoords || aiResult?.centroid
    if (!coords) {
      toast({
        title: "No coordinates",
        description: "Please detect or set coordinates first.",
        variant: "destructive"
      })
      return
    }

    const unitCoords = normalizedToUnitCoords(coords.x, coords.y)
    
    setWizardData(prev => ({
      ...prev,
      coordinates: {
        x: coords.x,
        y: coords.y,
        u: unitCoords.u,
        v: unitCoords.v
      }
    }))
    
    // Show success message and auto-advance
    setSavingCoordinates(true)
    setTimeout(() => {
      setSavingCoordinates(false)
      setCurrentStep(4)
    }, 2000)
  }

  // Step 4: Remove Ball
  const handleRemoveBall = async () => {
    if (!wizardData.normalizedPath) return

    setIsProcessing(true)
    try {
      const response = await fetch('/api/ball-processor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-images/${wizardData.normalizedPath}`,
          do_inpaint: true,
          competition_id: wizardData.competitionId
        })
      })

      const result = await response.json()
      if (!result.ok) throw new Error(result.error)

      // Use the inpainted URL directly from the API response
      const inpaintedUrl = result.inpainted_url
      console.log('Ball processor returned inpainted URL:', inpaintedUrl)
      
      setInpaintedPreview(inpaintedUrl)
    } catch (error: unknown) {
      toast({
        title: "Removal failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Step 4: Save Final Photo
  const handleSaveFinal = () => {
    if (!inpaintedPreview || !wizardData.coordinates || !wizardData.transform) {
      toast({
        title: "Missing data",
        description: "Please complete all steps first.",
        variant: "destructive"
      })
      return
    }

    const finalData = {
      competitionId: wizardData.competitionId,
      rawPath: wizardData.rawPath,
      normalizedPath: wizardData.normalizedPath,
      inpaintedPath: inpaintedPreview, // Use the actual URL from the API
      coordinates: wizardData.coordinates,
      transform: wizardData.transform
    }

    // Show success message and auto-close
    setIsSavingFinal(true)
    setTimeout(() => {
      onComplete(finalData)
      onClose()
    }, 2000)
  }

  // Handle click on cropped area for manual coordinate setting
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentStep !== 3) return
    
    const croppedArea = e.currentTarget
    if (!croppedArea) return

    const rect = croppedArea.getBoundingClientRect()
    // Calculate coordinates within the cropped area (0-960, 0-540)
    const x = ((e.clientX - rect.left) / rect.width) * 960
    const y = ((e.clientY - rect.top) / rect.height) * 540

    setManualCoords({ x, y })
    // Clear AI result when manual coordinates are set
    setAiResult(null)
    setShowMouseCrosshair(false)
    
    // No toast notification - only show when saving
  }

  // Handle mouse movement for live crosshair preview
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentStep !== 3) return
    
    const croppedArea = e.currentTarget
    if (!croppedArea) return

    const rect = croppedArea.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 960
    const y = ((e.clientY - rect.top) / rect.height) * 540

    setMouseCoords({ x, y })
  }

  const handleMouseEnter = () => {
    if (currentStep === 3) {
      setShowMouseCrosshair(true)
    }
  }

  const handleMouseLeave = () => {
    setShowMouseCrosshair(false)
    setMouseCoords(null)
  }

  const handleCancel = () => {
    onClose()
    // Reset state
    setCurrentStep(1)
    setWizardData({
      competitionId: '',
      rawPath: '',
      normalizedPath: '',
      normalizedBlob: null,
      normalizedImageUrl: '',
      coordinates: null,
      inpaintedPath: '',
      transform: null
    })
  }

  // Progress calculation
  const progress = (currentStep / 4) * 100

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-[1200px] h-[800px] overflow-hidden bg-white p-0 [&>button]:text-white [&>button]:w-10 [&>button]:h-10 [&>button]:font-bold [&>button]:text-2xl">
        <DialogTitle className="sr-only">Photo Processing Wizard</DialogTitle>
        {/* Header with Progress */}
        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Photo Processing Wizard ({currentStep}/4)</h2>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Step Title */}
          <div className="mt-4">
            {currentStep === 1 && <h3 className="text-lg">Save Raw Photo</h3>}
            {currentStep === 2 && <h3 className="text-lg">Crop Raw Photo</h3>}
            {currentStep === 3 && <h3 className="text-lg">Locate Ball Center</h3>}
            {currentStep === 4 && <h3 className="text-lg">Remove Ball</h3>}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 flex items-center justify-center overflow-hidden">
          {/* Step 1: Raw Photo */}
          {currentStep === 1 && imageUrl && imageDimensions && !isProcessing && (
            <div className="flex flex-col items-center justify-center space-y-6">
              <Image
                src={imageUrl}
                alt="Raw upload"
                width={800}
                height={600}
                className="object-contain"
              />
            </div>
          )}

          {/* Step 1: Processing/Success Message */}
          {currentStep === 1 && isProcessing && (
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500"></div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-emerald-600 mb-2">Raw Photo Saved!</p>
                <p className="text-lg text-gray-600">Moving to crop step...</p>
              </div>
            </div>
          )}

          {/* Step 2: Crop Interface */}
          {currentStep === 2 && imageUrl && imageDimensions && !isProcessing && (
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <Image
                  src={imageUrl}
                  alt="Photo to crop"
                  width={800}
                  height={600}
                  className="object-contain"
                  style={{ borderRadius: 0 }}
                />
                {/* Full overlay with cutout effect */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `
                      linear-gradient(to bottom, 
                        rgba(0,0,0,0.6) 0%, 
                        rgba(0,0,0,0.6) ${cropPosition.top}%, 
                        transparent ${cropPosition.top}%, 
                        transparent ${cropPosition.top + cropPosition.height}%, 
                        rgba(0,0,0,0.6) ${cropPosition.top + cropPosition.height}%, 
                        rgba(0,0,0,0.6) 100%
                      ),
                      linear-gradient(to right, 
                        rgba(0,0,0,0.6) 0%, 
                        rgba(0,0,0,0.6) ${cropPosition.left}%, 
                        transparent ${cropPosition.left}%, 
                        transparent ${cropPosition.left + cropPosition.width}%, 
                        rgba(0,0,0,0.6) ${cropPosition.left + cropPosition.width}%, 
                        rgba(0,0,0,0.6) 100%
                      )
                    `
                  }}
                ></div>
                
                <div 
                  className="absolute border-4 border-emerald-500 cursor-move pointer-events-auto select-none"
                  style={{
                    top: `${cropPosition.top}%`,
                    left: `${cropPosition.left}%`,
                    width: `${cropPosition.width}%`,
                    height: `${cropPosition.height}%`,
                    backgroundColor: 'transparent'
                  }}
                  onMouseDown={handleCropMouseDown}
                  onMouseMove={handleCropMouseMove}
                  onMouseUp={handleCropMouseUp}
                  onMouseLeave={handleCropMouseUp}
                >
                  <div className="absolute inset-2 border-2 border-dashed border-white opacity-80"></div>
                  <div className="absolute -top-2 -left-2 w-4 h-4 bg-emerald-500 border-2 border-white cursor-pointer"></div>
                  <div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-500 border-2 border-white cursor-pointer"></div>
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-emerald-500 border-2 border-white cursor-pointer"></div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-emerald-500 border-2 border-white cursor-pointer"></div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Processing/Success Message */}
          {currentStep === 2 && isProcessing && (
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500"></div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-emerald-600 mb-2">Cropped Photo Saved!</p>
                <p className="text-lg text-gray-600">Moving to ball detection...</p>
              </div>
            </div>
          )}

          {/* Step 3: Ball Detection */}
          {currentStep === 3 && wizardData.normalizedImageUrl && (
            <div className="flex items-center justify-center">
              {savingCoordinates && (
                <div className="absolute inset-0 bg-white flex items-center justify-center z-50">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-6"></div>
                    <h3 className="text-2xl font-bold text-emerald-600 mb-2">Coordinates Saved!</h3>
                    <p className="text-gray-600">Moving to ball removal...</p>
                  </div>
                </div>
              )}
              <div className="flex gap-8 items-center">
                {/* Image with crosshair - only clickable in cropped area */}
                <div className="relative">
                  {/* Full original image as background (dimmed) */}
                  <NextImage
                    src={imageUrl || '/placeholder-image.jpg'}
                    alt="Original photo"
                    width={800}
                    height={600}
                    className="opacity-40"
                    style={{ borderRadius: 0 }}
                  />
                  
                  {/* Cropped area overlay - interactive */}
                  <div 
                    className="absolute cursor-crosshair"
                    style={{
                      top: `${cropPosition.top}%`,
                      left: `${cropPosition.left}%`,
                      width: `${cropPosition.width}%`,
                      height: `${cropPosition.height}%`,
                      backgroundImage: `url(${wizardData.normalizedImageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                    onClick={handleCanvasClick}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  />
                  
                  {/* Fixed crosshair - positioned within the cropped area */}
                  {(manualCoords || !!aiResult?.centroid) && (
                    <div
                      className="absolute pointer-events-none z-10"
                      style={{
                        left: `${cropPosition.left + ((manualCoords?.x || aiResult?.centroid?.x || 0) / 960) * cropPosition.width}%`,
                        top: `${cropPosition.top + ((manualCoords?.y || aiResult?.centroid?.y || 0) / 540) * cropPosition.height}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {/* Crosshair lines */}
                      <div className="absolute w-8 h-px bg-red-500 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg"></div>
                      <div className="absolute h-8 w-px bg-red-500 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg"></div>
                    </div>
                  )}

                  {/* Mouse preview crosshair */}
                  {showMouseCrosshair && mouseCoords && !manualCoords && !aiResult && (
                    <div
                      className="absolute pointer-events-none z-10 opacity-60"
                      style={{
                        left: `${cropPosition.left + (mouseCoords.x / 960) * cropPosition.width}%`,
                        top: `${cropPosition.top + (mouseCoords.y / 540) * cropPosition.height}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {/* Preview crosshair lines */}
                      <div className="absolute w-6 h-px bg-yellow-400 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg"></div>
                      <div className="absolute h-6 w-px bg-yellow-400 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-lg"></div>
                    </div>
                  )}
                </div>

                {/* Controls on the right */}
                <div className="flex flex-col space-y-4">
                  <Button
                    onClick={handleDetectWithAI}
                    disabled={detectingBall}
                    className="flex items-center gap-2 w-48 bg-gray-700 hover:bg-emerald-600 text-white"
                  >
                    <Zap className="w-4 h-4" />
                    {detectingBall ? 'Detecting...' : 'Use AI Detection'}
                  </Button>

                  {(manualCoords || !!aiResult?.centroid) && (
                    <div className="bg-emerald-50 p-4 rounded-lg w-48">
                      <p className="font-medium text-emerald-800 text-sm">
                        Ball center: ({(manualCoords?.x || aiResult?.centroid?.x || 0).toFixed(1)}, {(manualCoords?.y || aiResult?.centroid?.y || 0).toFixed(1)})
                      </p>
                      <div className="mt-2 text-xs">
                        {manualCoords && (
                          <span className="text-blue-600 font-medium">📍 Manual Position</span>
                        )}
                        {!!aiResult?.centroid && !manualCoords && (
                          <span className="text-emerald-600 font-medium">🤖 AI Detection ({((aiResult.confidence || 0) * 100).toFixed(1)}% confidence)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Ball Removal */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-center">
                  <h4 className="font-medium mb-4 text-lg">Original (with ball)</h4>
                  {wizardData.normalizedImageUrl && (
                    <Image
                      src={wizardData.normalizedImageUrl}
                      alt="Original"
                      width={600}
                      height={338}
                      className="border mx-auto"
                      style={{ borderRadius: 0 }}
                    />
                  )}
                </div>
                <div className="text-center">
                  <h4 className="font-medium mb-4 text-lg">Ball Removed</h4>
                  {inpaintedPreview && (
                    <Image
                      src={inpaintedPreview}
                      alt="Ball removed"
                      width={600}
                      height={338}
                      className="border mx-auto"
                      style={{ borderRadius: 0 }}
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-center gap-4">
                {!inpaintedPreview ? (
                  <Button
                    onClick={handleRemoveBall}
                    disabled={isProcessing}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-emerald-600 text-white px-8 py-3"
                  >
                    <Wand2 className="w-4 h-4" />
                    {isProcessing ? 'Removing Ball...' : 'Remove Ball'}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      setInpaintedPreview(null)
                      handleRemoveBall()
                    }}
                    disabled={isProcessing}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-emerald-600 text-white px-8 py-3"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {isProcessing ? 'Rerunning...' : 'Rerun Ball Removal'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-gray-50 p-6 flex items-center justify-center">
          {currentStep === 1 && (
            <Button 
              onClick={handleSaveRaw} 
              disabled={isProcessing}
              className="bg-gray-700 hover:bg-emerald-600 text-white px-8 py-3"
            >
              <Save className="w-4 h-4 mr-2" />
              {isProcessing ? 'Saving...' : 'Save Raw Photo'}
            </Button>
          )}
            
          {currentStep === 2 && (
            <Button 
              onClick={handleSaveCropped} 
              disabled={isProcessing || !imageDimensions}
              className="bg-gray-700 hover:bg-emerald-600 text-white px-8 py-3"
            >
              <Save className="w-4 h-4 mr-2" />
              {isProcessing ? 'Saving...' : 'Save Cropped Photo'}
            </Button>
          )}
          
          {currentStep === 3 && (
            <Button 
              onClick={handleSaveCoordinates} 
              disabled={!manualCoords && !aiResult?.centroid}
              className="bg-gray-700 hover:bg-emerald-600 text-white px-8 py-3"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Coordinates
            </Button>
          )}
          
          {currentStep === 4 && (
            <Button 
              onClick={handleSaveFinal} 
              disabled={!inpaintedPreview}
              className="bg-gray-700 hover:bg-emerald-600 text-white px-8 py-3"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Final Photo
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}