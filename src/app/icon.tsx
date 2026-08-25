import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// Side-profile chibi puppy favicon — premium chalk sketch on dark badge.
// Matches AppyDoerLogo: faces right, big head, floppy ear, curly tail, collar tag.
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
      }}
    >
      {/* viewBox 0 0 44 44, side-facing RIGHT, scaled to 32×32 */}
      <svg width="30" height="30" viewBox="0 0 44 44" fill="none">
        {/* TAIL (curly, rear/left) */}
        <path
          d="M5 26 C1 22, -1 17, 3 14 C7 11, 12 13, 12 18 C12 23, 8.5 26, 5 26 Z"
          fill="#0f172a" stroke="white" strokeWidth="2.1" strokeLinejoin="round"
        />
        {/* BACK LEG */}
        <rect x="10" y="33" width="5" height="10" rx="2.5"
          fill="#0f172a" stroke="white" strokeWidth="1.6"/>
        <ellipse cx="12.5" cy="43.8" rx="3.8" ry="1.6"
          fill="#0f172a" stroke="white" strokeWidth="1.6"/>
        {/* FRONT LEG */}
        <rect x="23.5" y="33" width="5" height="10" rx="2.5"
          fill="#0f172a" stroke="white" strokeWidth="1.6"/>
        <ellipse cx="26" cy="43.8" rx="3.8" ry="1.6"
          fill="#0f172a" stroke="white" strokeWidth="1.6"/>
        {/* BODY */}
        <ellipse cx="17" cy="30" rx="13" ry="10"
          fill="#0f172a" stroke="white" strokeWidth="2.1"/>
        {/* FLOPPY EAR */}
        <path
          d="M22 12 C18 10, 13 14, 12 21 C11 28, 14 37, 19 37 C23 37, 25 32, 24 25 C23 19, 22 14, 22 12 Z"
          fill="#0f172a" stroke="white" strokeWidth="2.1" strokeLinejoin="round"
        />
        {/* HEAD */}
        <circle cx="29" cy="13" r="11"
          fill="#0f172a" stroke="white" strokeWidth="2.1"/>
        {/* FAR EAR */}
        <path
          d="M31.5 3 C33.5 0.5, 37 1.5, 37.5 4.5 C38 8, 35.5 10.5, 33 9.5 C31 8.5, 30.5 5.5, 31.5 3 Z"
          fill="#0f172a" stroke="white" strokeWidth="1.2" opacity=".6"/>
        {/* COLLAR (indigo accent) */}
        <path d="M20 22 C23 25, 28 26, 33 24.5"
          stroke="#818cf8" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
        <circle cx="26.5" cy="25.8" r="1.75" fill="#818cf8"/>
        {/* SNOUT */}
        <ellipse cx="40.5" cy="19" rx="6.2" ry="4.6"
          fill="#0f172a" stroke="white" strokeWidth="1.6"/>
        {/* NOSE */}
        <ellipse cx="46.1" cy="16.8" rx="2.25" ry="1.7" fill="white"/>
        {/* SMILE */}
        <path d="M41 23.5 Q44 26 47 23.5"
          stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        {/* TONGUE */}
        <ellipse cx="45.5" cy="27.5" rx="2.7" ry="2.6" fill="#991b1b"/>
        {/* EYE */}
        <circle cx="35" cy="10" r="4.5" fill="#0f172a" stroke="white" strokeWidth="1.6"/>
        <circle cx="35" cy="10" r="2.8" fill="#0f172a" stroke="white" strokeWidth="1.1"/>
        <circle cx="35" cy="10.3" r="1.4" fill="white"/>
        <ellipse cx="33.3" cy="8.4" rx="1.15" ry="0.78"
          fill="#0f172a" transform="rotate(-30 33.3 8.4)"/>
        <circle cx="36.3" cy="8.5" r="0.65" fill="#0f172a"/>
        {/* EYEBROW */}
        <path d="M31.5 6.5 Q35 5.2 38.5 6.5"
          stroke="white" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity=".7"/>
        {/* HAIR TUFT */}
        <path d="M23.5 4.5 C22.5 2.5, 23.5 0.5, 25.5 2.5"
          stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
        <path d="M27 4 C26.5 2, 27.5 0, 28.5 2.2"
          stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
        <path d="M30 5 C30 3, 31 1.5, 31.5 3.2"
          stroke="white" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity=".75"/>
      </svg>
    </div>,
    { ...size },
  )
}
