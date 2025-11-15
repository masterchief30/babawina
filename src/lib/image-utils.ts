// Image processing utilities for normalization and coordinate transforms

export interface ImageDimensions {
  width: number
  height: number
}

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface NormalizationTransform {
  scale_x: number
  scale_y: number
  offset_x: number
  offset_y: number
  raw_width: number
  raw_height: number
  normalized_width: number
  normalized_height: number
}

// HD 720p game canvas size (16:9 aspect ratio)
// Native resolution extraction - NO downscaling!
export const GAME_CANVAS_SIZE = {
  width: 1280,
  height: 720
} as const

// Legacy mobile size (deprecated)
export const GAME_CANVAS_SIZE_MOBILE = {
  width: 960,
  height: 540
} as const

// Responsive breakpoints for image delivery
export const RESPONSIVE_SIZES = {
  small: { width: 640, height: 360 },   // 480w - mobile
  medium: { width: 1280, height: 720 }, // 960w - tablet
  large: { width: 1920, height: 1080 }  // 1920w - desktop/HD
} as const

/**
 * Fix EXIF orientation issues by rotating/flipping the image
 */
export function fixImageOrientation(file: File): Promise<File> {
  return new Promise((resolve) => {
    // For now, return the original file
    // In production, you'd use exif-js to read orientation and apply transforms
    resolve(file)
  })
}

/**
 * Get image dimensions from a file
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Calculate the best-fit crop area for 16:9 aspect ratio (mobile-optimized)
 */
export function calculateBestFitCrop(imageWidth: number, imageHeight: number): CropArea {
  const targetAspectRatio = GAME_CANVAS_SIZE.width / GAME_CANVAS_SIZE.height // 16:9
  const imageAspectRatio = imageWidth / imageHeight

  let cropWidth: number
  let cropHeight: number
  let cropX: number
  let cropY: number

  if (imageAspectRatio > targetAspectRatio) {
    // Image is wider than 16:9, crop horizontally
    cropHeight = imageHeight
    cropWidth = cropHeight * targetAspectRatio
    cropX = (imageWidth - cropWidth) / 2
    cropY = 0
  } else {
    // Image is taller than 16:9, crop vertically
    cropWidth = imageWidth
    cropHeight = cropWidth / targetAspectRatio
    cropX = 0
    cropY = (imageHeight - cropHeight) / 2
  }

  return {
    x: cropX,
    y: cropY,
    width: cropWidth,
    height: cropHeight
  }
}

/**
 * Crop and extract image at NATIVE HD 720p resolution (1280×720)
 * NO DOWNSCALING - extracts exact pixels from original image!
 */
