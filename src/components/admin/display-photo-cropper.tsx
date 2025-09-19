"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"
import { Crop, Upload, Save, RotateCcw, CheckCircle, XCircle } from "lucide-react"
import Image from "next/image"
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
  x: number
  y: number
  width: number
  height: number
}

// Fixed aspect ratio for competition tiles (2:1 landscape - matches actual tile)
// Tile is max-w-sm (384px) with h-48 (192px) = 2:1 ratio
const TILE_ASPECT_RATIO = {
  ratio: 2/1,
  label: 'Competition Tile',
  width: 384,
  height: 192
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
  // Initialize crop area to match the ACTUAL competition tile proportions (2:1 landscape ratio)
  // Target is 384×192 (2:1 landscape), so crop area should be MUCH wider than tall
  const [cropArea, setCropArea] = useState<CropArea>({ x: 15, y: 40, width: 70, height: 20 })
  const [isProcessing, setIsProcessing] = useState(false)
  const [altText, setAltText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error'
    title: string
    message: string
  }>({ show: false, type: 'success', title: '', message: '' })
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()
  
  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Show notification helpers
  const showSuccess = (title: string, message: string) => {
    setNotification({ show: true, type: 'success', title, message })
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 2000)
  }

  const showError = (title: string, message: string) => {
    setNotification({ show: true, type: 'error', title, message })
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000)
  }

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, show: false }))
  }

  // Handle external file when passed in
  useEffect(() => {
    if (externalFile && isOpen) {
      setFile(externalFile)
      const url = URL.createObjectURL(externalFile)
      setImageUrl(url)
      
      // Set default alt text from filename
      const filename = externalFile.name.replace(/\.[^/.]+$/, '')
      setAltText(filename.replace(/[-_]/g, ' '))
    }
  }, [externalFile, isOpen])

  // File upload handling
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showError("Invalid File Type", "Please upload JPG, PNG, or WebP files only.")
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      showError("File Too Large", "Please upload files smaller than 10MB.")
      return
    }

    setFile(file)
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    
    // Set default alt text from filename
    const filename = file.name.replace(/\.[^/.]+$/, '')
    setAltText(filename.replace(/[-_]/g, ' '))
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  })

  // Handle crop area dragging with better mouse handling
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    
    const rect = e.currentTarget.parentElement!.getBoundingClientRect()
    const offsetX = e.clientX - rect.left - (cropArea.x * rect.width / 100)
    const offsetY = e.clientY - rect.top - (cropArea.y * rect.height / 100)
    
    setDragStart({ x: offsetX, y: offsetY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const newX = ((e.clientX - rect.left - dragStart.x) / rect.width) * 100
    const newY = ((e.clientY - rect.top - dragStart.y) / rect.height) * 100
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(100 - prev.width, newX)),
      y: Math.max(0, Math.min(100 - prev.height, newY))
    }))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Add global mouse up handler
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => setIsDragging(false)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDragging])

  // Convert image to WebP and generate multiple sizes
  const processAndUploadImage = async (): Promise<string> => {
    if (!file || !canvasRef.current) throw new Error('No file or canvas')

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No canvas context')

    return new Promise((resolve, reject) => {
      const img = new window.Image()
      img.onload = async () => {
        try {
          const { width: targetWidth, height: targetHeight } = TILE_ASPECT_RATIO
          
          // Set canvas size to target dimensions
          canvas.width = targetWidth
          canvas.height = targetHeight

          // Calculate source coordinates
          const srcX = (cropArea.x / 100) * img.naturalWidth
          const srcY = (cropArea.y / 100) * img.naturalHeight
          const srcWidth = (cropArea.width / 100) * img.naturalWidth
          const srcHeight = (cropArea.height / 100) * img.naturalHeight
          
          console.log('=== CROP DEBUG ===')
          console.log('cropArea:', cropArea)
          console.log('img dimensions:', img.naturalWidth, 'x', img.naturalHeight)
          console.log('calculated crop:', { srcX, srcY, srcWidth, srcHeight })
          console.log('target dimensions:', targetWidth, 'x', targetHeight)

          // Draw cropped image
          ctx.drawImage(
            img,
            srcX, srcY, srcWidth, srcHeight,
            0, 0, targetWidth, targetHeight
          )

          // Convert to WebP blob
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
              console.log('Uploading to bucket: competition-display, filename:', filename)
              const { data, error } = await supabase.storage
                .from('competition-display')
                .upload(filename, blob, {
                  contentType: 'image/webp',
                  upsert: true
                })

              if (error) {
                console.error('Supabase upload error:', error)
                throw error
              }
              console.log('Upload successful:', data)

              resolve(filename)
            } catch (error) {
              reject(error)
            }
          }, 'image/webp', 0.85)
        } catch (error) {
          reject(error)
        }
      }
      img.onerror = reject
      img.src = imageUrl!
    })
  }

  // Handle save
  const handleSave = async () => {
    if (!file || !altText.trim()) {
      showError("Missing Information", "Please upload an image and provide alt text.")
      return
    }

    setIsProcessing(true)
    try {
      const photoPath = await processAndUploadImage()
      
      onComplete({
        displayPhotoPath: photoPath,
        displayPhotoAlt: altText.trim()
      })
      
      showSuccess("Photo Saved!", "Your display photo has been processed and saved.")
      
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error: any) {
      console.error('Display photo upload error:', error)
      showError("Upload Error", "Failed to save photo. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Reset everything
  const handleReset = () => {
    setFile(null)
    setImageUrl(initialPhoto || null)
    setSelectedRatio('16:9')
    setCropArea({ x: 0, y: 0, width: 100, height: 56.25 })
    setAltText('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="w-5 h-5" />
            Competition Display Photo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          {!imageUrl && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {isDragActive ? (
                <p className="text-emerald-600">Drop the photo here...</p>
              ) : (
                <p className="text-gray-600">Drag & drop a photo here, or click to select</p>
              )}
            </div>
          )}

          {/* Image Preview and Cropping */}
          {imageUrl && (
            <div className="space-y-4">
              {/* Crop Instructions */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Adjust Crop Area</Label>
                <p className="text-sm text-gray-600">Drag the blue box to position your image for the competition tile</p>
              </div>

              {/* Image with Crop Overlay */}
              <div className="bg-white p-4 rounded-lg border border-gray-300">
                <div 
                  className="relative w-full bg-white"
                  style={{ aspectRatio: '16/9', height: '400px' }}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <Image
                    src={imageUrl}
                    alt="Preview"
                    fill
                    className="object-contain"
                    draggable={false}
                  />
                  
                  {/* Crop Selection Overlay */}
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-500/10 cursor-move"
                    style={{
                      left: `${cropArea.x}%`,
                      top: `${cropArea.y}%`,
                      width: `${cropArea.width}%`,
                      height: `${cropArea.height}%`,
                    }}
                    onMouseDown={handleMouseDown}
                  >
                    {/* Corner handles for visual feedback */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white"></div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white"></div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white"></div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white"></div>
                    
                    {/* Center drag handle */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-blue-500 rounded-full border-2 border-white opacity-80"></div>
                  </div>
                  
                </div>
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
                  placeholder="Describe the image for screen readers..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

            </div>
          )}

          {/* Hidden Canvas for Processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Action Buttons */}
          <div className="flex justify-center pt-4 border-t">
            {imageUrl && (
              <Button
                onClick={handleSave}
                disabled={isProcessing || !altText.trim()}
                className="flex items-center gap-2 bg-gray-700 hover:bg-emerald-600 text-white"
              >
                <Save className="w-4 h-4" />
                {isProcessing ? 'Processing...' : 'Save Display Photo'}
              </Button>
            )}
          </div>
        </div>

        {/* Custom Notification */}
        {notification.show && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all duration-300 pointer-events-auto relative">
              <button
                onClick={closeNotification}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
              <div className="text-center">
                {/* Icon */}
                <div className="mb-3">
                  {notification.type === 'success' ? (
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                  ) : (
                    <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                  )}
                </div>
                {/* Title */}
                <h3 className={`text-xl font-bold mb-2 ${notification.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                  {notification.title}
                </h3>
                {/* Message */}
                <p className="text-gray-600">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
