'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const inputClass =
  'w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm text-[#37003c] placeholder-gray-400 focus:outline-none focus:border-[#37003c] focus:ring-2 focus:ring-[#37003c]/10'

const TEAM_SUGGESTIONS = ['Accra All Stars', 'Kumasi Kings', 'Tamale Titans', 'Cape Coast Crusaders']

function friendlyError(message: string) {
  if (/already registered/i.test(message)) return 'An account with this email already exists — sign in instead.'
  if (/at least 6/i.test(message)) return 'Password must be at least 6 characters.'
  return message
}

function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (pw.length < 6) return { score: pw.length === 0 ? 0 : 1, label: 'Too short' }
  let score = 1
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++
  return { score: score as 1 | 2 | 3, label: score >= 3 ? 'Strong' : score === 2 ? 'Good' : 'Okay' }
}

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifySent, setVerifySent] = useState(false)
  const [resent, setResent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const strength = passwordStrength(password)

  function handleAccountStep(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords don’t match.'); return }
    setStep(2)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Saved to user metadata so /welcome can recover the club name even
        // if the user confirms their email on another device later.
        data: { team_name: teamName.trim() },
        emailRedirectTo: `${window.location.origin}/login?confirmed=1`,
      },
    })
    if (signUpError) { setError(friendlyError(signUpError.message)); setLoading(false); return }
    if (!data.user) { setError('Registration failed. Please try again.'); setLoading(false); return }

    // Email confirmation enabled → no session yet. The club gets created on
    // first sign-in via /welcome instead.
    if (!data.session) { setVerifySent(true); setLoading(false); return }

    const { data: season } = await supabase.from('seasons').select('id').eq('is_active', true).single()
    if (season) {
      await supabase.from('fantasy_teams').insert({
        user_id: data.user.id,
        season_id: season.id,
        name: teamName.trim(),
        free_transfers: 0,
      })
    }

    router.push('/squad'); router.refresh()
  }

  async function handleResend() {
    await supabase.auth.resend({ type: 'signup', email })
    setResent(true)
  }

  if (verifySent) {
    return (
      <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
        <div className="fpl-gradient h-1" />
        <div className="p-7 text-center">
          <div className="mx-auto w-12 h-12 rounded-full fpl-gradient flex items-center justify-center text-[#37003c]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-barlow font-bold text-2xl text-[#37003c] mt-4">Confirm your email</h1>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">
            We sent a confirmation link to <span className="font-semibold text-[#37003c]">{email}</span>.
            Click it, then sign in — your club <span className="font-semibold text-[#37003c]">{teamName.trim()}</span> will be waiting.
          </p>
          <button
            onClick={handleResend}
            disabled={resent}
            className="mt-5 w-full border border-gray-200 text-[#37003c] text-sm font-bold rounded-md py-2.5 hover:border-[#37003c] transition-colors disabled:opacity-50"
          >
            {resent ? 'Email sent ✓' : 'Resend email'}
          </button>
          <p className="text-gray-400 text-sm mt-4">
            Already confirmed?{' '}
            <Link href="/login" className="text-[#37003c] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-2xl">
      <div className="fpl-gradient h-1" />
      <div className="p-7">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {([
            [1, 'Account'],
            [2, 'Your club'],
          ] as const).map(([n, label]) => (
            <div key={n} className="flex-1">
              <div className={`h-1 rounded-full ${step >= n ? 'fpl-gradient' : 'bg-gray-100'}`} />
              <div className={`text-[11px] font-bold uppercase tracking-wider mt-1.5 ${step >= n ? 'text-[#37003c]' : 'text-gray-300'}`}>
                {n}. {label}
              </div>
            </div>
          ))}
        </div>

        {step === 1 ? (
          <>
            <h1 className="font-barlow font-bold text-2xl text-[#37003c]">Create Account</h1>
            <p className="text-gray-400 text-sm mt-0.5 mb-5">Join the game in under a minute.</p>

            <form onSubmit={handleAccountStep} className="space-y-4">
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
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Password</label>
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
                {password.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            strength.score >= i
                              ? strength.score === 1 ? 'bg-[#e90052]' : strength.score === 2 ? 'bg-amber-400' : 'bg-[#00ff87]'
                              : 'bg-gray-100'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] text-gray-400 w-14 text-right">{strength.label}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Confirm password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={inputClass}
                  placeholder="Repeat your password"
                />
                {confirm.length > 0 && confirm !== password && (
                  <p className="text-[11px] text-[#e90052] mt-1.5">Passwords don’t match yet.</p>
                )}
              </div>

              {error && (
                <div className="border border-[#e90052]/40 bg-[#e90052]/10 rounded-md px-3 py-2.5 text-[#e90052] text-sm">{error}</div>
              )}

              <button
                type="submit"
                className="w-full bg-[#00ff87] text-[#37003c] text-sm font-bold rounded-md py-3 hover:bg-[#00e57a] transition-colors"
              >
                Continue
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="font-barlow font-bold text-2xl text-[#37003c]">Name Your Club</h1>
            <p className="text-gray-400 text-sm mt-0.5 mb-5">This is how you’ll appear in leagues and rankings.</p>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Club name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  required
                  minLength={3}
                  maxLength={30}
                  autoFocus
                  className={inputClass}
                  placeholder="e.g. Accra All Stars"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {TEAM_SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTeamName(s)}
                      className="text-[11px] border border-gray-200 text-gray-500 rounded-full px-2.5 py-1 hover:border-[#37003c] hover:text-[#37003c] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Club name preview */}
              <div className="fpl-hero rounded-md px-4 py-3">
                <div className="text-[10px] uppercase tracking-wider text-white/50">Your club</div>
                <div className="font-barlow font-black text-2xl text-white truncate leading-tight">
                  {teamName.trim() || '—'}
                </div>
                <div className="text-[11px] text-[#00ff87]">{email}</div>
              </div>

              {error && (
                <div className="border border-[#e90052]/40 bg-[#e90052]/10 rounded-md px-3 py-2.5 text-[#e90052] text-sm">{error}</div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError('') }}
                  className="flex-shrink-0 border border-gray-200 text-gray-500 text-sm font-bold rounded-md px-4 py-3 hover:border-[#37003c] hover:text-[#37003c] transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || teamName.trim().length < 3}
                  className="flex-1 bg-[#00ff87] text-[#37003c] text-sm font-bold rounded-md py-3 hover:bg-[#00e57a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating your club…' : 'Create My Club'}
                </button>
              </div>
            </form>
          </>
        )}

        <p className="text-gray-400 text-sm mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-[#37003c] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
