'use client'

/**
 * AppyDoer logo — "A" with AI circuit nodes
 *
 * Symbol: Bold geometric "A" letterform (AppyDoer) with 3 circuit nodes
 * on the crossbar that pulse left-to-right (data-flow animation), and a
 * glowing spark at the apex representing AI intelligence.
 *
 *   • "A" letterform       → AppyDoer identity, clear at any size
 *   • Circuit crossbar     → AI-powered, technical, smart
 *   • Data-flow pulse      → Action, momentum, getting things done
 *   • Apex spark           → The "spark" of AI intelligence
 */

import { cn } from '@/lib/utils'

interface Props {
  /** Width/height of the icon square in px */
  size?: number
  className?: string
  /** 'full' = icon + wordmark;  'icon' = icon only */
  variant?: 'full' | 'icon'
  /** Disable animation (print / reduced-motion contexts) */
  static?: boolean
}

export default function AppyDoerLogo({
  size = 36,
  className,
  variant = 'full',
  static: isStatic = false,
}: Props) {
  const Icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AppyDoer"
      role="img"
      className="flex-shrink-0 select-none"
    >
      {/* Scoped CSS — animations never leak outside the SVG */}
      {!isStatic && (
        <style>{`
          @keyframes ad-node{0%,100%{opacity:.2}33%{opacity:1}}
          @keyframes ad-apex{0%,100%{opacity:.55}50%{opacity:1}}
          @keyframes ad-glow{0%,100%{opacity:.08}50%{opacity:.2}}
        `}</style>
      )}

      <defs>
        <linearGradient id="ad-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#4338ca" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <radialGradient id="ad-halo" cx="50%" cy="28%" r="55%">
          <stop offset="0%"   stopColor="white" stopOpacity=".22" />
          <stop offset="100%" stopColor="white" stopOpacity="0"   />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width="40" height="40" rx="10" fill="url(#ad-bg)" />
      <rect
        width="40" height="40" rx="10"
        fill="url(#ad-halo)"
        style={isStatic ? { opacity: .12 } : { animation: 'ad-glow 4s ease-in-out infinite' }}
      />

      {/* ── "A" letterform ── */}
      {/* Two diagonal legs */}
      <path
        d="M8 33 L20 7 L32 33"
        stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      {/* Horizontal crossbar */}
      <line x1="13" y1="23" x2="27" y2="23" stroke="white" strokeWidth="3" strokeLinecap="round" />

      {/* ── Circuit nodes — data-flow pulse: left → center → right ── */}
      <circle cx="13" cy="23" r="2.2" fill="#a5b4fc"
        style={isStatic ? { opacity: .7 } : { animation: 'ad-node 2.4s ease-in-out infinite 0s' }} />
      <circle cx="20" cy="23" r="2.2" fill="#c4b5fd"
        style={isStatic ? { opacity: .75 } : { animation: 'ad-node 2.4s ease-in-out infinite .4s' }} />
      <circle cx="27" cy="23" r="2.2" fill="#a5b4fc"
        style={isStatic ? { opacity: .7 } : { animation: 'ad-node 2.4s ease-in-out infinite .8s' }} />

      {/* ── Apex spark — AI intelligence node ── */}
      {/* Soft glow behind the spark */}
      <circle cx="20" cy="7" r="5" fill="#6d28d9" opacity=".4" />
      {/* Outer ring */}
      <circle cx="20" cy="7" r="3.5" fill="#c4b5fd"
        style={isStatic ? { opacity: .8 } : { animation: 'ad-apex 3s ease-in-out infinite' }} />
      {/* Bright center */}
      <circle cx="20" cy="7" r="1.7" fill="white" opacity=".95" />
    </svg>
  )

  if (variant === 'icon') return Icon

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      {Icon}
      <span className="font-bold tracking-tight text-gray-900" style={{ fontSize: size * 0.47, lineHeight: 1 }}>
        Appy<span className="text-indigo-600">Doer</span>
      </span>
    </div>
  )
}
