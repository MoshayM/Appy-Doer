import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getPricingZone, GEO_PRICES } from '@/lib/geo-pricing'
import Link from 'next/link'
import PlanCards from './PlanCards'

// ─── Personalised offer logic ─────────────────────────────────────────────────
async function computeOffer(userId: string, trialDaysLeft: number) {
  try {
    const [ctx, runs, leads, existing] = await Promise.all([
      prisma.userContext.findUnique({ where: { userId }, select: { engagementScore: true } }),
      prisma.agentRun.count({ where: { userId, success: true } }),
      prisma.lead.count({ where: { userId } }),
      prisma.subscriptionOffer.findFirst({
        where: { userId, accepted: false, shown: false },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    if (existing) return { discount: existing.discountPercent, headline: `🎁 Your exclusive ${existing.discountPercent}% off — waiting for you`, sub: 'A personalised deal is ready. Lock it in before it expires.' }
    const hi = (ctx?.engagementScore ?? 0) > 40 || runs >= 5
    const ending = trialDaysLeft <= 3 && trialDaysLeft > 0

    if (ending && hi)     return { discount: 30, headline: `⚡ ${trialDaysLeft}d left — 30% off if you subscribe now`, sub: `You've run ${runs} AI sessions. Don't lose your progress.` }
    if (ending)           return { discount: 25, headline: '🕐 Trial ending — 25% off today only', sub: 'Subscribe before your trial ends and continue exactly where you left off.' }
    if (hi && leads >= 2) return { discount: 20, headline: '🚀 Power user reward — 20% off', sub: `${runs} AI sessions · ${leads} leads in pipeline. You're getting results.` }
    if (leads >= 2)       return { discount: 15, headline: `📊 ${leads} leads waiting — close faster with AI`, sub: 'Unlimited Client Intelligence comes with a paid plan. 15% off.' }
    if (runs <= 1)        return { discount: 15, headline: '🎁 Welcome gift — 15% off your first plan', sub: 'Thank you for joining. Subscribe now and save.' }
  } catch { /* fall through */ }
  return { discount: 10, headline: '💡 Annual plan saves you 2 months of cost', sub: 'Pay once, grow all year. Plus 10% off today.' }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function BillingPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const sub = await prisma.subscription.findUnique({ where: { userId: user.id } })

  const headersList = headers()
  const country = headersList.get('x-country') ?? 'IN'
  const zone = getPricingZone(country)
  const prices = GEO_PRICES[zone]
  const { symbol, gateway } = prices

  const trialDays = user.trialDaysRemaining ?? null
  const trialDaysLeft = trialDays ?? 0
  const isPaid = user.plan === 'PRO' || user.plan === 'PREMIUM'

  const offer = await computeOffer(user.id, trialDaysLeft)

  const plans = [
    {
      id: 'PRO',
      name: 'Pro',
      emoji: '⚡',
      color: 'indigo' as const,
      badge: 'Most Popular',
      monthly: prices.PRO.monthly,
      annual: prices.PRO.annual,
      am: prices.PRO.annualMonthly,
      savings: prices.PRO.monthly * 12 - prices.PRO.annual,
      features: [
        '100 AI outputs / day',
        'All 9 AI agents',
        'Unlimited CRM leads',
        'Client Intelligence',
        'Offer Builder & Portfolio',
        'Work Support Center',
        'Profile Intelligence + public site',
        'Email support',
      ],
    },
    {
      id: 'PREMIUM',
      name: 'Premium',
      emoji: '👑',
      color: 'violet' as const,
      badge: 'Best Value',
      monthly: prices.PREMIUM.monthly,
      annual: prices.PREMIUM.annual,
      am: prices.PREMIUM.annualMonthly,
      savings: prices.PREMIUM.monthly * 12 - prices.PREMIUM.annual,
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

  const planStatusLabel: Record<string, string> = {
    TRIAL:   trialDays != null && trialDays > 0 ? `Trial · ${trialDays}d left` : 'Trial ended',
    PRO:     'Pro · Active',
    PREMIUM: 'Premium · Active',
    FREE:    'Free',
  }
  const planStatusColor: Record<string, string> = {
    TRIAL:   'bg-yellow-50 text-yellow-700 border-yellow-200',
    PRO:     'bg-indigo-50 text-indigo-700 border-indigo-200',
    PREMIUM: 'bg-violet-50 text-violet-700 border-violet-200',
    FREE:    'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-7">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription & Billing</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your plan, view pricing, and update billing</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${planStatusColor[user.plan] ?? planStatusColor.FREE}`}>
          {planStatusLabel[user.plan] ?? user.plan}
        </span>
      </div>

      {/* Alert banners */}
      {user.plan === 'FREE' && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <span className="text-red-500 text-lg shrink-0">⚠</span>
          <div>
            <p className="font-semibold text-red-800 text-sm">Your trial has ended</p>
            <p className="text-red-600 text-sm mt-0.5">All your data is preserved. Subscribe to continue using AI WorkBuddy.</p>
          </div>
        </div>
      )}
      {user.plan === 'TRIAL' && trialDays !== null && trialDays <= 3 && (
        <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <span className="text-yellow-500 text-lg shrink-0">⏳</span>
          <div>
            <p className="font-semibold text-yellow-800 text-sm">
              {trialDays === 0 ? 'Trial ends today' : `${trialDays} day${trialDays !== 1 ? 's' : ''} left on your trial`}
            </p>
            <p className="text-yellow-700 text-sm mt-0.5">Subscribe now to keep full access to all AI features.</p>
          </div>
        </div>
      )}

      {/* Active subscription card */}
      {isPaid && sub && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Active Subscription</p>
            <p className="font-bold text-gray-900">
              {user.plan} Plan · {sub.interval === 'YEAR' ? 'Annual billing' : 'Monthly billing'}
            </p>
            {sub.currentPeriodEnd && (
              <p className="text-sm text-gray-500">
                Next billing: <span className="font-medium text-gray-700">
                  {new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </p>
            )}
          </div>
          <span className="text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1.5 shrink-0">
            ✓ Active
          </span>
        </div>
      )}

      {/* Personalised offer banner (hidden for paid users) */}
      {!isPaid && (
        <div className="bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-800/40 rounded-2xl p-5 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
              🤖 AI Offer
            </span>
            <h2 className="text-white font-bold text-lg mt-2 mb-1">{offer.headline}</h2>
            <p className="text-gray-400 text-sm">{offer.sub}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-4xl font-black text-indigo-400">{offer.discount}%</div>
            <div className="text-gray-500 text-xs font-bold uppercase">OFF</div>
          </div>
        </div>
      )}

      {/* Pricing zone + discount tag */}
      <div className="flex items-center gap-2 text-xs">
        <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium">
          {zone === 'INR' ? `🇮🇳 India pricing · ${symbol} INR` : `🌍 International pricing · ${symbol} USD`}
        </span>
        {offer.discount > 0 && !isPaid && (
          <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-semibold">
            {offer.discount}% off applied
          </span>
        )}
      </div>

      {/* Plan cards with Monthly/Annual toggle */}
      <PlanCards
        plans={plans}
        currentPlan={user.plan}
        gateway={gateway}
        discountPct={offer.discount}
        isPaid={isPaid}
        symbol={symbol}
        zone={zone}
      />

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

      {/* Cancel */}
      {isPaid && (
        <div className="text-center pt-2">
          <Link href="/api/billing/cancel" className="text-xs text-red-400 hover:text-red-600 hover:underline transition-colors">
            Cancel subscription
          </Link>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 pb-6">
        {zone === 'INR'
          ? 'Prices in INR (₹) · Payments via Razorpay · 18% GST applicable · Cancel anytime'
          : 'Prices in USD ($) · Payments via Stripe · Cancel anytime · No hidden fees'}
      </p>
    </div>
  )
}
