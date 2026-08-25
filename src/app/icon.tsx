import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// Front-facing chibi puppy favicon — chalk sketch on dark background
// Matches AppyDoerLogo mascot: big eyes, floppy ears, hair tuft, round head
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0f172a',
        borderRadius: '7px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* 32×32 canvas — viewBox 0 0 40 44 scaled to 32px */}
      <svg width="32" height="32" viewBox="0 0 40 44" fill="none">
        {/* LEFT EAR */}
        <path
          d="M12 10 C8 8, 3 12, 3 20 C3 26, 7 31, 12 31 C16 31, 18 27, 17 21 C16 16, 13 11, 12 10 Z"
          fill="#0f172a" stroke="white" strokeWidth="2" strokeLinejoin="round"
        />
        {/* RIGHT EAR */}
        <path
          d="M28 10 C32 8, 37 12, 37 20 C37 26, 33 31, 28 31 C24 31, 22 27, 23 21 C24 16, 27 11, 28 10 Z"
          fill="#0f172a" stroke="white" strokeWidth="2" strokeLinejoin="round"
        />
        {/* BODY */}
        <ellipse cx="20" cy="34" rx="10" ry="8" fill="#0f172a" stroke="white" strokeWidth="1.8"/>
        {/* HEAD */}
        <circle cx="20" cy="15" r="11" fill="#0f172a" stroke="white" strokeWidth="2.1"/>
        {/* HAIR TUFT */}
        <path d="M17.5 5 C17 3, 18.5 1, 20 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M20.5 5 C20.5 3, 22 1, 22.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        {/* LEFT EYE */}
        <circle cx="14.5" cy="13.5" r="4" fill="#0f172a" stroke="white" strokeWidth="1.6"/>
        <circle cx="14.5" cy="13.5" r="2.5" fill="#0f172a" stroke="white" strokeWidth="1"/>
        <circle cx="14.5" cy="13.8" r="1.3" fill="white"/>
        <ellipse cx="12.9" cy="12.1" rx="1.1" ry="0.75"
          fill="#0f172a" transform="rotate(-30 12.9 12.1)"/>
        {/* RIGHT EYE */}
        <circle cx="25.5" cy="13.5" r="4" fill="#0f172a" stroke="white" strokeWidth="1.6"/>
        <circle cx="25.5" cy="13.5" r="2.5" fill="#0f172a" stroke="white" strokeWidth="1"/>
        <circle cx="25.5" cy="13.8" r="1.3" fill="white"/>
        <ellipse cx="23.9" cy="12.1" rx="1.1" ry="0.75"
          fill="#0f172a" transform="rotate(-30 23.9 12.1)"/>
        {/* MUZZLE */}
        <ellipse cx="20" cy="21" rx="6" ry="4.5" fill="#0f172a" stroke="white" strokeWidth="1.5"/>
        {/* NOSE */}
        <ellipse cx="20" cy="17.5" rx="2.4" ry="1.8" fill="white"/>
        {/* SMILE */}
        <path d="M15.5 22.5 Q20 26 24.5 22.5"
          stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        {/* TONGUE */}
        <ellipse cx="20" cy="27.5" rx="2.8" ry="2.5" fill="#991b1b"/>
        <line x1="20" y1="25.3" x2="20" y2="30" stroke="#7f1d1d" strokeWidth="0.9" strokeLinecap="round"/>
        {/* FRONT LEGS */}
        <rect x="13" y="37" width="5.5" height="5.5" rx="2.5" fill="#0f172a" stroke="white" strokeWidth="1.5"/>
        <rect x="21.5" y="37" width="5.5" height="5.5" rx="2.5" fill="#0f172a" stroke="white" strokeWidth="1.5"/>
      </svg>
    </div>,
    { ...size },
  )
}
