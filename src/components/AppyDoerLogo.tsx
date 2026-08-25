'use client'

/**
 * AppyDoer puppy mascot — side-profile chalk sketch, premium feel.
 * Puppy faces RIGHT. Style: white lines on dark / black lines on light.
 * Animations: tail wag, ear sway, eye blink, walk cycle (2 diagonal leg pairs),
 *             hair wave, tongue bob, occasional sparkle glint.
 * Premium accent: indigo collar with star tag.
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
  const dark   = surface === 'dark'
  const bg     = dark ? '#0f172a' : 'white'
  const ink    = dark ? 'white'   : '#111111'
  const t1     = dark ? '#991b1b' : '#f87171'  // tongue base
  const t2     = dark ? '#7f1d1d' : '#ef4444'  // tongue underside
  const accent = dark ? '#818cf8' : '#4f46e5'  // collar (brand indigo)

  const sw  = 2.1   // primary strokes
  const sw2 = 1.55  // secondary face details
  const sw3 = 0.92  // fur texture / toe lines

  const Icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      overflow="visible"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AppyDoer"
      role="img"
      className="flex-shrink-0 select-none"
      style={{
        filter: dark
          ? 'drop-shadow(0 0 10px rgba(255,255,255,0.2))'
          : 'drop-shadow(0 2px 10px rgba(0,0,0,0.22))',
      }}
    >
      {!isStatic && (
        <style>{`
          @keyframes ad-tail  { 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(22deg)}  }
          @keyframes ad-ear   { 0%,100%{transform:rotate(0deg)}   50%{transform:rotate(-9deg)}  }
          @keyframes ad-blink { 0%,80%,100%{transform:scaleY(1)}  88%{transform:scaleY(0.06)}   }
          @keyframes ad-hair  { 0%,100%{transform:rotate(0deg)}   50%{transform:rotate(7deg)}   }
          @keyframes ad-tongue{ 0%,100%{transform:translateY(0px)} 50%{transform:translateY(2px)} }
          @keyframes ad-walk  { 0%,100%{transform:rotate(-14deg)} 50%{transform:rotate(14deg)}  }
          @keyframes ad-glint {
            0%,76%,100%{opacity:0;transform:scale(0)}
            81%{opacity:1;transform:scale(1)}
            93%{opacity:0;transform:scale(0.2)}
          }
        `}</style>
      )}

      {/* ════════════════════════════════════════════════════
          Z-ORDER (back → front, puppy faces RIGHT):
            tail → all 4 legs → body → floppy-ear → head →
            far-ear → collar → snout → eye → face → hair → glint
          ════════════════════════════════════════════════════ */}

      {/* ── TAIL: curly loop, attaches at body rear, wags ── */}
      <g
        style={isStatic
          ? { transform: 'rotate(-18deg)', transformOrigin: '5px 26px' }
          : { transformOrigin: '5px 26px', animation: 'ad-tail 1.05s ease-in-out infinite' }}
      >
        <path
          d="M5 26 C1 22, -1 17, 3 14 C7 11, 12 13, 12 18 C12 23, 8.5 26, 5 26 Z"
          fill={bg} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
        />
        <path d="M10 14 C12 17.5, 11 22, 9 24"
          stroke={ink} strokeWidth={sw3} strokeLinecap="round" fill="none" opacity=".65"/>
      </g>

      {/* ── ALL 4 LEGS drawn BEFORE body (body masks their tops) ──
          Walk gait: diagonal pairs (near-front + far-back) and (far-front + near-back)
          move in opposite phase.
          Phase A (0s)   : near-back  + far-front
          Phase B (-0.65s): near-front + far-back        */}

      {/* FAR BACK LEG — phase B, grayed (left/inner side) */}
      <g
        style={isStatic ? undefined : {
          transformOrigin: '9px 37px',
          animation: 'ad-walk 1.3s ease-in-out infinite -0.65s',
        }}
      >
        <rect x="6.5" y="33" width="5" height="10.5" rx="2.5"
          fill={bg} stroke={ink} strokeWidth={sw3+0.2} opacity=".42"/>
        <ellipse cx="9" cy="44.2" rx="3.8" ry="1.6"
          fill={bg} stroke={ink} strokeWidth={sw3} opacity=".42"/>
      </g>

      {/* NEAR BACK LEG — phase A */}
      <g
        style={isStatic ? undefined : {
          transformOrigin: '12.5px 37px',
          animation: 'ad-walk 1.3s ease-in-out infinite',
        }}
      >
        <rect x="10" y="33" width="5" height="10.5" rx="2.5"
          fill={bg} stroke={ink} strokeWidth={sw2}/>
        <ellipse cx="12.5" cy="44.2" rx="3.8" ry="1.6"
          fill={bg} stroke={ink} strokeWidth={sw2}/>
        <circle cx="10.3" cy="43.3" r="0.9" fill={bg} stroke={ink} strokeWidth={sw3}/>
        <circle cx="12.5" cy="42.8" r="0.9" fill={bg} stroke={ink} strokeWidth={sw3}/>
        <circle cx="14.7" cy="43.3" r="0.9" fill={bg} stroke={ink} strokeWidth={sw3}/>
      </g>

      {/* FAR FRONT LEG — phase A, grayed */}
      <g
        style={isStatic ? undefined : {
          transformOrigin: '22px 37px',
          animation: 'ad-walk 1.3s ease-in-out infinite',
        }}
      >
        <rect x="19.5" y="33" width="5" height="10.5" rx="2.5"
          fill={bg} stroke={ink} strokeWidth={sw3+0.2} opacity=".42"/>
        <ellipse cx="22" cy="44.2" rx="3.8" ry="1.6"
          fill={bg} stroke={ink} strokeWidth={sw3} opacity=".42"/>
      </g>

      {/* NEAR FRONT LEG — phase B */}
      <g
        style={isStatic ? undefined : {
          transformOrigin: '26px 37px',
          animation: 'ad-walk 1.3s ease-in-out infinite -0.65s',
        }}
      >
        <rect x="23.5" y="33" width="5" height="10.5" rx="2.5"
          fill={bg} stroke={ink} strokeWidth={sw2}/>
        <ellipse cx="26" cy="44.2" rx="3.8" ry="1.6"
          fill={bg} stroke={ink} strokeWidth={sw2}/>
        <circle cx="23.7" cy="43.3" r="0.9" fill={bg} stroke={ink} strokeWidth={sw3}/>
        <circle cx="26"   cy="42.8" r="0.9" fill={bg} stroke={ink} strokeWidth={sw3}/>
        <circle cx="28.3" cy="43.3" r="0.9" fill={bg} stroke={ink} strokeWidth={sw3}/>
      </g>

      {/* ── BODY: oval, body covers leg tops ── */}
      <ellipse cx="17" cy="30" rx="13" ry="10"
        fill={bg} stroke={ink} strokeWidth={sw}/>
      {/* Chest fur swirl */}
      <path d="M22 35 Q25 38.5 27.5 36.5"
        stroke={ink} strokeWidth={sw3} strokeLinecap="round" fill="none" opacity=".48"/>

      {/* ── FLOPPY EAR: long, droops in front of body, pivots at head ── */}
      <g
        style={isStatic ? undefined : {
          transformOrigin: '22px 12px',
          animation: 'ad-ear 3.2s ease-in-out infinite .5s',
        }}
      >
        <path
          d="M22 12 C18 10, 13 14, 12 21 C11 28, 14 37, 19 37 C23 37, 25 32, 24 25 C23 19, 22 14, 22 12 Z"
          fill={bg} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
        />
        <line x1="16" y1="17" x2="17.5" y2="22" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".58"/>
        <line x1="18" y1="16" x2="19.5" y2="21" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".58"/>
        <line x1="15" y1="23" x2="16.5" y2="28" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".48"/>
        <line x1="17.5" y1="29" x2="18.5" y2="34" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".38"/>
      </g>

      {/* ── HEAD: big chibi circle (in front of ear base) ── */}
      <circle cx="29" cy="13" r="11"
        fill={bg} stroke={ink} strokeWidth={sw}/>

      {/* ── FAR EAR: small, partially visible on far side of head ── */}
      <path
        d="M31.5 3 C33.5 0.5, 37 1.5, 37.5 4.5 C38 8, 35.5 10.5, 33 9.5 C31 8.5, 30.5 5.5, 31.5 3 Z"
        fill={bg} stroke={ink} strokeWidth={sw3+0.25} opacity=".58"/>

      {/* ── COLLAR: indigo brand accent with star tag ── */}
      <path d="M20 22 C23 25, 28 26, 33 24.5"
        stroke={accent} strokeWidth="2.4" strokeLinecap="round" fill="none"/>
      {/* Tag circle */}
      <circle cx="26.5" cy="25.8" r="1.75" fill={accent} stroke={bg} strokeWidth=".8"/>
      {/* 4-pointed star on tag */}
      <path
        d="M26.5 24.5 L26.82 25.48 L27.8 25.8 L26.82 26.12 L26.5 27.1 L26.18 26.12 L25.2 25.8 L26.18 25.48 Z"
        fill={bg} opacity=".82"/>

      {/* ── SNOUT / MUZZLE: protrudes right from lower head ── */}
      <ellipse cx="40.5" cy="19" rx="6.2" ry="4.6"
        fill={bg} stroke={ink} strokeWidth={sw2}/>
      {/* Muzzle crease */}
      <path d="M35.2 16.5 Q39 15.8 44.5 16.8"
        stroke={ink} strokeWidth={sw3} strokeLinecap="round" fill="none"/>

      {/* ── NOSE ── */}
      <ellipse cx="46.1" cy="16.8" rx="2.25" ry="1.7" fill={ink}/>
      <ellipse cx="45.3" cy="16"   rx="0.72" ry="0.52" fill={bg} opacity=".52"/>

      {/* ── SMILE (side view) ── */}
      <path d="M41 23.5 Q44 26 47 23.5"
        stroke={ink} strokeWidth={sw2} strokeLinecap="round" fill="none"/>

      {/* ── TONGUE: bobs gently ── */}
      <g style={isStatic ? undefined : { animation: 'ad-tongue 2.2s ease-in-out infinite .9s' }}>
        <ellipse cx="45.5" cy="27.5" rx="2.7" ry="2.6" fill={t1}/>
        <ellipse cx="45.5" cy="29.6" rx="2.7" ry="1.1" fill={t2}/>
        <line x1="45.5" y1="25.2" x2="45.5" y2="30.2"
          stroke={t2} strokeWidth=".9" strokeLinecap="round"/>
      </g>

      {/* ── EYE: large cartoon eye with iris + sparkle reflections ── */}
      <g
        style={isStatic ? undefined : {
          transformOrigin: '35px 10px',
          animation: 'ad-blink 5.5s ease-in-out infinite 1.8s',
        }}
      >
        {/* Sclera */}
        <circle cx="35" cy="10" r="4.5" fill={bg} stroke={ink} strokeWidth={sw2}/>
        {/* Iris ring */}
        <circle cx="35" cy="10" r="2.8" fill={bg} stroke={ink} strokeWidth={sw3+0.18}/>
        {/* Pupil */}
        <circle cx="35" cy="10.3" r="1.4" fill={ink}/>
        {/* Oval sparkle (negative space = eye reflection) */}
        <ellipse cx="33.3" cy="8.4" rx="1.15" ry="0.78"
          fill={bg} stroke="none" transform="rotate(-30 33.3 8.4)"/>
        {/* Shine dot */}
        <circle cx="36.3" cy="8.5" r="0.65" fill={bg}/>
      </g>

      {/* ── EYEBROW: subtle expression arc ── */}
      <path d="M31.5 6.5 Q35 5.2 38.5 6.5"
        stroke={ink} strokeWidth={sw3+0.1} strokeLinecap="round" fill="none" opacity=".72"/>

      {/* ── HAIR TUFT: 4 strands, waves gently ── */}
      <g
        style={isStatic ? undefined : {
          transformOrigin: '27px 4px',
          animation: 'ad-hair 3.5s ease-in-out infinite 1.1s',
        }}
      >
        <path d="M23.5 4.5 C22.5 2.5, 23.5 0.5, 25.5 2.5"
          stroke={ink} strokeWidth={sw2} strokeLinecap="round" fill="none"/>
        <path d="M27 4 C26.5 2, 27.5 0, 28.5 2.2"
          stroke={ink} strokeWidth={sw2} strokeLinecap="round" fill="none"/>
        <path d="M30 5 C30 3, 31 1.5, 31.5 3.2"
          stroke={ink} strokeWidth={sw3+0.2} strokeLinecap="round" fill="none" opacity=".75"/>
        <path d="M21.5 5.5 C21 4, 21.5 2.5, 23 3.5"
          stroke={ink} strokeWidth={sw3+0.1} strokeLinecap="round" fill="none" opacity=".58"/>
      </g>

      {/* ── PREMIUM SPARKLE GLINT: 4-pointed star near ear, occasional ── */}
      <g
        style={isStatic
          ? { opacity: 0 }
          : { transformOrigin: '38px 5px', animation: 'ad-glint 8s ease-in-out infinite 2.3s', opacity: 0 }}
      >
        <path
          d="M38 3 L38.55 4.82 L40.5 5 L38.55 5.18 L38 7 L37.45 5.18 L35.5 5 L37.45 4.82 Z"
          fill={ink} opacity=".9"/>
      </g>
    </svg>
  )

  if (variant === 'icon') return Icon

  return (
    <div className={cn('flex items-center gap-3 select-none', className)}>
      {Icon}
      <span
        className={cn('font-black tracking-widest', dark ? 'text-white' : 'text-gray-900')}
        style={{ fontSize: size * 0.37, lineHeight: 1, letterSpacing: '0.1em' }}
      >
        APPY<span className={dark ? 'text-slate-500' : 'text-slate-400'}>DOER</span>
      </span>
    </div>
  )
}
