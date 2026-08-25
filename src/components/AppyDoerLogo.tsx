'use client'

import { cn } from '@/lib/utils'

interface Props {
  size?: number
  className?: string
  variant?: 'full' | 'icon'
  static?: boolean
  surface?: 'light' | 'dark'
}

export default function AppyDoerLogo({
  size = 40,
  className,
  variant = 'full',
  static: isStatic = false,
  surface = 'light',
}: Props) {
  const dark = surface === 'dark'

  // color palette — two surfaces
  const c = dark
    ? {
        ear:    'rgba(255,255,255,0.78)',
        head:   'white',
        body:   'rgba(255,255,255,0.92)',
        belly:  'rgba(255,255,255,0.15)',
        tail:   'rgba(255,255,255,0.72)',
        paw:    'rgba(255,255,255,0.6)',
        iris:   '#312e81',
        nose:   '#312e81',
        nosedot:'rgba(255,255,255,0.45)',
        smile:  '#312e81',
        tongue: '#f43f5e',
        tongue2:'#e11d48',
        shine:  'rgba(0,0,0,0.06)',
        shadow: 'drop-shadow(0 2px 8px rgba(255,255,255,0.15))',
      }
    : {
        ear:    '#6d28d9',
        head:   '#4338ca',
        body:   '#4338ca',
        belly:  'rgba(255,255,255,0.1)',
        tail:   '#6d28d9',
        paw:    '#5b21b6',
        iris:   '#1e1b4b',
        nose:   'white',
        nosedot:'rgba(67,56,202,0.3)',
        smile:  'white',
        tongue: '#f43f5e',
        tongue2:'#e11d48',
        shine:  'rgba(255,255,255,0.2)',
        shadow: 'drop-shadow(0 2px 8px rgba(67,56,202,0.25))',
      }

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
      style={{ filter: c.shadow }}
    >
      {!isStatic && (
        <style>{`
          @keyframes ad-ear-l  { 0%,100%{transform:rotate(0deg)}   50%{transform:rotate(-11deg)} }
          @keyframes ad-ear-r  { 0%,100%{transform:rotate(0deg)}   50%{transform:rotate(11deg)}  }
          @keyframes ad-blink  { 0%,84%,100%{transform:scaleY(1)}  92%{transform:scaleY(0.07)}   }
          @keyframes ad-tongue { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(1.5px)} }
          @keyframes ad-tail   { 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(22deg)}  }
        `}</style>
      )}

      {/* ── Tail — behind body, wags ── */}
      <g style={isStatic
        ? { transform: 'rotate(-12deg)', transformOrigin: '29.5px 27px' }
        : { transformOrigin: '29.5px 27px', animation: 'ad-tail 1.1s ease-in-out infinite' }
      }>
        {/* Tail shaft */}
        <path
          d="M29.5 27 C34 23, 39.5 20, 38.5 15 C37.5 11, 34 12, 33 15 C32 19, 33 25, 29.5 27 Z"
          fill={c.tail}
        />
        {/* Fluffy tip */}
        <circle cx="36" cy="13.5" r="2.8" fill={c.tail} opacity=".7" />
      </g>

      {/* ── Left ear (behind head) ── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '14px 4px',
        animation: 'ad-ear-l 2.8s ease-in-out infinite',
      }}>
        <path
          d="M14 3 C8 2, 2 9, 3 17 C4 23, 10 25, 14 21 C17 18, 17 10, 14 6 Z"
          fill={c.ear}
        />
      </g>

      {/* ── Right ear ── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '26px 4px',
        animation: 'ad-ear-r 2.8s ease-in-out infinite .6s',
      }}>
        <path
          d="M26 3 C32 2, 38 9, 37 17 C36 23, 30 25, 26 21 C23 18, 23 10, 26 6 Z"
          fill={c.ear}
        />
      </g>

      {/* ── Body ── */}
      <ellipse cx="20" cy="30.5" rx="10.5" ry="9" fill={c.body} />
      {/* Belly */}
      <ellipse cx="20" cy="29.5" rx="5.5" ry="5.5" fill={c.belly} />

      {/* ── Front paws ── */}
      <ellipse cx="13"   cy="39" rx="4.5" ry="1.8" fill={c.paw} />
      <ellipse cx="27"   cy="39" rx="4.5" ry="1.8" fill={c.paw} />
      {/* Paw toe bumps */}
      <circle cx="10.5" cy="38" r="1.2" fill={c.paw} opacity=".7" />
      <circle cx="13"   cy="37.5" r="1.2" fill={c.paw} opacity=".7" />
      <circle cx="15.5" cy="38" r="1.2" fill={c.paw} opacity=".7" />
      <circle cx="24.5" cy="38" r="1.2" fill={c.paw} opacity=".7" />
      <circle cx="27"   cy="37.5" r="1.2" fill={c.paw} opacity=".7" />
      <circle cx="29.5" cy="38" r="1.2" fill={c.paw} opacity=".7" />

      {/* ── Head (covers ear bases) ── */}
      <circle cx="20" cy="12" r="9.5" fill={c.head} />
      {/* Shine highlight */}
      <path
        d="M13 7 Q20 4 27 7"
        stroke={c.shine} strokeWidth="1.3" strokeLinecap="round" fill="none"
      />

      {/* ── Left eye (blinks) ── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '15.5px 10.5px',
        animation: 'ad-blink 5s ease-in-out infinite 1s',
      }}>
        <circle cx="15.5" cy="10.5" r="2.9" fill="white" />
        <circle cx="15.5" cy="10.5" r="1.6" fill={c.iris} />
        <circle cx="16.4" cy="9.2"  r=".8"  fill="white" opacity=".9" />
      </g>

      {/* ── Right eye ── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '24.5px 10.5px',
        animation: 'ad-blink 5s ease-in-out infinite 1.07s',
      }}>
        <circle cx="24.5" cy="10.5" r="2.9" fill="white" />
        <circle cx="24.5" cy="10.5" r="1.6" fill={c.iris} />
        <circle cx="25.4" cy="9.2"  r=".8"  fill="white" opacity=".9" />
      </g>

      {/* ── Nose ── */}
      <ellipse cx="20"  cy="15"  rx="2.3" ry="1.6" fill={c.nose} />
      <ellipse cx="18.9" cy="14.4" rx=".8" ry=".6" fill={c.nosedot} />

      {/* ── Smile ── */}
      <path
        d="M16.5 16.5 Q20 20 23.5 16.5"
        stroke={c.smile} strokeWidth="1.3" strokeLinecap="round" fill="none"
      />

      {/* ── Tongue — sits below chin, over body neck ── */}
      <g style={isStatic ? undefined : { animation: 'ad-tongue 2s ease-in-out infinite .9s' }}>
        <ellipse cx="20" cy="22" rx="2.5" ry="2.4"  fill={c.tongue} />
        <ellipse cx="20" cy="23.8" rx="2.5" ry=".95" fill={c.tongue2} />
        <line
          x1="20" y1="20.2" x2="20" y2="24.4"
          stroke={c.tongue2} strokeWidth=".75" strokeLinecap="round"
        />
      </g>
    </svg>
  )

  if (variant === 'icon') return Icon

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      {Icon}
      <span
        className={cn('font-bold tracking-tight', dark ? 'text-white' : 'text-gray-900')}
        style={{ fontSize: size * 0.43, lineHeight: 1 }}
      >
        Appy<span className={dark ? 'text-indigo-300' : 'text-indigo-600'}>Doer</span>
      </span>
    </div>
  )
}
