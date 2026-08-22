import { headers } from 'next/headers'
import Link from 'next/link'
import { getCurrencyForCountry, getPricing, formatLocalPrice, getPremiumPricing } from '@/lib/currency-pricing'
import PlanCards from './PlanCards'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function computePersonalOffer(userId: string, trialDaysLeft: number) {
  try {
    const [context, agentRunCount, leadCount, existingOffer] = await Promise.all([
      prisma.userContext.findUnique({ where: { userId }, select: { engagementScore: true } }),
      prisma.agentRun.count({ where: { userId, success: true } }),
      prisma.lead.count({ where: { userId } }),
      prisma.subscriptionOffer.findFirst({
        where: { userId, accepted: false, shown: false },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const engagement = context?.engagementScore ?? 0
    const isHighEngagement = engagement > 40 || agentRunCount >= 5
    const hasPipeline = leadCount >= 2
    const endingSoon = trialDaysLeft <= 3 && trialDaysLeft > 0
    const isNew = agentRunCount <= 1

    if (existingOffer) {
      return {
        offerId: existingOffer.id,
        discount: existingOffer.discountPercent,
        headline: `🎁 Your exclusive offer — ${existingOffer.discountPercent}% off`,
        message: 'A personalised deal is waiting for you. Lock in your discount before it expires.',
        badge: 'Exclusive Deal',
        badgeColor: 'purple' as const,
        cashback: null,
        tip: null,
      }
    }

    if (endingSoon && isHighEngagement) {
      return {
        offerId: null,
        discount: 30,
        headline: `⚡ ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left — your progress locks away`,
        message: `You've completed ${agentRunCount} AI sessions. Subscribe now and get 30% off forever.`,
        badge: 'Expiring Soon',
        badgeColor: 'red' as const,
        cashback: null,
        tip: 'Annual plan saves you the most — pay once, grow all year.',
      }
    }

    if (endingSoon) {
      return {
        offerId: null,
        discount: 25,
        headline: '🕐 Trial ending — don\'t lose your data',
        message: 'Subscribe before your trial ends and continue exactly where you left off. 25% off.',
        badge: 'Final Reminder',
        badgeColor: 'orange' as const,
        cashback: null,
        tip: null,
      }
    }

    if (isHighEngagement && hasPipeline) {
      return {
        offerId: null,
        discount: 20,
        headline: '🚀 Power user detected — here\'s your reward',
        message: `${agentRunCount} AI sessions + ${leadCount} leads in your pipeline. Get 20% off + 5% cashback.`,
        badge: 'Power User Reward',
        badgeColor: 'purple' as const,
        cashback: '5% cashback on first payment',
        tip: 'Unlimited AI on Premium means faster client acquisition.',
      }
    }

    if (hasPipeline) {
      return {
        offerId: null,
        discount: 15,
        headline: `📊 You have ${leadCount} leads — close them faster with AI`,
        message: 'Unlimited Client Intelligence and Relationship Success tools come with a paid plan. 15% off.',
        badge: 'Pipeline Offer',
        badgeColor: 'blue' as const,
        cashback: null,
        tip: 'Client Intelligence predicts deal success before you pitch.',
      }
    }

    if (isNew) {
      return {
        offerId: null,
        discount: 15,
        headline: '🎁 Welcome gift — 15% off your first subscription',
        message: 'You\'ve just started your journey. Subscribe now and get 15% off as a thank-you for joining.',
        badge: 'Welcome Offer',
        badgeColor: 'green' as const,
        cashback: '10% cashback after 90 days',
        tip: 'Start with the Skill Assessment agent to unlock your income roadmap.',
      }
    }
  } catch {
    // DB unavailable — fall through to default
  }

  return {
    offerId: null,
    discount: 10,
    headline: '💡 Annual saves you 2 months of cost',
    message: 'Tip from your AI advisor: switching to annual billing gives you 2 free months every year. Plus 10% extra off today.',
    badge: 'AI Tip',
    badgeColor: 'teal' as const,
    cashback: null,
    tip: 'Most power users choose annual for the unlimited AI advantage.',
  }
}

export default async function PlansPage() {
  const headersList = headers()
  const country = headersList.get('x-country') ?? 'IN'
  const currencyCode = getCurrencyForCountry(country)
  const pricing = getPricing(currencyCode)

  // Try to get auth user for personalised offer — gracefully skip if not logged in
  let trialDaysLeft = 0
  let offer = await computePersonalOffer('', 0)
  let currentPlan = 'NONE'

  try {
    const user = await getAuthUser()
    if (user) {
      currentPlan = user.plan
      if (user.plan === 'TRIAL') {
        const sub = await prisma.subscription.findUnique({ where: { userId: user.id } })
        if (sub?.trialEndsAt) {
          trialDaysLeft = Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86400000))
        }
      }
      offer = await computePersonalOffer(user.id, trialDaysLeft)
    }
  } catch {
    // Not logged in or DB error — show default public pricing
  }

  const premium = getPremiumPricing(pricing)

  const monthlyStr = formatLocalPrice(pricing.monthly, pricing)
  const annualStr = formatLocalPrice(pricing.annual, pricing)
  const amStr = formatLocalPrice(pricing.annualMonthly, pricing)

  const premiumMonthlyStr = formatLocalPrice(premium.monthly, pricing)
  const premiumAnnualStr = formatLocalPrice(premium.annual, pricing)
  const premiumAmStr = formatLocalPrice(premium.annualMonthly, pricing)

  const discountedMonthly = Math.round(pricing.monthly * (1 - offer.discount / 100))
  const discountedAnnual = Math.round(pricing.annual * (1 - offer.discount / 100))
  const discountedPremiumMonthly = Math.round(premium.monthly * (1 - offer.discount / 100))
  const discountedPremiumAnnual = Math.round(premium.annual * (1 - offer.discount / 100))

  const symbol = monthlyStr.replace(/[\d,.\s]/g, '').trim().slice(0, 4)

  const badgeColors: Record<string, string> = {
    red:    'bg-red-950/40 border-red-700/40',
    orange: 'bg-orange-950/40 border-orange-700/40',
    purple: 'bg-purple-950/40 border-purple-600/40',
    green:  'bg-green-950/40 border-green-700/40',
    teal:   'bg-teal-950/40 border-teal-700/40',
    blue:   'bg-blue-950/40 border-blue-700/40',
  }
  const badgeTextColors: Record<string, string> = {
    red:    'bg-red-500/20 text-red-300',
    orange: 'bg-orange-500/20 text-orange-300',
    purple: 'bg-purple-500/20 text-purple-300',
    green:  'bg-green-500/20 text-green-300',
    teal:   'bg-teal-500/20 text-teal-300',
    blue:   'bg-blue-500/20 text-blue-300',
  }
  const discountColors: Record<string, string> = {
    red:    'text-red-400',
    orange: 'text-orange-400',
    purple: 'text-purple-400',
    green:  'text-green-400',
    teal:   'text-teal-400',
    blue:   'text-blue-400',
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Minimal nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">W</div>
          <span className="font-bold text-white text-sm">AI WorkBuddy</span>
        </Link>
        <div className="flex items-center gap-3">
          {currentPlan === 'NONE' ? (
            <>
              <Link href="/login" className="text-gray-400 hover:text-white text-sm transition-colors">Sign In</Link>
              <Link href="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                Start Free Trial
              </Link>
            </>
          ) : (
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">← Dashboard</Link>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-[#0a0a0f] to-purple-950 px-6 pt-16 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-800/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
            {country !== 'IN' ? `Pricing for ${country}` : 'India Pricing'} · {currencyCode}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Grow your income.<br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Powered by AI.
            </span>
          </h1>
          <p className="text-gray-400 text-lg mb-2">
            All prices shown in <strong className="text-white">{pricing.name} ({currencyCode})</strong> based on your location.
          </p>
          {trialDaysLeft > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm px-4 py-2 rounded-full">
              ⏳ {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left on your free trial
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8">
        {/* AI Offer Card */}
        <div className={`rounded-2xl border p-6 mb-8 relative overflow-hidden ${badgeColors[offer.badgeColor] ?? badgeColors.blue}`}>
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 bg-white pointer-events-none" />
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 ${badgeTextColors[offer.badgeColor] ?? badgeTextColors.blue}`}>
                🤖 AI Offer · {offer.badge}
              </div>
              <h2 className="text-white font-bold text-xl mb-1">{offer.headline}</h2>
              <p className="text-gray-400 text-sm mb-3">{offer.message}</p>
              {offer.cashback && (
                <div className="inline-flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 text-green-300 px-3 py-1.5 rounded-lg">
                  💰 {offer.cashback}
                </div>
              )}
              {offer.tip && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
                  <span className="text-yellow-500 mt-0.5">💡</span>
                  <span>{offer.tip}</span>
                </div>
              )}
            </div>
            <div className="text-right flex-shrink-0">
              <div className={`text-5xl font-black mb-1 ${discountColors[offer.badgeColor] ?? 'text-indigo-400'}`}>
                {offer.discount}%
              </div>
              <div className="text-gray-500 text-xs font-semibold uppercase tracking-wide">OFF</div>
            </div>
          </div>
        </div>

        {/* Plan cards */}
        <PlanCards
          currencyCode={currencyCode}
          symbol={symbol}
          pro={{
            monthly: pricing.monthly,
            annual: pricing.annual,
            annualMonthly: pricing.annualMonthly,
            monthlyStr,
            annualStr,
            amStr,
            discountedMonthly,
            discountedAnnual,
          }}
          premium={{
            monthly: premium.monthly,
            annual: premium.annual,
            annualMonthly: premium.annualMonthly,
            monthlyStr: premiumMonthlyStr,
            annualStr: premiumAnnualStr,
            amStr: premiumAmStr,
            discountedMonthly: discountedPremiumMonthly,
            discountedAnnual: discountedPremiumAnnual,
          }}
          discountPct={offer.discount}
          gateway={pricing.gateway}
          currentPlan={currentPlan}
          offerId={offer.offerId ?? undefined}
        />

        {/* Trust row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 mb-16">
          {[
            { icon: '🔒', text: 'Secure payment' },
            { icon: '🔄', text: 'Cancel anytime' },
            { icon: '🌍', text: 'Local currency' },
            { icon: '💬', text: 'Priority support' },
          ].map(t => (
            <div key={t.text} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <span className="text-lg">{t.icon}</span>
              <span className="text-gray-400 text-xs font-medium">{t.text}</span>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="border-t border-white/10 pt-12 pb-20">
          <h3 className="text-white font-bold text-2xl mb-8 text-center">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {[
              { q: 'Why is pricing different for my country?', a: 'We use geo-adaptive pricing so the product is affordable everywhere. Your price is shown in your local currency at a fair rate for your region.' },
              { q: 'Can I switch from monthly to annual later?', a: "Yes. You can upgrade at any time from your billing page and we'll credit the unused portion of your current plan." },
              { q: 'What happens when my trial ends?', a: "Your account moves to the Free plan (read-only). All your data is preserved — subscribe at any time to continue where you left off." },
              { q: 'Is my payment secure?', a: 'Yes. Payments are processed by Razorpay (India) or Stripe (international). We never store card details.' },
              { q: 'How does the AI discount offer work?', a: 'Our AI analyses your activity — agent runs, leads added, days on trial — and generates a personalised discount. Offers refresh based on your engagement.' },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="text-white font-semibold mb-2 text-sm">{q}</div>
                <div className="text-gray-400 text-sm">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
