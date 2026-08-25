import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

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
        fontWeight: 900,
        fontSize: 22,
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
        letterSpacing: '-1px',
        paddingBottom: '1px',
      }}
    >
      A
    </div>,
    { ...size },
  )
}
