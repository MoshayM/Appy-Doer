import { NextResponse } from 'next/server'
import { PLAN_PRICES, TRIAL_DAYS } from '@/lib/constants'
import { gstAmount } from '@/lib/utils'

export async function GET() {
  return NextResponse.json({
    trial: { days: TRIAL_DAYS, requiresCard: false },
    plans: [
      {
        id: 'PRO',
        name: 'Pro',
        interval: 'MONTH',
        priceINR: PLAN_PRICES.PRO.priceINR,
        gstINR: gstAmount(PLAN_PRICES.PRO.priceINR),
        totalINR: PLAN_PRICES.PRO.priceINR + gstAmount(PLAN_PRICES.PRO.priceINR),
        features: ['100 AI outputs/day', 'All 9 MVP agents', 'Unlimited CRM leads', 'Work Support', 'Relationship Center'],
      },
      {
        id: 'PREMIUM',
        name: 'Premium',
        interval: 'YEAR',
        priceINR: PLAN_PRICES.PREMIUM.priceINR,
        gstINR: gstAmount(PLAN_PRICES.PREMIUM.priceINR),
        totalINR: PLAN_PRICES.PREMIUM.priceINR + gstAmount(PLAN_PRICES.PREMIUM.priceINR),
        effectiveMonthlyINR: Math.round(PLAN_PRICES.PREMIUM.priceINR / 12),
        features: ['Unlimited AI outputs', 'Priority AI', 'All Pro features', 'Virtual Employee Team (Phase 3)', 'Revenue Growth tools (Phase 4)', 'Early access', 'Priority support'],
      },
    ],
  })
}
