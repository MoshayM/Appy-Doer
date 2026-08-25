import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// Puppy face favicon — matches the AppyDoerLogo mascot
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
        {/* Left ear */}
        <path
          d="M13 11 C6 11, 2 19, 3 26 C4 33, 10 36, 14 32 C17 29, 17 20, 14 14 Z"
          fill="rgba(255,255,255,0.84)"
        />
        {/* Right ear */}
        <path
          d="M27 11 C34 11, 38 19, 37 26 C36 33, 30 36, 26 32 C23 29, 23 20, 26 14 Z"
          fill="rgba(255,255,255,0.84)"
        />
        {/* Head */}
        <circle cx="20" cy="21" r="12" fill="white" />
        {/* Left eye */}
        <circle cx="15"   cy="19.5" r="3"   fill="#312e81" />
        <circle cx="16.3" cy="18"   r="1.1" fill="white"   />
        {/* Right eye */}
        <circle cx="25"   cy="19.5" r="3"   fill="#312e81" />
        <circle cx="26.3" cy="18"   r="1.1" fill="white"   />
        {/* Nose */}
        <ellipse cx="20" cy="25.5" rx="2.5" ry="1.8" fill="#312e81" />
        {/* Tongue */}
        <ellipse cx="20" cy="32"   rx="2.8" ry="2.6" fill="#f43f5e" />
        <ellipse cx="20" cy="33.8" rx="2.8" ry="1"   fill="#e11d48" />
      </svg>
    </div>,
    { ...size },
  )
}
