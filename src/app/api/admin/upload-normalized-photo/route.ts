import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Helper to check if user is admin
async function checkAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false, userId: null, error: 'No authorization token' }
  }

  const token = authHeader.substring(7)
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  
  if (userError || !user) {
    return { isAdmin: false, userId: null, error: 'Invalid token' }
  }

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
 * POST /api/admin/upload-normalized-photo
 * Upload a normalized/cropped competition photo to Supabase Storage
 */
export async function POST(request: NextRequest) {
  try {
    console.log('✂️ POST request to upload normalized photo')

    const auth = await checkAdminAuth(request)
    if (!auth.isAdmin) {
      console.log('❌ Unauthorized upload attempt:', auth.error)
      return NextResponse.json(
        { error: auth.error },
        { status: 403 }
      )
    }

    console.log('✅ Admin authenticated:', auth.userId)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const filename = formData.get('filename') as string

    if (!file || !filename) {
      return NextResponse.json(
        { error: 'Missing file or filename' },
        { status: 400 }
      )
    }

    console.log('📦 File received:', filename, 'Size:', file.size, 'bytes')

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('⏳ Uploading to competition-images/normalized...')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { error: uploadError } = await supabase.storage
      .from('competition-images')
      .upload(`normalized/${filename}`, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError)
      return NextResponse.json(
        { 
          error: 'Upload failed',
          details: uploadError.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ Normalized photo uploaded successfully!')

    return NextResponse.json({
      success: true,
      filename: filename,
      message: 'Normalized photo uploaded successfully'
    })

  } catch (error) {
    console.error('💥 Upload error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

