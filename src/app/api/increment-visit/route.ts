import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Call the increment function
    const { data, error } = await supabase.rpc('increment_daily_visits')

    if (error) {
      console.error('Error incrementing visit counter:', error)
      return NextResponse.json({ count: 0 }, { status: 500 })
    }

    return NextResponse.json({ count: data || 0 })
  } catch (error) {
    console.error('Error in increment-visit API:', error)
    return NextResponse.json({ count: 0 }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get today's count without incrementing
    const { data, error } = await supabase.rpc('get_daily_visits')

    if (error) {
      console.error('Error getting visit counter:', error)
      return NextResponse.json({ count: 0 }, { status: 500 })
    }

    return NextResponse.json({ count: data || 0 })
  } catch (error) {
    console.error('Error in get visit API:', error)
    return NextResponse.json({ count: 0 }, { status: 500 })
  }
}

