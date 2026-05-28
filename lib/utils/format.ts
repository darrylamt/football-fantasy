export function formatPrice(price: number): string {
  return `₵${price.toFixed(1)}m`
}

export function formatPoints(points: number): string {
  return `${points} pts`
}

export function formatDeadline(deadline: string): string {
  return new Date(deadline).toLocaleString('en-GB', {
    timeZone: 'Africa/Accra',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getTimeUntilDeadline(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Deadline passed'
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function generateLeagueCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
