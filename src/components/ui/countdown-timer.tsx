"use client"

import { useState, useEffect } from "react"
import { getTimeRemaining } from "@/lib/utils"

interface CountdownTimerProps {
  endDate: Date
  onComplete?: () => void
}

export function CountdownTimer({ endDate, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(endDate))

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeRemaining(endDate)
      setTimeLeft(remaining)
      
      if (remaining.total <= 0) {
        clearInterval(timer)
        onComplete?.()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endDate, onComplete])

  if (timeLeft.total <= 0) {
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-muted-foreground">
          Competition Ended
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-4 text-center">
      <div className="flex flex-col items-center">
        <div className="text-3xl md:text-4xl font-bold text-primary">
          {timeLeft.days.toString().padStart(2, "0")}
        </div>
        <div className="text-sm text-muted-foreground">Days</div>
      </div>
      <div className="text-2xl text-muted-foreground">:</div>
      <div className="flex flex-col items-center">
        <div className="text-3xl md:text-4xl font-bold text-primary">
          {timeLeft.hours.toString().padStart(2, "0")}
        </div>
        <div className="text-sm text-muted-foreground">Hours</div>
      </div>
      <div className="text-2xl text-muted-foreground">:</div>
      <div className="flex flex-col items-center">
        <div className="text-3xl md:text-4xl font-bold text-primary">
          {timeLeft.minutes.toString().padStart(2, "0")}
        </div>
        <div className="text-sm text-muted-foreground">Minutes</div>
      </div>
      <div className="text-2xl text-muted-foreground">:</div>
      <div className="flex flex-col items-center">
        <div className="text-3xl md:text-4xl font-bold text-primary">
          {timeLeft.seconds.toString().padStart(2, "0")}
        </div>
        <div className="text-sm text-muted-foreground">Seconds</div>
      </div>
    </div>
  )
}
