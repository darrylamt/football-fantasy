'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/squad', label: 'My Squad' },
  { href: '/transfers', label: 'Transfers' },
  { href: '/points', label: 'Points' },
  { href: '/players', label: 'Players' },
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/leagues', label: 'Leagues' },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-[#0d1f0d] border-b border-[#1f3d1f] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-barlow font-black text-2xl text-[#4ade80] uppercase tracking-widest">
          GFF
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => {
            const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-barlow font-bold uppercase text-sm px-3 py-2 rounded transition-colors ${
                  active
                    ? 'text-[#4ade80] bg-[#1f3d1f]'
                    : 'text-gray-400 hover:text-[#4ade80] hover:bg-[#1f3d1f]/50'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <button
          onClick={handleSignOut}
          className="font-barlow font-bold uppercase text-sm text-gray-400 hover:text-red-400 transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden overflow-x-auto flex items-center gap-1 px-4 pb-2">
        {navLinks.map(link => {
          const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`font-barlow font-bold uppercase text-xs px-3 py-1.5 rounded whitespace-nowrap transition-colors ${
                active
                  ? 'text-[#4ade80] bg-[#1f3d1f]'
                  : 'text-gray-400 hover:text-[#4ade80]'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
