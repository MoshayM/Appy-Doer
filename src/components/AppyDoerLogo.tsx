'use client'

/**
 * AppyDoer logo — gray puppy, 3/4 side view matching puppy.PNG.
 * Transparent background. Full gray palette.
 * Gentle premium animations: tail wag · ear sway · eye blink.
 * All other parts are completely static.
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

  // Full gray palette — transparent background
  const body  = '#d1d5db'   // light gray — main body fill
  const ink   = '#5c6370'   // medium-dark gray — outlines
  const iris  = '#9ca3af'   // mid gray — eye iris
  const eye   = '#f3f4f6'   // near-white — eye sclera / reflections
  const dark_ = '#2d3748'   // dark gray — nose, pupils, dark accents
  const collar= '#9ca3af'   // collar band
  const sw    = 2.6          // main stroke width
  const sw2   = 1.9          // secondary stroke
  const sw3   = 1.1          // fine detail

  // ViewBox 0 0 180 206 — matches puppy.PNG 3/4-view proportions
  const h = Math.round(size * 206 / 180)

  const Icon = (
    <svg
      width={size}
      height={h}
      viewBox="0 0 180 206"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AppyDoer"
      role="img"
      className="flex-shrink-0 select-none"
    >
      {!isStatic && (
        <style>{`
          /* Tail — main wag, 1s, clearly visible */
          @keyframes ad-tail {
            0%,100% { transform: rotate(-13deg); }
            50%      { transform: rotate(13deg);  }
          }
          /* Left ear — very gentle sway, 3.6s */
          @keyframes ad-ear-l {
            0%,100% { transform: rotate(-4deg); }
            50%      { transform: rotate(4deg);  }
          }
          /* Right ear — opposite phase, 4.2s */
          @keyframes ad-ear-r {
            0%,100% { transform: rotate(4deg); }
            50%      { transform: rotate(-4deg); }
          }
          /* Eye blink — rare, quick, premium feel */
          @keyframes ad-blink {
            0%,85%,96%,100% { transform: scaleY(1);    }
            90%              { transform: scaleY(0.06); }
            93%              { transform: scaleY(1);    }
          }
        `}</style>
      )}

      {/* ══════════════════════════════════════
          Z-ORDER (back → front):
          ears → body → back-paw → tail → front-paws → head → face
          ══════════════════════════════════════ */}

      {/* ── LEFT EAR (droops forward-left, animated gentle sway) ── */}
      <g style={isStatic
        ? undefined
        : { transformOrigin: '58px 44px', animation: 'ad-ear-l 3.6s ease-in-out infinite' }
      }>
        <path
          d="M58 44 C46 30, 20 38, 18 64
             C16 88, 28 106, 48 108
             C62 110, 68 94, 64 78
             C60 64, 58 56, 58 44 Z"
          fill={body} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
        />
        {/* Ear fur lines */}
        <path d="M26 54 Q28 72 26 90"  stroke={ink} strokeWidth={sw3} strokeLinecap="round" fill="none" opacity=".48"/>
        <path d="M34 50 Q36 68 35 86"  stroke={ink} strokeWidth={sw3} strokeLinecap="round" fill="none" opacity=".44"/>
        <path d="M42 48 Q44 64 43 80"  stroke={ink} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity=".38"/>
      </g>

      {/* ── RIGHT EAR (droops right/back, opposite sway) ── */}
      <g style={isStatic
        ? undefined
        : { transformOrigin: '122px 44px', animation: 'ad-ear-r 4.2s ease-in-out infinite', animationDelay: '-1.1s' }
      }>
        <path
          d="M122 44 C134 30, 160 38, 162 64
             C164 88, 152 106, 132 108
             C118 110, 112 94, 116 78
             C120 64, 122 56, 122 44 Z"
          fill={body} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
        />
        <path d="M154 54 Q152 72 154 90" stroke={ink} strokeWidth={sw3} strokeLinecap="round" fill="none" opacity=".48"/>
        <path d="M146 50 Q144 68 145 86" stroke={ink} strokeWidth={sw3} strokeLinecap="round" fill="none" opacity=".44"/>
        <path d="M138 48 Q136 64 137 80" stroke={ink} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity=".38"/>
      </g>

      {/* ── BODY ── */}
      <ellipse cx="92" cy="150" rx="50" ry="40" fill={body} stroke={ink} strokeWidth={sw}/>
      {/* Chest marking (oval spot like puppy.PNG) */}
      <ellipse cx="80" cy="140" rx="17" ry="13"
        fill="none" stroke={ink} strokeWidth={sw3} opacity=".55"/>
      {/* Body fur swirls */}
      <path d="M70 155 Q76 164 72 170" stroke={ink} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".42"/>
      <path d="M88 153 Q94 162 90 167" stroke={ink} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".42"/>

      {/* ── BACK PAW (right side, lower opacity = depth) ── */}
      <path d="M136 168 Q138 182 140 190" stroke={ink} strokeWidth={sw2} strokeLinecap="round" fill="none" opacity=".78"/>
      <ellipse cx="140" cy="197" rx="14" ry="8.5" fill={body} stroke={ink} strokeWidth="2.1" opacity=".78"/>
      <circle cx="131" cy="190" r="4.2" fill={body} stroke={ink} strokeWidth="1.7" opacity=".78"/>
      <circle cx="140" cy="189" r="4.2" fill={body} stroke={ink} strokeWidth="1.7" opacity=".78"/>
      <circle cx="149" cy="190" r="4.2" fill={body} stroke={ink} strokeWidth="1.7" opacity=".78"/>

      {/* ── TAIL (only wags — rotate ±13° around base) ── */}
      <g style={isStatic
        ? { transform: 'rotate(-10deg)', transformOrigin: '150px 126px' }
        : { transformOrigin: '150px 126px', animation: 'ad-tail 1.0s ease-in-out infinite' }
      }>
        <path
          d="M150 126 C156 112, 168 108, 172 118
             C176 130, 168 142, 158 143
             C152 144, 148 136, 150 126 Z"
          fill={body} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
        />
        {/* Inner curl detail */}
        <path d="M167 110 C172 120, 170 133, 164 143"
          stroke={ink} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity=".52"/>
      </g>

      {/* ── FRONT-LEFT PAW (forward leg) ── */}
      <path d="M64 162 Q66 178 67 190" stroke={ink} strokeWidth={sw} strokeLinecap="round" fill="none"/>
      <ellipse cx="67" cy="197" rx="17" ry="9.5" fill={body} stroke={ink} strokeWidth={sw2}/>
      <circle cx="55"  cy="191" r="4.8" fill={body} stroke={ink} strokeWidth="1.9"/>
      <circle cx="66"  cy="190" r="4.8" fill={body} stroke={ink} strokeWidth="1.9"/>
      <circle cx="77"  cy="191" r="4.8" fill={body} stroke={ink} strokeWidth="1.9"/>

      {/* ── FRONT-RIGHT PAW (slightly behind) ── */}
      <path d="M90 163 Q92 179 94 190" stroke={ink} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".94"/>
      <ellipse cx="94" cy="197" rx="16" ry="9" fill={body} stroke={ink} strokeWidth="2.2" opacity=".94"/>
      <circle cx="83"  cy="191" r="4.5" fill={body} stroke={ink} strokeWidth="1.8" opacity=".94"/>
      <circle cx="94"  cy="190" r="4.5" fill={body} stroke={ink} strokeWidth="1.8" opacity=".94"/>
      <circle cx="105" cy="191" r="4.5" fill={body} stroke={ink} strokeWidth="1.8" opacity=".94"/>

      {/* ── HEAD (over ear bases) ── */}
      <circle cx="90" cy="70" r="44" fill={body} stroke={ink} strokeWidth={sw}/>

      {/* ── HAIR TUFT ── */}
      <path d="M84 28 C83 22, 85 18, 87 23"  stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <path d="M91 26 C90 20, 92 16, 94 21"  stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      <path d="M97 29 C97 23, 98 19, 99 24"  stroke={ink} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity=".78"/>
      <path d="M78 31 C77 26, 78 23, 80 27"  stroke={ink} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".65"/>

      {/* ── LEFT EYE ── */}
      {/* Outer sclera (static) */}
      <circle cx="76" cy="65" r="18" fill={eye} stroke={ink} strokeWidth={sw}/>
      {/* Iris + pupil + reflection — blinks via scaleY from eye top */}
      <g style={isStatic
        ? undefined
        : { transformOrigin: '76px 47px', animation: 'ad-blink 7s linear infinite' }
      }>
        <circle cx="76" cy="65" r="11.5" fill={iris} stroke={ink} strokeWidth={sw2}/>
        <circle cx="77" cy="66" r="5.8"  fill={dark_}/>
        <ellipse cx="73" cy="61" rx="4.0" ry="2.5" fill={eye} transform="rotate(-20 73 61)"/>
        <circle  cx="81" cy="61" r="1.7"  fill={eye}/>
      </g>
      {/* Eyebrow expression arc */}
      <path d="M63 51 Q76 47 90 51" stroke={ink} strokeWidth="1.9" strokeLinecap="round" fill="none"/>

      {/* ── RIGHT EYE ── */}
      <circle cx="108" cy="63" r="16" fill={eye} stroke={ink} strokeWidth={sw}/>
      <g style={isStatic
        ? undefined
        : { transformOrigin: '108px 47px', animation: 'ad-blink 7s linear infinite', animationDelay: '-0.18s' }
      }>
        <circle cx="108" cy="63" r="10"  fill={iris} stroke={ink} strokeWidth="1.9"/>
        <circle cx="109" cy="64" r="5.0" fill={dark_}/>
        <ellipse cx="105" cy="59.5" rx="3.4" ry="2.1" fill={eye} transform="rotate(-20 105 59.5)"/>
        <circle  cx="113" cy="59"   r="1.5" fill={eye}/>
      </g>
      <path d="M96 49 Q108 45 120 49" stroke={ink} strokeWidth="1.7" strokeLinecap="round" fill="none"/>

      {/* ── MUZZLE / SNOUT ── */}
      <ellipse cx="88" cy="103" rx="29" ry="23" fill="#e5e7eb" stroke={ink} strokeWidth={sw2}/>
      {/* Face-muzzle ridge line */}
      <path d="M65 91 Q88 87 113 91" stroke={ink} strokeWidth="1.4" strokeLinecap="round" fill="none"/>

      {/* ── NOSE ── */}
      <ellipse cx="92" cy="92" rx="10" ry="8" fill={dark_}/>
      <ellipse cx="89" cy="90" rx="3.0" ry="1.9" fill={iris} opacity=".42"/>

      {/* ── SMILE ── */}
      <path d="M68 109 Q88 122 109 109"
        stroke={ink} strokeWidth={sw} strokeLinecap="round" fill="none"/>

      {/* ── COLLAR (with tag — matches puppy.PNG) ── */}
      <ellipse cx="90" cy="117" rx="31" ry="9.5"
        fill={collar} stroke={ink} strokeWidth={sw2} opacity=".88"/>
      {/* Collar tag */}
      <circle cx="90" cy="130" r="7.5"
        fill={body} stroke={ink} strokeWidth={sw2}/>
    </svg>
  )

  if (variant === 'icon') return Icon

  const ts = Math.round(size * 0.36)
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      {Icon}
      <span style={{ fontSize: ts, lineHeight: 1, letterSpacing: '0.09em', fontWeight: 900 }}>
        <span style={{ color: dark ? '#f9fafb' : '#111827' }}>APPY</span>
        <span style={{ color: dark ? '#c0c0c0' : '#4b5563' }}>DOER</span>
      </span>
    </div>
  )
}
