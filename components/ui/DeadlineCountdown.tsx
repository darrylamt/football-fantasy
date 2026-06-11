'use client'

import { useEffect, useState } from 'react'
import { getTimeUntilDeadline } from '@/lib/utils/format'

export default function DeadlineCountdown({ deadline, light = false }: { deadline: string; light?: boolean }) {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilDeadline(deadline))
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(getTimeUntilDeadline(deadline)), 60000)
    return () => clearInterval(t)
  }, [deadline])

  const isPast = new Date(deadline) <= new Date()
  if (light) {
    return (
      <span className={`text-xs font-semibold ${isPast ? 'text-[#e90052]' : 'text-[#00ff87]'}`}>
        {isPast ? 'Deadline passed' : `Deadline: ${timeLeft}`}
      </span>
    )
  }
  return (
    <span className={`text-xs ${isPast ? 'text-[#e90052]' : 'text-gray-400'}`}>
      {isPast ? 'Deadline passed' : `Deadline in ${timeLeft}`}
    </span>
  )
}
