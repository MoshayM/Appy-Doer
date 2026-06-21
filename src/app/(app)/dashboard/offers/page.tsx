'use client'

import { useState } from 'react'
import { formatINR } from '@/lib/utils'

interface Tier {
  name: string
  priceINR: number
  deliverables: string[]
  turnaround: string
}

interface OfferResult {
  offerName: string
  positioningStatement: string
  tiers: Tier[]
  idealClient: string
  salesPitch: string
}

export default function OfferBuilderPage() {
  const [result, setResult] = useState<OfferResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function buildOffer() {
    setLoading(true); setError('')
    const res = await fetch('/api/agents/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentType: 'OFFER_BUILDER' }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error?.message ?? 'Failed'); setLoading(false); return }
    setResult(data.data)

    // Persist offer
    await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.data.offerName, detail: data.data }),
    })
    setSaved(true)
    setLoading(false)
  }

  const TIER_COLORS = ['bg-gray-50 border-gray-200', 'bg-indigo-50 border-indigo-200', 'bg-purple-50 border-purple-200']

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offer Builder</h1>
          <p className="text-gray-500 mt-1">Package your skills into a compelling, priced offer</p>
        </div>
        <button
          onClick={buildOffer}
          disabled={loading}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Building offer...' : result ? 'Rebuild Offer' : 'Build My Offer'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>}

      {!result && !loading && (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">📦</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Build Your Service Offer</h2>
          <p className="text-gray-500 text-sm mb-6">Based on your selected opportunity and skills, AI will create a 3-tier priced offer with deliverables, positioning and a sales pitch.</p>
          <button onClick={buildOffer} disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {loading ? 'Building...' : 'Build My Offer'}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Offer header */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-900">{result.offerName}</h2>
              {saved && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">Saved ✓</span>}
            </div>
            <p className="text-indigo-600 font-medium mb-3">{result.positioningStatement}</p>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ideal Client</div>
              <p className="text-sm text-gray-700">{result.idealClient}</p>
            </div>
          </div>

          {/* Tiers */}
          <div className="grid md:grid-cols-3 gap-4">
            {result.tiers.map((tier, i) => (
              <div key={tier.name} className={`border rounded-2xl p-6 ${TIER_COLORS[i % TIER_COLORS.length]}`}>
                <div className="font-bold text-gray-900 mb-1">{tier.name}</div>
                <div className="text-2xl font-bold text-indigo-700 mb-1">₹{tier.priceINR.toLocaleString('en-IN')}</div>
                <div className="text-xs text-gray-500 mb-4">Turnaround: {tier.turnaround}</div>
                <ul className="space-y-1.5">
                  {tier.deliverables.map((d, j) => (
                    <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Sales pitch */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sales Pitch</div>
            <p className="text-gray-700">{result.salesPitch}</p>
          </div>

          <a href="/dashboard/portfolio" className="block w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold text-center hover:bg-indigo-700 transition-colors">
            Build Portfolio →
          </a>
        </div>
      )}
    </div>
  )
}
