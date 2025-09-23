"use client"

import { useEffect } from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  // Add ESC key functionality
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && toasts.length > 0) {
        // Dismiss all toasts when ESC is pressed
        toasts.forEach(toast => dismiss(toast.id))
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [toasts, dismiss])

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const isSuccess = variant === 'success'
        const isError = variant === 'destructive'
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="grid gap-4 text-center py-6 px-8">
              {/* Icon - Green checkmark for success, Red X for error */}
              {(isSuccess || isError) && (
                <div className="flex justify-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    isSuccess ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <span className={`text-3xl font-bold ${
                      isSuccess ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isSuccess ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              )}
              {title && <ToastTitle className="text-xl font-bold text-gray-900">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-base text-gray-600">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
