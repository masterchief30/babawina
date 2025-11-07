export default function WinnersLoading() {
  return (
    <div className="p-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        {/* Spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-emerald-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
        </div>
        
        {/* Text */}
        <p className="mt-6 text-lg font-medium text-gray-700 animate-pulse">
          Loading winners...
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Fetching competition results
        </p>
      </div>
    </div>
  )
}

