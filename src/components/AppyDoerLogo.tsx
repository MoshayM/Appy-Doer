'use client'

/**
 * AppyDoer — chalk-sketch puppy matching puppy.PNG reference.
 * Dark badge (#0d0d0d), white chalk lines.
 * ONLY the tail animates (gentle wag). Everything else is static.
 *
 * Reference features reproduced:
 *   - Two wide floppy ears with fur striations
 *   - Large chibi head with hair tuft
 *   - Anime-style eyes: sclera ring + iris ring + oval reflection + shine
 *   - Round muzzle, solid nose, happy smile, tongue
 *   - Chubby oval body with fur swirls
 *   - Four paws with toe bumps
 *   - Curly tail (upper-right of body) — only animated element
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
  const bg   = '#0d0d0d'    // chalk-on-blackboard background
  const ink  = 'white'      // chalk lines

  // 100 × 112 internal coordinate space → scales to any size
  const h = Math.round(size * 112 / 100)

  const Icon = (
    <svg
      width={size}
      height={h}
      viewBox="0 0 100 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AppyDoer"
      role="img"
      className="flex-shrink-0 select-none"
      style={{
        filter: dark
          ? 'drop-shadow(0 0 8px rgba(255,255,255,0.14))'
          : 'drop-shadow(0 3px 12px rgba(0,0,0,0.45))',
      }}
    >
      {!isStatic && (
        <style>{`
          @keyframes ad-tail-wag {
            0%,100% { transform: rotate(-16deg); }
            50%     { transform: rotate(16deg);  }
          }
        `}</style>
      )}

      {/* ── BADGE ── */}
      <rect x="0" y="0" width="100" height="112" rx="14" fill={bg}/>

      {/* ════════════════════════════════════════
          Z-ORDER:
          ears → body → back-paws → tail → front-paws → head → face
          ════════════════════════════════════════ */}

      {/* ── LEFT EAR (wide, drooping, fur striation lines) ── */}
      <path
        d="M27 25 C20 18, 5 24, 4 41 C3 56, 11 68, 22 68
           C29 68, 31 59, 29 50 C27 42, 26 32, 27 25 Z"
        fill={bg} stroke={ink} strokeWidth="2.4" strokeLinejoin="round"
      />
      <path d="M10 33 Q12 43 10 55"  stroke={ink} strokeWidth="1.05" strokeLinecap="round" fill="none" opacity=".58"/>
      <path d="M14 30 Q16 41 15 54"  stroke={ink} strokeWidth="1.05" strokeLinecap="round" fill="none" opacity=".58"/>
      <path d="M18 29 Q20 39 19 51"  stroke={ink} strokeWidth="1.05" strokeLinecap="round" fill="none" opacity=".55"/>
      <path d="M22 29 Q23 38 22 48"  stroke={ink} strokeWidth="0.9"  strokeLinecap="round" fill="none" opacity=".45"/>

      {/* ── RIGHT EAR ── */}
      <path
        d="M73 25 C80 18, 95 24, 96 41 C97 56, 89 68, 78 68
           C71 68, 69 59, 71 50 C73 42, 74 32, 73 25 Z"
        fill={bg} stroke={ink} strokeWidth="2.4" strokeLinejoin="round"
      />
      <path d="M90 33 Q88 43 90 55"  stroke={ink} strokeWidth="1.05" strokeLinecap="round" fill="none" opacity=".58"/>
      <path d="M86 30 Q84 41 85 54"  stroke={ink} strokeWidth="1.05" strokeLinecap="round" fill="none" opacity=".58"/>
      <path d="M82 29 Q80 39 81 51"  stroke={ink} strokeWidth="1.05" strokeLinecap="round" fill="none" opacity=".55"/>
      <path d="M78 29 Q77 38 78 48"  stroke={ink} strokeWidth="0.9"  strokeLinecap="round" fill="none" opacity=".45"/>

      {/* ── BODY ── */}
      <ellipse cx="50" cy="83" rx="28" ry="20" fill={bg} stroke={ink} strokeWidth="2.4"/>
      {/* Chest fur swirls */}
      <path d="M37 87 Q42 94 46 91" stroke={ink} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity=".5"/>
      <path d="M50 87 Q55 94 59 91" stroke={ink} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity=".5"/>

      {/* ── BACK PAWS (smaller, behind front paws) ── */}
      <ellipse cx="40" cy="102" rx="10" ry="6" fill={bg} stroke={ink} strokeWidth="1.5" opacity=".52"/>
      <ellipse cx="60" cy="102" rx="10" ry="6" fill={bg} stroke={ink} strokeWidth="1.5" opacity=".52"/>

      {/* ── TAIL (ONLY ANIMATED ELEMENT — rotates around its base) ── */}
      <g
        style={isStatic
          ? { transform: 'rotate(-14deg)', transformOrigin: '70px 76px' }
          : { transformOrigin: '70px 76px', animation: 'ad-tail-wag 0.85s ease-in-out infinite' }
        }
      >
        <path
          d="M70 76 C77 69, 88 71, 89 78
             C90 84, 84 88, 78 86
             C73.5 84.5, 71 81, 70 76 Z"
          fill={bg} stroke={ink} strokeWidth="2.3" strokeLinejoin="round"
        />
        {/* Inner curl detail */}
        <path d="M85 72 C88 76, 87 82, 84 85"
          stroke={ink} strokeWidth="1.0" strokeLinecap="round" fill="none" opacity=".62"/>
      </g>

      {/* ── FRONT PAWS (in front of body) ── */}
      {/* Front-left */}
      <ellipse cx="33" cy="104" rx="12" ry="7.5" fill={bg} stroke={ink} strokeWidth="2.1"/>
      <circle cx="27"   cy="98.5" r="3.5" fill={bg} stroke={ink} strokeWidth="1.7"/>
      <circle cx="33"   cy="97.5" r="3.5" fill={bg} stroke={ink} strokeWidth="1.7"/>
      <circle cx="39"   cy="98.5" r="3.5" fill={bg} stroke={ink} strokeWidth="1.7"/>
      {/* Front-right */}
      <ellipse cx="67" cy="104" rx="12" ry="7.5" fill={bg} stroke={ink} strokeWidth="2.1"/>
      <circle cx="61"   cy="98.5" r="3.5" fill={bg} stroke={ink} strokeWidth="1.7"/>
      <circle cx="67"   cy="97.5" r="3.5" fill={bg} stroke={ink} strokeWidth="1.7"/>
      <circle cx="73"   cy="98.5" r="3.5" fill={bg} stroke={ink} strokeWidth="1.7"/>

      {/* ── HEAD (sits over ear attachment bases) ── */}
      <circle cx="50" cy="40" r="29" fill={bg} stroke={ink} strokeWidth="2.4"/>

      {/* ── HAIR TUFT (4 strands) ── */}
      <path d="M44 13 C43 8,  45 5,  47 9"   stroke={ink} strokeWidth="2.1" strokeLinecap="round" fill="none"/>
      <path d="M50 12 C49 7,  51 4,  53 8"   stroke={ink} strokeWidth="2.1" strokeLinecap="round" fill="none"/>
      <path d="M56 13 C56 8,  57 5,  58 9"   stroke={ink} strokeWidth="1.7" strokeLinecap="round" fill="none" opacity=".82"/>
      <path d="M39 15 C38 11, 39 8,  41 11"  stroke={ink} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".68"/>

      {/* ── LEFT EYE (anime-style: ring + iris ring + oval reflection + shine) ── */}
      {/* Outer sclera ring */}
      <circle cx="37" cy="38" r="11" fill={bg} stroke={ink} strokeWidth="2.2"/>
      {/* Iris ring */}
      <circle cx="37" cy="38" r="6.8" fill={bg} stroke={ink} strokeWidth="1.7"/>
      {/* Large oval reflection (upper-left) */}
      <ellipse cx="34"   cy="34.5" rx="3.4" ry="2.1" fill={ink} transform="rotate(-20 34 34.5)"/>
      {/* Secondary shine dot */}
      <circle  cx="41.5" cy="35"   r="1.5"            fill={ink}/>

      {/* ── RIGHT EYE ── */}
      <circle cx="63" cy="38" r="11" fill={bg} stroke={ink} strokeWidth="2.2"/>
      <circle cx="63" cy="38" r="6.8" fill={bg} stroke={ink} strokeWidth="1.7"/>
      <ellipse cx="60"   cy="34.5" rx="3.4" ry="2.1" fill={ink} transform="rotate(-20 60 34.5)"/>
      <circle  cx="67.5" cy="35"   r="1.5"            fill={ink}/>

      {/* ── MUZZLE / SNOUT ── */}
      <ellipse cx="50" cy="57" rx="18" ry="14" fill={bg} stroke={ink} strokeWidth="2.1"/>
      {/* Ridge line dividing face from muzzle */}
      <path d="M35 50 Q50 48 65 50"
        stroke={ink} strokeWidth="1.1" strokeLinecap="round" fill="none"/>

      {/* ── NOSE ── */}
      <ellipse cx="50" cy="48.5" rx="6" ry="4.5" fill={ink}/>
      {/* Nose shine */}
      <ellipse cx="48" cy="47"   rx="1.8" ry="1.3" fill={bg} opacity=".48"/>

      {/* ── SMILE ── */}
      <path d="M38 63 Q50 72 62 63"
        stroke={ink} strokeWidth="2.3" strokeLinecap="round" fill="none"/>

      {/* ── TONGUE ── */}
      <ellipse cx="50" cy="74"   rx="7"   ry="6.5" fill="#991b1b"/>
      <ellipse cx="50" cy="79.5" rx="7"   ry="2.8" fill="#7f1d1d"/>
      <line x1="50" y1="67.5" x2="50" y2="80"
        stroke="#7f1d1d" strokeWidth="2.1" strokeLinecap="round"/>
    </svg>
  )

  if (variant === 'icon') return Icon

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
