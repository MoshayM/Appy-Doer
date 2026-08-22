'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  )
}

export default function SettingsPage() {
  const [current,     setCurrent]     = useState('')
  const [newPw,       setNewPw]       = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [showCur,     setShowCur]     = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [success,     setSuccess]     = useState(false)
  const [error,       setError]       = useState('')
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [userEmail,   setUserEmail]   = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then((d: { hasPassword?: boolean; email?: string } | null) => {
        setHasPassword(d?.hasPassword ?? false)
        setUserEmail(d?.email ?? '')
      })
      .catch(() => setHasPassword(false))
  }, [])

  const mismatch = confirm && confirm !== newPw
  const strength =
    newPw.length === 0       ? null :
    newPw.length < 8         ? 'weak' :
    newPw.length < 12        ? 'fair' :
    newPw.length < 16        ? 'good' : 'strong'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirm) { setError('New passwords do not match'); return }
    if (newPw.length < 8)  { setError('Password must be at least 8 characters'); return }

    setLoading(true); setError(''); setSuccess(false)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: newPw }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error?.message ?? 'Password change failed'); setLoading(false); return }
      setSuccess(true)
      setCurrent(''); setNewPw(''); setConfirm('')
    } catch {
      setError('Network error — please try again')
    }
    setLoading(false)
  }

  const strengthMeta: Record<string, { label: string; bars: number; color: string }> = {
    weak:   { label: 'Too weak',  bars: 1, color: 'bg-red-400'    },
    fair:   { label: 'Fair',      bars: 2, color: 'bg-amber-400'  },
    good:   { label: 'Good',      bars: 3, color: 'bg-blue-500'   },
    strong: { label: 'Strong',    bars: 4, color: 'bg-green-500'  },
  }
  const sm = strength ? strengthMeta[strength] : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your security and account preferences</p>
      </div>

      {/* ── Change Password card ─────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">🔒 Password & Security</h2>
        </div>

        {/* Loading */}
        {hasPassword === null && (
          <div className="p-6 flex items-center gap-2 text-gray-400 text-sm">
            <Spinner/> Checking account type…
          </div>
        )}

        {/* OAuth user — no password */}
        {hasPassword === false && (
          <div className="p-6">
            <div className="flex items-start gap-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="shrink-0 mt-0.5">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Signed in with Google</p>
                <p className="text-sm text-blue-700 mt-0.5">
                  Your account <strong>{userEmail}</strong> uses Google for authentication.
                  Password management is handled by your Google account — there is no separate password to change here.
                </p>
                <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-3 text-xs font-medium text-blue-600 hover:underline">
                  Manage Google account security →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Email/password user — show form */}
        {hasPassword === true && (
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Current password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCur ? 'text' : 'password'}
                required
                placeholder="Your current password"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400"
                value={current}
                onChange={e => { setCurrent(e.target.value); setError(''); setSuccess(false) }}
              />
              <button type="button" onClick={() => setShowCur(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCur ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required minLength={8}
                placeholder="Minimum 8 characters"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400"
                value={newPw}
                onChange={e => { setNewPw(e.target.value); setError(''); setSuccess(false) }}
              />
              <button type="button" onClick={() => setShowNew(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            {sm && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className={`flex-1 h-1.5 rounded-full transition-colors ${
                      n <= sm.bars ? sm.color : 'bg-gray-200'
                    }`}/>
                  ))}
                </div>
                <span className="text-xs text-gray-500">{sm.label}</span>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              required
              placeholder="Repeat new password"
              className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 ${
                mismatch ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(''); setSuccess(false) }}
            />
            {mismatch && <p className="text-xs text-red-500 mt-1">Passwords don't match</p>}
          </div>

          {/* Feedback */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-red-500 shrink-0">⚠</span>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-green-500 shrink-0">✓</span>
              <p className="text-green-700 text-sm font-medium">Password changed successfully.</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !current || !newPw || newPw !== confirm || newPw.length < 8}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? <span className="flex items-center gap-2"><Spinner/> Updating…</span> : 'Update Password'}
          </button>
        </form>
        )}
      </div>

      {/* ── Tips card — only for email/password accounts ─────────── */}
      {hasPassword === true && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">💡 Password tips</h3>
          <ul className="space-y-1 text-xs text-amber-700">
            <li>→ Use at least 12 characters with a mix of letters, numbers, and symbols</li>
            <li>→ Avoid using your name, email, or easily guessable words</li>
            <li>→ Don't reuse passwords from other services</li>
            <li>→ Consider using a password manager (1Password, Bitwarden)</li>
          </ul>
        </div>
      )}
    </div>
  )
}
