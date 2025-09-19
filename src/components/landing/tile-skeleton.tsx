interface TileSkeletonProps {
  featured?: boolean
}

export function TileSkeleton({ featured = false }: TileSkeletonProps) {
  return (
    <div className={`
      bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse
      ${featured ? 'md:col-span-2 md:row-span-1' : ''}
    `}>
      {/* Image Skeleton */}
      <div className={`bg-gray-200 ${featured ? 'h-64' : 'h-48'}`} />
      
      {/* Content Skeleton */}
      <div className="p-6">
        {/* Title */}
        <div className="h-6 bg-gray-200 rounded mb-2" />
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
        
        {/* Prize Description */}
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
        
        {/* Stats Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-4">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-12" />
          </div>
          <div className="text-right">
            <div className="h-3 bg-gray-200 rounded w-8 mb-1" />
            <div className="h-5 bg-gray-200 rounded w-12" />
          </div>
        </div>
        
        {/* Button */}
        <div className="h-12 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )
}
