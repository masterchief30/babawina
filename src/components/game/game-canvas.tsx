"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface GameCanvasProps {
  imageUrl: string
  imageWidth: number
  imageHeight: number
  onSubmit: (x: number, y: number) => Promise<void>
  disabled?: boolean
}

interface Position {
  x: number
  y: number
}

export function GameCanvas({ 
  imageUrl, 
  imageWidth, 
  imageHeight, 
  onSubmit, 
  disabled = false 
}: GameCanvasProps) {
  const [markerPosition, setMarkerPosition] = useState<Position | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const { toast } = useToast()

  // Handle mouse/touch events for pan and zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.min(Math.max(scale * delta, 0.5), 5)
    setScale(newScale)
  }, [scale])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click
      setIsDragging(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [isDragging, lastPanPoint])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Handle click to place marker
  const handleImageClick = useCallback((e: React.MouseEvent) => {
    if (disabled || isDragging) return

    const rect = imageRef.current?.getBoundingClientRect()
    if (!rect) return

    // Calculate click position relative to the image
    const x = (e.clientX - rect.left - pan.x) / scale
    const y = (e.clientY - rect.top - pan.y) / scale

    // Convert to image coordinates
    const imageX = (x / rect.width) * imageWidth
    const imageY = (y / rect.height) * imageHeight

    // Ensure coordinates are within bounds
    if (imageX >= 0 && imageX <= imageWidth && imageY >= 0 && imageY <= imageHeight) {
      setMarkerPosition({ x: imageX, y: imageY })
    }
  }, [disabled, isDragging, pan, scale, imageWidth, imageHeight])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!markerPosition || disabled) return

      let newX = markerPosition.x
      let newY = markerPosition.y

      switch (e.key) {
        case "ArrowLeft":
          newX = Math.max(0, newX - 1)
          break
        case "ArrowRight":
          newX = Math.min(imageWidth, newX + 1)
          break
        case "ArrowUp":
          newY = Math.max(0, newY - 1)
          break
        case "ArrowDown":
          newY = Math.min(imageHeight, newY + 1)
          break
        default:
          return
      }

      e.preventDefault()
      setMarkerPosition({ x: newX, y: newY })
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [markerPosition, disabled, imageWidth, imageHeight])

  const handleSubmitClick = () => {
    if (!markerPosition) return
    setShowConfirmDialog(true)
  }

  const handleConfirmSubmit = async () => {
    if (!markerPosition) return

    setIsSubmitting(true)
    try {
      await onSubmit(markerPosition.x, markerPosition.y)
      toast({
        title: "Nice one!",
        description: "Your entry is in. Check back when the countdown hits zero.",
      })
      setShowConfirmDialog(false)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit your pick. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getMarkerStyle = (): React.CSSProperties => {
    if (!markerPosition || !containerRef.current || !imageRef.current) {
      return { display: "none" }
    }

    const rect = imageRef.current.getBoundingClientRect()
    const containerRect = containerRef.current.getBoundingClientRect()

    // Convert image coordinates to screen coordinates
    const screenX = (markerPosition.x / imageWidth) * rect.width * scale + pan.x
    const screenY = (markerPosition.y / imageHeight) * rect.height * scale + pan.y

    return {
      left: screenX + (rect.left - containerRect.left),
      top: screenY + (rect.top - containerRect.top),
      position: "absolute" as const,
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Game Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden game-canvas"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
        >
          <Image
            ref={imageRef}
            src={imageUrl}
            alt="Spot the ball game image"
            width={imageWidth}
            height={imageHeight}
            className="max-w-none cursor-crosshair"
            onClick={handleImageClick}
            draggable={false}
            priority
          />
        </div>

        {/* Crosshair Marker */}
        {markerPosition && (
          <div className="crosshair-marker" style={getMarkerStyle()} />
        )}
      </div>

      {/* Controls */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {markerPosition 
              ? `Position: (${Math.round(markerPosition.x)}, ${Math.round(markerPosition.y)})` 
              : "Zoom in, then tap to place your crosshair. You can adjust before submitting."
            }
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScale(Math.max(0.5, scale * 0.8))}
                disabled={disabled}
              >
                Zoom Out
              </Button>
              <span className="text-sm text-muted-foreground">
                {Math.round(scale * 100)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScale(Math.min(5, scale * 1.25))}
                disabled={disabled}
              >
                Zoom In
              </Button>
            </div>
            
            <Button
              variant="accent"
              onClick={handleSubmitClick}
              disabled={!markerPosition || disabled}
            >
              Submit Pick
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock in your pick?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your crosshair position? 
              You can only make one entry per competition.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
