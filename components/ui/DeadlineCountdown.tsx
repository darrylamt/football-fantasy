'use client'

import { useEffect, useState } from 'react'
import { getTimeUntilDeadline } from '@/lib/utils/format'

export default function DeadlineCountdown({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilDeadline(deadline))
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(getTimeUntilDeadline(deadline)), 60000)
    return () => clearInterval(t)
  }, [deadline])

  const isPast = new Date(deadline) <= new Date()
  return (
    <span className={`text-xs ${isPast ? 'text-red-500' : 'text-gray-400'}`}>
      {isPast ? 'Deadline passed' : `Deadline in ${timeLeft}`}
    </span>
  )
}
