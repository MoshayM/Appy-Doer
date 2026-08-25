'use client'

/**
 * AppyDoer puppy — front-facing chibi on a dark indigo badge.
 * Matches puppy.PNG: wide floppy ears, big round eyes, round muzzle,
 * chubby body, stubby paws, curly tail, hair tuft.
 * Style: white chalk sketch inside a #1e1b4b rounded-square badge.
 * Animations: ear sway (both), eye blink, hair wave, tail wag,
 *             tongue bob, whole-puppy gentle bounce, premium glint.
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
  // Badge is always dark indigo — self-contained identity on any background
  const badge  = '#1e1b4b'
  const ink    = 'white'
  const t1     = '#991b1b'   // tongue body
  const t2     = '#7f1d1d'   // tongue groove
  const col    = '#a5b4fc'   // collar (light indigo)

  const sw  = 1.9    // main strokes
  const sw2 = 1.45   // face details
  const sw3 = 0.85   // fur texture / toe lines

  // Aspect ratio 40 : 46
  const h = Math.round(size * 46 / 40)

  const Icon = (
    <svg
      width={size}
      height={h}
      viewBox="0 0 40 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AppyDoer"
      role="img"
      className="flex-shrink-0 select-none"
      style={{
        filter: dark
          ? 'drop-shadow(0 0 8px rgba(99,102,241,0.45))'
          : 'drop-shadow(0 3px 10px rgba(30,27,75,0.35))',
      }}
    >
      {!isStatic && (
        <style>{`
          @keyframes ad-ear-l  { 0%,100%{transform:rotate(0deg)}    50%{transform:rotate(-8deg)}  }
          @keyframes ad-ear-r  { 0%,100%{transform:rotate(0deg)}    50%{transform:rotate(8deg)}   }
          @keyframes ad-tail   { 0%,100%{transform:rotate(-18deg)}  50%{transform:rotate(18deg)}  }
          @keyframes ad-blink  { 0%,82%,100%{transform:scaleY(1)}   90%{transform:scaleY(0.05)}   }
          @keyframes ad-hair   { 0%,100%{transform:rotate(0deg)}    50%{transform:rotate(6deg)}   }
          @keyframes ad-tongue { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(2px)} }
          @keyframes ad-bounce { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-2px)} }
          @keyframes ad-glint  {
            0%,77%,100%{opacity:0;transform:scale(0)}
            82%{opacity:1;transform:scale(1)}
            93%{opacity:0;transform:scale(0.2)}
          }
        `}</style>
      )}

      {/* ── BADGE: fixed dark indigo rounded square ── */}
      <rect x="0" y="0" width="40" height="46" rx="10" fill={badge}/>

      {/* ── ALL PUPPY ELEMENTS bounce gently together ── */}
      <g style={isStatic ? undefined : { animation: 'ad-bounce 2.5s ease-in-out infinite' }}>

        {/* ── LEFT EAR (behind head, sways) ── */}
        <g style={isStatic ? undefined : {
          transformOrigin: '11px 11px',
          animation: 'ad-ear-l 2.8s ease-in-out infinite',
        }}>
          <path
            d="M11 11 C7 9, 3 13, 3 22 C3 29, 7 35, 11 35 C15 35, 16 30, 15 23 C14 17, 12 12, 11 11 Z"
            fill={badge} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
          />
          <line x1="6.5" y1="15" x2="8"   y2="20" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".58"/>
          <line x1="8.5" y1="14" x2="10"  y2="19" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".58"/>
          <line x1="6"   y1="21" x2="7.5" y2="26" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".48"/>
          <line x1="8"   y1="27" x2="9"   y2="31" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".38"/>
        </g>

        {/* ── RIGHT EAR (sways opposite phase) ── */}
        <g style={isStatic ? undefined : {
          transformOrigin: '29px 11px',
          animation: 'ad-ear-r 2.8s ease-in-out infinite .7s',
        }}>
          <path
            d="M29 11 C33 9, 37 13, 37 22 C37 29, 33 35, 29 35 C25 35, 24 30, 25 23 C26 17, 28 12, 29 11 Z"
            fill={badge} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
          />
          <line x1="33.5" y1="15" x2="32"  y2="20" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".58"/>
          <line x1="31.5" y1="14" x2="30"  y2="19" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".58"/>
          <line x1="34"   y1="21" x2="32.5" y2="26" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".48"/>
          <line x1="32"   y1="27" x2="31"   y2="31" stroke={ink} strokeWidth={sw3} strokeLinecap="round" opacity=".38"/>
        </g>

        {/* ── TAIL (curly loop, upper right of body, wags) ── */}
        <g style={isStatic
          ? { transform: 'rotate(-12deg)', transformOrigin: '29px 30px' }
          : { transformOrigin: '29px 30px', animation: 'ad-tail 1.1s ease-in-out infinite' }
        }>
          <path
            d="M29 30 C33 26, 38 27.5, 38 31.5 C38 35.5, 34 36.5, 30.5 35 C28.5 34, 28.5 32, 29 30 Z"
            fill={badge} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
          />
          <path d="M35 28 C37 31, 36.5 33.5, 35 35"
            stroke={ink} strokeWidth={sw3} strokeLinecap="round" fill="none" opacity=".62"/>
        </g>

        {/* ── BODY ── */}
        <ellipse cx="20" cy="34" rx="10" ry="8" fill={badge} stroke={ink} strokeWidth={sw}/>
        <path d="M15.5 37.5 Q18 40.5 20 39"   stroke={ink} strokeWidth={sw3} strokeLinecap="round" fill="none" opacity=".48"/>
        <path d="M20 37.5 Q22 40.5 24.5 39"   stroke={ink} strokeWidth={sw3} strokeLinecap="round" fill="none" opacity=".48"/>

        {/* ── PAWS: back pair (smaller/behind), then front pair ── */}
        <ellipse cx="16" cy="43.5" rx="4"   ry="2.7" fill={badge} stroke={ink} strokeWidth={sw3+0.1} opacity=".45"/>
        <ellipse cx="24" cy="43.5" rx="4"   ry="2.7" fill={badge} stroke={ink} strokeWidth={sw3+0.1} opacity=".45"/>
        {/* Front-left paw */}
        <ellipse cx="13" cy="43" rx="4.5" ry="3"   fill={badge} stroke={ink} strokeWidth={sw2}/>
        <circle cx="10.8" cy="41.8" r="1.05" fill={badge} stroke={ink} strokeWidth={sw3}/>
        <circle cx="13"   cy="41.3" r="1.05" fill={badge} stroke={ink} strokeWidth={sw3}/>
        <circle cx="15.2" cy="41.8" r="1.05" fill={badge} stroke={ink} strokeWidth={sw3}/>
        {/* Front-right paw */}
        <ellipse cx="27" cy="43" rx="4.5" ry="3"   fill={badge} stroke={ink} strokeWidth={sw2}/>
        <circle cx="24.8" cy="41.8" r="1.05" fill={badge} stroke={ink} strokeWidth={sw3}/>
        <circle cx="27"   cy="41.3" r="1.05" fill={badge} stroke={ink} strokeWidth={sw3}/>
        <circle cx="29.2" cy="41.8" r="1.05" fill={badge} stroke={ink} strokeWidth={sw3}/>

        {/* ── HEAD (covers ear attachment bases) ── */}
        <circle cx="20" cy="16.5" r="10" fill={badge} stroke={ink} strokeWidth={sw}/>

        {/* ── HAIR TUFT (waves gently) ── */}
        <g style={isStatic ? undefined : {
          transformOrigin: '20px 7px',
          animation: 'ad-hair 3.2s ease-in-out infinite 1s',
        }}>
          <path d="M17 7.5 C16.5 5.5, 17.5 4, 19 5.5"    stroke={ink} strokeWidth={sw2} strokeLinecap="round" fill="none"/>
          <path d="M20.5 7 C20 5, 21 3.5, 22 5.3"         stroke={ink} strokeWidth={sw2} strokeLinecap="round" fill="none"/>
          <path d="M23 8 C23 6, 23.5 4.5, 24 6"           stroke={ink} strokeWidth={sw3+0.15} strokeLinecap="round" fill="none" opacity=".7"/>
          <path d="M15 8.5 C14.5 7, 15 5.5, 16.5 6.5"     stroke={ink} strokeWidth={sw3+0.1}  strokeLinecap="round" fill="none" opacity=".58"/>
        </g>

        {/* ── LEFT EYE (blinks) ── */}
        <g style={isStatic ? undefined : {
          transformOrigin: '14.5px 14px',
          animation: 'ad-blink 5s ease-in-out infinite 1.2s',
        }}>
          <circle cx="14.5" cy="14" r="3.8" fill={badge} stroke={ink} strokeWidth={sw2}/>
          <circle cx="14.5" cy="14" r="2.4" fill={badge} stroke={ink} strokeWidth={sw3+0.1}/>
          <circle cx="14.5" cy="14.3" r="1.2" fill={ink}/>
          <ellipse cx="13" cy="12.5" rx="1.1" ry="0.75"
            fill={badge} stroke="none" transform="rotate(-30 13 12.5)"/>
          <circle cx="15.5" cy="12.5" r="0.55" fill={badge}/>
        </g>

        {/* ── RIGHT EYE ── */}
        <g style={isStatic ? undefined : {
          transformOrigin: '25.5px 14px',
          animation: 'ad-blink 5s ease-in-out infinite 1.27s',
        }}>
          <circle cx="25.5" cy="14" r="3.8" fill={badge} stroke={ink} strokeWidth={sw2}/>
          <circle cx="25.5" cy="14" r="2.4" fill={badge} stroke={ink} strokeWidth={sw3+0.1}/>
          <circle cx="25.5" cy="14.3" r="1.2" fill={ink}/>
          <ellipse cx="24" cy="12.5" rx="1.1" ry="0.75"
            fill={badge} stroke="none" transform="rotate(-30 24 12.5)"/>
          <circle cx="26.5" cy="12.5" r="0.55" fill={badge}/>
        </g>

        {/* ── MUZZLE / SNOUT ── */}
        <ellipse cx="20" cy="22" rx="6" ry="5" fill={badge} stroke={ink} strokeWidth={sw2}/>
        <path d="M15 19 Q20 18 25 19"
          stroke={ink} strokeWidth={sw3} strokeLinecap="round" fill="none"/>

        {/* ── NOSE ── */}
        <ellipse cx="20" cy="18.5" rx="2.2" ry="1.65" fill={ink}/>
        <ellipse cx="19.3" cy="17.75" rx="0.65" ry="0.5" fill={badge} opacity=".5"/>

        {/* ── SMILE ── */}
        <path d="M15.5 24 Q20 27 24.5 24"
          stroke={ink} strokeWidth={sw2} strokeLinecap="round" fill="none"/>

        {/* ── TONGUE (bobs) ── */}
        <g style={isStatic ? undefined : { animation: 'ad-tongue 2.2s ease-in-out infinite .8s' }}>
          <ellipse cx="20" cy="28" rx="2.6" ry="2.4" fill={t1}/>
          <ellipse cx="20" cy="30" rx="2.6" ry="0.9" fill={t2}/>
          <line x1="20" y1="25.8" x2="20" y2="30.5"
            stroke={t2} strokeWidth=".9" strokeLinecap="round"/>
        </g>

        {/* ── COLLAR (light indigo accent) ── */}
        <path d="M12.5 27 Q20 29.8 27.5 27"
          stroke={col} strokeWidth="2.3" strokeLinecap="round" fill="none"/>
        <circle cx="20" cy="29.8" r="1.6" fill={col}/>
        {/* 4-pointed star tag */}
        <path
          d="M20 28.5 L20.32 29.48 L21.3 29.8 L20.32 30.12 L20 31.1 L19.68 30.12 L18.7 29.8 L19.68 29.48 Z"
          fill={badge} opacity=".82"/>

        {/* ── PREMIUM SPARKLE GLINT ── */}
        <g style={isStatic
          ? { opacity: 0 }
          : { transformOrigin: '30px 8px', animation: 'ad-glint 8s ease-in-out infinite 2.5s', opacity: 0 }
        }>
          <path d="M30 6 L30.5 7.8 L32.2 8 L30.5 8.2 L30 10 L29.5 8.2 L27.8 8 L29.5 7.8 Z"
            fill={ink} opacity=".9"/>
        </g>
      </g>
    </svg>
  )

  if (variant === 'icon') return Icon

  // Full variant: badge icon + wordmark
  const ts = Math.round(size * 0.36)
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      {Icon}
      <span style={{ fontSize: ts, lineHeight: 1, letterSpacing: '0.09em', fontWeight: 900 }}>
        <span style={{ color: dark ? 'white' : '#111827' }}>APPY</span>
        <span style={{ color: dark ? '#818cf8' : '#4f46e5' }}>DOER</span>
      </span>
    </div>
  )
}
