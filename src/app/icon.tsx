import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// Favicon: chibi puppy face on dark indigo badge — all within 32×32.
// Uses inline styles only (Satori/next/og requirement).
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        background: '#0d0d0d',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Left ear */}
      <div style={{
        position: 'absolute',
        left: 1,
        top: 4,
        width: 9,
        height: 18,
        borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
        border: '1.5px solid white',
        background: '#0d0d0d',
        transform: 'rotate(-12deg)',
        transformOrigin: 'top center',
      }}/>
      {/* Right ear */}
      <div style={{
        position: 'absolute',
        right: 1,
        top: 4,
        width: 9,
        height: 18,
        borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
        border: '1.5px solid white',
        background: '#0d0d0d',
        transform: 'rotate(12deg)',
        transformOrigin: 'top center',
      }}/>
      {/* Head */}
      <div style={{
        position: 'absolute',
        left: 6,
        top: 3,
        width: 20,
        height: 20,
        borderRadius: '50%',
        border: '1.8px solid white',
        background: '#0d0d0d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}>
        {/* Eyes row */}
        <div style={{ display: 'flex', gap: 5, marginTop: -2 }}>
          {/* Left eye */}
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            border: '1.2px solid white', background: '#0d0d0d',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 2.4, height: 2.4, borderRadius: '50%', background: 'white' }}/>
          </div>
          {/* Right eye */}
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            border: '1.2px solid white', background: '#0d0d0d',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 2.4, height: 2.4, borderRadius: '50%', background: 'white' }}/>
          </div>
        </div>
        {/* Nose */}
        <div style={{
          width: 5, height: 3.5, borderRadius: '50%',
          background: 'white', marginTop: 1,
        }}/>
        {/* Smile */}
        <div style={{
          width: 8, height: 4, borderRadius: '0 0 50% 50%',
          border: '1.2px solid white',
          borderTop: 'none',
          marginTop: 1,
        }}/>
      </div>
      {/* Body */}
      <div style={{
        position: 'absolute',
        left: 8,
        top: 21,
        width: 16,
        height: 10,
        borderRadius: '50%',
        border: '1.5px solid white',
        background: '#0d0d0d',
      }}/>
      {/* Collar dot */}
      <div style={{
        position: 'absolute',
        left: 14,
        top: 22,
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: '#a5b4fc',
      }}/>
    </div>,
    { ...size },
  )
}
