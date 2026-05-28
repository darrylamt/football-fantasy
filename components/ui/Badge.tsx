interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'yellow' | 'red' | 'gray' | 'blue'
  className?: string
}

const variants = {
  green: 'bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/30',
  yellow: 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30',
  red: 'bg-red-500/20 text-red-400 border border-red-500/30',
  gray: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
}

export default function Badge({ children, variant = 'green', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-barlow font-bold uppercase ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