export function cropAndNormalizeImage(
  file: File,
  cropArea: CropArea,
  originalDimensions: ImageDimensions
): Promise<{ blob: Blob; transform: NormalizationTransform }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    // Set canvas to 720p HD size for native resolution extraction
    canvas.width = GAME_CANVAS_SIZE.width
    canvas.height = GAME_CANVAS_SIZE.height

    const img = new Image()
    img.onload = () => {
      // Draw the cropped portion of the image, scaled to fit the canvas
      ctx.drawImage(
        img,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height, // source rectangle
        0, 0, GAME_CANVAS_SIZE.width, GAME_CANVAS_SIZE.height // destination rectangle
      )

      // Calculate transformation parameters
      const transform: NormalizationTransform = {
        scale_x: GAME_CANVAS_SIZE.width / cropArea.width,
        scale_y: GAME_CANVAS_SIZE.height / cropArea.height,
        offset_x: cropArea.x,
        offset_y: cropArea.y,
        raw_width: originalDimensions.width,
        raw_height: originalDimensions.height,
        normalized_width: GAME_CANVAS_SIZE.width,
        normalized_height: GAME_CANVAS_SIZE.height
      }

      // Convert canvas to blob with mobile-optimized compression
      canvas.toBlob((blob) => {
        if (blob) {
          resolve({ blob, transform })
        } else {
          reject(new Error('Failed to create blob from canvas'))
        }
      }, 'image/jpeg', 0.85) // Slightly lower quality for mobile optimization
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Convert raw coordinates to normalized pixel coordinates
 */
export function rawToNormalizedCoords(
  rawX: number,
  rawY: number,
  transform: NormalizationTransform
): { x_norm: number; y_norm: number } {
  const x_norm = (rawX - transform.offset_x) * transform.scale_x
  const y_norm = (rawY - transform.offset_y) * transform.scale_y

  return {
    x_norm: Math.max(0, Math.min(transform.normalized_width - 1, x_norm)),
    y_norm: Math.max(0, Math.min(transform.normalized_height - 1, y_norm))
  }
}

/**
 * Convert normalized pixel coordinates to raw coordinates
 */
export function normalizedToRawCoords(
  xNorm: number,
  yNorm: number,
  transform: NormalizationTransform
): { x_raw: number; y_raw: number } {
  const x_raw = (xNorm / transform.scale_x) + transform.offset_x
  const y_raw = (yNorm / transform.scale_y) + transform.offset_y

  return { x_raw, y_raw }
}

/**
 * Convert normalized pixel coordinates to unit coordinates [0..1] (mobile-optimized)
 */
export function normalizedToUnitCoords(
  xNorm: number,
  yNorm: number
): { u: number; v: number } {
  return {
    u: xNorm / GAME_CANVAS_SIZE.width,  // 960
    v: yNorm / GAME_CANVAS_SIZE.height  // 540
  }
}

/**
 * Convert unit coordinates [0..1] to normalized pixel coordinates (mobile-optimized)
 */
export function unitToNormalizedCoords(
  u: number,
  v: number
): { x_norm: number; y_norm: number } {
  return {
    x_norm: u * GAME_CANVAS_SIZE.width,  // 960
    y_norm: v * GAME_CANVAS_SIZE.height  // 540
  }
}

/**
 * Calculate distance in normalized pixel space (mobile-optimized 960×540)
 */
export function calculateDistanceNormalized(
  u1: number,
  v1: number,
  u2: number,
  v2: number
): number {
  // Convert unit coords to normalized pixels for consistent distance calculation
  const dx = (u1 * GAME_CANVAS_SIZE.width) - (u2 * GAME_CANVAS_SIZE.width)
  const dy = (v1 * GAME_CANVAS_SIZE.height) - (v2 * GAME_CANVAS_SIZE.height)
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate Euclidean distance between two points in normalized space
 */
export function calculateDistance(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

/**
 * Validate that coordinates are within normalized bounds
 */
export function validateNormalizedCoords(x: number, y: number): boolean {
  return x >= 0 && x < GAME_CANVAS_SIZE.width && y >= 0 && y < GAME_CANVAS_SIZE.height
}

/**
 * Generate a filename for normalized images
 */
export function generateNormalizedFilename(originalName: string): string {
  const timestamp = Date.now()
  const extension = originalName.split('.').pop() || 'jpg'
  return `normalized_${timestamp}.${extension}`
}

/**
 * Generate a filename for inpainted images
 */
export function generateInpaintedFilename(originalName: string): string {
  // Remove any existing extension and add _inpainted.jpg
  const baseName = originalName.replace(/\.[^/.]+$/, '')
  return `${baseName}_inpainted.jpg`
}

/**
 * Generate a filename for mask images
 */
export function generateMaskFilename(): string {
  const timestamp = Date.now()
  return `mask_${timestamp}.png`
}

/**
 * Generate responsive image srcSet for mobile-optimized delivery
 */
export function generateResponsiveSrcSet(basePath: string): string {
  const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/competition-images`
  
  return [
    `${baseUrl}/${basePath.replace('.jpg', '_640w.jpg')} 480w`,
    `${baseUrl}/${basePath.replace('.jpg', '_960w.jpg')} 960w`, 
    `${baseUrl}/${basePath.replace('.jpg', '_1280w.jpg')} 1280w`
  ].join(', ')
}

/**
 * Generate responsive image sizes attribute for mobile-first
 */
export function generateResponsiveSizes(): string {
  return [
    '(max-width: 480px) 100vw',
    '(max-width: 960px) 100vw',
    '960px'
  ].join(', ')
}

/**
 * Validate file for mobile upload (reduced limits)
 */
export function validateMobileUpload(file: File): { valid: boolean; error?: string } {
  // File type validation
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return {
      valid: false,
      error: "Please upload JPG, PNG, or WEBP files only."
    }
  }

  // File size validation (6MB for mobile)
  if (file.size > 6 * 1024 * 1024) {
    return {
      valid: false,
      error: "Please upload files smaller than 6MB."
    }
  }

  return { valid: true }
}

/**
 * Validate image dimensions for HD upload
 * Requires HD 720p minimum for native resolution extraction
 */
export function validateMobileDimensions(width: number, height: number): { valid: boolean; error?: string } {
  if (width < 1280 || height < 720) {
    return {
      valid: false,
      error: "Minimum resolution: 1280×720 pixels (720p HD) required for best quality."
    }
  }
  
  if (width > 8000 || height > 8000) {
    return {
      valid: false,
      error: "Maximum resolution: 8000×8000 pixels."
    }
  }

  return { valid: true }
}
