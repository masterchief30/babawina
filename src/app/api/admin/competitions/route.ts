import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const dynamic = 'force-dynamic'

// Helper to check if user is admin
async function checkAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false, userId: null, error: 'No authorization token' }
  }

  const token = authHeader.substring(7)
  
  // Verify token and get user
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  
  if (userError || !user) {
    return { isAdmin: false, userId: null, error: 'Invalid token' }
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return { isAdmin: false, userId: user.id, error: 'Not an admin' }
  }

  return { isAdmin: true, userId: user.id, error: null }
}

/**
 * POST /api/admin/competitions
 * Create a new competition
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST request to create competition')

    // Check admin authentication
    const auth = await checkAdminAuth(request)
    if (!auth.isAdmin) {
      console.log('❌ Unauthorized create attempt:', auth.error)
      return NextResponse.json(
        { error: auth.error },
        { status: 403 }
      )
    }

    console.log('✅ Admin authenticated:', auth.userId)

    // Parse request body
    const competitionData = await request.json()
    console.log('📦 Competition data received:', Object.keys(competitionData))

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Insert the competition
    console.log('📝 Creating competition...')
    const { data, error } = await supabase
      .from('competitions')
      .insert(competitionData)
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating competition:', error)
      return NextResponse.json(
        { 
          error: 'Failed to create competition',
          details: error.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ Competition created successfully!', data.id)

    return NextResponse.json({
      success: true,
      message: 'Competition created successfully',
      data
    })

  } catch (error) {
    console.error('💥 Create error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

