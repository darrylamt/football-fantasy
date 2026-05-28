'use client'

import { useEffect, useState } from 'react'
import { getTimeUntilDeadline } from '@/lib/utils/format'

export default function DeadlineCountdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilDeadline(deadline))

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeUntilDeadline(deadline))
    }, 60000)
    return () => clearInterval(interval)
  }, [deadline])

  const isPast = new Date(deadline) <= new Date()

  return (
    <div className={`font-barlow font-bold text-sm uppercase ${isPast ? 'text-red-400' : 'text-[#4ade80]'}`}>
      {isPast ? 'Deadline Passed' : `Deadline: ${timeLeft}`}
    </div>
  )
}
