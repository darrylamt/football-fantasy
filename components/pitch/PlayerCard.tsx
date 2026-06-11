'use client'

import type { FantasyPick, Player } from '@/types'

interface PlayerCardProps {
  pick: FantasyPick & { players: Player }
  onClick?: () => void
  /** Text shown in the bottom plate (price or points) */
  value: string
  /** Highlighted as an eligible substitution target */
  highlight?: boolean
  /** Dimmed while another substitution is in progress */
  dimmed?: boolean
}

function ShirtSVG({ color }: { color: string }) {
  // Simple FPL-style jersey: body + sleeves
  return (
    <svg viewBox="0 0 44 44" width="44" height="44" fill="none">
      {/* Sleeves */}
      <path d="M10 8 L2 13 L6 22 L12 19 Z" fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
      <path d="M34 8 L42 13 L38 22 L32 19 Z" fill={color} stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
      {/* Body */}
      <path
        d="M10 8 L17 5 C18 9 26 9 27 5 L34 8 L32 19 L32 40 L12 40 L12 19 Z"
        fill={color}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="1"
      />
      {/* Collar */}
      <path d="M17 5 C18 9 26 9 27 5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" />
    </svg>
  )
}

export default function PlayerCard({ pick, onClick, value, highlight = false, dimmed = false }: PlayerCardProps) {
  const player = pick.players
  const shirtColor = player.real_teams?.primary_color ?? '#37003c'
  const flagged = player.status !== 'available'

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`flex flex-col items-center group w-[72px] transition-all ${
        dimmed ? 'opacity-30' : ''
      } ${highlight ? 'scale-105' : ''} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className={`relative rounded-md p-0.5 ${highlight ? 'ring-2 ring-[#04f5ff] bg-[#04f5ff]/20' : ''}`}>
        <ShirtSVG color={shirtColor} />
        {flagged && (
          <span
            className="absolute -top-1 -left-1 w-4 h-4 bg-[#ffe65b] rounded-full text-[#37003c] text-[10px] font-black flex items-center justify-center leading-none border border-[#37003c]/20"
            title={player.status}
          >!</span>
        )}
        {pick.is_captain && (
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-[#37003c] rounded-full text-white text-[10px] font-black flex items-center justify-center leading-none">C</span>
        )}
        {pick.is_vice_captain && (
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] bg-white border border-[#37003c] rounded-full text-[#37003c] text-[10px] font-black flex items-center justify-center leading-none">V</span>
        )}
      </div>

      {/* Name plate */}
      <div className={`w-full bg-white rounded-t-sm px-1 py-0.5 text-center shadow-sm ${highlight ? 'bg-[#04f5ff]/30' : ''}`}>
        <div className="text-[11px] font-semibold text-[#37003c] truncate leading-tight">
          {player.display_name ?? player.name.split(' ').pop()}
        </div>
      </div>

      {/* Value plate */}
      <div className="w-full bg-[#37003c] rounded-b-sm px-1 py-0.5 text-center">
        <div className="text-[11px] font-bold text-white leading-tight">{value}</div>
      </div>
    </button>
  )
}
