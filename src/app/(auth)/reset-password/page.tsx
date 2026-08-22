'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

function ResetForm() {
  const params     = useSearchParams()
  const token      = params.get('token') ?? ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (!token) setError('Missing reset token. Please use the link from your email.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return }

    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error?.message ?? 'Reset failed'); setLoading(false); return }
      setDone(true)
    } catch {
      setError('Network error — please try again')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
      {done ? (
        <div className="text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Password updated!</h1>
          <p className="text-sm text-gray-500 mb-6">Your password has been changed successfully.</p>
          <Link
            href="/login"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors"
          >
            Sign in →
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Set new password</h1>
            <p className="text-gray-500 text-sm mt-1">Choose a strong password of at least 8 characters.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required minLength={8}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 ${
                  confirm && confirm !== password ? 'border-red-300' : 'border-gray-300'
                }`}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
              {confirm && confirm !== password && (
                <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Strength hint */}
            {password && (
              <div className="flex gap-1">
                {[8, 12, 16].map(len => (
                  <div key={len} className={`flex-1 h-1 rounded-full transition-colors ${
                    password.length >= len ? 'bg-indigo-500' : 'bg-gray-200'
                  }`}/>
                ))}
                <span className="text-xs text-gray-400 ml-2">
                  {password.length < 8 ? 'Too short' : password.length < 12 ? 'OK' : password.length < 16 ? 'Good' : 'Strong'}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !token || password !== confirm || password.length < 8}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Updating…
                </span>
              ) : 'Update Password'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">← Back to sign in</Link>
          </p>
        </>
      )}
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">W</div>
          <span className="font-bold text-gray-900 text-lg">AI WorkBuddy</span>
        </div>
        <Suspense fallback={<div className="bg-white rounded-2xl border p-8 text-center text-gray-400">Loading…</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
