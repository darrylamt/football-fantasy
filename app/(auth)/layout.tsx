const features = [
  {
    title: 'Pick your squad',
    desc: 'Build a 15-player squad from the Ghana Premier League with a 100.0m budget.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M16 3l5 3-2 5-2-1v11H7V10l-2 1-2-5 5-3a4 4 0 0 0 8 0z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Score points every gameweek',
    desc: 'Goals, assists, clean sheets and bonus points — captain doubles up.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Compete with friends',
    desc: 'Climb the overall rankings and battle it out in private leagues.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4zM7 6H4a3 3 0 0 0 3 5M17 6h3a3 3 0 0 1-3 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen fpl-hero flex">
      {/* Brand panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] max-w-xl px-12 py-12">
        <div>
          <div className="font-barlow font-black text-4xl text-white tracking-tight leading-none">GFF</div>
          <div className="text-[#00ff87] text-[11px] uppercase tracking-widest font-semibold mt-1">Ghana Fantasy Football</div>
        </div>

        <div className="space-y-7">
          <h2 className="font-barlow font-black text-5xl text-white leading-[0.95]">
            The official fantasy game of the{' '}
            <span className="text-transparent bg-clip-text fpl-gradient">Ghana Premier League</span>
          </h2>
          <div className="space-y-5">
            {features.map(f => (
              <div key={f.title} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-md fpl-gradient text-[#37003c] flex items-center justify-center">
                  {f.icon}
                </div>
                <div>
                  <div className="text-white font-bold text-sm">{f.title}</div>
                  <div className="text-white/50 text-sm mt-0.5 leading-snug">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-white/30 text-xs">Free to play · One team per manager</div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Compact logo — mobile only */}
          <div className="lg:hidden mb-8 text-center">
            <div className="font-barlow font-black text-5xl text-white tracking-tight">GFF</div>
            <div className="text-[#00ff87] text-xs uppercase tracking-widest font-semibold mt-1">Ghana Fantasy Football</div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
