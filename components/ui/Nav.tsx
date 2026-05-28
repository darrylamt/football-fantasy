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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-barlow font-black text-2xl text-green-600 uppercase tracking-widest flex-shrink-0">
          GFF
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-0.5 flex-1 mx-4">
          {navLinks.map(link => {
            const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-barlow font-bold uppercase text-sm px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  active
                    ? 'text-green-700 bg-green-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>

        <button
          onClick={handleSignOut}
          className="font-barlow font-bold uppercase text-sm text-gray-500 hover:text-red-500 transition-colors flex-shrink-0"
        >
          Sign Out
        </button>
      </div>

      {/* Mobile scrollable links */}
      <div className="md:hidden overflow-x-auto flex items-center gap-0.5 px-3 pb-2 scrollbar-none">
        {navLinks.map(link => {
          const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`font-barlow font-bold uppercase text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                active
                  ? 'text-green-700 bg-green-50'
                  : 'text-gray-600 hover:bg-gray-100'
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
