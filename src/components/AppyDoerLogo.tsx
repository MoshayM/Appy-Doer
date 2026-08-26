'use client'

import { cn } from '@/lib/utils'

interface Props {
  size?: number
  className?: string
  variant?: 'full' | 'icon'
  static?: boolean
  surface?: 'light' | 'dark'
}

/**
 * AppyDoer logo — redesigned front-facing chibi puppy.
 *
 * Design principles applied:
 *  • Front-facing & symmetric → iconic at any size (16 px to billboard)
 *  • Brand cyan (#06b6d4) in eyes + collar → "AI-powered" feel, colour harmony
 *  • Cool blue-gray body (#f0f4f8) → subtle tech tint vs plain grey
 *  • Warm rose inner ear (#fda4af) → approachable contrast accent
 *  • Rich slate ink (#0f172a) → more contrast, more modern than grey
 *  • "DOER" text in cyan → matches eyes + collar, unified brand language
 *  • Minimal bezier curves, pure geometric primitives where possible
 *  • Animations: tail wag · ear sway · eye blink (respects prefers-reduced-motion via globals.css)
 */
export default function AppyDoerLogo({
  size = 40,
  className,
  variant = 'full',
  static: isStatic = false,
  surface = 'light',
}: Props) {
  const dark = surface === 'dark'

  /* ── Palette ─────────────────────────────────────────────── */
  const body    = '#f0f4f8'   // cool blue-gray — body / ears / paws
  const ink     = '#0f172a'   // slate-950 — outlines
  const cyan    = '#06b6d4'   // brand cyan — eyes + collar
  const cyanD   = '#0891b2'   // deep cyan — depth / strokes on collar
  const white   = '#ffffff'   // sclera + eye shine
  const muzzle  = '#e2e8f0'   // slate-200 — muzzle area
  const earPink = '#fda4af'   // rose-300 — warm inner-ear accent
  const sw      = 2.8         // base stroke width

  /* ViewBox 200 × 218, front-facing, symmetric */
  const h = Math.round(size * 218 / 200)

  const Icon = (
    <svg
      width={size}
      height={h}
      viewBox="0 0 200 218"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AppyDoer"
      role="img"
      className="flex-shrink-0 select-none"
    >
      {!isStatic && (
        <style>{`
          @keyframes ad-tail {
            0%,100% { transform: rotate(-18deg); }
            50%      { transform: rotate(22deg);  }
          }
          @keyframes ad-ear-l {
            0%,100% { transform: rotate(-4deg); }
            50%      { transform: rotate(5deg);  }
          }
          @keyframes ad-ear-r {
            0%,100% { transform: rotate(4deg);  }
            50%      { transform: rotate(-5deg); }
          }
          @keyframes ad-blink {
            0%,88%,98%,100% { transform: scaleY(1);    }
            92%              { transform: scaleY(0.05); }
            95%              { transform: scaleY(1);    }
          }
        `}</style>
      )}

      {/* ── LEFT EAR — floppy, droops down left side ── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '64px 50px',
        animation: 'ad-ear-l 3.7s ease-in-out infinite',
      }}>
        <path
          d="M64 50 C52 36 26 46 24 72 C22 96 34 118 58 122
             C71 124 76 112 72 96 C68 80 66 64 64 50 Z"
          fill={body} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
        />
        {/* Warm pink inner-ear */}
        <path
          d="M61 62 C51 56 33 64 31 82 C29 98 39 116 57 118
             C66 119 69 110 67 97 C65 84 63 73 61 62 Z"
          fill={earPink} opacity=".68"
        />
      </g>

      {/* ── RIGHT EAR ── */}
      <g style={isStatic ? undefined : {
        transformOrigin: '136px 50px',
        animation: 'ad-ear-r 4.2s ease-in-out infinite',
        animationDelay: '-1.4s',
      }}>
        <path
          d="M136 50 C148 36 174 46 176 72 C178 96 166 118 142 122
             C129 124 124 112 128 96 C132 80 134 64 136 50 Z"
          fill={body} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
        />
        <path
          d="M139 62 C149 56 167 64 169 82 C171 98 161 116 143 118
             C134 119 131 110 133 97 C135 84 137 73 139 62 Z"
          fill={earPink} opacity=".68"
        />
      </g>

      {/* ── BODY ── */}
      <ellipse cx="100" cy="171" rx="53" ry="37"
        fill={body} stroke={ink} strokeWidth={sw}/>

      {/* ── TAIL — peeks from right side, wags ── */}
      <g style={isStatic
        ? { transform: 'rotate(-10deg)', transformOrigin: '150px 160px' }
        : { transformOrigin: '150px 160px', animation: 'ad-tail 0.85s ease-in-out infinite' }
      }>
        <path
          d="M150 160 C157 144 174 138 173 151
             C172 163 158 172 151 169 Z"
          fill={body} stroke={ink} strokeWidth={sw} strokeLinejoin="round"
        />
      </g>

      {/* ── PAWS — left ── */}
      <ellipse cx="76" cy="205" rx="19" ry="9"
        fill={body} stroke={ink} strokeWidth="2.2"/>
      <circle cx="65"  cy="200" r="4.5" fill={body} stroke={ink} strokeWidth="1.9"/>
      <circle cx="76"  cy="198" r="4.5" fill={body} stroke={ink} strokeWidth="1.9"/>
      <circle cx="87"  cy="200" r="4.5" fill={body} stroke={ink} strokeWidth="1.9"/>

      {/* ── PAWS — right ── */}
      <ellipse cx="124" cy="205" rx="19" ry="9"
        fill={body} stroke={ink} strokeWidth="2.2"/>
      <circle cx="113" cy="200" r="4.5" fill={body} stroke={ink} strokeWidth="1.9"/>
      <circle cx="124" cy="198" r="4.5" fill={body} stroke={ink} strokeWidth="1.9"/>
      <circle cx="135" cy="200" r="4.5" fill={body} stroke={ink} strokeWidth="1.9"/>

      {/* ── HEAD — large chibi circle ── */}
      <circle cx="100" cy="89" r="53"
        fill={body} stroke={ink} strokeWidth={sw}/>

      {/* Subtle gloss highlight — top-left of head */}
      <ellipse cx="83" cy="60" rx="20" ry="12"
        fill={white} opacity=".10" transform="rotate(-28 83 60)"/>

      {/* ── HAIR TUFT ── */}
      <path d="M92 38 C90 28 93 22 95 30"
        stroke={ink} strokeWidth="2.3" strokeLinecap="round"/>
      <path d="M100 36 C99 26 101 20 103 28"
        stroke={ink} strokeWidth="2.3" strokeLinecap="round"/>
      <path d="M108 38 C107 28 109 24 111 32"
        stroke={ink} strokeWidth="1.9" strokeLinecap="round" opacity=".72"/>
      <path d="M84 42 C82 34 84 30 86 36"
        stroke={ink} strokeWidth="1.6" strokeLinecap="round" opacity=".56"/>

      {/* ── MUZZLE — soft wide oval ── */}
      <ellipse cx="100" cy="113" rx="29" ry="21"
        fill={muzzle} stroke={ink} strokeWidth="2.0"/>

      {/* ── NOSE ── */}
      <ellipse cx="100" cy="104" rx="11.5" ry="8"
        fill={ink}/>
      <ellipse cx="96" cy="102" rx="3.5" ry="2.2"
        fill={white} opacity=".30"/>

      {/* ── SMILE — wide, warm ── */}
      <path d="M83 119 Q100 134 117 119"
        stroke={ink} strokeWidth="2.7" strokeLinecap="round"/>
      {/* Corner dimples */}
      <path d="M81 117 Q79 122 82 124"
        stroke={ink} strokeWidth="1.5" strokeLinecap="round" opacity=".42"/>
      <path d="M119 117 Q121 122 118 124"
        stroke={ink} strokeWidth="1.5" strokeLinecap="round" opacity=".42"/>

      {/* ── LEFT EYE ── */}
      <circle cx="74" cy="79" r="19"
        fill={white} stroke={ink} strokeWidth={sw}/>
      {/* Eyebrow */}
      <path d="M57 62 Q74 56 91 62"
        stroke={ink} strokeWidth="2.5" strokeLinecap="round"/>
      <g style={isStatic ? undefined : {
        transformOrigin: '74px 60px',
        animation: 'ad-blink 7s linear infinite',
      }}>
        {/* Cyan iris — the "AI eye" */}
        <circle cx="74" cy="79" r="13" fill={cyan}/>
        {/* Iris rim */}
        <circle cx="74" cy="79" r="13"
          fill="none" stroke={cyanD} strokeWidth="1.4"/>
        {/* Pupil */}
        <circle cx="76" cy="81" r="7" fill={ink}/>
        {/* Shine — main */}
        <ellipse cx="69" cy="73" rx="5" ry="3.2"
          fill={white} transform="rotate(-24 69 73)"/>
        {/* Shine — small */}
        <circle cx="82" cy="72" r="2.2" fill={white}/>
      </g>

      {/* ── RIGHT EYE ── */}
      <circle cx="126" cy="79" r="19"
        fill={white} stroke={ink} strokeWidth={sw}/>
      {/* Eyebrow */}
      <path d="M109 62 Q126 56 143 62"
        stroke={ink} strokeWidth="2.5" strokeLinecap="round"/>
      <g style={isStatic ? undefined : {
        transformOrigin: '126px 60px',
        animation: 'ad-blink 7s linear infinite',
        animationDelay: '-0.22s',
      }}>
        <circle cx="126" cy="79" r="13" fill={cyan}/>
        <circle cx="126" cy="79" r="13"
          fill="none" stroke={cyanD} strokeWidth="1.4"/>
        <circle cx="128" cy="81" r="7" fill={ink}/>
        <ellipse cx="121" cy="73" rx="5" ry="3.2"
          fill={white} transform="rotate(-24 121 73)"/>
        <circle cx="134" cy="72" r="2.2" fill={white}/>
      </g>

      {/* ── COLLAR — brand cyan band ── */}
      <rect x="55" y="131" width="90" height="15" rx="7.5"
        fill={cyan} stroke={cyanD} strokeWidth="2.2"/>
      {/* Stitching line */}
      <line x1="55" y1="138.5" x2="145" y2="138.5"
        stroke={cyanD} strokeWidth="1.0" opacity=".30"/>

      {/* ── TAG — circular pendant ── */}
      <circle cx="100" cy="153" r="10"
        fill={white} stroke={ink} strokeWidth="2.2"/>
      <circle cx="100" cy="153" r="4" fill={ink}/>

    </svg>
  )

  if (variant === 'icon') return Icon

  const ts = Math.round(size * 0.38)
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      {Icon}
      <span style={{ fontSize: ts, lineHeight: 1, letterSpacing: '0.08em', fontWeight: 900 }}>
        <span style={{ color: dark ? '#f1f5f9' : '#0f172a' }}>APPY</span>
        <span style={{ color: '#06b6d4' }}>DOER</span>
      </span>
    </div>
  )
}
