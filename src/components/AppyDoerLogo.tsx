'use client'

/**
 * AppyDoer puppy mascot — front-facing cartoon sketch style
 * Reference: cute round puppy, big eyes, long floppy ears, hair tuft,
 *            chubby body, stubby legs with toe bumps, curly tail.
 * Style: white chalk sketch on dark  |  black ink on light
 */

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

  // bg  = shape fills (same colour as the page → "hollow" chalk look)
  // ink = outlines and marks
  const bg      = dark ? '#0f172a'               : 'white'
  const ink     = dark ? 'white'                 : '#111111'
  const tongue1 = dark ? '#991b1b'               : '#f87171'
  const tongue2 = dark ? '#7f1d1d'               : '#ef4444'
  const shadow  = dark
    ? 'drop-shadow(0 0 8px rgba(255,255,255,0.22))'
    : 'drop-shadow(0 2px 8px rgba(0,0,0,0.22))'

  const sw  = 2.1   // main strokes
  const sw2 = 1.55  // face details
  const sw3 = 0.95  // fur texture / toe lines

  const Icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AppyDoer"
      role="img"
      className="flex-shrink-0 select-none"
      style={{ filter: shadow }}
    >
      {!isStatic && (
        <style>{`
          @keyframes ad-ear-l  { 0%,100%{transform:rotate(0deg)}    50%{transform:rotate(-10deg)} }
          @keyframes ad-ear-r  { 0%,100%{transform:rotate(0deg)}    50%{transform:rotate(10deg)}  }
          @keyframes ad-tail   { 0%,100%{transform:rotate(-20deg)}  50%{transform:rotate(20deg)}  }
          @keyframes ad-blink  { 0%,82%,100%{transform:scaleY(1)}   90%{transform:scaleY(0.05)}   }
          @keyframes ad-hair   { 0%,100%{transform:rotate(0deg)}    50%{transform:rotate(7deg)}   }
          @keyframes ad-tongue { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(2px)} }
        `}</style>
      )}

      {/* ════════════════════════════════
          Z-ORDER: ears → tail → back-legs → body → front-legs → head → face
          ════════════════════════════════ */}

      {/* ── LEFT EAR (floppy, hangs down past face) ── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '12px 9px',
        animation: 'ad-ear-l 2.8s ease-in-out infinite',
      }}>
        <path
          d="M12 9 C8 7, 3 11, 3 19 C3 25, 7 30, 12 30 C16 30, 18 26, 17 20 C16 15, 13 10, 12 9 Z"
          fill={bg} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
        />
        {/* Fur texture lines inside ear */}
        <line x1="6.5"  y1="13" x2="8.5"  y2="18" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".65"/>
        <line x1="9"    y1="12" x2="11"   y2="17" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".65"/>
        <line x1="6"    y1="18" x2="8"    y2="23" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".55"/>
        <line x1="8.5"  y1="23" x2="10"   y2="27" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".45"/>
      </g>

      {/* ── RIGHT EAR ── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '28px 9px',
        animation: 'ad-ear-r 2.8s ease-in-out infinite .65s',
      }}>
        <path
          d="M28 9 C32 7, 37 11, 37 19 C37 25, 33 30, 28 30 C24 30, 22 26, 23 20 C24 15, 27 10, 28 9 Z"
          fill={bg} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
        />
        <line x1="33.5" y1="13" x2="31.5" y2="18" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".65"/>
        <line x1="31"   y1="12" x2="29"   y2="17" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".65"/>
        <line x1="34"   y1="18" x2="32"   y2="23" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".55"/>
        <line x1="31.5" y1="23" x2="30"   y2="27" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".45"/>
      </g>

      {/* ── TAIL (curly, right side of body, wags) ── */}
      <g style={isStatic
        ? { transform: 'rotate(-12deg)', transformOrigin: '29px 26px' }
        : { transformOrigin: '29px 26px', animation: 'ad-tail 1.1s ease-in-out infinite' }
      }>
        <path
          d="M29 26 C33 22, 38 23, 38 27 C38 31, 34 32, 30 30 C28.5 29, 28.5 27.5, 29 26 Z"
          fill={bg} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
        />
        {/* Inner curl detail */}
        <path d="M33 24 C36 23, 37 25.5, 36 28"
          stroke={ink} strokeWidth={sw3} strokeLinecap="round" fill="none" opacity=".7"/>
      </g>

      {/* ── BACK LEGS (drawn before body so body hides tops) ── */}
      {/* Back-left */}
      <rect x="11.5" y="33" width="6" height="7" rx="3" fill={bg} stroke={ink} strokeWidth={sw3+0.3} opacity=".5"/>
      <ellipse cx="14.5" cy="40.3" rx="4.2" ry="1.8" fill={bg} stroke={ink} strokeWidth={sw3} opacity=".5"/>
      {/* Back-right */}
      <rect x="22.5" y="33" width="6" height="7" rx="3" fill={bg} stroke={ink} strokeWidth={sw3+0.3} opacity=".5"/>
      <ellipse cx="25.5" cy="40.3" rx="4.2" ry="1.8" fill={bg} stroke={ink} strokeWidth={sw3} opacity=".5"/>

      {/* ── BODY ── */}
      <ellipse cx="20" cy="30" rx="10.5" ry="9" fill={bg} stroke={ink} strokeWidth={sw}/>
      {/* Chest fur swirls */}
      <path d="M15 34 Q17 37.5 19 36" stroke={ink} strokeWidth={sw3} strokeLinecap="round" fill="none" opacity=".5"/>
      <path d="M21 34 Q23 37.5 25 36" stroke={ink} strokeWidth={sw3} strokeLinecap="round" fill="none" opacity=".5"/>

      {/* ── FRONT LEGS (drawn after body — emerge from below body) ── */}
      {/* Front-left */}
      <rect x="12.5" y="34" width="6" height="7" rx="3" fill={bg} stroke={ink} strokeWidth={sw2}/>
      <ellipse cx="15.5" cy="41.3" rx="4.4" ry="2" fill={bg} stroke={ink} strokeWidth={sw2}/>
      {/* Toe bumps front-left */}
      <circle cx="12.8" cy="40"  r="1.1" fill={bg} stroke={ink} strokeWidth={sw3}/>
      <circle cx="15.5" cy="39.5" r="1.1" fill={bg} stroke={ink} strokeWidth={sw3}/>
      <circle cx="18.2" cy="40"  r="1.1" fill={bg} stroke={ink} strokeWidth={sw3}/>
      {/* Front-right */}
      <rect x="21.5" y="34" width="6" height="7" rx="3" fill={bg} stroke={ink} strokeWidth={sw2}/>
      <ellipse cx="24.5" cy="41.3" rx="4.4" ry="2" fill={bg} stroke={ink} strokeWidth={sw2}/>
      {/* Toe bumps front-right */}
      <circle cx="21.8" cy="40"  r="1.1" fill={bg} stroke={ink} strokeWidth={sw3}/>
      <circle cx="24.5" cy="39.5" r="1.1" fill={bg} stroke={ink} strokeWidth={sw3}/>
      <circle cx="27.2" cy="40"  r="1.1" fill={bg} stroke={ink} strokeWidth={sw3}/>

      {/* ── HEAD (covers ear bases) ── */}
      <circle cx="20" cy="13.5" r="10.5" fill={bg} stroke={ink} strokeWidth={sw}/>

      {/* ── HAIR TUFT (waves gently) ── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '20px 4px',
        animation: 'ad-hair 3.2s ease-in-out infinite .9s',
      }}>
        <path d="M17.5 4.5 C17 2, 18.2 0.5, 20 2.5"   stroke={ink} strokeWidth={sw2} strokeLinecap="round" fill="none"/>
        <path d="M20.5 4.5 C20.5 2, 21.5 0.5, 22 2.5" stroke={ink} strokeWidth={sw2} strokeLinecap="round" fill="none"/>
        <path d="M15.5 5.5 C15 4, 15.5 2.5, 17 3.5"   stroke={ink} strokeWidth={sw3+0.2} strokeLinecap="round" fill="none" opacity=".75"/>
        <path d="M23 6 C23.5 4.5, 23 3, 22.5 3.5"     stroke={ink} strokeWidth={sw3+0.2} strokeLinecap="round" fill="none" opacity=".75"/>
      </g>

      {/* ── LEFT EYE (blinks) ── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '14.5px 12px',
        animation: 'ad-blink 5s ease-in-out infinite 1s',
      }}>
        {/* Sclera */}
        <circle cx="14.5" cy="12" r="4" fill={bg} stroke={ink} strokeWidth={sw2}/>
        {/* Iris ring */}
        <circle cx="14.5" cy="12" r="2.5" fill={bg} stroke={ink} strokeWidth={sw3+0.1}/>
        {/* Pupil */}
        <circle cx="14.5" cy="12.3" r="1.3" fill={ink}/>
        {/* Large oval sparkle (negative space / reflection) */}
        <ellipse cx="12.9" cy="10.4" rx="1.1" ry="0.75"
          fill={bg} stroke="none" transform="rotate(-30 12.9 10.4)"/>
        {/* Small shine dot */}
        <circle cx="15.7" cy="10.5" r="0.6" fill={bg}/>
      </g>

      {/* ── RIGHT EYE ── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '25.5px 12px',
        animation: 'ad-blink 5s ease-in-out infinite 1.08s',
      }}>
        <circle cx="25.5" cy="12" r="4" fill={bg} stroke={ink} strokeWidth={sw2}/>
        <circle cx="25.5" cy="12" r="2.5" fill={bg} stroke={ink} strokeWidth={sw3+0.1}/>
        <circle cx="25.5" cy="12.3" r="1.3" fill={ink}/>
        <ellipse cx="23.9" cy="10.4" rx="1.1" ry="0.75"
          fill={bg} stroke="none" transform="rotate(-30 23.9 10.4)"/>
        <circle cx="26.7" cy="10.5" r="0.6" fill={bg}/>
      </g>

      {/* ── SNOUT / MUZZLE ── */}
      <ellipse cx="20" cy="19.5" rx="6" ry="4.8" fill={bg} stroke={ink} strokeWidth={sw2}/>
      {/* Top muzzle ridge */}
      <path d="M15 17 Q20 16.3 25 17"
        stroke={ink} strokeWidth={sw3} strokeLinecap="round" fill="none"/>

      {/* ── NOSE ── */}
      <ellipse cx="20" cy="16.5" rx="2.4" ry="1.8" fill={ink}/>
      <ellipse cx="19.1" cy="15.7" rx="0.75" ry="0.55" fill={bg} opacity=".6"/>

      {/* ── SMILE ── */}
      <path d="M15.5 21 Q20 25 24.5 21"
        stroke={ink} strokeWidth={sw2} strokeLinecap="round" fill="none"/>

      {/* ── TONGUE (bobs) ── */}
      <g style={isStatic ? undefined : { animation: 'ad-tongue 2s ease-in-out infinite .8s' }}>
        <ellipse cx="20" cy="25.5" rx="3"   ry="2.7" fill={tongue1}/>
        <ellipse cx="20" cy="27.7" rx="3"   ry="1.1" fill={tongue2}/>
        <line x1="20" y1="23.3" x2="20" y2="28"
          stroke={tongue2} strokeWidth=".9" strokeLinecap="round"/>
      </g>
    </svg>
  )

  if (variant === 'icon') return Icon

  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      {Icon}
      <span
        className={cn('font-black tracking-widest', dark ? 'text-white' : 'text-gray-900')}
        style={{ fontSize: size * 0.37, lineHeight: 1, letterSpacing: '0.1em' }}
      >
        APPY<span className={dark ? 'text-gray-500' : 'text-gray-500'}>DOER</span>
      </span>
    </div>
  )
}
