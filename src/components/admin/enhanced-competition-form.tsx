"use client"

import { useState, useCallback, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useCenterNotification } from "@/hooks/use-center-notification"
import { CenterNotification } from "@/components/ui/center-notification"
import { supabase } from "@/lib/supabase"
import { generateSlug } from "@/lib/utils"
import { 
  fixImageOrientation, 
  getImageDimensions,
  generateNormalizedFilename,
  normalizedToUnitCoords,
  validateNormalizedCoords,
  validateMobileUpload,
  validateMobileDimensions,
  GAME_CANVAS_SIZE,
  type NormalizationTransform,
  type ImageDimensions
} from "@/lib/image-utils"
import { PhotoWizardModal } from "./photo-wizard-modal"
import { DisplayPhotoCropper } from "./display-photo-cropper"
import { Upload, Target, Wand2, Save, Eye, RefreshCw, AlertTriangle, CheckCircle, Camera } from "lucide-react"
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

interface ProcessingStatus {
  status: 'idle' | 'ready_for_ai' | 'coords_saved' | 'ready' | 'needs_review'
  message: string
  color: string
}

interface EnhancedCompetitionFormProps {
  editMode?: boolean
  initialData?: any
  competitionId?: string
}

export function EnhancedCompetitionForm({ 
  editMode = false, 
  initialData = null,
  competitionId = null 
}: EnhancedCompetitionFormProps = {}) {
  const [formData, setFormData] = useState<CompetitionData>(() => {
    if (editMode && initialData) {
      return {
        title: initialData.title || "",
        prize_short: initialData.prize_short || "",
        prize_value_rand: initialData.prize_value_rand || 0,
        entry_price_rand: initialData.entry_price_rand || 0,
        is_free: initialData.entry_price_rand === 0,
        starts_at: initialData.starts_at ? new Date(initialData.starts_at).toISOString().slice(0, 16) : "",
        ends_at: initialData.ends_at ? new Date(initialData.ends_at).toISOString().slice(0, 16) : "",
        per_user_entry_limit: initialData.per_user_entry_limit || 1,
        status: initialData.status || 'draft'
      }
    }
    return {
      title: "",
      prize_short: "",
      prize_value_rand: 0,
      entry_price_rand: 0,
      is_free: false,
      starts_at: "",
      ends_at: "",
      per_user_entry_limit: 1,
      status: 'draft'
    }
  })

  // Image states
  const [rawFile, setRawFile] = useState<File | null>(null)
  const [rawImageUrl, setRawImageUrl] = useState<string | null>(() => 
    editMode && initialData?.image_raw_path 
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-raw/${initialData.image_raw_path}`
      : null
  )
  const [rawImagePath, setRawImagePath] = useState<string | null>(
    editMode && initialData ? initialData.image_raw_path : null
  )
  const [rawDimensions, setRawDimensions] = useState<ImageDimensions | null>(() => 
    editMode && initialData?.raw_image_width && initialData?.raw_image_height
      ? { width: initialData.raw_image_width, height: initialData.raw_image_height }
      : null
  )

  // Normalization states
  const [showWizard, setShowWizard] = useState(false)
  const [normalizedBlob, setNormalizedBlob] = useState<Blob | null>(null)
  const [normalizedImageUrl, setNormalizedImageUrl] = useState<string | null>(() =>
    editMode && initialData?.image_normalized_path
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-images/${initialData.image_normalized_path}`
      : null
  )
  const [normalizedImagePath, setNormalizedImagePath] = useState<string | null>(
    editMode && initialData ? initialData.image_normalized_path : null
  )
  const [normalizationTransform, setNormalizationTransform] = useState<NormalizationTransform | null>(() =>
    editMode && initialData?.norm_scale_x && initialData?.norm_scale_y
      ? {
          scale_x: initialData.norm_scale_x,
          scale_y: initialData.norm_scale_y,
          offset_x: initialData.norm_offset_x || 0,
          offset_y: initialData.norm_offset_y || 0
        }
      : null
  )

  // AI Processing states
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(() =>
    editMode && initialData?.judged_x_norm && initialData?.judged_y_norm
      ? {
          centroid: { x: initialData.judged_x_norm, y: initialData.judged_y_norm },
          bbox: { x: 0, y: 0, w: 0, h: 0 }, // Placeholder
          confidence: initialData.detect_confidence || 0.8,
          mask_url: initialData.image_mask_path || '',
          image_size: { width: initialData.normalized_width || 960, height: initialData.normalized_height || 540 }
        }
      : null
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [manualCoords, setManualCoords] = useState<{ x: number; y: number } | null>(() =>
    editMode && initialData?.judged_x_norm && initialData?.judged_y_norm
      ? { x: initialData.judged_x_norm, y: initialData.judged_y_norm }
      : null
  )
  const [inpaintedImageUrl, setInpaintedImageUrl] = useState<string | null>(() => {
    if (editMode && initialData?.image_inpainted_path) {
      // The database stores the full URL, use it directly
      const imagePath = initialData.image_inpainted_path
      
      console.log('=== INPAINTED IMAGE DEBUG ===')
      console.log('Raw image path from DB:', imagePath)
      console.log('Length:', imagePath.length)
      console.log('Starts with http?', imagePath.startsWith('http'))
      console.log('Contains duplicate URL?', imagePath.includes('supabase.co/storage/v1/object/public/competition-inpainted/https://'))
      
      // Fix duplicated URLs if they exist
      let cleanUrl = imagePath
      if (imagePath.includes('supabase.co/storage/v1/object/public/competition-inpainted/https://')) {
        // Extract the correct URL from the duplicated mess
        const match = imagePath.match(/https:\/\/[^\/]+\.supabase\.co\/storage\/v1\/object\/public\/competition-inpainted\/[^\/]+\.jpg$/)
        if (match) {
          cleanUrl = match[0]
          console.log('Fixed duplicated URL to:', cleanUrl)
        }
      }
      
      console.log('Final URL to use:', cleanUrl)
      console.log('=== END DEBUG ===')
      
      return cleanUrl
    }
    return null
  })
  const [showComparison, setShowComparison] = useState(() =>
    editMode && initialData?.image_inpainted_path ? true : false
  )

  // Display photo states (for competition tiles)
  const [displayPhotoPath, setDisplayPhotoPath] = useState<string | null>(() => {
    console.log('=== DISPLAY PHOTO INIT DEBUG ===')
    console.log('editMode:', editMode)
    console.log('initialData:', initialData)
    console.log('initialData.display_photo_path:', initialData?.display_photo_path)
    console.log('initialData.display_photo_alt:', initialData?.display_photo_alt)
    return editMode && initialData ? initialData.display_photo_path : null
  })
  const [displayPhotoAlt, setDisplayPhotoAlt] = useState<string>(
    editMode && initialData ? initialData.display_photo_alt || '' : ''
  )
  const [showDisplayPhotoCropper, setShowDisplayPhotoCropper] = useState(false)
  const [displayPhotoFile, setDisplayPhotoFile] = useState<File | null>(null)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>(() => {
    if (editMode && initialData) {
      if (initialData.image_inpainted_path) {
        return {
          status: 'ready',
          message: 'Competition ready for publishing!',
          color: 'text-green-600'
        }
      } else if (initialData.judged_x_norm && initialData.judged_y_norm) {
        return {
          status: 'coords_saved',
          message: 'Coordinates saved. Ready for ball removal.',
          color: 'text-green-600'
        }
      } else if (initialData.image_normalized_path) {
        return {
          status: 'ready_for_ai',
          message: 'Mobile-optimized image ready for AI processing.',
          color: 'text-green-600'
        }
      }
    }
    return {
      status: 'idle',
      message: 'Upload a photo to begin',
      color: 'text-gray-500'
    }
  })

  const normalizedCanvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()
  const { notification, showSuccess, showError, close } = useCenterNotification()

  // File upload handling (mobile-optimized)
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file for mobile upload
    const fileValidation = validateMobileUpload(file)
    if (!fileValidation.valid) {
      toast({
        title: "Invalid file",
        description: fileValidation.error,
        variant: "destructive"
      })
      return
    }

    try {
      // Fix EXIF orientation
      const orientedFile = await fixImageOrientation(file)
      
      // Get dimensions
      const dimensions = await getImageDimensions(orientedFile)
      
      // Validate dimensions for mobile
      const dimensionValidation = validateMobileDimensions(dimensions.width, dimensions.height)
      if (!dimensionValidation.valid) {
        toast({
          title: "Invalid dimensions",
          description: dimensionValidation.error,
          variant: "destructive"
        })
        return
      }

      setRawFile(orientedFile)
      setRawDimensions(dimensions)
      setRawImageUrl(URL.createObjectURL(orientedFile))
      
      // Reset processing states
      setNormalizedBlob(null)
      setNormalizedImageUrl(null)
      setNormalizedImagePath(null)
      setNormalizationTransform(null)
      setProcessingResult(null)
      setManualCoords(null)
      setInpaintedImageUrl(null)
      setShowComparison(false)
      
      setProcessingStatus({
        status: 'idle',
        message: 'Photo uploaded. Click "Process Photo" to start the wizard.',
        color: 'text-blue-600'
      })

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  })

  // Display photo dropzone
  const onDisplayPhotoDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file
    const validation = validateMobileUpload(file)
    if (!validation.valid) {
      showError("Invalid File", validation.error!)
      return
    }

    setDisplayPhotoFile(file)
    setShowDisplayPhotoCropper(true)
  }, [showError])

  const { 
    getRootProps: getDisplayRootProps, 
    getInputProps: getDisplayInputProps, 
    isDragActive: isDisplayDragActive 
  } = useDropzone({
    onDrop: onDisplayPhotoDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  })

  // Upload raw image to Supabase with proper ID
  const handleUploadRaw = async () => {
    if (!rawFile) return

    try {
      // Generate unique competition ID for this session
      const competitionId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const fileName = `${competitionId}_raw.${rawFile.name.split('.').pop()}`
      
      const { error } = await supabase.storage
        .from('competition-raw')
        .upload(fileName, rawFile)

      if (error) throw error

      setRawImagePath(fileName)
      
      // Store the competition ID for later use
      sessionStorage.setItem('currentCompetitionId', competitionId)
      
      toast({
        title: "Raw photo uploaded",
        description: "Original photo saved to storage with ID: " + competitionId,
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // Handle photo wizard
  const handleProcessPhoto = () => {
    if (!rawFile) {
      toast({
        title: "No image",
        description: "Please upload an image first.",
        variant: "destructive"
      })
      return
    }
    setShowWizard(true)
  }

  // Handle wizard completion
  const handleWizardComplete = (data: {
    competitionId: string
    rawPath: string
    normalizedPath: string
    inpaintedPath: string
    coordinates: { x: number; y: number; u: number; v: number }
    transform: NormalizationTransform
  }) => {
    // Update all the state with wizard results
    setRawImagePath(data.rawPath)
    setNormalizedImagePath(data.normalizedPath)
    // The data.inpaintedPath should be a full URL from the API
    setInpaintedImageUrl(data.inpaintedPath)
    setNormalizationTransform(data.transform)
    setManualCoords({ x: data.coordinates.x, y: data.coordinates.y })
    
    // Store competition ID
    sessionStorage.setItem('currentCompetitionId', data.competitionId)
    
    setProcessingStatus({
      status: 'ready',
      message: 'All processing complete! Competition ready to save.',
      color: 'text-green-600'
    })
    
    setShowComparison(true)
    
    toast({
      title: "Photo processing complete!",
      description: `Competition ${data.competitionId} is ready to save.`,
    })
  }

  // Display photo handlers
  const handleDisplayPhotoComplete = (photoData: {
    displayPhotoPath: string
    displayPhotoAlt: string
  }) => {
    console.log('Display photo completed:', photoData)
    setDisplayPhotoPath(photoData.displayPhotoPath)
    setDisplayPhotoAlt(photoData.displayPhotoAlt)
    setShowDisplayPhotoCropper(false)
    console.log('Display photo state updated:', {
      displayPhotoPath: photoData.displayPhotoPath,
      displayPhotoAlt: photoData.displayPhotoAlt
    })
    
    showSuccess(
      "Display Photo Saved!",
      "Your competition display photo has been processed and saved."
    )
  }

  const getDisplayPhotoUrl = () => {
    if (!displayPhotoPath) return null
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-display/${displayPhotoPath}`
  }

  // Handle normalized image save
  const handleNormalizedSave = async (blob: Blob, transform: NormalizationTransform) => {
    try {
      // Get the competition ID from session
      const competitionId = sessionStorage.getItem('currentCompetitionId') || `comp_${Date.now()}`
      const fileName = `${competitionId}_normalized.jpg`
      
      const { error } = await supabase.storage
        .from('competition-images')
        .upload(`normalized/${fileName}`, blob)

      if (error) throw error

      // Create local URL for preview
      const url = URL.createObjectURL(blob)
      
      setNormalizedBlob(blob)
      setNormalizedImageUrl(url)
      setNormalizedImagePath(`normalized/${fileName}`)
      setNormalizationTransform(transform)
      
      setProcessingStatus({
        status: 'ready_for_ai',
        message: 'Mobile-optimized image ready for AI processing.',
        color: 'text-green-600'
      })

      toast({
        title: "Image normalized",
        description: `Mobile-optimized: ${GAME_CANVAS_SIZE.width}×${GAME_CANVAS_SIZE.height} (ID: ${competitionId})`,
      })
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  // AI Ball Detection
  const handleGetCoordinates = async () => {
    if (!normalizedImagePath) {
      toast({
        title: "No normalized image",
        description: "Please crop and normalize the image first.",
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
          image_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-images/${normalizedImagePath}`,
          do_inpaint: false,
          competition_id: Date.now().toString() // Temporary ID
        })
      })

      const result = await response.json()
      if (!result.ok) throw new Error(result.error)

      setProcessingResult(result)
      
      // Set status based on confidence
      const status = result.confidence < 0.6 ? 'needs_review' : 'coords_saved'
      setProcessingStatus({
        status,
        message: status === 'needs_review' 
          ? `Low confidence (${(result.confidence * 100).toFixed(1)}%). Please review and adjust.`
          : `Ball detected with ${(result.confidence * 100).toFixed(1)}% confidence.`,
        color: status === 'needs_review' ? 'text-orange-600' : 'text-green-600'
      })

      toast({
        title: "Ball detected",
        description: `Confidence: ${(result.confidence * 100).toFixed(1)}%`,
      })
    } catch (error: any) {
      toast({
        title: "Detection failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Manual coordinate setting
  const handleManualSet = () => {
    if (!normalizedImageUrl) return
    
    toast({
      title: "Manual mode",
      description: "Click on the image to set the ball center.",
    })
  }

  // Handle canvas click for manual coordinate setting
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = normalizedCanvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = GAME_CANVAS_SIZE.width / rect.width
    const scaleY = GAME_CANVAS_SIZE.height / rect.height
    
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    if (validateNormalizedCoords(x, y)) {
      setManualCoords({ x, y })
      setProcessingStatus({
        status: 'coords_saved',
        message: `Manual coordinates set at (${Math.round(x)}, ${Math.round(y)}).`,
        color: 'text-green-600'
      })
    }
  }

  // Save coordinates
  const handleSaveCoordinates = () => {
    const coords = manualCoords || processingResult?.centroid
    if (!coords) {
      toast({
        title: "No coordinates",
        description: "Please detect or manually set coordinates first.",
        variant: "destructive"
      })
      return
    }

    setProcessingStatus({
      status: 'coords_saved',
      message: 'Coordinates saved. Ready for ball removal.',
      color: 'text-green-600'
    })

    toast({
      title: "Coordinates saved",
      description: `Ball center: (${Math.round(coords.x)}, ${Math.round(coords.y)})`,
    })
  }

  // AI Ball Removal
  const handleRemoveBall = async () => {
    if (!normalizedImagePath || !processingResult) {
      toast({
        title: "Prerequisites missing",
        description: "Please detect ball coordinates first.",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      const competitionId = sessionStorage.getItem('currentCompetitionId') || `comp_${Date.now()}`
      
      const response = await fetch('/api/ball-processor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-images/${normalizedImagePath}`,
          do_inpaint: true,
          competition_id: competitionId
        })
      })

      const result = await response.json()
      if (!result.ok) throw new Error(result.error)

      // The API should return the actual Supabase URL for the inpainted image
      const inpaintedFileName = `${competitionId}_inpainted.jpg`
      const inpaintedUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-inpainted/${inpaintedFileName}`
      
      setInpaintedImageUrl(inpaintedUrl)
      setShowComparison(true)

      toast({
        title: "Ball removed",
        description: `Inpainting completed successfully. (ID: ${competitionId})`,
      })
    } catch (error: any) {
      toast({
        title: "Inpainting failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Accept inpainted result
  const handleAcceptInpainted = () => {
    setProcessingStatus({
      status: 'ready',
      message: 'Competition ready for publishing!',
      color: 'text-green-600'
    })

    toast({
      title: "Inpainted image accepted",
      description: "Competition is ready to go live.",
    })
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

    if (formData.status === 'live' && processingStatus.status !== 'ready') {
      toast({
        title: "Cannot go live",
        description: "Complete image processing before going live.",
        variant: "destructive"
      })
      return
    }

    try {
      const coords = manualCoords || processingResult?.centroid
      const unitCoords = coords ? normalizedToUnitCoords(coords.x, coords.y) : null

      console.log('=== SAVE COMPETITION DEBUG ===')
      console.log('displayPhotoPath state:', displayPhotoPath)
      console.log('displayPhotoAlt state:', displayPhotoAlt)
      
      const competitionData = {
        title: formData.title,
        slug: generateSlug(formData.title),
        prize_short: formData.prize_short,
        prize_value_rand: formData.prize_value_rand,
        entry_price_rand: formData.is_free ? 0 : formData.entry_price_rand,
        starts_at: formData.starts_at,
        ends_at: formData.ends_at,
        status: formData.status,
        per_user_entry_limit: formData.per_user_entry_limit,
        
        // Image paths
        image_raw_path: rawImagePath,
        image_normalized_path: normalizedImagePath,
        image_mask_path: processingResult?.mask_url,
        image_inpainted_path: inpaintedImageUrl,
        
        // Display photo (for tiles)
        display_photo_path: displayPhotoPath,
        display_photo_alt: displayPhotoAlt,
        
        // Raw image dimensions
        raw_image_width: rawDimensions?.width,
        raw_image_height: rawDimensions?.height,
        
        // Normalized dimensions (always 1920x1080)
        normalized_width: GAME_CANVAS_SIZE.width,
        normalized_height: GAME_CANVAS_SIZE.height,
        
        // Normalization transform
        norm_scale_x: normalizationTransform?.scale_x,
        norm_scale_y: normalizationTransform?.scale_y,
        norm_offset_x: normalizationTransform?.offset_x,
        norm_offset_y: normalizationTransform?.offset_y,
        
        // Coordinates in normalized pixel space
        judged_x_norm: coords?.x,
        judged_y_norm: coords?.y,
        judged_u: unitCoords?.u,
        judged_v: unitCoords?.v,
        
        // AI metadata
        detect_confidence: processingResult?.confidence,
        processing_status: processingStatus.status
      }

      console.log('=== FULL COMPETITION DATA ===')
      console.log(JSON.stringify(competitionData, null, 2))
      
      let error
      if (editMode && competitionId) {
        console.log('=== UPDATING COMPETITION ===')
        console.log('Competition ID:', competitionId)
        
        // Update existing competition
        // First try with display photo fields
        const { error: updateError } = await supabase
          .from('competitions')
          .update(competitionData)
          .eq('id', competitionId)
        
        console.log('Update result:', { updateError })
        
        // If error (likely missing columns), try without display photo fields
        if (updateError && updateError.message?.includes('column')) {
          console.log('Display photo columns not found, updating without them')
          const { display_photo_path, display_photo_alt, ...dataWithoutDisplay } = competitionData
          console.log('Data without display fields:', dataWithoutDisplay)
          const { error: fallbackError } = await supabase
            .from('competitions')
            .update(dataWithoutDisplay)
            .eq('id', competitionId)
          console.log('Fallback update result:', { fallbackError })
          error = fallbackError
        } else {
          error = updateError
        }
      } else {
        // Create new competition
        const { error: insertError } = await supabase
          .from('competitions')
          .insert(competitionData)
        error = insertError
      }

      if (error) throw error

      showSuccess(
        editMode ? "Competition updated" : "Competition created", 
        editMode ? "Competition updated successfully!" : "Competition saved successfully!"
      )

      // Only reset form in create mode
      if (!editMode) {
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
        
        // Reset all image states
        setRawFile(null)
        setRawImageUrl(null)
        setRawImagePath(null)
        setRawDimensions(null)
        setNormalizedBlob(null)
        setNormalizedImageUrl(null)
        setNormalizedImagePath(null)
        setNormalizationTransform(null)
        setProcessingResult(null)
        setManualCoords(null)
        setInpaintedImageUrl(null)
        setShowComparison(false)
        setProcessingStatus({
          status: 'idle',
          message: 'Upload a photo to begin',
          color: 'text-gray-500'
        })
      }

    } catch (error: any) {
      showError("Save failed", error.message)
    }
  }

  // Status chip component
  const StatusChip = ({ status }: { status: ProcessingStatus }) => {
    const icons = {
      idle: <Upload className="w-4 h-4" />,
      ready_for_ai: <Target className="w-4 h-4" />,
      coords_saved: <CheckCircle className="w-4 h-4" />,
      ready: <CheckCircle className="w-4 h-4" />,
      needs_review: <AlertTriangle className="w-4 h-4" />
    }

    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${status.color} bg-gray-50 border`}>
        {icons[status.status]}
        {status.message}
      </div>
    )
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
              className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
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
                className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
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
              className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
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

      {/* 2. Display Photo (for Competition Tiles) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-6">Display Photo - Prize</h2>
        
        <div className="max-w-2xl mx-auto">
          {displayPhotoPath ? (
            <div className="space-y-4">
              {/* Current Display Photo */}
              <div className="text-center">
                <div className="inline-block border border-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={getDisplayPhotoUrl()!}
                    alt={displayPhotoAlt || 'Competition display photo'}
                    width={384}
                    height={192}
                    className="object-cover"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {displayPhotoAlt || 'No alt text provided'}
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex justify-center gap-3">
                  <Button
                    onClick={() => {
                      // Trigger file input click
                      const fileInput = document.createElement('input')
                      fileInput.type = 'file'
                      fileInput.accept = 'image/*'
                      fileInput.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) {
                          setDisplayPhotoFile(file)
                          setShowDisplayPhotoCropper(true)
                        }
                      }
                      fileInput.click()
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Change Display Photo
                  </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div 
                {...getDisplayRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 mb-4 cursor-pointer transition-colors ${
                  isDisplayDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getDisplayInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                {isDisplayDragActive ? (
                  <p className="text-emerald-600">Drop the photo here...</p>
                ) : (
                  <p className="text-gray-600">Drag & drop a photo here, or click to select</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Upload & Normalize Photo (Game Photo) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-6">Football Photo - Game</h2>
        
        <div className="max-w-2xl mx-auto">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-gray-400'
            } ${rawImageUrl ? 'p-4' : 'p-8'}`}
          >
            <input {...getInputProps()} />
            
            {rawImageUrl ? (
              // Show uploaded image in the dropzone
              <div className="space-y-4">
                <div className="relative">
                  <Image
                    src={rawImageUrl}
                    alt="Uploaded photo"
                    width={500}
                    height={333}
                    className="rounded-lg shadow-sm object-cover mx-auto"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p>{rawDimensions?.width} × {rawDimensions?.height} pixels • {rawFile ? (rawFile.size / (1024 * 1024)).toFixed(2) : '0'} MB</p>
                </div>
              </div>
            ) : (
              // Show upload prompt when no image
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-emerald-600">Drop the photo here...</p>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">Drag & drop a photo here, or click to select</p>
                  </div>
                )}
              </>
            )}
          </div>

          {rawImageUrl && (
            <div className="mt-6 flex flex-col items-center space-y-4">
              <Button 
                onClick={() => {
                  setRawFile(null)
                  setRawImageUrl(null)
                  setRawDimensions(null)
                  setRawImagePath(null)
                  // Reset all other states
                  setNormalizedBlob(null)
                  setNormalizedImageUrl(null)
                  setNormalizedImagePath(null)
                  setNormalizationTransform(null)
                  setProcessingResult(null)
                  setManualCoords(null)
                  setInpaintedImageUrl(null)
                  setShowComparison(false)
                  setProcessingStatus({
                    status: 'idle',
                    message: 'Upload a photo to begin.',
                    color: 'text-gray-500'
                  })
                }}
                variant="outline" 
                size="sm"
                className="text-gray-600 hover:text-gray-800"
              >
                Upload New Photo
              </Button>
              
              <Button 
                onClick={handleProcessPhoto} 
                size="lg" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3"
              >
                Process Photo
              </Button>
            </div>
          )}

          {rawImageUrl && (
            <div className="mt-8 space-y-6">
              <div className="space-y-6">
                
                {/* Mobile Optimized Image */}
                {normalizedImageUrl && (
                  <div className="text-center">
                    <h4 className="text-sm font-medium mb-3 text-gray-700">
                      Mobile Optimized ({GAME_CANVAS_SIZE.width} × {GAME_CANVAS_SIZE.height})
                    </h4>
                    <div className="inline-block relative">
                      <canvas
                        ref={normalizedCanvasRef}
                        width={400}
                        height={225}
                        className="rounded-lg border shadow-sm cursor-crosshair"
                        onClick={handleCanvasClick}
                        style={{ 
                          backgroundImage: `url(${normalizedImageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                      {(manualCoords || processingResult) && (
                        <div
                          className="absolute w-3 h-3 bg-red-500 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-lg"
                          style={{
                            left: `${((manualCoords?.x || processingResult?.centroid.x || 0) / GAME_CANVAS_SIZE.width) * 400}px`,
                            top: `${((manualCoords?.y || processingResult?.centroid.y || 0) / GAME_CANVAS_SIZE.height) * 225}px`
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. AI Processing */}
      {normalizedImageUrl && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-6">AI Processing (Mobile-Optimized Image)</h2>
          

          {showComparison && inpaintedImageUrl && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                <div className="text-center">
                  <h4 className="text-sm font-medium mb-3 text-gray-700">Mobile Optimized (with ball)</h4>
                  <Image
                    src={normalizedImageUrl}
                    alt="Mobile Optimized"
                    width={350}
                    height={197}
                    className="border shadow-sm"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-medium mb-3 text-gray-700">Inpainted (ball removed)</h4>
                  <Image
                    src={inpaintedImageUrl}
                    alt="Inpainted"
                    width={350}
                    height={197}
                    className="border shadow-sm"
                    style={{ borderRadius: 0 }}
                    onError={(e) => {
                      console.error('Failed to load inpainted image:', inpaintedImageUrl)
                      console.error('Image error event:', e)
                    }}
                    onLoad={() => {
                      console.log('Successfully loaded inpainted image:', inpaintedImageUrl)
                    }}
                  />
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={() => {
                    // Reset all states to start from beginning
                    setRawFile(null)
                    setRawImageUrl(null)
                    setRawImagePath(null)
                    setRawDimensions(null)
                    setNormalizedBlob(null)
                    setNormalizedImageUrl(null)
                    setNormalizedImagePath(null)
                    setNormalizationTransform(null)
                    setProcessingResult(null)
                    setManualCoords(null)
                    setInpaintedImageUrl(null)
                    setShowComparison(false)
                    setProcessingStatus({
                      status: 'idle',
                      message: 'Upload a photo to begin',
                      color: 'text-gray-500'
                    })
                  }}
                  className="bg-gray-700 hover:bg-emerald-600 text-white px-8 py-3"
                >
                  Upload a new Photo
                </Button>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                <RefreshCw className="animate-spin w-4 h-4" />
                Processing...
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Save Competition */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-center">
          <Button
            onClick={handleSaveCompetition}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-4 text-lg font-semibold"
          >
            <Save className="w-5 h-5" />
            {editMode ? 'Update Competition' : 'Save Competition'}
          </Button>
        </div>
        
        {formData.status === 'live' && processingStatus.status !== 'ready' && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Cannot go live</span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Complete mobile-optimized image processing (normalize → detect → inpaint) before setting status to Live.
            </p>
          </div>
        )}
      </div>

      {/* Photo Wizard Modal */}
      <PhotoWizardModal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        file={rawFile}
        onComplete={handleWizardComplete}
      />

      {/* Display Photo Cropper Modal */}
      <DisplayPhotoCropper
        isOpen={showDisplayPhotoCropper}
        onClose={() => {
          setShowDisplayPhotoCropper(false)
          setDisplayPhotoFile(null)
        }}
        onComplete={handleDisplayPhotoComplete}
        competitionId={competitionId || (typeof window !== 'undefined' ? sessionStorage.getItem('currentCompetitionId') : null) || undefined}
        initialPhoto={getDisplayPhotoUrl() || undefined}
        file={displayPhotoFile}
      />

      {/* Center Notification */}
      <CenterNotification
        isOpen={notification.isOpen}
        type={notification.type}
        title={notification.title}
        description={notification.description}
        onClose={close}
      />
    </div>
  )
}
