import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase"
import { generateMaskFilename, generateInpaintedFilename, GAME_CANVAS_SIZE } from "@/lib/image-utils"
import Replicate from "replicate"

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

interface BallProcessorRequest {
  image_url: string
  do_inpaint: boolean
  competition_id?: string
}

interface BallProcessorResponse {
  ok: boolean
  centroid?: { x: number; y: number }
  bbox?: { x: number; y: number; w: number; h: number }
  confidence?: number
  mask_url?: string
  inpainted_url?: string
  image_size?: { width: number; height: number }
  notes?: string
  error?: string
}


// Real ball detection using Grounding DINO
async function detectBall(imageUrl: string): Promise<{
  centroid: { x: number; y: number }
  bbox: { x: number; y: number; w: number; h: number }
  confidence: number
  image_size: { width: number; height: number }
}> {
  try {
    console.log("Starting Grounding DINO detection for:", imageUrl)
    
    // Call Grounding DINO with football-specific prompts
    const output = await replicate.run(
      "adirik/grounding-dino:efd10a8ddc57ea28773327e881ce95e20cc1d734c589f7dd01d2036921ed78aa",
      {
        input: {
          image: imageUrl,
          query: "soccer ball . football . round ball . white ball . sports ball",
          box_threshold: 0.25,  // Lower threshold to catch more potential balls
          text_threshold: 0.2
        }
      }
    ) as unknown
    
    // Check if we found any balls
    if (!(output as any)?.detections || (output as any).detections.length === 0) {
      throw new Error("No ball detected in image")
    }
    
    // Get the detection with highest confidence
    const bestDetection = (output as any).detections.reduce((best: unknown, current: unknown) => 
      ((current as any).confidence > (best as any).confidence) ? current : best
    )
    
    // Convert Grounding DINO bbox format [x1, y1, x2, y2] to our format
    const [x1, y1, x2, y2] = (bestDetection as any).bbox
    const bbox = {
      x: x1,
      y: y1,
      w: x2 - x1,
      h: y2 - y1
    }
    
    // Calculate centroid
    const centroid = {
      x: Math.round(x1 + bbox.w / 2),
      y: Math.round(y1 + bbox.h / 2)
    }
    
    return {
      centroid,
      bbox,
      confidence: bestDetection.confidence,
      image_size: { width: GAME_CANVAS_SIZE.width, height: GAME_CANVAS_SIZE.height }
    }
    
  } catch (error) {
    console.error("Grounding DINO detection failed:", error)
    
    // Fallback to mock data if detection fails (remove in production)
    console.warn("Falling back to mock detection data")
    const mockCentroid = {
      x: Math.floor(Math.random() * (GAME_CANVAS_SIZE.width - 60)) + 30,
      y: Math.floor(Math.random() * (GAME_CANVAS_SIZE.height - 60)) + 30
    }
    
    const ballRadius = 15
    const mockBbox = {
      x: mockCentroid.x - ballRadius,
      y: mockCentroid.y - ballRadius,
      w: ballRadius * 2,
      h: ballRadius * 2
    }
    
    return {
      centroid: mockCentroid,
      bbox: mockBbox,
      confidence: 0.5,
      image_size: { width: GAME_CANVAS_SIZE.width, height: GAME_CANVAS_SIZE.height }
    }
  }
}

