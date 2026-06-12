'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const inputClass =
  'w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-[#37003c] placeholder-gray-400 focus:outline-none focus:border-[#37003c] focus:ring-2 focus:ring-[#37003c]/10'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true); setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
      <div className="fpl-gradient h-1" />
      <div className="p-7">
        {sent ? (
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full fpl-gradient flex items-center justify-center text-[#37003c]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="font-barlow font-bold text-2xl text-[#37003c] mt-4">Check your inbox</h1>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              If an account exists for <span className="font-semibold text-[#37003c]">{email}</span>,
              you’ll receive a link to reset your password.
            </p>
            <Link
              href="/login"
              className="mt-5 block w-full bg-[#00ff87] text-[#37003c] text-sm font-bold rounded-md py-3 hover:bg-[#00e57a] transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-barlow font-bold text-2xl text-[#37003c]">Reset Password</h1>
            <p className="text-gray-400 text-sm mt-0.5 mb-5">We’ll email you a link to set a new one.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>

              {error && (
                <div className="border border-[#e90052]/40 bg-[#e90052]/10 rounded-md px-3 py-2.5 text-[#e90052] text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00ff87] text-[#37003c] text-sm font-bold rounded-md py-3 hover:bg-[#00e57a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <p className="text-gray-400 text-sm mt-5">
              Remembered it?{' '}
              <Link href="/login" className="text-[#37003c] font-semibold hover:underline">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
