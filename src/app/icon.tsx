import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// Favicon: gray puppy face on white badge — matches the gray no-bg logo style.
// Satori (next/og) supports only flex/div — no SVG paths.
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32, height: 32,
        background: '#f3f4f6',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        border: '1.5px solid #d1d5db',
      }}
    >
      {/* Left ear */}
      <div style={{
        position: 'absolute', left: 1, top: 3,
        width: 10, height: 18,
        borderRadius: '45% 45% 55% 55% / 38% 38% 62% 62%',
        border: '1.8px solid #6b7280',
        background: '#d1d5db',
        transform: 'rotate(-10deg)',
        transformOrigin: 'top center',
      }}/>
      {/* Right ear */}
      <div style={{
        position: 'absolute', right: 1, top: 3,
        width: 10, height: 18,
        borderRadius: '45% 45% 55% 55% / 38% 38% 62% 62%',
        border: '1.8px solid #6b7280',
        background: '#d1d5db',
        transform: 'rotate(10deg)',
        transformOrigin: 'top center',
      }}/>
      {/* Head */}
      <div style={{
        position: 'absolute', left: 6, top: 2,
        width: 20, height: 20,
        borderRadius: '50%',
        border: '2px solid #6b7280',
        background: '#d1d5db',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Eyes row */}
        <div style={{ display: 'flex', gap: 4, marginTop: -1 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            border: '1.4px solid #6b7280',
            background: '#f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 2.5, height: 2.5, borderRadius: '50%', background: '#374151' }}/>
          </div>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            border: '1.4px solid #6b7280',
            background: '#f3f4f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 2.5, height: 2.5, borderRadius: '50%', background: '#374151' }}/>
          </div>
        </div>
        {/* Nose */}
        <div style={{
          width: 5, height: 3.5, borderRadius: '50%',
          background: '#374151', marginTop: 1.5,
        }}/>
        {/* Smile */}
        <div style={{
          width: 8, height: 4, marginTop: 1,
          borderRadius: '0 0 50% 50%',
          border: '1.4px solid #6b7280',
          borderTop: 'none',
        }}/>
      </div>
      {/* Collar dot */}
      <div style={{
        position: 'absolute', left: 13, top: 23,
        width: 6, height: 3.5,
        borderRadius: '50%',
        background: '#9ca3af',
      }}/>
    </div>,
    { ...size },
  )
}
