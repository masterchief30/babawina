"use client"

import { useState, useCallback } from 'react'

interface NotificationState {
  isOpen: boolean
  type: 'success' | 'error'
  title: string
  description?: string
}

export function useCenterNotification() {
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    type: 'success',
    title: '',
    description: ''
  })

  const showSuccess = useCallback((title: string, description?: string) => {
    setNotification({
      isOpen: true,
      type: 'success',
      title,
      description
    })
    
    // Auto-close success messages after 500ms
    setTimeout(() => {
      setNotification(prev => ({ ...prev, isOpen: false }))
    }, 500)
  }, [])

  const showError = useCallback((title: string, description?: string) => {
    setNotification({
      isOpen: true,
      type: 'error',
      title,
      description
    })
  }, [])

  const close = useCallback(() => {
    setNotification(prev => ({ ...prev, isOpen: false }))
  }, [])

  return {
    notification,
    showSuccess,
    showError,
    close
  }
}
