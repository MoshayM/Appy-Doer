import Link from 'next/link'
import AppyDoerLogo from '@/components/AppyDoerLogo'
import PWAInstallButton from '@/components/PWAInstallButton'

export default function LandingPage() {
  const features = [
    { icon: '🤖', title: '11 AI Agents', desc: 'From skill discovery to Gmail-powered outreach — 11 specialized agents working as your AI income team.', accent: 'cyan' },
    { icon: '🎯', title: 'Client Intelligence', desc: 'Know your client before the first meeting — style, budget, and fit score.', accent: 'amber' },
    { icon: '⚡', title: 'Work Support Center', desc: 'Your AI co-worker for delivery — plan, execute, and ship faster.', accent: 'cyan' },
    { icon: '🌐', title: 'Profile Builder', desc: 'Auto-generate resume and public profile site from your skill map.', accent: 'amber' },
    { icon: '🤝', title: 'Relationship Engine', desc: 'Never let a client go cold — automated follow-ups and renewal triggers.', accent: 'cyan' },
    { icon: '💡', title: 'Smart Upgrade Engine', desc: 'Personalized upgrade offers by AI based on your engagement data.', accent: 'amber' },
    { icon: '📧', title: 'Gmail Outreach', desc: 'Connect Gmail and send, track, and reply to client emails with AI-suggested responses.', accent: 'cyan' },
  ]

  const stats = [
    { number: '11', label: 'AI Agents' },
    { number: 'INR', label: 'India-First Pricing' },
    { number: '7-Day', label: 'Free Trial' },
    { number: '100%', label: 'AI-Powered' },
  ]

  const incomeSteps = ['Skills', 'Opportunities', 'Offers', 'Profile', 'Clients', 'Work', 'Relationships', 'Revenue', 'Growth']

  const floatingCards = [
    { icon: '🤖', label: '11 AI Agents', pos: 'top-0 left-4' },
    { icon: '🧠', label: 'Skill Map', pos: 'top-0 left-1/2 -translate-x-1/2' },
    { icon: '🎯', label: 'Lead Gen', pos: 'top-0 right-4' },
    { icon: '⚡', label: 'Work AI', pos: 'top-1/2 left-0 -translate-y-1/2' },
    { icon: '📦', label: 'Offer Builder', pos: 'top-1/2 right-0 -translate-y-1/2' },
    { icon: '🤝', label: 'Clients', pos: 'bottom-0 left-4' },
    { icon: '📋', label: 'CRM', pos: 'bottom-0 left-1/2 -translate-x-1/2' },
    { icon: '💰', label: 'Revenue', pos: 'bottom-0 right-4' },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          {/* Mobile: icon only — saves ~80px */}
          <span className="sm:hidden"><AppyDoerLogo size={32} variant="icon" /></span>
          <span className="hidden sm:block"><AppyDoerLogo size={36} /></span>

          <div className="flex items-center gap-2 sm:gap-5">
            <Link
              href="/login"
              className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors whitespace-nowrap"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="bg-cyan-500 hover:bg-cyan-600 active:scale-95 text-white px-4 py-2 sm:px-5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shadow-sm shadow-cyan-200"
            >
              <span className="sm:hidden">Free Trial</span>
              <span className="hidden sm:inline">Start Free Trial</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-white pt-20 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-semibold px-4 py-2 rounded-full mb-8 tracking-wide uppercase">
            AI-Powered · 7-Day Free Trial · No Card
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6">
            Your{' '}
            <span className="text-cyan-500">AI Workforce</span>
            <br />
            Operating System
          </h1>
          <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Discover opportunities, acquire clients, deliver work, and build recurring income — with an AI-powered virtual team.
          </p>
          <div className="flex gap-4 justify-center flex-wrap mb-6">
            <Link href="/register" className="bg-cyan-500 hover:bg-cyan-600 text-white px-9 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-cyan-100">
              Start Free Trial
            </Link>
            <Link href="/plans" className="border border-cyan-300 text-cyan-600 hover:bg-cyan-50 px-9 py-4 rounded-xl font-semibold text-lg transition-colors">
              View Plans
            </Link>
          </div>
          <p className="text-sm text-slate-400 font-medium">
            Built for India-first professionals — no card, no commitment, start in minutes.
          </p>
        </div>
      </section>

      {/* Floating icon illustration */}
      <section className="bg-white pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="relative h-72 sm:h-80">
            {/* Connecting lines SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <line x1="50%" y1="50%" x2="12%" y2="12%" stroke="#e0f2fe" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="50%" y2="8%" stroke="#e0f2fe" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="88%" y2="12%" stroke="#e0f2fe" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="6%" y2="50%" stroke="#e0f2fe" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="94%" y2="50%" stroke="#e0f2fe" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="12%" y2="88%" stroke="#e0f2fe" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="50%" y2="95%" stroke="#e0f2fe" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="88%" y2="88%" stroke="#e0f2fe" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>

            {/* Outer icon cards */}
            {floatingCards.map((card) => (
              <div
                key={card.label}
                className={`absolute ${card.pos} bg-white border border-slate-200 shadow-md rounded-xl px-3 py-2 flex flex-col items-center gap-1 w-24`}
              >
                <span className="text-xl">{card.icon}</span>
                <span className="text-xs font-semibold text-slate-700 text-center leading-tight">{card.label}</span>
              </div>
            ))}

            {/* Center "AppyDoer" card */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-cyan-500 rounded-2xl px-6 py-4 flex flex-col items-center gap-1 shadow-xl shadow-cyan-200 z-10">
              <span className="text-4xl font-black text-white tracking-tighter">AI</span>
              <span className="text-xs font-semibold text-cyan-100 tracking-wide">AppyDoer</span>
            </div>
          </div>
        </div>
      </section>

      {/* Income Chain */}
      <section className="bg-slate-50 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-10">The AI Income Chain</h2>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {incomeSteps.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="border border-cyan-400 text-cyan-700 bg-white px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap">
                  {step}
                </span>
                {i < incomeSteps.length - 1 && (
                  <span className="text-cyan-400 font-bold text-lg">→</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Everything you need to earn with AI</h2>
          <p className="text-center text-slate-500 mb-12 max-w-xl mx-auto">
            Nine specialized AI agents working together as your virtual income team.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className={`bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-shadow border-l-4 ${f.accent === 'cyan' ? 'border-l-cyan-500' : 'border-l-amber-400'}`}
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2 text-lg">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="bg-cyan-500 py-14 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center text-white">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-black mb-1">{s.number}</div>
              <div className="text-cyan-100 text-sm font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA section */}
      <section className="bg-white py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Start growing your income today</h2>
          <p className="text-slate-500 mb-10">
            7-day free trial, no credit card required. Full access to all 11 AI agents. INR pricing, no hidden charges.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register" className="bg-cyan-500 hover:bg-cyan-600 text-white px-9 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg shadow-cyan-100">
              Start Free Trial
            </Link>
            <Link href="/plans" className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-9 py-4 rounded-xl font-semibold text-lg transition-colors">
              View Plans →
            </Link>
          </div>
        </div>
      </section>

      {/* Install / Download section */}
      <section className="bg-slate-50 py-20 px-6" id="install">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-4 py-2 rounded-full mb-6 tracking-wide uppercase">
            Available on every device
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Download &amp; Install AppyDoer</h2>
          <p className="text-slate-500 mb-12 max-w-xl mx-auto">
            Install AppyDoer as a native app on your phone, tablet, or desktop. Works offline, loads instantly, no App Store required.
          </p>

          {/* Platform cards */}
          <div className="grid sm:grid-cols-3 gap-6 mb-12">

            {/* iOS */}
            <div className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col items-center gap-4 shadow-sm">
              <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-3xl">
                🍎
              </div>
              <div>
                <div className="font-bold text-slate-900 mb-1">iPhone &amp; iPad</div>
                <div className="text-sm text-slate-500">iOS Safari · iPadOS</div>
              </div>
              <ol className="text-xs text-slate-600 text-left space-y-1.5 w-full">
                <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold mt-0.5">1.</span> Open in <strong>Safari</strong></li>
                <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold mt-0.5">2.</span> Tap the <strong>Share</strong> icon at the bottom</li>
                <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold mt-0.5">3.</span> Tap <strong>&ldquo;Add to Home Screen&rdquo;</strong></li>
              </ol>
              <PWAInstallButton className="w-full justify-center" />
            </div>

            {/* Android */}
            <div className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col items-center gap-4 shadow-sm">
              <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center text-white text-3xl">
                📱
              </div>
              <div>
                <div className="font-bold text-slate-900 mb-1">Android</div>
                <div className="text-sm text-slate-500">Chrome · Samsung Internet · Brave</div>
              </div>
              <ol className="text-xs text-slate-600 text-left space-y-1.5 w-full">
                <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold mt-0.5">1.</span> Open in <strong>Chrome or Brave</strong></li>
                <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold mt-0.5">2.</span> Tap the <strong>Install</strong> prompt below</li>
                <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold mt-0.5">3.</span> Tap <strong>Install</strong> — done!</li>
              </ol>
              <PWAInstallButton className="w-full justify-center" />
            </div>

            {/* Desktop */}
            <div className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col items-center gap-4 shadow-sm">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl">
                💻
              </div>
              <div>
                <div className="font-bold text-slate-900 mb-1">Mac, Windows &amp; Linux</div>
                <div className="text-sm text-slate-500">Chrome · Edge · Brave · Opera</div>
              </div>
              <ol className="text-xs text-slate-600 text-left space-y-1.5 w-full">
                <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold mt-0.5">1.</span> Open in <strong>Chrome or Edge</strong></li>
                <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold mt-0.5">2.</span> Click <strong>Install App</strong> below</li>
                <li className="flex items-start gap-2"><span className="text-indigo-500 font-bold mt-0.5">3.</span> Launches like a native app!</li>
              </ol>
              <PWAInstallButton className="w-full justify-center" />
            </div>
          </div>

          {/* Benefits strip */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
            {['Works offline', 'No App Store', 'Free forever', 'Auto-updates', 'Secure (HTTPS)'].map((b) => (
              <span key={b} className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">✓</span>
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <AppyDoerLogo size={28} surface="dark" />
            <p className="text-slate-500 text-xs">Your AI-Powered Workforce Operating System</p>
          </div>
          <div className="flex items-center gap-6 text-sm flex-wrap justify-center">
            <Link href="/plans" className="text-slate-400 hover:text-white transition-colors">Plans</Link>
            <Link href="/login" className="text-slate-400 hover:text-white transition-colors">Sign In</Link>
            <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms</Link>
          </div>
          <p className="text-slate-600 text-xs">© 2026 AppyDoer. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
