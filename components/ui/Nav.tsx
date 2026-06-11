'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/',          label: 'Status' },
  { href: '/squad',     label: 'Pick Team' },
  { href: '/transfers', label: 'Transfers' },
  { href: '/points',    label: 'Points' },
  { href: '/results',   label: 'Results' },
  { href: '/fixtures',  label: 'Fixtures' },
  { href: '/players',   label: 'Players' },
  { href: '/leagues',   label: 'Leagues' },
]

const mobileLinks = [
  { href: '/',          label: 'Status' },
  { href: '/squad',     label: 'Team' },
  { href: '/transfers', label: 'Transfers' },
  { href: '/points',    label: 'Points' },
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
    <>
      <nav className="bg-[#37003c] sticky top-0 z-40">
        {/* Gradient top strip */}
        <div className="fpl-gradient h-1" />

        <div className="max-w-5xl mx-auto px-4">
          {/* Brand row */}
          <div className="flex items-center h-14 gap-4">
            <Link href="/" className="flex items-baseline gap-2 flex-shrink-0">
              <span className="font-barlow font-black text-2xl text-white tracking-tight leading-none">GFF</span>
              <span className="hidden sm:block text-[10px] uppercase tracking-widest text-[#00ff87] font-semibold">
                Ghana Fantasy Football
              </span>
            </Link>

            <div className="flex items-center gap-4 ml-auto flex-shrink-0">
              <Link href="/admin" className="text-xs text-white/50 hover:text-[#00ff87] transition-colors">
                Admin
              </Link>
              <button onClick={signOut} className="text-xs text-white/50 hover:text-[#00ff87] transition-colors">
                Sign out
              </button>
            </div>
          </div>

          {/* Desktop tab row */}
          <div className="hidden md:flex items-stretch gap-1 -mb-px">
            {links.map(l => {
              const active = isActive(l.href)
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center px-3 h-10 text-sm whitespace-nowrap border-b-[3px] transition-colors ${
                    active
                      ? 'text-[#00ff87] border-[#00ff87] font-semibold'
                      : 'text-white/70 border-transparent hover:text-white'
                  }`}
                >
                  {l.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#37003c] border-t border-white/10">
        <div className="flex items-stretch">
          {mobileLinks.map(l => {
            const active = isActive(l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative flex-1 flex flex-col items-center justify-center py-3 text-xs transition-colors ${
                  active ? 'text-[#00ff87] font-semibold' : 'text-white/60'
                }`}
              >
                {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 fpl-gradient rounded-full" />}
                {l.label}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
