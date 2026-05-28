'use client'

import { useEffect, useState } from 'react'
import { getTimeUntilDeadline } from '@/lib/utils/format'

export default function DeadlineCountdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilDeadline(deadline))

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeUntilDeadline(deadline)), 60000)
    return () => clearInterval(interval)
  }, [deadline])

  const isPast = new Date(deadline) <= new Date()

  return (
    <div className={`font-barlow font-bold text-sm uppercase px-3 py-1.5 rounded-lg ${
      isPast ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
    }`}>
      {isPast ? 'Deadline Passed' : `⏱ ${timeLeft}`}
    </div>
  )
}
