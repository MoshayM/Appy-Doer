'use client'

import { useState } from 'react'
import { formatPrice, type PricingZone } from '@/lib/geo-pricing'

interface Plan {
  id: string
  name: string
  emoji: string
  color: 'indigo' | 'violet'
  badge: string
  monthly: number
  annual: number
  am: number
  savings: number
  features: string[]
}

interface Props {
  plans: Plan[]
  currentPlan: string
  gateway: string
  discountPct: number
  isPaid: boolean
  symbol: string
  zone: PricingZone
}

export default function PlanCards({ plans, currentPlan, gateway, discountPct, isPaid, zone }: Props) {
  const fmt = (n: number) => formatPrice(n, zone)
  const [billing, setBilling] = useState<'annual' | 'monthly'>('annual')
  const hasDiscount = discountPct > 0 && !isPaid
  const dp = (p: number) => Math.round(p * (1 - discountPct / 100))

  return (
    <div>
      {/* Monthly / Annual toggle */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
          {currentPlan === 'PRO' || currentPlan === 'PREMIUM' ? 'Switch or Upgrade' : 'Choose a Plan'}
        </h3>

        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              billing === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              billing === 'annual'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Annual
            <span className="text-xs font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
              Save 25%
            </span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {plans.map(plan => {
          const isCurrent = currentPlan === plan.id
          const isIndigo = plan.color === 'indigo'

          const rawPrice   = billing === 'annual' ? plan.annual : plan.monthly
          const dispPrice  = hasDiscount ? dp(rawPrice) : rawPrice
          const origPrice  = hasDiscount ? rawPrice : null

          const perMonthAnnual = hasDiscount
            ? Math.round(dp(plan.annual) / 12)
            : plan.am

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border-2 flex flex-col p-6 transition-shadow hover:shadow-md ${
                isCurrent
                  ? isIndigo ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-violet-400 ring-4 ring-violet-50'
                  : isIndigo ? 'border-indigo-200 hover:border-indigo-300' : 'border-violet-200 hover:border-violet-300'
              }`}
            >
              {/* Top badge */}
              <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                <span className={`text-white text-xs font-bold px-4 py-1 rounded-full ${
                  isIndigo ? 'bg-indigo-500' : 'bg-gradient-to-r from-violet-500 to-indigo-500'
                }`}>
                  {isCurrent ? 'Your Current Plan' : plan.badge}
                </span>
              </div>

              {/* Plan name */}
              <div className="flex items-center gap-2 mt-1 mb-4">
                <span className="text-lg">{plan.emoji}</span>
                <span className={`font-bold text-sm uppercase tracking-widest ${isIndigo ? 'text-indigo-600' : 'text-violet-600'}`}>
                  {plan.name}
                </span>
              </div>

              {/* Price */}
              <div className="mb-5">
                <div className="flex items-baseline gap-2 mb-1">
                  {origPrice !== null && (
                    <span className="text-sm text-gray-400 line-through">{fmt(origPrice)}</span>
                  )}
                  <span className="text-3xl font-black text-gray-900">{fmt(dispPrice)}</span>
                  <span className="text-gray-400 text-sm">/{billing === 'annual' ? 'year' : 'month'}</span>
                </div>

                {billing === 'annual' ? (
                  <>
                    <p className="text-xs text-gray-500">
                      ≈ {fmt(perMonthAnnual)}/month · billed annually
                    </p>
                    {plan.savings > 0 && (
                      <span className="inline-flex items-center text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full mt-1.5">
                        Save {fmt(plan.savings)}/year vs monthly
                      </span>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-500">
                    Billed every month · switch to annual to save {fmt(plan.savings)}/year
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className={`mt-0.5 shrink-0 ${isIndigo ? 'text-indigo-500' : 'text-violet-500'}`}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <form action="/api/billing/subscribe" method="POST">
                <input type="hidden" name="plan" value={plan.id} />
                <input type="hidden" name="interval" value={billing === 'annual' ? 'YEAR' : 'MONTH'} />
                <input type="hidden" name="gateway" value={gateway} />
                <button
                  type="submit"
                  disabled={isCurrent}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isIndigo
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700'
                  }`}
                >
                  {isCurrent
                    ? 'Current Plan'
                    : `Subscribe to ${plan.name} · ${billing === 'annual' ? 'Annual' : 'Monthly'}`}
                </button>
              </form>

              {/* Secondary: flip interval */}
              {!isCurrent && (
                <form action="/api/billing/subscribe" method="POST" className="mt-2">
                  <input type="hidden" name="plan" value={plan.id} />
                  <input type="hidden" name="interval" value={billing === 'annual' ? 'MONTH' : 'YEAR'} />
                  <input type="hidden" name="gateway" value={gateway} />
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl text-xs font-medium border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                  >
                    {billing === 'annual'
                      ? `Or pay ${fmt(hasDiscount ? dp(plan.monthly) : plan.monthly)}/month`
                      : `Or pay ${fmt(hasDiscount ? dp(plan.annual) : plan.annual)}/year (save more)`}
                  </button>
                </form>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
