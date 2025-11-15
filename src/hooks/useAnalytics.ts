/**
 * Analytics Hook
 * Track user sessions and events for traffic analysis
 */

import { useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'

// Generate or retrieve session ID (expires after 30 minutes of inactivity)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  const now = Date.now()
  let sessionId = localStorage.getItem('bw_session_id')
  const lastActivity = localStorage.getItem('bw_session_last_activity')
  
  // Check if session expired (30 min of inactivity)
  if (sessionId && lastActivity) {
    const timeSinceActivity = now - parseInt(lastActivity, 10)
    if (timeSinceActivity > SESSION_TIMEOUT_MS) {
      // Session expired, create new one
      sessionId = null
    }
  }
  
  // Create new session if needed
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`
    localStorage.setItem('bw_session_id', sessionId)
  }
  
  // Update last activity timestamp
  localStorage.setItem('bw_session_last_activity', now.toString())
  
  return sessionId
}

// Get device info
function getDeviceInfo() {
  if (typeof window === 'undefined') return {}
  
  const ua = navigator.userAgent
  let deviceType = 'desktop'
  
  if (/Mobile|Android|iPhone/i.test(ua)) {
    deviceType = 'mobile'
  } else if (/iPad|Tablet/i.test(ua)) {
    deviceType = 'tablet'
  }
  
  let browser = 'unknown'
  if (ua.includes('Chrome')) browser = 'chrome'
  else if (ua.includes('Safari')) browser = 'safari'
  else if (ua.includes('Firefox')) browser = 'firefox'
  else if (ua.includes('Edge')) browser = 'edge'
  
  let os = 'unknown'
  if (ua.includes('Windows')) os = 'windows'
  else if (ua.includes('Mac')) os = 'mac'
  else if (ua.includes('Linux')) os = 'linux'
  else if (ua.includes('Android')) os = 'android'
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'ios'
  
  return { deviceType, browser, os }
}

// Extract UTM parameters
function getUTMParams() {
  if (typeof window === 'undefined') return {}
  
  const params = new URLSearchParams(window.location.search)
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
    referrer: document.referrer || undefined,
  }
}

export function useAnalytics() {
  const { user } = useAuth()
  const pathname = usePathname()
  // Note: searchParams intentionally NOT used to avoid Suspense boundary requirement
  const lastTrackedPath = useRef<string | null>(null)
  const lastTrackTime = useRef<number>(0)

  // Track session on mount and update periodically
  useEffect(() => {
    const sessionId = getSessionId()
    const { deviceType, browser, os } = getDeviceInfo()
    const { utmSource, utmMedium, utmCampaign, referrer } = getUTMParams()

    const updateSession = () => {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'session',
          sessionId,
          userId: user?.id,
          utmSource,
          utmMedium,
          utmCampaign,
          referrer,
          landingPage: pathname || '/',
          deviceType,
          browser,
          os,
        }),
      }).catch((err) => console.error('Analytics session tracking failed:', err))
    }

    // Track immediately
    updateSession()

    // Update session every 30 seconds to track duration
    const interval = setInterval(updateSession, 30000)

    return () => clearInterval(interval)
  }, [user?.id, pathname])

  // Track page views with deduplication
  useEffect(() => {
    const now = Date.now()
    const timeSinceLastTrack = now - lastTrackTime.current
    
    // Skip if same path was tracked less than 2 seconds ago (prevents React Strict Mode duplicates)
    if (pathname === lastTrackedPath.current && timeSinceLastTrack < 2000) {
      console.log('⏭️ Skipping duplicate page view:', pathname)
      return
    }

    const sessionId = getSessionId()
    
    lastTrackedPath.current = pathname
    lastTrackTime.current = now
    
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'event',
        sessionId,
        userId: user?.id,
        eventName: 'page_view',
        pagePath: pathname,
      }),
    }).catch((err) => console.error('Analytics page view tracking failed:', err))
  }, [pathname, user?.id])  // searchParams removed - not used in tracking logic

  // Function to track custom events
  const trackEvent = useCallback(
    (eventName: string, eventData?: Record<string, any>) => {
      const sessionId = getSessionId()
      
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event',
          sessionId,
          userId: user?.id,
          eventName,
          pagePath: pathname,
          eventData,
        }),
      }).catch((err) => console.error(`Analytics event tracking failed (${eventName}):`, err))
    },
    [user?.id, pathname]
  )

  return { trackEvent }
}

