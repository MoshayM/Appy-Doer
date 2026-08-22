'use client'

import { useState } from 'react'
import { Check, X, Zap } from 'lucide-react'

interface PlanPricing {
  monthly: number
  annual: number
  annualMonthly: number
  monthlyStr: string
  annualStr: string
  amStr: string
  discountedMonthly: number
  discountedAnnual: number
}

interface Props {
  pro: PlanPricing
  premium: PlanPricing
  discountPct: number
  gateway: string
  currentPlan: string
  offerId?: string
  currencyCode: string
  symbol: string
}

const FREE_FEATURES = [
  { text: 'All data preserved', ok: true },
  { text: 'View history & reports', ok: true },
  { text: 'Read-only dashboard', ok: true },
  { text: 'AI generation', ok: false },
  { text: 'Add leads or projects', ok: false },
]

const PRO_FEATURES = [
  '100 AI outputs / day',
  'All 9 MVP AI agents',
  'Unlimited CRM leads',
  'Offer Builder & Portfolio',
  'Client Intelligence',
  'Work Support Center',
  'Profile Intelligence + public site',
  'Email support',
]

const PREMIUM_FEATURES = [
  { text: 'Everything in Pro', bold: false },
  { text: 'Unlimited AI outputs', bold: true },
  { text: 'Priority AI (higher tokens)', bold: true },
  { text: 'Virtual Employee Team', bold: true },
  { text: 'Revenue Growth agents', bold: false },
  { text: 'Business Scaling agents', bold: false },
  { text: 'Early access to all features', bold: true },
  { text: 'Priority email support', bold: false },
]

