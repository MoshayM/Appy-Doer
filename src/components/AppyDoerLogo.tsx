'use client'

/**
 * AppyDoer logo — gray chibi puppy matching puppy.PNG.
 * Standing pose, looking left (3/4 view).
 * Transparent background. Full gray palette.
 *
 * Fixed from "elephant" look:
 *  - Ears now droop DOWN (not spread wide like elephant flaps)
 *  - Big chibi head, smaller body beneath
 *  - Proper 4-leg standing pose
 *  - Narrow ear overhang (~22px each side vs 70px before)
 *
 * 3 gentle premium animations: tail wag · ear sway · eye blink
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

  /* Gray palette — all elements, no background */
  const body  = '#d1d5db'   // light gray
  const ink   = '#4b5563'   // dark outline
  const irisC = '#9ca3af'   // iris / collar
  const eyeW  = '#f3f4f6'   // sclera / reflections
  const dark_ = '#1f2937'   // pupil / nose
  const sw    = 2.5

  /* ViewBox 0 0 200 210 → slight portrait ratio matching puppy.PNG */
  const h = Math.round(size * 210 / 200)

  const Icon = (
    <svg
      width={size}
      height={h}
      viewBox="0 0 200 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AppyDoer"
      role="img"
      className="flex-shrink-0 select-none"
    >
      {!isStatic && (
        <style>{`
          /* Tail — main wag, clearly visible */
          @keyframes ad-tail {
            0%,100% { transform: rotate(-13deg); }
            50%      { transform: rotate(13deg);  }
          }
          /* Ears — very gentle, opposite phase */
          @keyframes ad-ear-l {
            0%,100% { transform: rotate(-4deg); }
            50%      { transform: rotate(4deg);  }
          }
          @keyframes ad-ear-r {
            0%,100% { transform: rotate(4deg);  }
            50%      { transform: rotate(-4deg); }
          }
          /* Eyes — rare blink, premium feel (once per ~7s) */
          @keyframes ad-blink {
            0%,85%,96%,100% { transform: scaleY(1);    }
            90%              { transform: scaleY(0.06); }
            93%              { transform: scaleY(1);    }
          }
        `}</style>
      )}

      {/* ═══════════════════════════════════════
          Z-ORDER: ears → body → back-legs →
                   tail → front-legs → head → face
          ═══════════════════════════════════════ */}

      {/* ── LEFT EAR
          Hangs DOWN beside head (NOT wide — narrow drooping flap).
          Widest point extends only ~22px left of head edge.
          Attachment: (58,46). Tip reaches y≈116. ── */}
      <g style={isStatic
        ? undefined
        : { transformOrigin: '58px 46px', animation: 'ad-ear-l 3.6s ease-in-out infinite' }
      }>
        <path
          d="M58 46
             C50 36, 28 44, 26 66
             C24 88, 34 112, 54 116
             C66 120, 72 106, 68 90
             C64 76, 61 60, 58 46 Z"
          fill={body} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
        />
        {/* Fur lines inside ear */}
        <path d="M34 56 Q36 74 34 94"  stroke={ink} strokeWidth="1.0" strokeLinecap="round" fill="none" opacity=".44"/>
        <path d="M42 52 Q44 70 43 88"  stroke={ink} strokeWidth="0.95" strokeLinecap="round" fill="none" opacity=".40"/>
        <path d="M50 50 Q52 66 51 82"  stroke={ink} strokeWidth="0.9"  strokeLinecap="round" fill="none" opacity=".35"/>
      </g>

      {/* ── RIGHT EAR (slightly narrower — far side in 3/4 view) ── */}
      <g style={isStatic
        ? undefined
        : { transformOrigin: '122px 46px', animation: 'ad-ear-r 4.2s ease-in-out infinite', animationDelay: '-1.1s' }
      }>
        <path
          d="M122 46
             C130 36, 152 44, 154 66
             C156 88, 146 112, 126 116
             C114 120, 108 106, 112 90
             C116 76, 119 60, 122 46 Z"
          fill={body} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
        />
        <path d="M144 56 Q142 74 144 94" stroke={ink} strokeWidth="1.0" strokeLinecap="round" fill="none" opacity=".44"/>
        <path d="M136 52 Q134 70 135 88" stroke={ink} strokeWidth="0.95" strokeLinecap="round" fill="none" opacity=".40"/>
        <path d="M128 50 Q126 66 127 82" stroke={ink} strokeWidth="0.9"  strokeLinecap="round" fill="none" opacity=".35"/>
      </g>

      {/* ── BODY (horizontal oval — standing pose, 3/4 left-facing) ── */}
      <ellipse cx="104" cy="144" rx="50" ry="31"
        fill={body} stroke={ink} strokeWidth={sw}/>
      {/* Chest marking (oval spot matching puppy.PNG) */}
      <ellipse cx="82" cy="136" rx="16" ry="13"
        fill="none" stroke={ink} strokeWidth="1.1" opacity=".52"/>
      {/* Chest fur swirls */}
      <path d="M74 150 Q80 158 76 163" stroke={ink} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".40"/>
      <path d="M92 148 Q98 156 94 161" stroke={ink} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".40"/>

      {/* ── BACK LEGS (right side, slightly dimmer = depth) ── */}
      {/* Back-right leg */}
      <path d="M140 168 Q141 184 142 195" stroke={ink} strokeWidth="2.1" strokeLinecap="round" fill="none" opacity=".66"/>
      <ellipse cx="142" cy="200" rx="12" ry="7"  fill={body} stroke={ink} strokeWidth="1.9" opacity=".66"/>
      <circle cx="133" cy="194" r="3.6" fill={body} stroke={ink} strokeWidth="1.6" opacity=".66"/>
      <circle cx="141" cy="193" r="3.6" fill={body} stroke={ink} strokeWidth="1.6" opacity=".66"/>
      <circle cx="149" cy="194" r="3.6" fill={body} stroke={ink} strokeWidth="1.6" opacity=".66"/>
      {/* Back-left leg */}
      <path d="M118 169 Q119 184 120 195" stroke={ink} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity=".78"/>
      <ellipse cx="120" cy="200" rx="13" ry="7.5" fill={body} stroke={ink} strokeWidth="2.0" opacity=".78"/>
      <circle cx="111" cy="193" r="3.8" fill={body} stroke={ink} strokeWidth="1.7" opacity=".78"/>
      <circle cx="120" cy="192" r="3.8" fill={body} stroke={ink} strokeWidth="1.7" opacity=".78"/>
      <circle cx="129" cy="193" r="3.8" fill={body} stroke={ink} strokeWidth="1.7" opacity=".78"/>

      {/* ── TAIL (J-curl at upper-right of body — only animated element among statics) ── */}
      <g style={isStatic
        ? { transform: 'rotate(-10deg)', transformOrigin: '148px 126px' }
        : { transformOrigin: '148px 126px', animation: 'ad-tail 1.0s ease-in-out infinite' }
      }>
        <path
          d="M148 126
             C154 113, 165 109, 169 119
             C173 130, 167 142, 157 143
             C150 144, 146 136, 148 126 Z"
          fill={body} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
        />
        <path d="M164 111 C169 121, 167 133, 161 143"
          stroke={ink} strokeWidth="1.0" strokeLinecap="round" fill="none" opacity=".50"/>
      </g>

      {/* ── FRONT LEGS (forward pair, fully visible) ── */}
      {/* Front-right leg */}
      <path d="M93 169 Q94 184 95 195"  stroke={ink} strokeWidth="2.3" strokeLinecap="round" fill="none" opacity=".92"/>
      <ellipse cx="95" cy="201" rx="14" ry="8.5" fill={body} stroke={ink} strokeWidth="2.1" opacity=".92"/>
      <circle cx="85"  cy="194" r="4.2" fill={body} stroke={ink} strokeWidth="1.7" opacity=".92"/>
      <circle cx="95"  cy="193" r="4.2" fill={body} stroke={ink} strokeWidth="1.7" opacity=".92"/>
      <circle cx="105" cy="194" r="4.2" fill={body} stroke={ink} strokeWidth="1.7" opacity=".92"/>
      {/* Front-left leg */}
      <path d="M70 168 Q70 184 71 195"  stroke={ink} strokeWidth="2.4" strokeLinecap="round" fill="none"/>
      <ellipse cx="71" cy="201" rx="15" ry="9"   fill={body} stroke={ink} strokeWidth="2.2"/>
      <circle cx="60"  cy="194" r="4.5" fill={body} stroke={ink} strokeWidth="1.9"/>
      <circle cx="71"  cy="193" r="4.5" fill={body} stroke={ink} strokeWidth="1.9"/>
      <circle cx="82"  cy="194" r="4.5" fill={body} stroke={ink} strokeWidth="1.9"/>

      {/* ── HEAD (large chibi — over ear bases) ── */}
      <circle cx="90" cy="70" r="46" fill={body} stroke={ink} strokeWidth={sw}/>

      {/* ── HAIR TUFT ── */}
      <path d="M84 26 C83 20, 85 16, 87 22"  stroke={ink} strokeWidth="2.1" strokeLinecap="round" fill="none"/>
      <path d="M91 24 C90 18, 92 14, 94 20"  stroke={ink} strokeWidth="2.1" strokeLinecap="round" fill="none"/>
      <path d="M98 27 C98 22, 99 18, 100 23" stroke={ink} strokeWidth="1.7" strokeLinecap="round" fill="none" opacity=".78"/>
      <path d="M77 30 C76 25, 77 22, 79 26"  stroke={ink} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".65"/>

      {/* ── LEFT EYE (larger — near-side eye) ── */}
      <circle cx="74" cy="63" r="18" fill={eyeW} stroke={ink} strokeWidth={sw}/>
      <g style={isStatic
        ? undefined
        : { transformOrigin: '74px 45px', animation: 'ad-blink 7s linear infinite' }
      }>
        <circle cx="74" cy="63" r="11.5" fill={irisC} stroke={ink} strokeWidth="1.9"/>
        <circle cx="75" cy="64" r="5.8"  fill={dark_}/>
        <ellipse cx="71" cy="59" rx="4.0" ry="2.5" fill={eyeW} transform="rotate(-22 71 59)"/>
        <circle  cx="80" cy="59" r="1.7"  fill={eyeW}/>
      </g>
      {/* Left eyebrow */}
      <path d="M60 49 Q74 45 88 49" stroke={ink} strokeWidth="1.9" strokeLinecap="round" fill="none"/>

      {/* ── RIGHT EYE (slightly smaller — far-side eye in 3/4) ── */}
      <circle cx="108" cy="61" r="16" fill={eyeW} stroke={ink} strokeWidth={sw}/>
      <g style={isStatic
        ? undefined
        : { transformOrigin: '108px 45px', animation: 'ad-blink 7s linear infinite', animationDelay: '-0.18s' }
      }>
        <circle cx="108" cy="61" r="10.2" fill={irisC} stroke={ink} strokeWidth="1.7"/>
        <circle cx="109" cy="62" r="5.0"  fill={dark_}/>
        <ellipse cx="105" cy="57.5" rx="3.4" ry="2.1" fill={eyeW} transform="rotate(-22 105 57.5)"/>
        <circle  cx="113" cy="57"   r="1.5"  fill={eyeW}/>
      </g>
      {/* Right eyebrow */}
      <path d="M95 47 Q108 43 121 47" stroke={ink} strokeWidth="1.7" strokeLinecap="round" fill="none"/>

      {/* ── MUZZLE / SNOUT ── */}
      <ellipse cx="84" cy="101" rx="27" ry="22" fill="#e9eaec" stroke={ink} strokeWidth="2.2"/>
      {/* Face-muzzle ridge */}
      <path d="M63 90 Q84 86 108 90" stroke={ink} strokeWidth="1.3" strokeLinecap="round" fill="none"/>

      {/* ── NOSE ── */}
      <ellipse cx="88" cy="91" rx="9.5" ry="7.5" fill={dark_}/>
      <ellipse cx="85" cy="89" rx="2.8"  ry="1.8"  fill={irisC} opacity=".38"/>

      {/* ── SMILE ── */}
      <path d="M64 107 Q84 121 105 107"
        stroke={ink} strokeWidth={sw} strokeLinecap="round" fill="none"/>

      {/* ── COLLAR + TAG (matching puppy.PNG) ── */}
      <ellipse cx="90" cy="118" rx="32" ry="9"
        fill={irisC} stroke={ink} strokeWidth="2.1" opacity=".86"/>
      <circle cx="90" cy="130" r="7"
        fill={body} stroke={ink} strokeWidth="2.0"/>
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
