"use client"

import { CheckCircle, X } from "lucide-react"
import { useEffect, useState } from "react"

interface CenterNotificationProps {
  isOpen: boolean
  type: 'success' | 'error'
  title: string
  description?: string
  onClose: () => void
  autoClose?: boolean
  autoCloseDelay?: number
}

export function CenterNotification({
  isOpen,
  type,
  title,
  description,
  onClose,
  autoClose = true,
  autoCloseDelay = 3000
}: CenterNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      if (autoClose) {
        const timer = setTimeout(() => {
          setIsVisible(false)
          setTimeout(onClose, 300) // Wait for fade out animation
        }, autoCloseDelay)
        return () => clearTimeout(timer)
      }
    } else {
      setIsVisible(false)
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose])

  // Add ESC key functionality
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsVisible(false)
        setTimeout(onClose, 300)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
      <div 
        className={`bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 pointer-events-auto ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        <div className="text-center">
          {/* Icon */}
          <div className="mb-6">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
              type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {type === 'success' ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : (
                <X className="w-12 h-12 text-red-600" />
              )}
            </div>
          </div>
          
          {/* Title */}
          <h3 className={`text-xl font-bold mb-2 ${
            type === 'success' ? 'text-green-700' : 'text-red-700'
          }`}>
            {title}
          </h3>
          
          {/* Description */}
          {description && (
            <p className="text-gray-600 text-sm">
              {description}
            </p>
          )}
          
          {/* Close button */}
          {!autoClose && (
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
