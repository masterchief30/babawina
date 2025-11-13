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
 * DELETE /api/admin/competitions/[id]
 * Delete a competition and all related data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ DELETE request for competition:', params.id)

    // Check admin authentication
    const auth = await checkAdminAuth(request)
    if (!auth.isAdmin) {
      console.log('❌ Unauthorized delete attempt:', auth.error)
      return NextResponse.json(
        { error: auth.error },
        { status: 403 }
      )
    }

    console.log('✅ Admin authenticated:', auth.userId)

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const competitionId = params.id

    // 1. Delete competition entries
    console.log('🗑️ Deleting competition entries...')
    const { error: entriesError } = await supabase
      .from('competition_entries')
      .delete()
      .eq('competition_id', competitionId)

    if (entriesError) {
      console.error('❌ Error deleting entries:', entriesError)
      // Don't fail - continue anyway
    } else {
      console.log('✅ Entries deleted')
    }

    // 2. Delete winners
    console.log('🗑️ Deleting winners...')
    const { error: winnersError } = await supabase
      .from('winners')
      .delete()
      .eq('competition_id', competitionId)

    if (winnersError && winnersError.code !== 'PGRST116') {
      console.error('⚠️ Error deleting winners:', winnersError)
      // Don't fail - continue anyway
    } else {
      console.log('✅ Winners deleted')
    }

    // 3. Delete the competition itself
    console.log('🗑️ Deleting competition...')
    const { error: competitionError } = await supabase
      .from('competitions')
      .delete()
      .eq('id', competitionId)

    if (competitionError) {
      console.error('❌ Error deleting competition:', competitionError)
      return NextResponse.json(
        { 
          error: 'Failed to delete competition',
          details: competitionError.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ Competition deleted successfully!')

    return NextResponse.json({
      success: true,
      message: 'Competition deleted successfully'
    })

  } catch (error) {
    console.error('💥 Delete error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/competitions/[id]
 * Update a competition
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📝 PUT request for competition:', params.id)

    // Check admin authentication
    const auth = await checkAdminAuth(request)
    if (!auth.isAdmin) {
      console.log('❌ Unauthorized update attempt:', auth.error)
      return NextResponse.json(
        { error: auth.error },
        { status: 403 }
      )
    }

    console.log('✅ Admin authenticated:', auth.userId)

    // Parse request body
    const updateData = await request.json()
    console.log('📦 Update data received:', Object.keys(updateData))

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const competitionId = params.id

    // Update the competition
    console.log('📝 Updating competition...')
    const { data, error } = await supabase
      .from('competitions')
      .update(updateData)
      .eq('id', competitionId)
      .select()
      .single()

    if (error) {
      console.error('❌ Error updating competition:', error)
      return NextResponse.json(
        { 
          error: 'Failed to update competition',
          details: error.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ Competition updated successfully!')

    return NextResponse.json({
      success: true,
      message: 'Competition updated successfully',
      data
    })

  } catch (error) {
    console.error('💥 Update error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

