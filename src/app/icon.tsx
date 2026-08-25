import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// Favicon: gray chibi puppy face on a cyan rounded badge.
// Satori (next/og) only supports flex/div — no SVG paths.
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32, height: 32,
        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Left ear */}
      <div style={{
        position: 'absolute', left: 2, top: 4,
        width: 9, height: 16,
        borderRadius: '45% 45% 55% 55% / 36% 36% 64% 64%',
        border: '1.6px solid #4b5563',
        background: '#d1d5db',
        transform: 'rotate(-12deg)',
        transformOrigin: 'top center',
      }}/>
      {/* Right ear */}
      <div style={{
        position: 'absolute', right: 2, top: 4,
        width: 9, height: 16,
        borderRadius: '45% 45% 55% 55% / 36% 36% 64% 64%',
        border: '1.6px solid #4b5563',
        background: '#d1d5db',
        transform: 'rotate(12deg)',
        transformOrigin: 'top center',
      }}/>
      {/* Head */}
      <div style={{
        position: 'absolute', left: 5, top: 2,
        width: 22, height: 22,
        borderRadius: '50%',
        border: '2px solid #4b5563',
        background: '#d1d5db',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Eyes */}
        <div style={{ display: 'flex', gap: 4, marginTop: -2 }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#f3f4f6',
            border: '1.2px solid #4b5563',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 2, height: 2, borderRadius: '50%', background: '#1f2937' }}/>
          </div>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#f3f4f6',
            border: '1.2px solid #4b5563',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 2, height: 2, borderRadius: '50%', background: '#1f2937' }}/>
          </div>
        </div>
        {/* Muzzle */}
        <div style={{
          width: 10, height: 8, marginTop: 2,
          borderRadius: '50%',
          background: '#e9eaec',
          border: '1.2px solid #4b5563',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 5, height: 3, borderRadius: '50%', background: '#1f2937' }}/>
        </div>
      </div>
      {/* Collar strip */}
      <div style={{
        position: 'absolute', left: 4, top: 25,
        width: 24, height: 4,
        borderRadius: 2,
        background: '#9ca3af',
        opacity: 0.9,
      }}/>
    </div>,
    { ...size },
  )
}
