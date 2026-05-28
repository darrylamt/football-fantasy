import Link from 'next/link'

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/teams', label: 'Teams' },
  { href: '/admin/players', label: 'Players' },
  { href: '/admin/gameweeks', label: 'Gameweeks' },
  { href: '/admin/fixtures', label: 'Fixtures' },
  { href: '/admin/stats', label: 'Stats Entry' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#0a1400' }}>
      <nav className="bg-[#0d1f0d] border-b border-[#1f3d1f]">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 h-14 overflow-x-auto">
          <span className="font-barlow font-black text-xl text-[#4ade80] uppercase mr-4 whitespace-nowrap">
            GFF Admin
          </span>
          {adminLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="font-barlow font-bold uppercase text-sm px-3 py-2 rounded text-gray-300 hover:text-[#4ade80] hover:bg-[#1f3d1f] whitespace-nowrap transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-auto">
            <Link href="/" className="font-barlow font-bold uppercase text-xs text-gray-500 hover:text-[#4ade80]">
              ← Public Site
            </Link>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
