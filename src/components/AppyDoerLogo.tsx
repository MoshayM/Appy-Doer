interface Props {
  size?: number
  className?: string
  variant?: 'full' | 'icon'
}

export default function AppyDoerLogo({ size = 36, className = '', variant = 'full' }: Props) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon mark — stylised "A" with upward arrow in gradient rounded square */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="ad-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#6366f1" />
            <stop offset="55%"  stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="ad-shine" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.25)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Background rounded square */}
        <rect width="40" height="40" rx="10" fill="url(#ad-grad)" />
        {/* Subtle shine overlay */}
        <rect width="40" height="20" rx="10" fill="url(#ad-shine)" />

        {/* "A" letterform with integrated upward arrow — premium geometric */}
        {/* Left leg */}
        <path d="M10 29 L20 11 L30 29" stroke="white" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Crossbar */}
        <line x1="14" y1="23" x2="26" y2="23" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
        {/* Upward arrow tip above the A — signals doing / action */}
        <path d="M20 8 L17 12 M20 8 L23 12" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Wordmark — shown in full variant */}
      {variant === 'full' && (
        <span
          className="font-bold tracking-tight select-none"
          style={{ fontSize: size * 0.5, lineHeight: 1, letterSpacing: '-0.02em' }}
        >
          <span style={{ color: 'inherit' }}>Appy</span>
          <span className="text-indigo-500">Doer</span>
        </span>
      )}
    </div>
  )
}