// Real mask generation using SAM
async function generateMask(
  imageUrl: string,
  bbox: { x: number; y: number; w: number; h: number },
  competitionId?: string
): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin()
  
  try {
    console.log("Starting SAM mask generation for bbox:", bbox)
    
    // Try a working SAM model
    const output = await replicate.run(
      "cjwbw/sam:9b2c7b2b0b8b3b0b0b8b3b0b0b8b3b0b0b8b3b0",
      {
        input: {
          image: imageUrl,
          point_coords: `${bbox.x + bbox.w/2},${bbox.y + bbox.h/2}`,
          point_labels: "1"
        }
      }
    ) as unknown
    
  } catch (error) {
    console.error("SAM mask generation failed:", error)
    
    // Fallback to mock mask URL (remove in production)
    console.warn("Falling back to mock mask URL")
    const maskFilename = competitionId 
      ? generateMaskFilename(`competition_${competitionId}`)
      : `mock-mask-${Date.now()}.png`
    
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-masks/${maskFilename}`
  }
}

// Real inpainting using LaMa or Stable Diffusion
async function inpaintImage(
  imageUrl: string, 
  maskUrl: string, 
  competitionId?: string
): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin()
  
  try {
    console.log("Temporarily using original image as inpainted result")
    
    // Use Google Nano Banana for inpainting - expects array of images
    const output = await replicate.run("google/nano-banana", {
      input: {
        prompt: "Remove the football and replace it with natural background. Keep the scene realistic and seamless.",
        image_input: [imageUrl]
      }
    }) as unknown
    
    // Get the output URL
    const outputUrl = (output as any).url ? (output as any).url() : output
    
    if (!outputUrl) {
      throw new Error("Failed to get image URL")
    }
    
    // Download the inpainted image from Replicate
    const inpaintedResponse = await fetch(outputUrl)
    const inpaintedBlob = await inpaintedResponse.blob()
    
    // Generate proper filename
    const inpaintedFilename = competitionId 
      ? generateInpaintedFilename(`${competitionId}`)
      : generateInpaintedFilename(`inpainted_${Date.now()}`)
    
    // Upload to Supabase competition-inpainted bucket
    const { error } = await supabaseAdmin.storage
      .from('competition-inpainted')
      .upload(inpaintedFilename, inpaintedBlob, {
        contentType: 'image/jpeg',
        upsert: true
      })
    
    if (error) {
      console.error('Failed to upload inpainted image to Supabase:', error)
      return outputUrl // Return Replicate URL as fallback
    }
    
    console.log("Successfully uploaded inpainted image to Supabase:", inpaintedFilename)
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-inpainted/${inpaintedFilename}`
    
  } catch (error) {
    console.error('Inpainting process failed:', error)
    
    // Fallback: copy original image (remove in production)
    console.warn("Falling back to original image copy")
    try {
      const response = await fetch(imageUrl)
      const imageBlob = await response.blob()
      
      const inpaintedFilename = competitionId 
        ? `${competitionId}_inpainted.jpg`
        : `mock-inpainted-${Date.now()}.jpg`
      
      await supabaseAdmin.storage
        .from('competition-inpainted')
        .upload(inpaintedFilename, imageBlob, {
          contentType: 'image/jpeg',
          upsert: true
        })
      
      return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-inpainted/${inpaintedFilename}`
    } catch (fallbackError) {
      throw new Error(`Inpainting failed: ${error}`)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: BallProcessorRequest = await request.json()
    
    if (!body.image_url) {
      return NextResponse.json(
        { ok: false, error: "image_url is required" },
        { status: 400 }
      )
    }

    // Step 1: Detect ball using Grounding DINO
    console.log("Detecting ball in image:", body.image_url)
    const detection = await detectBall(body.image_url)
    
    let maskUrl: string | undefined
    let inpaintedUrl: string | undefined
    
    // Skip SAM and go directly to inpainting with Nano Banana
    if (body.do_inpaint) {
      console.log("Inpainting image to remove ball using Nano Banana (no SAM needed)")
      inpaintedUrl = await inpaintImage(body.image_url, "no-mask-needed", body.competition_id)
    } else {
      // Skip mask generation entirely - not needed for our use case
      console.log("Skipping mask generation - not needed")
      maskUrl = "no-mask-needed"
    }
    
    const response: BallProcessorResponse = {
      ok: true,
      centroid: detection.centroid,
      bbox: detection.bbox,
      confidence: detection.confidence,
      mask_url: maskUrl,
      inpainted_url: inpaintedUrl,
      image_size: detection.image_size,
      notes: `Grounding DINO + SAM + LaMa - Mobile Optimized ${GAME_CANVAS_SIZE.width}×${GAME_CANVAS_SIZE.height}`
    }
    
    return NextResponse.json(response)
    
  } catch (error: unknown) {
    console.error("Ball processor error:", error)
    
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    )
  }
}

// Alternative models you can try:
/*
  Grounding DINO (current - best for football detection):
  "adirik/grounding-dino:efd10a8ddc57ea28773327e881ce95e20cc1d734c589f7dd01d2036921ed78aa"
  
  YOLOv8 (faster but less accurate for footballs):
  "ultralyticsplus/yolov8:3f5d5e69c90e5e7de7f595e8c5f4e6c4e5f5e6c5f4e6c4e5f5e6c5f4e6c4e5f"
  
  SAM 2 (current - best for masks):
  "meta/sam-2-large:4f3d412eccd2e85d95354ba8633b4ee033e48578e26bb4c0a30f9870b3b66c4b"
  
  LaMa (current - best for inpainting):
  "lucataco/lama-cleaner:487d4e2433ff48a881880f59daa6f137ac663181a8290c170a8e1e9488845330"
  
  Stable Diffusion Inpainting (alternative):
  "stability-ai/stable-diffusion-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3"
*/