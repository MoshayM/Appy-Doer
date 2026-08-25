'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, Zap, Target, TrendingUp } from 'lucide-react'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function NeuralBackground() {
  return (
    <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full opacity-10" aria-hidden="true">
      <circle cx="80" cy="100" r="5" fill="white" />
      <circle cx="200" cy="60" r="5" fill="white" />
      <circle cx="320" cy="120" r="5" fill="white" />
      <circle cx="60" cy="220" r="5" fill="white" />
      <circle cx="180" cy="200" r="8" fill="white" />
      <circle cx="310" cy="250" r="5" fill="white" />
      <circle cx="100" cy="320" r="5" fill="white" />
      <circle cx="240" cy="340" r="5" fill="white" />
      <circle cx="360" cy="300" r="5" fill="white" />
      <line x1="80" y1="100" x2="200" y2="60" stroke="white" strokeWidth="1" />
      <line x1="200" y1="60" x2="320" y2="120" stroke="white" strokeWidth="1" />
      <line x1="80" y1="100" x2="60" y2="220" stroke="white" strokeWidth="1" />
      <line x1="200" y1="60" x2="180" y2="200" stroke="white" strokeWidth="1" />
      <line x1="320" y1="120" x2="310" y2="250" stroke="white" strokeWidth="1" />
      <line x1="60" y1="220" x2="180" y2="200" stroke="white" strokeWidth="1" />
      <line x1="180" y1="200" x2="310" y2="250" stroke="white" strokeWidth="1" />
      <line x1="60" y1="220" x2="100" y2="320" stroke="white" strokeWidth="1" />
      <line x1="180" y1="200" x2="240" y2="340" stroke="white" strokeWidth="1" />
      <line x1="310" y1="250" x2="360" y2="300" stroke="white" strokeWidth="1" />
      <line x1="100" y1="320" x2="240" y2="340" stroke="white" strokeWidth="1" />
      <line x1="240" y1="340" x2="360" y2="300" stroke="white" strokeWidth="1" />
    </svg>
  )
}

function LeftPanel() {
  const features = [
    { icon: Zap, text: 'AI opportunity discovery' },
    { icon: Target, text: 'Smart client intelligence' },
    { icon: TrendingUp, text: 'Income tracking & growth' },
  ]

  return (
    <div className="hidden lg:flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-900 p-12 text-white">
      <NeuralBackground />

      <div className="relative flex items-center gap-3">
        {/* AppyDoer logo icon */}
        <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <clipPath id="lp-clip"><rect width="40" height="40" rx="10"/></clipPath>
          </defs>
          <rect width="40" height="40" rx="10" fill="rgba(255,255,255,0.18)"/>
          {/* AI arcs */}
          <g clipPath="url(#lp-clip)">
            <path d="M12 27 Q20 17 28 27" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity=".7"/>
            <path d="M8 31 Q20 13 32 31"   stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".45"/>
          </g>
          {/* Head + circuit */}
          <circle cx="20" cy="12" r="4" fill="white"/>
          <line x1="20" y1="8" x2="20" y2="6" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity=".65"/>
          <circle cx="20" cy="5.5" r="1.5" fill="rgba(196,181,253,0.95)"/>
          {/* Body */}
          <path d="M17 16 L20 22 L23 16" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          <path d="M18.5 21 L16 30" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
          <path d="M21.5 21 L24 30" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
        <span className="font-bold text-lg tracking-tight">Appy<span className="text-indigo-300">Doer</span></span>
      </div>

      <div className="relative space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-3 py-1 text-xs font-medium text-indigo-200">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            7-day free trial · No card required
          </div>
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Your AI-powered<br />freelance co-pilot
          </h2>
          <p className="text-indigo-200 text-base leading-relaxed max-w-xs">
            Discover opportunities, build your profile, and grow income — all guided by AI.
          </p>
        </div>

        <div className="space-y-3">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/10">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/40 flex items-center justify-center flex-shrink-0">
                <Icon size={14} />
              </div>
              <span className="text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="flex items-center gap-3 mb-3">
          {['S', 'R', 'A', 'P'].map((initial, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-xs font-bold border-2 border-indigo-900"
              style={{ marginLeft: i > 0 ? '-8px' : 0 }}
            >
              {initial}
            </div>
          ))}
          <span className="text-xs text-indigo-300 ml-1">+1,000 freelancers</span>
        </div>
        <p className="text-xs text-indigo-400">Join freelancers growing their income with AI</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'oauth_failed') {
      setError('Google sign-in failed. Please try again or use email.')
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error?.message ?? 'Sign in failed')
        setLoading(false)
        return
      }
      window.location.href = '/dashboard'
    } catch {
      setError('Network error — please try again')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-[440px_1fr]">
      <LeftPanel />

      <div className="flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-10">
            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <linearGradient id="ml-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4f46e5"/><stop offset="100%" stopColor="#7c3aed"/>
                </linearGradient>
                <clipPath id="ml-clip"><rect width="40" height="40" rx="10"/></clipPath>
              </defs>
              <rect width="40" height="40" rx="10" fill="url(#ml-grad)"/>
              <g clipPath="url(#ml-clip)">
                <path d="M12 27 Q20 17 28 27" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity=".7"/>
                <path d="M8 31 Q20 13 32 31"   stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".45"/>
              </g>
              <circle cx="20" cy="12" r="4" fill="white"/>
              <line x1="20" y1="8" x2="20" y2="6" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity=".6"/>
              <circle cx="20" cy="5.5" r="1.5" fill="#c4b5fd" opacity=".9"/>
              <path d="M17 16 L20 22 L23 16" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M18.5 21 L16 30" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <path d="M21.5 21 L24 30" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            <span className="font-bold text-gray-900">Appy<span className="text-indigo-600">Doer</span></span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to continue to your dashboard</p>
          </div>

          {/* Google OAuth */}
          <a
            href="/api/auth/google"
            className="flex items-center justify-center gap-3 w-full border border-gray-300 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-150 shadow-sm"
          >
            <GoogleIcon />
            Continue with Google
          </a>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-gray-400"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-indigo-600 hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-gray-400"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            No account?{' '}
            <Link href="/register" className="text-indigo-600 font-semibold hover:underline">
              Start free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
