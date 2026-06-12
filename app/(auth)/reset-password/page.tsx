'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const inputClass =
  'w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-[#37003c] placeholder-gray-400 focus:outline-none focus:border-[#37003c] focus:ring-2 focus:ring-[#37003c]/10'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords don’t match.'); return }
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(
        /session/i.test(error.message)
          ? 'This reset link has expired — request a new one.'
          : error.message
      )
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    router.push('/login?reset=1')
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
      <div className="fpl-gradient h-1" />
      <div className="p-7">
        <h1 className="font-barlow font-bold text-2xl text-[#37003c]">New Password</h1>
        <p className="text-gray-400 text-sm mt-0.5 mb-5">Choose a new password for your account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">New password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className={`${inputClass} pr-16`}
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-[#37003c]"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Confirm new password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className={inputClass}
              placeholder="Repeat your password"
            />
          </div>

          {error && (
            <div className="border border-[#e90052]/40 bg-[#e90052]/10 rounded-md px-3 py-2.5 text-[#e90052] text-sm">
              {error}{' '}
              {/expired/.test(error) && (
                <Link href="/forgot-password" className="font-semibold underline">Request link</Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00ff87] text-[#37003c] text-sm font-bold rounded-md py-3 hover:bg-[#00e57a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
