'use client'

/**
 * AppyDoer logo — Puppy mascot
 *
 * Symbol: A friendly cartoon puppy face on an indigo/violet gradient badge.
 *   • Floppy ears  → warmth, approachability, "Appy" (happy)
 *   • Big bright eyes + shine → intelligence, curiosity, AI awareness
 *   • Playful tongue → energy, action, "Doer"
 *
 * Animations (all scoped, never bleed to page):
 *   ad-ear-l / ad-ear-r  — ears sway gently (offset phase)
 *   ad-blink             — eyes blink every ~5 s
 *   ad-tongue            — tongue bobs up/down playfully
 *   ad-glow              — background halo breathes
 */

import { cn } from '@/lib/utils'

interface Props {
  size?: number
  className?: string
  variant?: 'full' | 'icon'
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
      {!isStatic && (
        <style>{`
          @keyframes ad-ear-l  { 0%,100%{transform:rotate(0deg)}   50%{transform:rotate(-11deg)} }
          @keyframes ad-ear-r  { 0%,100%{transform:rotate(0deg)}   50%{transform:rotate(11deg)}  }
          @keyframes ad-blink  { 0%,86%,100%{transform:scaleY(1)}  93%{transform:scaleY(0.07)}   }
          @keyframes ad-tongue { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(2px)} }
          @keyframes ad-glow   { 0%,100%{opacity:.07}              50%{opacity:.2}                }
        `}</style>
      )}

      <defs>
        <linearGradient id="ad-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#4338ca" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <radialGradient id="ad-halo" cx="50%" cy="30%" r="55%">
          <stop offset="0%"   stopColor="white" stopOpacity=".22" />
          <stop offset="100%" stopColor="white" stopOpacity="0"   />
        </radialGradient>
      </defs>

      {/* Background badge */}
      <rect width="40" height="40" rx="10" fill="url(#ad-bg)" />
      <rect
        width="40" height="40" rx="10"
        fill="url(#ad-halo)"
        style={isStatic ? { opacity: .1 } : { animation: 'ad-glow 4s ease-in-out infinite' }}
      />

      {/* ── Left floppy ear — painted before head so it appears behind ── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '13px 12px',
        animation: 'ad-ear-l 2.8s ease-in-out infinite',
      }}>
        <path
          d="M13 11 C6 11, 2 19, 3 26 C4 33, 10 36, 14 32 C17 29, 17 20, 14 14 Z"
          fill="white" opacity=".86"
        />
      </g>

      {/* ── Right floppy ear ── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '27px 12px',
        animation: 'ad-ear-r 2.8s ease-in-out infinite .6s',
      }}>
        <path
          d="M27 11 C34 11, 38 19, 37 26 C36 33, 30 36, 26 32 C23 29, 23 20, 26 14 Z"
          fill="white" opacity=".86"
        />
      </g>

      {/* ── Head ── */}
      <circle cx="20" cy="21" r="12" fill="white" />
      {/* Subtle head shine — gives glossy AI-bot feel */}
      <path
        d="M14 14 Q20 11 26 14"
        stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".3"
      />

      {/* ── Left eye (blinks) ── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '15px 19.5px',
        animation: 'ad-blink 5s ease-in-out infinite 1s',
      }}>
        <circle cx="15"   cy="19.5" r="3"   fill="#312e81" />
        <circle cx="16.3" cy="18"   r="1.1" fill="white" opacity=".9" />
      </g>

      {/* ── Right eye (blinks, slight natural offset) ── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '25px 19.5px',
        animation: 'ad-blink 5s ease-in-out infinite 1.07s',
      }}>
        <circle cx="25"   cy="19.5" r="3"   fill="#312e81" />
        <circle cx="26.3" cy="18"   r="1.1" fill="white" opacity=".9" />
      </g>

      {/* ── Nose ── */}
      <ellipse cx="20" cy="25.5" rx="2.5" ry="1.8" fill="#312e81" />
      {/* Nose highlight */}
      <ellipse cx="18.8" cy="24.8" rx=".9" ry=".65" fill="white" opacity=".4" />

      {/* ── Smile ── */}
      <path
        d="M16 27.5 Q20 32 24 27.5"
        stroke="#312e81" strokeWidth="1.5" strokeLinecap="round" fill="none"
      />

      {/* ── Tongue — drawn AFTER head so it sits on top (sticking out) ── */}
      <g style={isStatic ? undefined : { animation: 'ad-tongue 2s ease-in-out infinite .9s' }}>
        <ellipse cx="20" cy="32"   rx="2.8" ry="2.6" fill="#f43f5e" />
        <ellipse cx="20" cy="33.8" rx="2.8" ry="1"   fill="#e11d48" />
        {/* Center line */}
        <line
          x1="20" y1="30" x2="20" y2="34.5"
          stroke="#e11d48" strokeWidth=".8" strokeLinecap="round"
        />
      </g>
    </svg>
  )

  if (variant === 'icon') return Icon

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      {Icon}
      <span
        className="font-bold tracking-tight text-gray-900"
        style={{ fontSize: size * 0.47, lineHeight: 1 }}
      >
        Appy<span className="text-indigo-600">Doer</span>
      </span>
    </div>
  )
}
