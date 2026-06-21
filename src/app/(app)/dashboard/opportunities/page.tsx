'use client'

import { useState, useEffect } from 'react'

interface Opportunity {
  id: string
  title: string
  category: string
  difficultyScore: number
  timeToFirstIncome: string
  monthlyPotentialINR: { min: number; max: number }
  requiredEffortHoursPerWeek: number
  indiaContext: { clientGeography: string; gstRelevant: boolean; recommendedPlatforms: string[] }
  riskNotes: string
  actionPlanSummary: string
}

interface DiscoveryResult {
  opportunities: Opportunity[]
  topRecommendationId: string
}

export default function OpportunitiesPage() {
  const [result, setResult] = useState<DiscoveryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function discover() {
    setLoading(true); setError('')
    const res = await fetch('/api/agents/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentType: 'OPPORTUNITY_DISCOVERY' }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error?.message ?? 'Failed'); setLoading(false); return }
    setResult(data.data)
    setSelected(data.data.topRecommendationId)
    setLoading(false)
  }

  async function selectOpportunity(oppId: string) {
    setSelected(oppId)
    await fetch('/api/opportunities/' + oppId + '/select', { method: 'POST' })
  }

  const CATEGORY_ICON: Record<string, string> = {
    SERVICE: '🛠️', DIGITAL_PRODUCT: '📦', SAAS: '💻', CONTENT: '✍️',
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunity Discovery</h1>
          <p className="text-gray-500 mt-1">Find your best income path based on your skills</p>
        </div>
        <button
          onClick={discover}
          disabled={loading}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Discovering...' : result ? 'Rediscover' : 'Discover Opportunities'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>}

      {!result && !loading && (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Discover Your Income Opportunities</h2>
          <p className="text-gray-500 text-sm mb-6">Complete your skill assessment first, then click Discover to see personalized income opportunities.</p>
          <button onClick={discover} disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {loading ? 'Analyzing...' : 'Discover Opportunities'}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {result.opportunities.map(opp => (
            <div
              key={opp.id}
              onClick={() => selectOpportunity(opp.id)}
              className={`bg-white border rounded-2xl p-6 cursor-pointer transition-all hover:shadow-md ${
                selected === opp.id ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200'
              } ${result.topRecommendationId === opp.id ? 'border-indigo-300' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CATEGORY_ICON[opp.category] ?? '💡'}</span>
                  <div>
                    <h3 className="font-bold text-gray-900">{opp.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{opp.category}</span>
                      {result.topRecommendationId === opp.id && (
                        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-medium">⭐ Top Pick</span>
                      )}
                      {selected === opp.id && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded font-medium">✓ Selected</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">₹{opp.monthlyPotentialINR.min.toLocaleString('en-IN')}–{opp.monthlyPotentialINR.max.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-gray-500">/month potential</div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">{opp.actionPlanSummary}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>⏱ {opp.timeToFirstIncome}</span>
                <span>⚡ {opp.requiredEffortHoursPerWeek}h/week</span>
                <span>📊 Difficulty: {opp.difficultyScore}/10</span>
                <span>{opp.indiaContext.clientGeography}</span>
              </div>
            </div>
          ))}

          {selected && (
            <a href="/dashboard/offers" className="block w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold text-center hover:bg-indigo-700 transition-colors mt-4">
              Build Your Offer →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
