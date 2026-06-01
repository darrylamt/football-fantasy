'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/',          label: 'Dashboard' },
  { href: '/squad',     label: 'Squad' },
  { href: '/transfers', label: 'Transfers' },
  { href: '/points',    label: 'Points' },
  { href: '/players',   label: 'Players' },
  { href: '/fixtures',  label: 'Fixtures' },
  { href: '/leagues',   label: 'Leagues' },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href)
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 flex items-center h-12 gap-6">
        <Link href="/" className="font-barlow font-black text-xl text-gray-900 tracking-tight flex-shrink-0">
          GFF
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-5 flex-1">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={`text-sm transition-colors whitespace-nowrap ${
                isActive(l.href) ? 'text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4 ml-auto flex-shrink-0">
          <Link href="/admin" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
            Admin
          </Link>
          <button onClick={signOut} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex items-center gap-4 px-4 pb-2 overflow-x-auto scrollbar-none">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`text-xs whitespace-nowrap transition-colors flex-shrink-0 ${
              isActive(l.href) ? 'text-gray-900 font-medium' : 'text-gray-400'
            }`}
          >
            {l.label}
          </Link>
        ))}
        <Link href="/admin" className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 ml-2">Admin</Link>
      </div>
    </nav>
  )
}
