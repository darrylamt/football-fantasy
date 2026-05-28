'use client'

import type { Formation } from '@/types'

const formations: Formation[] = ['3-4-3', '3-5-2', '4-3-3', '4-4-2', '4-5-1', '5-3-2', '5-4-1']

interface FormationSelectorProps {
  value: Formation
  onChange: (f: Formation) => void
}

export default function FormationSelector({ value, onChange }: FormationSelectorProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      <span className="text-xs font-barlow uppercase text-gray-400">Formation:</span>
      <div className="flex gap-1 flex-wrap justify-center">
        {formations.map(f => (
          <button
            key={f}
            onClick={() => onChange(f)}
            className={`font-barlow font-bold text-sm px-3 py-1 rounded transition-colors ${
              value === f
                ? 'bg-[#4ade80] text-[#0a1400]'
                : 'bg-[#1f3d1f] text-gray-300 hover:bg-[#2d5a2d]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  )
}
