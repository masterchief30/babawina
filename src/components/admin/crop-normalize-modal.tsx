"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { 
  calculateBestFitCrop, 
  cropAndNormalizeImage, 
  getImageDimensions,
  validateMobileUpload,
  validateMobileDimensions,
  type CropArea,
  type ImageDimensions,
  type NormalizationTransform,
  GAME_CANVAS_SIZE
} from "@/lib/image-utils"
import { RotateCcw, ZoomIn, ZoomOut, Move, Grid3X3, Smartphone } from "lucide-react"

interface CropNormalizeModalProps {
  isOpen: boolean
  onClose: () => void
  file: File | null
  onSave: (normalizedBlob: Blob, transform: NormalizationTransform) => void
}

export function CropNormalizeModal({ isOpen, onClose, file, onSave }: CropNormalizeModalProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null)
  const [cropArea, setCropArea] = useState<CropArea | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [showGrid, setShowGrid] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { toast } = useToast()

  // Load image when file changes
  useEffect(() => {
    if (!file) {
      setImageUrl(null)
      setImageDimensions(null)
      setCropArea(null)
      return
    }

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

    const url = URL.createObjectURL(file)
    setImageUrl(url)

    // Get image dimensions and validate for mobile
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
      const initialCrop = calculateBestFitCrop(dimensions.width, dimensions.height)
      setCropArea(initialCrop)
    })

    return () => URL.revokeObjectURL(url)
  }, [file, toast])

  // Draw image and crop overlay on canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !imageUrl || !imageDimensions || !cropArea) return

    const img = new Image()
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Calculate display dimensions
      const containerWidth = canvas.width
      const containerHeight = canvas.height
      
      // Scale image to fit container while maintaining aspect ratio
      const scale = Math.min(
        containerWidth / imageDimensions.width,
        containerHeight / imageDimensions.height
      ) * zoom

      const displayWidth = imageDimensions.width * scale
      const displayHeight = imageDimensions.height * scale

      // Center image with pan offset
      const offsetX = (containerWidth - displayWidth) / 2 + pan.x
      const offsetY = (containerHeight - displayHeight) / 2 + pan.y

      // Draw image
      ctx.drawImage(img, offsetX, offsetY, displayWidth, displayHeight)

      // Draw crop overlay
      const cropDisplayX = offsetX + (cropArea.x / imageDimensions.width) * displayWidth
      const cropDisplayY = offsetY + (cropArea.y / imageDimensions.height) * displayHeight
      const cropDisplayWidth = (cropArea.width / imageDimensions.width) * displayWidth
      const cropDisplayHeight = (cropArea.height / imageDimensions.height) * displayHeight

      // Create overlay effect - darken everything first
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw the cropped area clearly on top
      ctx.drawImage(
        img,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
        cropDisplayX, cropDisplayY, cropDisplayWidth, cropDisplayHeight
      )

      // Draw crop border with high contrast
      ctx.strokeStyle = '#10b981'
      ctx.lineWidth = 3
      ctx.strokeRect(cropDisplayX, cropDisplayY, cropDisplayWidth, cropDisplayHeight)
      
      // Add inner white border for better visibility
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.strokeRect(cropDisplayX + 1, cropDisplayY + 1, cropDisplayWidth - 2, cropDisplayHeight - 2)

      // Draw grid if enabled (more visible)
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.lineWidth = 1
        ctx.setLineDash([5, 5])
        
        // Rule of thirds lines
        for (let i = 1; i < 3; i++) {
          // Vertical lines
          const x = cropDisplayX + (cropDisplayWidth / 3) * i
          ctx.beginPath()
          ctx.moveTo(x, cropDisplayY)
          ctx.lineTo(x, cropDisplayY + cropDisplayHeight)
          ctx.stroke()
          
          // Horizontal lines
          const y = cropDisplayY + (cropDisplayHeight / 3) * i
          ctx.beginPath()
          ctx.moveTo(cropDisplayX, y)
          ctx.lineTo(cropDisplayX + cropDisplayWidth, y)
          ctx.stroke()
        }
        
        // Reset line dash
        ctx.setLineDash([])
      }


      // Draw corner handles with better visibility
      const handleSize = 12
      const corners = [
        { x: cropDisplayX - handleSize/2, y: cropDisplayY - handleSize/2 },
        { x: cropDisplayX + cropDisplayWidth - handleSize/2, y: cropDisplayY - handleSize/2 },
        { x: cropDisplayX - handleSize/2, y: cropDisplayY + cropDisplayHeight - handleSize/2 },
        { x: cropDisplayX + cropDisplayWidth - handleSize/2, y: cropDisplayY + cropDisplayHeight - handleSize/2 }
      ]
      
      corners.forEach(corner => {
        // White background for contrast
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(corner.x - 1, corner.y - 1, handleSize + 2, handleSize + 2)
        
        // Green handle
        ctx.fillStyle = '#10b981'
        ctx.fillRect(corner.x, corner.y, handleSize, handleSize)
        
        // Dark border
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 1
        ctx.strokeRect(corner.x, corner.y, handleSize, handleSize)
      })
    }
    img.src = imageUrl
  }, [imageUrl, imageDimensions, cropArea, zoom, pan, showGrid])

  // Redraw canvas when dependencies change
  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // Handle mouse and touch events for dragging crop area (mobile-first)
  const getPointerPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return null

    let clientX: number, clientY: number

    if ('touches' in e) {
      // Touch event
      if (e.touches.length === 0) return null
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      // Mouse event
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const position = getPointerPosition(e)
    if (!position) return

    setIsDragging(true)
    setDragStart(position)
  }

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasEvent>) => {
    e.preventDefault()
    if (!isDragging || !dragStart || !cropArea || !imageDimensions) return

    const position = getPointerPosition(e)
    if (!position) return

    const deltaX = position.x - dragStart.x
    const deltaY = position.y - dragStart.y

    // Convert screen delta to image coordinates
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const scale = Math.min(
      rect.width / imageDimensions.width,
      rect.height / imageDimensions.height
    ) * zoom

    const imageDeltaX = deltaX / scale
    const imageDeltaY = deltaY / scale

    // Update crop area position
    const newCropArea = {
      ...cropArea,
      x: Math.max(0, Math.min(imageDimensions.width - cropArea.width, cropArea.x + imageDeltaX)),
      y: Math.max(0, Math.min(imageDimensions.height - cropArea.height, cropArea.y + imageDeltaY))
    }

    setCropArea(newCropArea)
    setDragStart(position)
  }

  const handlePointerUp = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    setIsDragging(false)
    setDragStart(null)
  }

  // Reset crop to best fit
  const handleResetCrop = () => {
    if (!imageDimensions) return
    const resetCrop = calculateBestFitCrop(imageDimensions.width, imageDimensions.height)
    setCropArea(resetCrop)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Handle zoom
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 5))
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.1))

  // Handle save
  const handleSave = async () => {
    if (!file || !cropArea || !imageDimensions) return

    setIsProcessing(true)
    try {
      const { blob, transform } = await cropAndNormalizeImage(file, cropArea, imageDimensions)
      onSave(blob, transform)
      onClose()
      
      toast({
        title: "Image normalized",
        description: `Cropped and resized to ${GAME_CANVAS_SIZE.width}×${GAME_CANVAS_SIZE.height}`,
      })
    } catch (error: unknown) {
      toast({
        title: "Normalization failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault()
          setZoom(prev => prev === 1 ? 2 : 1)
          break
        case 'r':
          e.preventDefault()
          handleResetCrop()
          break
        case 'g':
          e.preventDefault()
          setShowGrid(prev => !prev)
          break
        case 'arrowleft':
          e.preventDefault()
          setCropArea(prev => prev ? { ...prev, x: Math.max(0, prev.x - 1) } : null)
          break
        case 'arrowright':
          e.preventDefault()
          setCropArea(prev => prev && imageDimensions ? { 
            ...prev, 
            x: Math.min(imageDimensions.width - prev.width, prev.x + 1) 
          } : null)
          break
        case 'arrowup':
          e.preventDefault()
          setCropArea(prev => prev ? { ...prev, y: Math.max(0, prev.y - 1) } : null)
          break
        case 'arrowdown':
          e.preventDefault()
          setCropArea(prev => prev && imageDimensions ? { 
            ...prev, 
            y: Math.min(imageDimensions.height - prev.height, prev.y + 1) 
          } : null)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, imageDimensions])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-white">
        <DialogHeader className="bg-white border-b border-gray-200 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            Crop to 16:9 (Mobile Optimized)
          </DialogTitle>
          <p className="text-sm text-gray-600">
            Adjust the crop area to frame your image for mobile game canvas ({GAME_CANVAS_SIZE.width}×{GAME_CANVAS_SIZE.height})
          </p>
        </DialogHeader>

        <div className="flex flex-col space-y-4 bg-white p-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.1}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-mono min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 5}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGrid(!showGrid)}
                className={showGrid ? 'bg-emerald-50 border-emerald-300' : ''}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetCrop}
              >
                <RotateCcw className="w-4 h-4" />
                Reset Crop
              </Button>
            </div>

            <div className="text-sm text-gray-500">
              Touch: Pinch to zoom, drag to pan • Hotkeys: Z, R, G, Arrow keys
            </div>
          </div>

          {/* Canvas */}
          <div 
            ref={containerRef}
            className="relative bg-white rounded-lg overflow-hidden border-2 border-gray-300 shadow-inner"
            style={{ height: '500px' }}
          >
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="cursor-move touch-none"
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            />
          </div>

          {/* Info */}
          {cropArea && imageDimensions && (
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-4 rounded-lg border border-emerald-200">
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Original Image:</span>
                    <span className="font-mono text-gray-900">{imageDimensions.width} × {imageDimensions.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Crop Selection:</span>
                    <span className="font-mono text-gray-900">{Math.round(cropArea.width)} × {Math.round(cropArea.height)}</span>
                  </div>
                </div>
                
                <div className="border-t border-emerald-200 pt-3">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-gray-600">Will be resized to:</span>
                    <span className="font-mono text-emerald-700 font-bold text-lg">{GAME_CANVAS_SIZE.width} × {GAME_CANVAS_SIZE.height}</span>
                    <span className="text-gray-500">(Mobile Optimized)</span>
                  </div>
                  <div className="text-center mt-1 text-xs text-gray-500">
                    Crop area will be scaled down from {Math.round(cropArea.width)} × {Math.round(cropArea.height)} to 960 × 540
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!cropArea || isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? 'Processing...' : 'Save Normalized'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
