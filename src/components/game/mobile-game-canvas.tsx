"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { 
  GAME_CANVAS_SIZE,
  normalizedToUnitCoords,
  unitToNormalizedCoords,
  validateNormalizedCoords,
  generateResponsiveSrcSet,
  generateResponsiveSizes
} from "@/lib/image-utils"
import { Button } from "@/components/ui/button"
import { Target, ZoomIn, ZoomOut, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react"
import Image from "next/image"

interface MobileGameCanvasProps {
  imageUrl: string
  competitionId: string
  onSubmitEntry: (u: number, v: number) => Promise<void>
  disabled?: boolean
}

export function MobileGameCanvas({ 
  imageUrl, 
  competitionId, 
  onSubmitEntry, 
  disabled = false 
}: MobileGameCanvasProps) {
  const [crosshairPosition, setCrosshairPosition] = useState<{ u: number; v: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const { toast } = useToast()

  // Handle touch/mouse events for mobile-first interaction
  const getPointerPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
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

    const x = clientX - rect.left
    const y = clientY - rect.top

    // Convert to normalized coordinates (0..1)
    const u = x / rect.width
    const v = y / rect.height

    return { u, v, screenX: x, screenY: y }
  }

  // Handle single tap to place crosshair
  const handleTap = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    
    if (disabled || isDragging) return

    const position = getPointerPosition(e)
    if (!position) return

    // Validate position is within bounds
    if (position.u >= 0 && position.u <= 1 && position.v >= 0 && position.v <= 1) {
      setCrosshairPosition({ u: position.u, v: position.v })
      setShowConfirmation(true)
      
      // Convert to pixel coordinates for display
      const pixelCoords = unitToNormalizedCoords(position.u, position.v)
      
      toast({
        title: "Crosshair placed",
        description: `Position: (${Math.round(pixelCoords.x_norm)}, ${Math.round(pixelCoords.y_norm)})`,
      })
    }
  }

  // Handle pan gesture
  const handlePanStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const position = getPointerPosition(e)
    if (!position) return

    setIsDragging(true)
    setDragStart({ x: position.screenX, y: position.screenY })
  }

  const handlePanMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart) return

    const position = getPointerPosition(e)
    if (!position) return

    const deltaX = position.screenX - dragStart.x
    const deltaY = position.screenY - dragStart.y

    setPan(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }))

    setDragStart({ x: position.screenX, y: position.screenY })
  }

  const handlePanEnd = () => {
    setIsDragging(false)
    setDragStart(null)
  }

  // Zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 5))
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.5))
  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Crosshair nudging with arrow keys or on-screen buttons
  const nudgeCrosshair = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!crosshairPosition) return

    const nudgeAmount = 0.005 // Small movement in unit coordinates
    let newU = crosshairPosition.u
    let newV = crosshairPosition.v

    switch (direction) {
      case 'up':
        newV = Math.max(0, crosshairPosition.v - nudgeAmount)
        break
      case 'down':
        newV = Math.min(1, crosshairPosition.v + nudgeAmount)
        break
      case 'left':
        newU = Math.max(0, crosshairPosition.u - nudgeAmount)
        break
      case 'right':
        newU = Math.min(1, crosshairPosition.u + nudgeAmount)
        break
    }

    setCrosshairPosition({ u: newU, v: newV })
  }

  // Submit entry
  const handleSubmitEntry = async () => {
    if (!crosshairPosition) {
      toast({
        title: "No position selected",
        description: "Please tap on the image to place your crosshair first.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmitEntry(crosshairPosition.u, crosshairPosition.v)
      
      toast({
        title: "Entry submitted!",
        description: "Good luck! Results will be announced when the competition ends.",
      })
      
      setShowConfirmation(false)
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault()
          nudgeCrosshair('up')
          break
        case 'ArrowDown':
          e.preventDefault()
          nudgeCrosshair('down')
          break
        case 'ArrowLeft':
          e.preventDefault()
          nudgeCrosshair('left')
          break
        case 'ArrowRight':
          e.preventDefault()
          nudgeCrosshair('right')
          break
        case '+':
        case '=':
          e.preventDefault()
          handleZoomIn()
          break
        case '-':
          e.preventDefault()
          handleZoomOut()
          break
        case 'r':
          e.preventDefault()
          handleResetView()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [crosshairPosition, disabled])

  return (
    <div className="space-y-4">
      {/* Game Canvas */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden">
        <div className="relative" style={{ aspectRatio: `${GAME_CANVAS_SIZE.width}/${GAME_CANVAS_SIZE.height}` }}>
          {/* Responsive Image */}
          <Image
            ref={imageRef}
            src={imageUrl}
            alt="Game Image"
            fill
            className="object-cover"
            sizes={generateResponsiveSizes()}
            priority
            quality={85}
          />
          
          {/* Interactive Canvas Overlay */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            onMouseDown={handlePanStart}
            onMouseMove={handlePanMove}
            onMouseUp={handlePanEnd}
            onMouseLeave={handlePanEnd}
            onTouchStart={handlePanStart}
            onTouchMove={handlePanMove}
            onTouchEnd={handlePanEnd}
            onClick={handleTap}
          />
          
          {/* Crosshair */}
          {crosshairPosition && (
            <div
              className="absolute w-6 h-6 pointer-events-none"
              style={{
                left: `${crosshairPosition.u * 100}%`,
                top: `${crosshairPosition.v * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-full h-full">
                {/* Crosshair lines */}
                <div className="absolute w-full h-0.5 bg-red-500 top-1/2 transform -translate-y-1/2 shadow-lg"></div>
                <div className="absolute h-full w-0.5 bg-red-500 left-1/2 transform -translate-x-1/2 shadow-lg"></div>
                {/* Center dot */}
                <div className="absolute w-2 h-2 bg-red-500 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-white shadow-lg"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col space-y-4">
        {/* Zoom and Reset Controls */}
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
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
            onClick={handleResetView}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Crosshair Nudge Controls (Mobile) */}
        {crosshairPosition && (
          <div className="flex flex-col items-center space-y-2">
            <p className="text-sm text-gray-600">Fine-tune crosshair position:</p>
            <div className="grid grid-cols-3 gap-2">
              <div></div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => nudgeCrosshair('up')}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
              <div></div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => nudgeCrosshair('left')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center justify-center">
                <Target className="w-4 h-4 text-gray-400" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => nudgeCrosshair('right')}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
              
              <div></div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => nudgeCrosshair('down')}
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
              <div></div>
            </div>
          </div>
        )}

        {/* Position Display */}
        {crosshairPosition && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
              <span className="font-mono">
                u: {crosshairPosition.u.toFixed(3)}, v: {crosshairPosition.v.toFixed(3)}
              </span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">How to play:</p>
          <p>Pinch to zoom, drag to pan. Tap to place your crosshair where you think the ball was.</p>
        </div>

        {/* Submit Button */}
        {showConfirmation && (
          <div className="space-y-3">
            <div className="text-center p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-emerald-800 font-medium">Ready to submit your entry?</p>
              <p className="text-sm text-emerald-700 mt-1">
                You've placed your crosshair. Double-check the position and submit when ready.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                className="flex-1"
              >
                Adjust Position
              </Button>
              <Button
                onClick={handleSubmitEntry}
                disabled={isSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Entry'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
