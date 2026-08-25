'use client'

/**
 * AppyDoer logo — gray chibi puppy, matching puppy.PNG proportions.
 * Faces RIGHT toward the app name.
 * Transparent background. Full gray palette.
 *
 * Key design decisions (to avoid duck/elephant look):
 *  - Muzzle is SMALL + CIRCULAR (rx=19, ry=17), not wide like a duck bill
 *  - Ears droop DOWN, only ~21 units beyond head edge (not elephant-wide)
 *  - Head large chibi (r=44), body smaller (rx=50, ry=34)
 *  - All built facing LEFT, then flipped RIGHT via SVG scale(-1,1) transform
 *
 * Animations: tail wag · ear sway · eye blink (others static)
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

  /* Gray palette */
  const body   = '#d1d5db'   // main fill
  const ink    = '#4b5563'   // outline
  const irisC  = '#9ca3af'   // iris / collar
  const eyeW   = '#f3f4f6'   // sclera / reflection
  const dark_  = '#1f2937'   // nose / pupil
  const muzzleF= '#e9eaec'   // muzzle slightly lighter
  const sw     = 2.5

  const h = Math.round(size * 208 / 200)

  const Icon = (
    <svg
      width={size}
      height={h}
      viewBox="0 0 200 208"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AppyDoer"
      role="img"
      className="flex-shrink-0 select-none"
    >
      {!isStatic && (
        <style>{`
          @keyframes ad-tail {
            0%,100% { transform: rotate(-13deg); }
            50%      { transform: rotate(13deg);  }
          }
          @keyframes ad-ear-l {
            0%,100% { transform: rotate(-4deg); }
            50%      { transform: rotate(4deg);  }
          }
          @keyframes ad-ear-r {
            0%,100% { transform: rotate(4deg);  }
            50%      { transform: rotate(-4deg); }
          }
          @keyframes ad-blink {
            0%,85%,96%,100% { transform: scaleY(1);    }
            90%              { transform: scaleY(0.06); }
            93%              { transform: scaleY(1);    }
          }
        `}</style>
      )}

      {/*
        Everything is drawn facing LEFT then flipped RIGHT via this transform.
        The flip mirrors about x=100, so the puppy naturally faces toward
        the "APPYDOER" text that appears to the right of the icon.
        CSS animation transform-origins work correctly in the flipped space.
      */}
      <g transform="scale(-1 1) translate(-200 0)">

        {/* ── LEFT EAR — droops DOWN beside head, ~21px beyond head edge ── */}
        <g style={isStatic
          ? undefined
          : { transformOrigin: '60px 44px', animation: 'ad-ear-l 3.6s ease-in-out infinite' }
        }>
          <path
            d="M60 44
               C50 32, 27 40, 25 64
               C23 86, 33 110, 52 116
               C65 120, 70 107, 66 90
               C62 75, 61 58, 60 44 Z"
            fill={body} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
          />
          <path d="M34 56 Q36 74 34 96"  stroke={ink} strokeWidth="1.0" strokeLinecap="round" fill="none" opacity=".40"/>
          <path d="M42 52 Q44 70 43 89"  stroke={ink} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity=".36"/>
          <path d="M50 50 Q52 66 51 83"  stroke={ink} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity=".32"/>
        </g>

        {/* ── RIGHT EAR ── */}
        <g style={isStatic
          ? undefined
          : { transformOrigin: '120px 44px', animation: 'ad-ear-r 4.2s ease-in-out infinite', animationDelay: '-1.1s' }
        }>
          <path
            d="M120 44
               C130 32, 153 40, 155 64
               C157 86, 147 110, 128 116
               C115 120, 110 107, 114 90
               C118 75, 119 58, 120 44 Z"
            fill={body} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
          />
          <path d="M146 56 Q144 74 146 96" stroke={ink} strokeWidth="1.0" strokeLinecap="round" fill="none" opacity=".40"/>
          <path d="M138 52 Q136 70 137 89" stroke={ink} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity=".36"/>
          <path d="M130 50 Q128 66 129 83" stroke={ink} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity=".32"/>
        </g>

        {/* ── BODY (horizontal oval, 3/4 view) ── */}
        <ellipse cx="100" cy="148" rx="50" ry="34"
          fill={body} stroke={ink} strokeWidth={sw}/>
        {/* Chest marking (matches puppy.PNG) */}
        <ellipse cx="86" cy="140" rx="16" ry="12"
          fill="none" stroke={ink} strokeWidth="1.1" opacity=".50"/>
        <path d="M76 153 Q82 161 78 166" stroke={ink} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".38"/>
        <path d="M92 151 Q98 159 94 164" stroke={ink} strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".38"/>

        {/* ── BACK LEGS (right/far side — dimmer = depth) ── */}
        <path d="M140 170 Q141 184 142 196" stroke={ink} strokeWidth="2.0" strokeLinecap="round" fill="none" opacity=".60"/>
        <ellipse cx="142" cy="201" rx="12" ry="7"   fill={body} stroke={ink} strokeWidth="1.8" opacity=".60"/>
        <circle cx="133" cy="195" r="3.5" fill={body} stroke={ink} strokeWidth="1.5" opacity=".60"/>
        <circle cx="142" cy="194" r="3.5" fill={body} stroke={ink} strokeWidth="1.5" opacity=".60"/>
        <circle cx="151" cy="195" r="3.5" fill={body} stroke={ink} strokeWidth="1.5" opacity=".60"/>

        <path d="M118 171 Q119 184 120 196" stroke={ink} strokeWidth="2.1" strokeLinecap="round" fill="none" opacity=".74"/>
        <ellipse cx="120" cy="201" rx="13" ry="7.5" fill={body} stroke={ink} strokeWidth="1.9" opacity=".74"/>
        <circle cx="110" cy="194" r="3.8" fill={body} stroke={ink} strokeWidth="1.6" opacity=".74"/>
        <circle cx="120" cy="193" r="3.8" fill={body} stroke={ink} strokeWidth="1.6" opacity=".74"/>
        <circle cx="130" cy="194" r="3.8" fill={body} stroke={ink} strokeWidth="1.6" opacity=".74"/>

        {/* ── TAIL (upper-right of body, will flip to upper-left) ── */}
        <g style={isStatic
          ? { transform: 'rotate(-10deg)', transformOrigin: '152px 128px' }
          : { transformOrigin: '152px 128px', animation: 'ad-tail 1.0s ease-in-out infinite' }
        }>
          <path
            d="M152 128
               C157 115, 168 112, 171 122
               C174 132, 168 143, 158 144
               C151 145, 149 137, 152 128 Z"
            fill={body} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
          />
          <path d="M167 114 C172 124, 170 136, 164 143"
            stroke={ink} strokeWidth="1.0" strokeLinecap="round" fill="none" opacity=".48"/>
        </g>

        {/* ── FRONT LEGS (left/near side — full opacity) ── */}
        <path d="M94 170 Q95 184 96 196"  stroke={ink} strokeWidth="2.3" strokeLinecap="round" fill="none" opacity=".92"/>
        <ellipse cx="96" cy="201" rx="14" ry="8.5" fill={body} stroke={ink} strokeWidth="2.1" opacity=".92"/>
        <circle cx="86"  cy="194" r="4.2" fill={body} stroke={ink} strokeWidth="1.7" opacity=".92"/>
        <circle cx="96"  cy="193" r="4.2" fill={body} stroke={ink} strokeWidth="1.7" opacity=".92"/>
        <circle cx="106" cy="194" r="4.2" fill={body} stroke={ink} strokeWidth="1.7" opacity=".92"/>

        <path d="M70 169 Q70 183 71 196"  stroke={ink} strokeWidth="2.4" strokeLinecap="round" fill="none"/>
        <ellipse cx="71" cy="201" rx="15" ry="9"   fill={body} stroke={ink} strokeWidth="2.2"/>
        <circle cx="60"  cy="194" r="4.5" fill={body} stroke={ink} strokeWidth="1.9"/>
        <circle cx="71"  cy="193" r="4.5" fill={body} stroke={ink} strokeWidth="1.9"/>
        <circle cx="82"  cy="194" r="4.5" fill={body} stroke={ink} strokeWidth="1.9"/>

        {/* ── HEAD (large chibi, over ear bases) ── */}
        <circle cx="90" cy="68" r="44" fill={body} stroke={ink} strokeWidth={sw}/>

        {/* ── HAIR TUFT ── */}
        <path d="M84 26 C83 20, 85 16, 87 22"  stroke={ink} strokeWidth="2.1" strokeLinecap="round" fill="none"/>
        <path d="M91 24 C90 18, 92 14, 94 20"  stroke={ink} strokeWidth="2.1" strokeLinecap="round" fill="none"/>
        <path d="M98 27 C98 22, 99 18, 100 23" stroke={ink} strokeWidth="1.7" strokeLinecap="round" fill="none" opacity=".76"/>
        <path d="M77 30 C76 25, 77 22, 79 26"  stroke={ink} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".64"/>

        {/* ── LEFT EYE (bigger — near side) ── */}
        <circle cx="74" cy="64" r="17" fill={eyeW} stroke={ink} strokeWidth={sw}/>
        <g style={isStatic
          ? undefined
          : { transformOrigin: '74px 47px', animation: 'ad-blink 7s linear infinite' }
        }>
          <circle cx="74" cy="64" r="11" fill={irisC} stroke={ink} strokeWidth="1.9"/>
          <circle cx="75" cy="65" r="5.5" fill={dark_}/>
          <ellipse cx="71" cy="60" rx="3.8" ry="2.4" fill={eyeW} transform="rotate(-22 71 60)"/>
          <circle  cx="79" cy="59" r="1.6"  fill={eyeW}/>
        </g>
        <path d="M60 50 Q74 46 88 50" stroke={ink} strokeWidth="1.9" strokeLinecap="round" fill="none"/>

        {/* ── RIGHT EYE (smaller — far side) ── */}
        <circle cx="108" cy="62" r="15" fill={eyeW} stroke={ink} strokeWidth={sw}/>
        <g style={isStatic
          ? undefined
          : { transformOrigin: '108px 47px', animation: 'ad-blink 7s linear infinite', animationDelay: '-0.18s' }
        }>
          <circle cx="108" cy="62" r="9.5" fill={irisC} stroke={ink} strokeWidth="1.7"/>
          <circle cx="109" cy="63" r="4.8" fill={dark_}/>
          <ellipse cx="105.5" cy="58.5" rx="3.2" ry="2.0" fill={eyeW} transform="rotate(-22 105.5 58.5)"/>
          <circle  cx="113"   cy="58"   r="1.4"  fill={eyeW}/>
        </g>
        <path d="M95 48 Q108 44 121 48" stroke={ink} strokeWidth="1.7" strokeLinecap="round" fill="none"/>

        {/* ── MUZZLE — SMALL CIRCLE (not wide oval = no duck bill) ── */}
        <ellipse cx="82" cy="98" rx="19" ry="17"
          fill={muzzleF} stroke={ink} strokeWidth="2.2"/>
        {/* Face-to-muzzle ridge */}
        <path d="M68 87 Q82 83 98 87"
          stroke={ink} strokeWidth="1.2" strokeLinecap="round" fill="none"/>

        {/* ── NOSE (dark oval, at front of muzzle) ── */}
        <ellipse cx="75" cy="89" rx="8.5" ry="6.5" fill={dark_}/>
        <ellipse cx="72" cy="87" rx="2.5"  ry="1.7"  fill={irisC} opacity=".36"/>

        {/* ── SMILE (small arc INSIDE muzzle — not wide like duck bill) ── */}
        <path d="M70 103 Q82 112 94 103"
          stroke={ink} strokeWidth="2.3" strokeLinecap="round" fill="none"/>

        {/* ── COLLAR + TAG ── */}
        <ellipse cx="90" cy="115" rx="26" ry="8.5"
          fill={irisC} stroke={ink} strokeWidth="2.1" opacity=".85"/>
        <circle cx="90" cy="127" r="7"
          fill={body} stroke={ink} strokeWidth="2.0"/>

      </g>{/* end flip-to-face-right */}
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
