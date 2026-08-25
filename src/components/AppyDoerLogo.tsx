'use client'

/**
 * AppyDoer logo — "AI-powered professional in motion"
 *
 * Symbol: A human figure with a neural/circuit head, body forming an upward
 * momentum shape, surrounded by 3 staggered AI-signal arcs.
 *   • Person + upward arrow  → AppyDoer (gets things done, grows)
 *   • Circuit head + arcs    → AI-powered intelligence
 *
 * Animation: arcs pulse outward in sequence (staggered) — subtle, premium.
 * CSS is scoped inside the SVG so it never bleeds into the page stylesheet.
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
          @keyframes ad-arc1{0%,100%{opacity:.15}33%{opacity:.85}}
          @keyframes ad-arc2{0%,100%{opacity:.10}55%{opacity:.65}}
          @keyframes ad-arc3{0%,100%{opacity:.05}77%{opacity:.45}}
          @keyframes ad-spark{0%,100%{r:2px;opacity:.7}50%{r:3.2px;opacity:1}}
          @keyframes ad-glow{0%,100%{opacity:.12}50%{opacity:.26}}
        `}</style>
      )}

      <defs>
        <linearGradient id="ad-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <radialGradient id="ad-halo" cx="50%" cy="30%" r="60%">
          <stop offset="0%"   stopColor="white" stopOpacity=".18" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <clipPath id="ad-clip">
          <rect width="40" height="40" rx="10" />
        </clipPath>
      </defs>

      {/* Background */}
      <rect width="40" height="40" rx="10" fill="url(#ad-bg)" />
      {/* Subtle inner-glow halo */}
      <rect
        width="40" height="40" rx="10"
        fill="url(#ad-halo)"
        style={isStatic ? undefined : { animation: 'ad-glow 3s ease-in-out infinite' }}
      />

      {/* ── AI signal arcs — staggered pulse, clipped to icon boundary ── */}
      <g clipPath="url(#ad-clip)">
        <path d="M12 27 Q20 17 28 27" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"
          style={isStatic ? { opacity: .55 } : { animation: 'ad-arc1 2.6s ease-in-out infinite' }} />
        <path d="M8 31  Q20 13 32 31"  stroke="white" strokeWidth="1.3" strokeLinecap="round" fill="none"
          style={isStatic ? { opacity: .35 } : { animation: 'ad-arc2 2.6s ease-in-out infinite .65s' }} />
        <path d="M4 35  Q20 9  36 35"  stroke="white" strokeWidth="0.9" strokeLinecap="round" fill="none"
          style={isStatic ? { opacity: .2 }  : { animation: 'ad-arc3 2.6s ease-in-out infinite 1.3s' }} />
      </g>

      {/* ── Person figure ── */}

      {/* Head: filled circle */}
      <circle cx="20" cy="12" r="4" fill="white" />

      {/* Circuit nodes radiating from head — left, top, right */}
      <line x1="16.5" y1="10" x2="14.5" y2="8.2" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity=".6" />
      <line x1="20"   y1="8"  x2="20"   y2="6"   stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity=".6" />
      <line x1="23.5" y1="10" x2="25.5" y2="8.2" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity=".6" />

      {/* Terminal dots at wire ends */}
      <circle cx="14"   cy="7.8" r=".9" fill="white" opacity=".65" />
      <circle cx="20"   cy="5.5" r=".9" fill="white" opacity=".65"
        style={isStatic ? undefined : { animation: 'ad-spark 2.2s ease-in-out infinite' }} />
      <circle cx="26"   cy="7.8" r=".9" fill="white" opacity=".65" />

      {/* Torso: converging lines forming upward-pointing chevron/arrow */}
      <path d="M17 16 L20 22 L23 16"
        stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Legs: stride apart — suggests forward motion */}
      <path d="M18.5 21 L16 30" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M21.5 21 L24 30" stroke="white" strokeWidth="2.2" strokeLinecap="round" />

      {/* ── Spark pulse at top circuit node ── */}
      <circle
        cx="20" cy="5.5" r="2"
        fill="#c4b5fd"
        style={isStatic ? { opacity: .8 } : { animation: 'ad-spark 2.2s ease-in-out infinite' }}
      />
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
