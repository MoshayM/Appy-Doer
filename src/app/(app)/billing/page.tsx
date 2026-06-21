import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getPricingZone, GEO_PRICES, formatPrice } from '@/lib/geo-pricing'
import { Check, Zap, Crown, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

function StatusBadge({ plan, daysLeft }: { plan: string; daysLeft?: number | null }) {
  if (plan === 'PREMIUM') return (
    <span className="inline-flex items-center gap-1.5 bg-violet-100 text-violet-700 text-xs font-bold px-3 py-1 rounded-full">
      <Crown size={11} /> Premium
    </span>
  )
  if (plan === 'PRO') return (
    <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
      <Zap size={11} /> Pro
    </span>
  )
  if (plan === 'TRIAL') return (
    <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
      <Clock size={11} /> Trial{daysLeft != null ? ` · ${daysLeft}d left` : ''}
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
      Free
    </span>
  )
}

export default async function BillingPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } })

  const headersList = headers()
  const country = headersList.get('x-country') ?? 'IN'
  const zone = getPricingZone(country)
  const prices = GEO_PRICES[zone]
  const { symbol } = prices
  const gateway = prices.gateway

  const isINR = zone === 'INR'
  const trialDays = user.trialDaysRemaining
  const isOnPaidPlan = user.plan === 'PRO' || user.plan === 'PREMIUM'
  const nextBilling = sub?.currentPeriodEnd

  // Annual savings vs paying monthly all year
  const proAnnualSavings = prices.PRO.monthly * 12 - prices.PRO.annual
  const premiumAnnualSavings = prices.PREMIUM.monthly * 12 - prices.PREMIUM.annual

  const plans = [
    {
      id: 'PRO',
      name: 'Pro',
      icon: Zap,
      color: 'indigo',
      monthlyPrice: prices.PRO.monthly,
      annualPrice: prices.PRO.annual,
      amPrice: prices.PRO.annualMonthly,
      annualSavings: proAnnualSavings,
      badge: 'Most Popular',
      features: [
        '100 AI outputs / day',
        'All 9 MVP AI agents',
        'Unlimited CRM leads',
        'Offer Builder & Portfolio',
        'Client Intelligence',
        'Work Support Center',
        'Profile Intelligence + public site',
        'Email support',
      ],
    },
    {
      id: 'PREMIUM',
      name: 'Premium',
      icon: Crown,
      color: 'violet',
      monthlyPrice: prices.PREMIUM.monthly,
      annualPrice: prices.PREMIUM.annual,
      amPrice: prices.PREMIUM.annualMonthly,
      annualSavings: premiumAnnualSavings,
      badge: 'Best Value',
      features: [
        'Everything in Pro',
        'Unlimited AI outputs',
        'Priority AI (higher tokens)',
        'Virtual Employee Team (Phase 3)',
        'Revenue Growth agents (Phase 4)',
        'Business Scaling agents (Phase 4)',
        'Early access to all features',
        'Priority email support',
      ],
    },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscription & Billing</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your plan and billing details</p>
      </div>

      {/* Trial expired banner */}
      {user.plan === 'FREE' && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-5">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Your trial has ended</p>
            <p className="text-red-600 text-sm mt-0.5">
              Subscribe to continue using AI WorkBuddy. All your data is preserved and ready to use.
            </p>
          </div>
        </div>
      )}

      {/* Trial ending soon */}
      {user.plan === 'TRIAL' && trialDays !== null && trialDays <= 3 && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
          <Clock size={18} className="text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800 text-sm">
              {trialDays === 0 ? 'Your trial ends today' : `${trialDays} day${trialDays !== 1 ? 's' : ''} left on your trial`}
            </p>
            <p className="text-yellow-700 text-sm mt-0.5">Subscribe now to keep full access to all AI features.</p>
          </div>
        </div>
      )}

      {/* Current plan status card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Current Plan</p>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xl font-bold text-gray-900">{user.plan === 'TRIAL' ? '7-Day Trial' : user.plan}</h2>
              <StatusBadge plan={user.plan} daysLeft={trialDays} />
            </div>
            {isOnPaidPlan && sub && (
              <div className="space-y-1 text-sm text-gray-500">
                {sub.interval && (
                  <p>Billing: <span className="text-gray-700 font-medium">{sub.interval === 'YEAR' ? 'Annual' : 'Monthly'}</span></p>
                )}
                {nextBilling && (
                  <p>Next billing: <span className="text-gray-700 font-medium">{new Date(nextBilling).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span></p>
                )}
              </div>
            )}
            {user.plan === 'TRIAL' && trialDays !== null && (
              <p className="text-sm text-gray-500">
                {trialDays > 0 ? `${trialDays} day${trialDays !== 1 ? 's' : ''} remaining` : 'Trial ends today'}
              </p>
            )}
          </div>
          {isOnPaidPlan && (
            <div className="text-right flex-shrink-0">
              <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
                <CheckCircle size={12} />
                Active
              </div>
            </div>
          )}
        </div>

        {isOnPaidPlan && (
          <div className="mt-5 pt-5 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">Need to make changes to your subscription?</p>
            <Link
              href="/api/billing/cancel"
              className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline"
            >
              Cancel subscription
            </Link>
          </div>
        )}
      </div>

      {/* Geo pricing tag */}
      <div className="flex items-center gap-2">
        <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium">
          {isINR ? `🇮🇳 India pricing (${symbol} INR)` : `🌍 International pricing (${symbol} USD)`}
        </span>
        <span className="text-xs text-gray-400">· {country}</span>
      </div>

      {/* Plan cards */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4">
          {isOnPaidPlan ? 'Upgrade your plan' : 'Choose a plan'}
        </h3>

        <div className="grid md:grid-cols-2 gap-5">
          {plans.map(plan => {
            const isCurrent = user.plan === plan.id
            const isIndigo = plan.color === 'indigo'

            return (
              <div
                key={plan.id}
                className={`relative bg-white border-2 rounded-2xl p-7 flex flex-col transition-shadow hover:shadow-md ${
                  isCurrent
                    ? isIndigo
                      ? 'border-indigo-400 ring-4 ring-indigo-50'
                      : 'border-violet-400 ring-4 ring-violet-50'
                    : isIndigo
                      ? 'border-indigo-200 hover:border-indigo-300'
                      : 'border-violet-200 hover:border-violet-300'
                }`}
              >
                {/* Badge */}
                <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                  <span className={`text-white text-xs font-bold px-4 py-1 rounded-full ${
                    isIndigo ? 'bg-indigo-500' : 'bg-gradient-to-r from-violet-500 to-indigo-500'
                  }`}>
                    {isCurrent ? 'Your Plan' : plan.badge}
                  </span>
                </div>

                {/* Plan name */}
                <div className="flex items-center gap-2 mb-4 mt-1">
                  <plan.icon size={16} className={isIndigo ? 'text-indigo-600' : 'text-violet-600'} />
                  <span className={`text-sm font-bold uppercase tracking-widest ${isIndigo ? 'text-indigo-600' : 'text-violet-600'}`}>
                    {plan.name}
                  </span>
                </div>

                {/* Pricing */}
                <div className="mb-5">
                  {/* Annual (default shown) */}
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-3xl font-black text-gray-900">{formatPrice(plan.annualPrice, zone)}</span>
                    <span className="text-gray-400 text-sm">/year</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">
                    ≈ {formatPrice(plan.amPrice, zone)}/month · billed annually
                  </p>
                  {plan.annualSavings > 0 && (
                    <div className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                      Save {formatPrice(plan.annualSavings, zone)}/year vs monthly
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    or {formatPrice(plan.monthlyPrice, zone)}/month (monthly billing)
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <Check size={14} className={`flex-shrink-0 ${isIndigo ? 'text-indigo-500' : 'text-violet-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="space-y-2">
                  <form action="/api/billing/subscribe" method="POST">
                    <input type="hidden" name="plan" value={plan.id} />
                    <input type="hidden" name="interval" value="YEAR" />
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
                      {isCurrent ? 'Current Plan' : `Subscribe to ${plan.name} — Annual`}
                    </button>
                  </form>
                  <form action="/api/billing/subscribe" method="POST">
                    <input type="hidden" name="plan" value={plan.id} />
                    <input type="hidden" name="interval" value="MONTH" />
                    <input type="hidden" name="gateway" value={gateway} />
                    <button
                      type="submit"
                      disabled={isCurrent}
                      className="w-full py-2.5 rounded-xl font-medium text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {formatPrice(plan.monthlyPrice, zone)}/month — monthly billing
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Trust row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: '🔒', text: 'Secure payment' },
          { icon: '🔄', text: 'Cancel anytime' },
          { icon: '🌍', text: 'Local currency' },
          { icon: '💬', text: 'Priority support' },
        ].map(t => (
          <div key={t.text} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
            <span>{t.icon}</span>
            <span className="text-gray-500 text-xs font-medium">{t.text}</span>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 pb-4">
        {isINR
          ? 'Prices in Indian Rupees (₹) · Payments via Razorpay · 18% GST applicable · Cancel anytime'
          : 'Prices in US Dollars ($) · Payments via Stripe · Cancel anytime · No hidden fees'}
      </p>
    </div>
  )
}
