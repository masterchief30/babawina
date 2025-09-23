"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"
import { Crop, Upload, Save, Move } from "lucide-react"
// import Image from "next/image" // Unused
import { useDropzone } from "react-dropzone"

interface DisplayPhotoCropperProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (photoData: {
    displayPhotoPath: string
    displayPhotoAlt: string
  }) => void
  competitionId?: string
  initialPhoto?: string
  file?: File | null
}

interface CropArea {
  x: number  // pixels from left
  y: number  // pixels from top
}

// CORRECT aspect ratio for competition tiles
// Using 16:9 aspect ratio which is standard for wide displays
const TILE_SPECS = {
  aspectRatio: 16/9,
  outputWidth: 640,   // Higher res for retina displays
  outputHeight: 360,  // 640 / (16/9) = 360
  previewWidth: 480,  // Preview size in modal
  previewHeight: 270  // 480 / (16/9) = 270
}

export function DisplayPhotoCropper({ 
  isOpen, 
  onClose, 
  onComplete, 
  competitionId,
  initialPhoto,
  file: externalFile 
}: DisplayPhotoCropperProps) {
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(initialPhoto || null)
  const [cropPosition, setCropPosition] = useState<CropArea>({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  const [scale, setScale] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [altText, setAltText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const finalCanvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const { toast } = useToast()
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Calculate the crop box dimensions based on the image and desired aspect ratio
  const getCropBoxDimensions = () => {
    if (!imageSize) return { width: 0, height: 0 }
    
    const targetAspect = TILE_SPECS.aspectRatio
    const imageAspect = imageSize.width / imageSize.height
    
    let cropWidth, cropHeight
    
    if (imageAspect > targetAspect) {
      // Image is wider than target - fit by height
      cropHeight = imageSize.height * scale
      cropWidth = cropHeight * targetAspect
    } else {
      // Image is taller than target - fit by width
      cropWidth = imageSize.width * scale
      cropHeight = cropWidth / targetAspect
    }
    
    return { width: cropWidth, height: cropHeight }
  }

  // Handle external file when passed in
  useEffect(() => {
    if (externalFile && isOpen) {
      handleNewFile(externalFile)
    }
  }, [externalFile, isOpen])

  // Load image and get dimensions
  const handleNewFile = (file: File) => {
    setFile(file)
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    
    // Set default alt text from filename
    const filename = file.name.replace(/\.[^/.]+$/, '')
    setAltText(filename.replace(/[-_]/g, ' '))
    
    // Load image to get dimensions
    const img = new window.Image()
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height })
      imageRef.current = img
      
      // Calculate initial scale to fit the crop area nicely
      const targetAspect = TILE_SPECS.aspectRatio
      const imageAspect = img.width / img.height
      
      if (imageAspect > targetAspect) {
        // Image is wider - scale based on height
        setScale(0.8)
      } else {
        // Image is taller - scale based on width
        setScale(0.8)
      }
      
      // Center the crop area
      setCropPosition({ x: 0, y: 0 })
      
      // Update preview
      updatePreview()
    }
    img.src = url
  }

  // File upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPG, PNG, or WebP files only.",
        variant: "destructive"
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please upload files smaller than 10MB.",
        variant: "destructive"
      })
      return
    }

    handleNewFile(file)
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  })

  // Update preview canvas whenever crop changes
  const updatePreview = useCallback(() => {
    if (!previewCanvasRef.current || !imageRef.current || !imageSize) return
    
    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const cropBox = getCropBoxDimensions()
    
    // Set canvas to preview size
    canvas.width = TILE_SPECS.previewWidth
    canvas.height = TILE_SPECS.previewHeight
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw cropped image
    ctx.drawImage(
      imageRef.current,
      cropPosition.x,
      cropPosition.y,
      cropBox.width,
      cropBox.height,
      0, 0,
      TILE_SPECS.previewWidth,
      TILE_SPECS.previewHeight
    )
  }, [cropPosition, scale, imageSize])

  // Update preview when crop changes
  useEffect(() => {
    updatePreview()
  }, [cropPosition, scale, updatePreview])

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - cropPosition.x,
      y: e.clientY - cropPosition.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageSize) return
    e.preventDefault()
    
    const cropBox = getCropBoxDimensions()
    
    // Calculate new position
    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y
    
    // Constrain to image bounds
    const maxX = imageSize.width - cropBox.width
    const maxY = imageSize.height - cropBox.height
    
    setCropPosition({
      x: Math.max(0, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY))
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Process and upload image
  const processAndUploadImage = async (): Promise<string> => {
    if (!file || !finalCanvasRef.current || !imageRef.current || !imageSize) {
      throw new Error('Missing required elements')
    }

    const canvas = finalCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No canvas context')

    // Set canvas to output size
    canvas.width = TILE_SPECS.outputWidth
    canvas.height = TILE_SPECS.outputHeight

    const cropBox = getCropBoxDimensions()

    // Draw the cropped image at full quality
    ctx.drawImage(
      imageRef.current,
      cropPosition.x,
      cropPosition.y,
      cropBox.width,
      cropBox.height,
      0, 0,
      TILE_SPECS.outputWidth,
      TILE_SPECS.outputHeight
    )

    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'))
          return
        }

        try {
          // Generate filename
          const timestamp = Date.now()
          const filename = `display_${competitionId || timestamp}_16x9.webp`

          // Upload to Supabase
          const { data, error } = await supabase.storage
            .from('competition-display')
            .upload(filename, blob, {
              contentType: 'image/webp',
              upsert: true
            })

          if (error) throw error

          resolve(filename)
        } catch (error) {
          reject(error)
        }
      }, 'image/webp', 0.9) // Higher quality for display photos
    })
  }

  // Handle save
  const handleSave = async () => {
    if (!file || !altText.trim()) {
      toast({
        title: "Missing information",
        description: "Please upload an image and provide alt text.",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      const photoPath = await processAndUploadImage()
      
      // Call the completion handler to update parent state
      onComplete({
        displayPhotoPath: photoPath,
        displayPhotoAlt: altText.trim()
      })
      
      // Success - no toast notification needed
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error: unknown) {
      console.error('Display photo upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to save photo. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="w-5 h-5" />
            Competition Display Photo (16:9)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          {!imageUrl && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {isDragActive ? (
                <p className="text-blue-600 font-medium">Drop the photo here...</p>
              ) : (
                <>
                  <p className="text-gray-600 mb-2">Drag & drop a photo here, or click to select</p>
                  <p className="text-sm text-gray-500">The image will be cropped to 16:9 aspect ratio</p>
                </>
              )}
            </div>
          )}

          {/* Cropping Interface */}
          {imageUrl && imageSize && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: Original Image with Crop Overlay */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Original Image</Label>
                  <p className="text-xs text-gray-500 mb-3">Drag the blue box to select the area to display</p>
                </div>
                
                <div 
                  className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-checkerboard"
                  style={{ maxHeight: '400px' }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Original Image */}
                  <img
                    src={imageUrl}
                    alt="Original"
                    style={{ 
                      maxWidth: '100%',
                      maxHeight: '400px',
                      display: 'block'
                    }}
                  />
                  
                  {/* Dark overlay for non-cropped areas */}
                  <div
                    className="absolute inset-0 bg-black/50 pointer-events-none"
                    style={{
                      clipPath: `polygon(
                        0 0, 100% 0, 100% 100%, 0 100%, 0 0,
                        ${(cropPosition.x / imageSize.width) * 100}% ${(cropPosition.y / imageSize.height) * 100}%,
                        ${((cropPosition.x + getCropBoxDimensions().width) / imageSize.width) * 100}% ${(cropPosition.y / imageSize.height) * 100}%,
                        ${((cropPosition.x + getCropBoxDimensions().width) / imageSize.width) * 100}% ${((cropPosition.y + getCropBoxDimensions().height) / imageSize.height) * 100}%,
                        ${(cropPosition.x / imageSize.width) * 100}% ${((cropPosition.y + getCropBoxDimensions().height) / imageSize.height) * 100}%,
                        ${(cropPosition.x / imageSize.width) * 100}% ${(cropPosition.y / imageSize.height) * 100}%
                      )`
                    }}
                  />
                  
                  {/* Crop Box */}
                  <div
                    className="absolute border-2 border-blue-500 cursor-move"
                    style={{
                      left: `${(cropPosition.x / imageSize.width) * 100}%`,
                      top: `${(cropPosition.y / imageSize.height) * 100}%`,
                      width: `${(getCropBoxDimensions().width / imageSize.width) * 100}%`,
                      height: `${(getCropBoxDimensions().height / imageSize.height) * 100}%`,
                    }}
                    onMouseDown={handleMouseDown}
                  >
                    <div className="absolute inset-0 border border-white/50" />
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 rounded-full p-2 opacity-75">
                      <Move className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>

                {/* Scale Slider */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Crop Size</Label>
                  <input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.01"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Zoom Out</span>
                    <span>{Math.round(scale * 100)}%</span>
                    <span>Zoom In</span>
                  </div>
                </div>
              </div>

              {/* Right: Preview */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Preview</Label>
                  <p className="text-xs text-gray-500 mb-3">This is how it will appear in the competition tile</p>
                </div>
                
                {/* Preview Canvas */}
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                  <canvas
                    ref={previewCanvasRef}
                    width={TILE_SPECS.previewWidth}
                    height={TILE_SPECS.previewHeight}
                    className="w-full"
                  />
                </div>

                {/* Alt Text Input */}
                <div>
                  <Label htmlFor="altText" className="text-sm font-medium mb-2 block">
                    Alt Text (for accessibility)
                  </Label>
                  <input
                    id="altText"
                    type="text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Describe the image..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    <strong>Output:</strong> {TILE_SPECS.outputWidth} × {TILE_SPECS.outputHeight}px WebP
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Optimized for fast loading and retina displays
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Hidden Canvas for Final Processing */}
          <canvas ref={finalCanvasRef} className="hidden" />

          {/* Action Buttons */}
          {imageUrl && (
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                onClick={() => {
                  setFile(null)
                  setImageUrl(null)
                  setImageSize(null)
                  setAltText('')
                  setCropPosition({ x: 0, y: 0 })
                  setScale(1)
                }}
                variant="outline"
              >
                Change Photo
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isProcessing || !altText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Save Display Photo'}
              </Button>
            </div>
          )}
        </div>

        <style jsx>{`
          .bg-checkerboard {
            background-image: 
              linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
              linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
              linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}