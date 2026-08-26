import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

// Favicon: front-facing puppy on cyan-to-deep-cyan gradient badge.
// Matches redesigned logo: cyan eyes, white sclera, dark ink outlines.
export default function Icon() {
  return new ImageResponse(
    <div style={{
      width: 32, height: 32,
      background: 'linear-gradient(145deg,#06b6d4 0%,#0891b2 100%)',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Left ear */}
      <div style={{
        position: 'absolute', left: 1, top: 3,
        width: 9, height: 17,
        borderRadius: '48% 48% 54% 54% / 36% 36% 64% 64%',
        background: '#f0f4f8',
        border: '1.5px solid #0f172a',
        transform: 'rotate(-13deg)',
        transformOrigin: 'top center',
      }}/>
      {/* Right ear */}
      <div style={{
        position: 'absolute', right: 1, top: 3,
        width: 9, height: 17,
        borderRadius: '48% 48% 54% 54% / 36% 36% 64% 64%',
        background: '#f0f4f8',
        border: '1.5px solid #0f172a',
        transform: 'rotate(13deg)',
        transformOrigin: 'top center',
      }}/>
      {/* Head */}
      <div style={{
        position: 'absolute', left: 5, top: 1,
        width: 22, height: 22,
        borderRadius: '50%',
        background: '#f0f4f8',
        border: '1.8px solid #0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
      }}>
        {/* Eyes row — cyan iris */}
        <div style={{ display: 'flex', gap: 3, marginTop: -1 }}>
          {/* Left eye */}
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#ffffff',
            border: '1.3px solid #0f172a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 4, height: 4, borderRadius: '50%',
              background: '#06b6d4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 1.8, height: 1.8, borderRadius: '50%', background: '#0f172a' }}/>
            </div>
          </div>
          {/* Right eye */}
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#ffffff',
            border: '1.3px solid #0f172a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 4, height: 4, borderRadius: '50%',
              background: '#06b6d4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ width: 1.8, height: 1.8, borderRadius: '50%', background: '#0f172a' }}/>
            </div>
          </div>
        </div>
        {/* Muzzle + nose */}
        <div style={{
          width: 10, height: 8, borderRadius: '50%',
          background: '#e2e8f0',
          border: '1.1px solid #0f172a',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          paddingTop: 1,
        }}>
          <div style={{ width: 5, height: 3, borderRadius: '40%', background: '#0f172a' }}/>
        </div>
      </div>
      {/* Collar strip — brand cyan (lighter band on darker bg) */}
      <div style={{
        position: 'absolute', left: 4, top: 24,
        width: 24, height: 4,
        borderRadius: 2,
        background: '#ffffff',
        opacity: 0.35,
      }}/>
    </div>,
    { ...size },
  )
}
