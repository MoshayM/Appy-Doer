'use client'

import Link from 'next/link'

export default function TrialBanner({ daysRemaining }: { daysRemaining: number }) {
  const isCritical = daysRemaining <= 2
  const isExpired  = daysRemaining === 0
  const progress   = ((7 - daysRemaining) / 7) * 100

  if (isExpired) {
    return (
      <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between text-sm">
        <span className="font-medium">Your trial has ended. Upgrade to continue generating income.</span>
        <Link href="/billing" className="bg-white text-red-600 px-4 py-1.5 rounded-lg font-semibold text-xs hover:bg-red-50 transition-colors ml-4">
          Upgrade Now
        </Link>
      </div>
    )
  }

  return (
    <div className={`${isCritical ? 'bg-amber-500' : 'bg-indigo-600'} text-white px-6 py-2.5 flex items-center justify-between text-sm`}>
      <div className="flex items-center gap-4">
        <span className="font-medium">
          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in your trial
        </span>
        <div className="w-32 bg-white/30 rounded-full h-1.5 hidden sm:block">
          <div
            className="bg-white rounded-full h-1.5 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <Link href="/billing" className="bg-white text-indigo-600 px-4 py-1.5 rounded-lg font-semibold text-xs hover:opacity-90 transition-opacity ml-4">
        Subscribe
      </Link>
    </div>
  )
}
