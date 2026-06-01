'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const platformLinks = [
  { href: '/results',   label: 'Results' },
  { href: '/fixtures',  label: 'Fixtures' },
  { href: '/players',   label: 'Players' },
  { href: '/leagues',   label: 'Leagues' },
]

const fantasyLinks = [
  { href: '/squad',     label: 'Squad' },
  { href: '/transfers', label: 'Transfers' },
  { href: '/points',    label: 'Points' },
]

const mobileLinks = [
  { href: '/',          label: 'Home' },
  { href: '/results',   label: 'Results' },
  { href: '/fixtures',  label: 'Fixtures' },
  { href: '/squad',     label: 'Squad' },
  { href: '/points',    label: 'Points' },
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

  function NavLink({ href, label }: { href: string; label: string }) {
    const active = isActive(href)
    return (
      <Link
        href={href}
        className={`flex items-center text-sm whitespace-nowrap border-b-2 transition-colors h-full ${
          active
            ? 'text-gray-900 font-medium border-gray-900'
            : 'text-gray-400 border-transparent hover:text-gray-700 hover:border-gray-300'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-stretch gap-6">

          <Link href="/" className="flex items-center font-barlow font-black text-xl text-gray-900 tracking-tight flex-shrink-0 mr-2">
            GFF
          </Link>

          {/* Desktop — platform section */}
          <div className="hidden md:flex items-stretch gap-5">
            {platformLinks.map(l => <NavLink key={l.href} href={l.href} label={l.label} />)}
          </div>

          {/* Desktop — section divider */}
          <div className="hidden md:flex items-center">
            <div className="w-px h-4 bg-gray-200" />
          </div>

          {/* Desktop — fantasy section */}
          <div className="hidden md:flex items-stretch gap-5">
            {fantasyLinks.map(l => <NavLink key={l.href} href={l.href} label={l.label} />)}
          </div>

          {/* Desktop — right actions */}
          <div className="hidden md:flex items-center gap-4 ml-auto flex-shrink-0">
            <Link href="/admin" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Admin</Link>
            <button onClick={signOut} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">Sign out</button>
          </div>

          {/* Mobile — right actions */}
          <div className="md:hidden flex items-center gap-3 ml-auto flex-shrink-0">
            <Link href="/admin" className="text-xs text-gray-400">Admin</Link>
            <button onClick={signOut} className="text-xs text-gray-400">Sign out</button>
          </div>

        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100">
        <div className="flex items-stretch">
          {mobileLinks.map(l => {
            const active = isActive(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative flex-1 flex flex-col items-center justify-center py-3 text-xs transition-colors ${
                  active ? 'text-gray-900 font-medium' : 'text-gray-400'
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gray-900 rounded-full" />
                )}
                {l.label}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