export default function PlanCards({
  pro, premium, discountPct, gateway, currentPlan, offerId, currencyCode, symbol,
}: Props) {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')
  const [loading, setLoading] = useState<string | null>(null)
  const isAnnual = billing === 'annual'

  const proAnnualSavings = pro.monthly * 12 - pro.annual
  const premiumAnnualSavings = premium.monthly * 12 - premium.annual

  function fmt(n: number) { return `${symbol}${n.toLocaleString()}` }

  const proDisplayPrice = discountPct > 0
    ? (isAnnual ? pro.discountedAnnual : pro.discountedMonthly)
    : (isAnnual ? pro.annual : pro.monthly)

  const premiumDisplayPrice = discountPct > 0
    ? (isAnnual ? premium.discountedAnnual : premium.discountedMonthly)
    : (isAnnual ? premium.annual : premium.monthly)

  async function subscribe(plan: string) {
    setLoading(plan)
    const res = await fetch('/api/billing/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, interval: isAnnual ? 'YEAR' : 'MONTH', gateway, offerId }),
    })
    const data = await res.json()
    if (data.checkoutUrl) { window.location.href = data.checkoutUrl; return }
    if (!res.ok) alert(data.error?.message ?? 'Payment failed. Try again.')
    setLoading(null)
  }

  return (
    <div>
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <div className="bg-white/5 border border-white/10 rounded-full p-1 flex items-center">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              !isAnnual ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              isAnnual ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Annual
          </button>
        </div>
        {isAnnual && proAnnualSavings > 0 && (
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full">
            <Zap size={11} />
            Save {fmt(proAnnualSavings)} on Pro · {fmt(premiumAnnualSavings)} on Premium
          </div>
        )}
      </div>

      {/* 3-column plan grid */}
      <div className="grid md:grid-cols-3 gap-5">

        {/* ── Free ── */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col">
          <div className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Free</div>

          <div className="mb-5">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-gray-600">{symbol}0</span>
            </div>
            <p className="text-gray-700 text-xs mt-1">After trial ends</p>
          </div>

          <ul className="space-y-2.5 flex-1 mb-6">
            {FREE_FEATURES.map(f => (
              <li key={f.text} className="flex items-center gap-2.5 text-sm">
                {f.ok
                  ? <Check size={14} className="text-gray-500 flex-shrink-0" />
                  : <X size={14} className="text-gray-700 flex-shrink-0" />}
                <span className={f.ok ? 'text-gray-400' : 'text-gray-700 line-through'}>{f.text}</span>
              </li>
            ))}
          </ul>

          <div className="py-3 rounded-xl text-center text-xs font-semibold text-gray-600 border border-white/10">
            {currentPlan === 'FREE' ? 'Current Plan' : 'After trial'}
          </div>
        </div>

        {/* ── Pro — highlighted ── */}
        <div className="relative bg-white/5 border-2 border-indigo-500/60 rounded-2xl p-6 flex flex-col shadow-xl shadow-indigo-900/20">
          <div className="absolute -top-3.5 inset-x-0 flex justify-center">
            <span className="bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-full">Most Popular</span>
          </div>

          <div className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4 mt-1">Pro</div>

          <div className="mb-5">
            <div className="flex items-end gap-2">
              {discountPct > 0 && (
                <span className="text-gray-600 line-through text-sm">
                  {isAnnual ? pro.annualStr : pro.monthlyStr}
                </span>
              )}
              <span className="text-4xl font-black text-white">{fmt(proDisplayPrice)}</span>
              <span className="text-gray-400 text-sm mb-0.5">/{isAnnual ? 'yr' : 'mo'}</span>
            </div>
            {isAnnual && (
              <p className="text-gray-500 text-xs mt-0.5">
                ≈ {discountPct > 0 ? fmt(Math.round(pro.discountedAnnual / 12)) : pro.amStr}/month billed annually
              </p>
            )}
            {discountPct > 0 ? (
              <div className="inline-flex items-center gap-1 mt-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full">
                {discountPct}% discount applied
              </div>
            ) : isAnnual && proAnnualSavings > 0 ? (
              <div className="inline-flex items-center gap-1 mt-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full">
                Save {fmt(proAnnualSavings)}/year
              </div>
            ) : null}
          </div>

          <ul className="space-y-2.5 flex-1 mb-6">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-300">
                <Check size={14} className="text-indigo-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={() => subscribe('PRO')}
            disabled={currentPlan === 'PRO' || !!loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading === 'PRO' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Redirecting…
              </span>
            ) : currentPlan === 'PRO' ? 'Current Plan' : 'Get Pro'}
          </button>
        </div>

        {/* ── Premium ── */}
        <div className="relative bg-gradient-to-br from-violet-900/40 via-purple-900/30 to-indigo-900/40 border border-violet-500/30 rounded-2xl p-6 flex flex-col overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-3.5 inset-x-0 flex justify-center">
            <span className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-full">Best Value</span>
          </div>

          <div className="relative text-violet-300 text-xs font-bold uppercase tracking-widest mb-4 mt-1">Premium</div>

          <div className="relative mb-5">
            <div className="flex items-end gap-2">
              {discountPct > 0 && (
                <span className="text-violet-400/50 line-through text-sm">
                  {isAnnual ? premium.annualStr : premium.monthlyStr}
                </span>
              )}
              <span className="text-4xl font-black text-white">{fmt(premiumDisplayPrice)}</span>
              <span className="text-violet-300/60 text-sm mb-0.5">/{isAnnual ? 'yr' : 'mo'}</span>
            </div>
            {isAnnual && (
              <p className="text-violet-400/60 text-xs mt-0.5">
                ≈ {discountPct > 0 ? fmt(Math.round(premium.discountedAnnual / 12)) : premium.amStr}/month billed annually
              </p>
            )}
            {discountPct > 0 ? (
              <div className="inline-flex items-center gap-1 mt-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full">
                {discountPct}% discount applied
              </div>
            ) : isAnnual && premiumAnnualSavings > 0 ? (
              <div className="inline-flex items-center gap-1 mt-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full">
                Save {fmt(premiumAnnualSavings)}/year
              </div>
            ) : null}
          </div>

          <ul className="space-y-2.5 flex-1 mb-6 relative">
            {PREMIUM_FEATURES.map(f => (
              <li key={f.text} className="flex items-center gap-2.5 text-sm">
                <Check size={14} className={`flex-shrink-0 ${f.bold ? 'text-violet-300' : 'text-indigo-400'}`} />
                <span className={f.bold ? 'text-violet-100 font-medium' : 'text-indigo-200'}>{f.text}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => subscribe('PREMIUM')}
            disabled={currentPlan === 'PREMIUM' || !!loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-900/30 disabled:opacity-40 disabled:cursor-not-allowed relative"
          >
            {loading === 'PREMIUM' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Redirecting…
              </span>
            ) : currentPlan === 'PREMIUM' ? 'Current Plan' : 'Get Premium'}
          </button>
        </div>
      </div>

      <p className="text-center text-gray-600 text-xs mt-6">
        All prices in {currencyCode} · Secured by {gateway === 'RAZORPAY' ? 'Razorpay' : 'Stripe'} · Cancel anytime · No hidden fees
      </p>
    </div>
  )
}
