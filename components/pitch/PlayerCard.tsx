'use client'

import type { FantasyPick, Player } from '@/types'

interface PlayerCardProps {
  pick: FantasyPick & { players: Player }
  onClick?: () => void
  compact?: boolean
}

function ShirtSVG({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 40" width="36" height="36" fill="none">
      <path
        d="M5 10 L12 6 L16 10 C17 14 23 14 24 10 L28 6 L35 10 L32 18 L27 16 L27 34 L13 34 L13 16 L8 18 Z"
        fill={color}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
      />
    </svg>
  )
}

export default function PlayerCard({ pick, onClick, compact = false }: PlayerCardProps) {
  const player = pick.players
  const shirtColor = player.real_teams?.primary_color ?? '#4ade80'
  const isInjured = player.status !== 'available'

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 group cursor-pointer"
    >
      <div className="relative">
        <ShirtSVG color={shirtColor} />
        {isInjured && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-[#0a1400]" />
        )}
        {pick.is_captain && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-yellow-400 rounded-full text-black text-xs font-black flex items-center justify-center leading-none">C</span>
        )}
        {pick.is_vice_captain && (
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-300 rounded-full text-black text-xs font-black flex items-center justify-center leading-none">V</span>
        )}
      </div>

      <div className="bg-[#0a1400]/90 border border-[#1f3d1f] rounded px-2 py-0.5 text-center min-w-[60px] group-hover:border-[#4ade80]/50 transition-colors">
        <div className="font-barlow font-bold text-xs text-white uppercase truncate max-w-[72px]">
          {player.display_name ?? player.name.split(' ').pop()}
        </div>
        {!compact && (
          <div className="font-barlow text-xs text-[#4ade80]">
            {pick.points_scored ?? 0}
          </div>
        )}
      </div>
    </button>
  )
}
