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
  const bg  = dark ? '#0f172a' : 'white'
  const ink = dark ? 'white'   : '#111111'
  const spot = dark ? 'white'  : '#111111'    // nose / iris fill
  const glint = dark ? '#0f172a' : 'white'    // eye / nose shine
  const shade = dark ? 'rgba(255,255,255,0.18)' : '#d1d5db'
  const sw = 2.4   // main stroke
  const sw2 = 1.6  // detail stroke

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
      style={{
        filter: dark
          ? 'drop-shadow(0 0 8px rgba(255,255,255,0.18))'
          : 'drop-shadow(0 2px 6px rgba(0,0,0,0.22))',
      }}
    >
      {!isStatic && (
        <style>{`
          @keyframes ad-ear    { 0%,100%{transform:rotate(0deg)}    50%{transform:rotate(11deg)}  }
          @keyframes ad-tail   { 0%,100%{transform:rotate(-24deg)}  50%{transform:rotate(24deg)}  }
          @keyframes ad-blink  { 0%,83%,100%{transform:scaleY(1)}   91%{transform:scaleY(0.05)}   }
          @keyframes ad-tongue { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(2px)} }
          @keyframes ad-paw-a  { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-3px)} }
          @keyframes ad-paw-b  { 0%,100%{transform:translateY(-3px)} 50%{transform:translateY(0px)} }
        `}</style>
      )}

      {/* ─── TAIL  (left side, wags; drawn behind body) ─── */}
      <g style={isStatic
        ? { transform: 'rotate(-14deg)', transformOrigin: '4px 26px' }
        : { transformOrigin: '4px 26px', animation: 'ad-tail 0.9s ease-in-out infinite' }
      }>
        <path
          d="M4 26 C1 20, 1 14, 5 11 C8 9, 11 11, 9 15 C7 19, 4 25, 4 26 Z"
          fill={bg} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
        />
        {/* Fluffy tail tip */}
        <circle cx="7" cy="12" r="2.8" fill={bg} stroke={ink} strokeWidth={sw - 0.4}/>
      </g>

      {/* ─── FLOPPY EAR  (hangs from back of head) ─── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '22px 9px',
        animation: 'ad-ear 2.6s ease-in-out infinite .3s',
      }}>
        <path
          d="M22 9 C18 5, 11 6, 10 13 C9 20, 14 26, 18 25 C21 24, 23 20, 22 14 Z"
          fill={bg} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
        />
      </g>

      {/* ─── SHADOW PAWS  (drawn before body so body sits over their tops) ─── */}
      {/* Front shadow */}
      <g style={isStatic ? undefined : { animation: 'ad-paw-b 0.65s ease-in-out infinite .325s' }}>
        <ellipse cx="25" cy="37.5" rx="4" ry="1.8" fill={shade}/>
      </g>
      {/* Back shadow */}
      <g style={isStatic ? undefined : { animation: 'ad-paw-a 0.65s ease-in-out infinite .325s' }}>
        <ellipse cx="10" cy="37.5" rx="4" ry="1.8" fill={shade}/>
      </g>

      {/* ─── BODY ─── */}
      <ellipse cx="14.5" cy="27" rx="11.5" ry="9.5" fill={bg} stroke={ink} strokeWidth={sw}/>
      {/* Chest line */}
      <path
        d="M21 33 Q24 36 27 34.5"
        stroke={ink} strokeWidth={sw2 - 0.4} strokeLinecap="round" fill="none" opacity=".45"
      />

      {/* ─── FOREGROUND PAWS (drawn after body — emerge from below body) ─── */}
      {/* Front */}
      <g style={isStatic ? undefined : { animation: 'ad-paw-a 0.65s ease-in-out infinite' }}>
        <ellipse cx="23" cy="37.5" rx="4.2" ry="1.9" fill={bg} stroke={ink} strokeWidth={sw2}/>
        <line x1="20.5" y1="37.5" x2="21"   y2="36.2" stroke={ink} strokeWidth=".9" strokeLinecap="round"/>
        <line x1="23"   y1="37.5" x2="23"   y2="36"   stroke={ink} strokeWidth=".9" strokeLinecap="round"/>
        <line x1="25.5" y1="37.5" x2="25"   y2="36.2" stroke={ink} strokeWidth=".9" strokeLinecap="round"/>
      </g>
      {/* Back */}
      <g style={isStatic ? undefined : { animation: 'ad-paw-b 0.65s ease-in-out infinite' }}>
        <ellipse cx="8" cy="37.5" rx="4.2" ry="1.9" fill={bg} stroke={ink} strokeWidth={sw2}/>
        <line x1="5.5" y1="37.5" x2="6"   y2="36.2" stroke={ink} strokeWidth=".9" strokeLinecap="round"/>
        <line x1="8"   y1="37.5" x2="8"   y2="36"   stroke={ink} strokeWidth=".9" strokeLinecap="round"/>
        <line x1="10.5" y1="37.5" x2="10" y2="36.2" stroke={ink} strokeWidth=".9" strokeLinecap="round"/>
      </g>

      {/* ─── HEAD ─── */}
      <circle cx="27.5" cy="15" r="9" fill={bg} stroke={ink} strokeWidth={sw}/>

      {/* ─── SNOUT / MUZZLE ─── */}
      <ellipse cx="35.5" cy="19" rx="4.8" ry="3.4" fill={bg} stroke={ink} strokeWidth={sw2}/>

      {/* ─── NOSE (black button) ─── */}
      <ellipse cx="39" cy="17.5" rx="1.9" ry="1.6" fill={spot}/>
      <ellipse cx="38.3" cy="16.8" rx=".65" ry=".5" fill={glint} opacity=".65"/>

      {/* ─── EYE (blinks — front-facing, right side of head) ─── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '31px 12.5px',
        animation: 'ad-blink 4.8s ease-in-out infinite 1s',
      }}>
        <circle cx="31"  cy="12.5" r="3.3" fill={bg}  stroke={ink} strokeWidth={sw2}/>
        <circle cx="31.5" cy="12.5" r="1.8" fill={spot}/>
        <circle cx="31.2" cy="11.3" r=".75" fill={glint} opacity=".9"/>
      </g>

      {/* ─── EYEBROW (single bold arc) ─── */}
      <path
        d="M29 9.5 Q31 8.3 33.5 9.5"
        stroke={ink} strokeWidth={sw2} strokeLinecap="round" fill="none"
      />

      {/* ─── MOUTH ─── */}
      <path
        d="M39 19.5 Q37 23.5 32.5 22"
        stroke={ink} strokeWidth={sw2} strokeLinecap="round" fill="none"
      />

      {/* ─── TONGUE ─── */}
      <g style={isStatic ? undefined : { animation: 'ad-tongue 1.9s ease-in-out infinite .5s' }}>
        <ellipse cx="37" cy="24.5" rx="2.7" ry="2.4" fill="#f87171"/>
        <ellipse cx="37" cy="26.4" rx="2.7" ry=".95" fill="#ef4444"/>
        <line x1="37" y1="22.5" x2="37" y2="26.5"
          stroke="#ef4444" strokeWidth=".8" strokeLinecap="round"/>
      </g>
    </svg>
  )

  if (variant === 'icon') return Icon

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      {Icon}
      <span
        className={cn('font-black tracking-widest', dark ? 'text-white' : 'text-gray-900')}
        style={{ fontSize: size * 0.38, lineHeight: 1, letterSpacing: '0.1em' }}
      >
        APPY<span className={dark ? 'text-gray-500' : 'text-gray-500'}>DOER</span>
      </span>
    </div>
  )
}
