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
          <div className="mb-4">
            {type === 'success' ? (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            ) : (
              <X className="w-16 h-16 text-red-500 mx-auto" />
            )}
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
