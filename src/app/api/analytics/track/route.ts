/**
 * Analytics Tracking API
 * Records user sessions and events for traffic analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface TrackSessionRequest {
  sessionId: string
  userId?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  referrer?: string
  landingPage: string
  deviceType?: string
  browser?: string
  os?: string
  ipAddress?: string
  country?: string
  city?: string
}

interface TrackEventRequest {
  sessionId: string
  userId?: string
  eventName: string
  pagePath?: string
  eventData?: Record<string, any>
}

// Extract IP address from request headers
function getIpAddress(request: NextRequest): string {
  // Try multiple header sources (Vercel, Cloudflare, standard)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  if (realIp) {
    return realIp
  }
  
  return 'unknown'
}

// Get location (country and city) from IP address using free geolocation API
async function getLocationFromIp(ipAddress: string): Promise<{ country: string | null; city: string | null }> {
  // Skip for localhost or unknown IPs
  if (!ipAddress || ipAddress === 'unknown' || ipAddress.startsWith('127.') || ipAddress.startsWith('192.168.') || ipAddress === '::1') {
    return { country: null, city: null }
  }

  try {
    // Use ipapi.co free tier (no API key needed, 30k requests/month)
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
      headers: {
        'User-Agent': 'BabaWina Analytics',
      },
      signal: AbortSignal.timeout(3000), // 3 second timeout
    })

    if (!response.ok) {
      console.warn(`Geolocation API error: ${response.status}`)
      return { country: null, city: null }
    }

    const data = await response.json()
    
    // Return country and city (e.g., "South Africa", "Cape Town")
    return {
      country: data.country_name || null,
      city: data.city || null,
    }
  } catch (error) {
    // Silently fail - don't block analytics if geolocation fails
    console.warn('Failed to get location from IP:', error)
    return { country: null, city: null }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, ...data } = body

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Capture IP address from request
    const ipAddress = getIpAddress(request)

    if (type === 'session') {
      // Get location (country and city) from IP (only for new sessions to avoid rate limits)
      let country: string | null = null
      let city: string | null = null
      if (ipAddress && ipAddress !== 'unknown') {
        const location = await getLocationFromIp(ipAddress)
        country = location.country
        city = location.city
      }
      
      return await trackSession(supabase, { ...data, ipAddress, country, city } as TrackSessionRequest)
    } else if (type === 'event') {
      return await trackEvent(supabase, data as TrackEventRequest)
    } else {
      return NextResponse.json({ error: 'Invalid tracking type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track analytics' },
      { status: 500 }
    )
  }
}

async function trackSession(supabase: any, data: TrackSessionRequest) {
  const {
    sessionId,
    userId,
    utmSource,
    utmMedium,
    utmCampaign,
    referrer,
    landingPage,
    deviceType,
    browser,
    os,
    ipAddress,
    country,
    city,
  } = data

  // Check if session exists
  const { data: existingSession } = await supabase
    .from('analytics_sessions')
    .select('id, last_seen_at')
    .eq('session_id', sessionId)
    .single()

  if (existingSession) {
    // Update existing session (last seen, duration)
    const lastSeen = new Date(existingSession.last_seen_at)
    const now = new Date()
    const additionalSeconds = Math.floor((now.getTime() - lastSeen.getTime()) / 1000)

    // Get current duration first
    const { data: currentSession } = await supabase
      .from('analytics_sessions')
      .select('session_duration_seconds')
      .eq('session_id', sessionId)
      .single()

    const currentDuration = currentSession?.session_duration_seconds || 0
    const newDuration = currentDuration + additionalSeconds

    const { error } = await supabase
      .from('analytics_sessions')
      .update({
        last_seen_at: now.toISOString(),
        session_duration_seconds: newDuration,
      })
      .eq('session_id', sessionId)

    if (error) {
      console.error('Error updating session:', error)
    }

    return NextResponse.json({ success: true, type: 'update' })
  } else {
    // Create new session
    const { error } = await supabase.from('analytics_sessions').insert({
      session_id: sessionId,
      user_id: userId || null,
      utm_source: utmSource || 'direct',
      utm_medium: utmMedium || null,
      utm_campaign: utmCampaign || null,
      referrer: referrer || null,
      landing_page: landingPage,
      device_type: deviceType || 'unknown',
      browser: browser || 'unknown',
      os: os || 'unknown',
      ip_address: ipAddress || null,
      country: country || null,
      city: city || null,
    })

    if (error) {
      console.error('Error creating session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, type: 'create' })
  }
}

async function trackEvent(supabase: any, data: TrackEventRequest) {
  const { sessionId, userId, eventName, pagePath, eventData } = data

  // Record event
  const { error: eventError } = await supabase.from('analytics_events').insert({
    session_id: sessionId,
    user_id: userId || null,
    event_name: eventName,
    page_path: pagePath || null,
    event_data: eventData || null,
  })

  if (eventError) {
    console.error('Error tracking event:', eventError)
    return NextResponse.json({ error: eventError.message }, { status: 500 })
  }

  // Update conversion flags on session if applicable
  const conversionEvents: Record<string, string> = {
    signup: 'did_signup',
    competition_viewed: 'did_view_competition',
    bet_placed: 'did_place_bet',
    payment_added: 'did_add_payment',
  }

  if (conversionEvents[eventName]) {
    await supabase
      .from('analytics_sessions')
      .update({ [conversionEvents[eventName]]: true })
      .eq('session_id', sessionId)
  }

  return NextResponse.json({ success: true })
}

