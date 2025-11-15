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
}

interface TrackEventRequest {
  sessionId: string
  userId?: string
  eventName: string
  pagePath?: string
  eventData?: Record<string, any>
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

    if (type === 'session') {
      return await trackSession(supabase, data as TrackSessionRequest)
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

