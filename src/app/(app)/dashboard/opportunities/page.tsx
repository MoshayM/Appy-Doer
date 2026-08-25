'use client'

import { useState, useEffect } from 'react'
import { AgentProgress } from '@/components/AgentProgress'

interface Opportunity {
  id: string
  title: string
  category: string
  difficultyScore: number
  timeToFirstIncome: string
  monthlyPotentialINR: { min: number; max: number }
  requiredEffortHoursPerWeek: number
  actionPlanSummary: string
}

interface DiscoveryResult {
  opportunities: Opportunity[]
  topRecommendationId: string
  summaryInsight: string
}

const CATEGORY_ICON: Record<string, string> = {
  FREELANCE: '💼', CONSULTING: '🎯', CONTENT: '✍️', TEACHING: '📚',
  PRODUCT: '📦', SERVICE: '🔧', OTHER: '💡',
}

export default function OpportunitiesPage() {
  const [result, setResult] = useState<DiscoveryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [profession, setProfession] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/opportunities')
      .then(r => r.json())
      .then(data => {
        if (data.latestRun?.outputJson) {
          try { setResult(JSON.parse(data.latestRun.outputJson)) } catch { /* ignore */ }
        }
      })
      .catch(() => {})
  }, [])

  async function discover() {
    setLoading(true)
    setError('')
    try {
      const ctx = profession.trim()
        ? await fetch('/api/agents/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentType: 'OPPORTUNITY_DISCOVERY', input: { profession } }),
          }).then(r => r.json())
        : await fetch('/api/agents/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentType: 'OPPORTUNITY_DISCOVERY', input: {} }),
          }).then(r => r.json())
      if (ctx.error) throw new Error(ctx.error)
      setResult(ctx.output ?? ctx)
      setShowForm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Discovery failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Opportunity Discovery</h1>
        <p className="text-gray-500 mt-1 text-sm">AI-powered income opportunity discovery tailored to your skills and the India market</p>
      </div>

      {!loading && !result && (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Find Your Best Income Paths</h2>
          <p className="text-sm text-gray-500 mb-6">Discover high-potential opportunities matched to your background and goals</p>
          {showForm ? (
            <div className="space-y-3 text-left max-w-sm mx-auto">
              <input
                type="text"
                placeholder="Your profession or skills (optional)"
                value={profession}
                onChange={e => setProfession(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button
                onClick={discover}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm"
              >
                Discover Opportunities
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm"
            >
              Discover Opportunities
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <AgentProgress agentType="OPPORTUNITY_DISCOVERY" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">{result.summaryInsight}</p>
            <button
              onClick={() => { setResult(null); setShowForm(false) }}
              className="text-xs text-indigo-500 hover:underline"
            >
              ↺ Rediscover
            </button>
          </div>
          {result.opportunities?.map(opp => (
            <div key={opp.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-xl shrink-0">{CATEGORY_ICON[opp.category] ?? '💡'}</span>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{opp.title}</h3>
                      {result.topRecommendationId === opp.id && (
                        <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-medium">⭐ Top Pick</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{opp.actionPlanSummary}</p>
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      <span>⏱ {opp.timeToFirstIncome}</span>
                      <span>⚡ {opp.requiredEffortHoursPerWeek}h/week</span>
                      <span>📊 Difficulty: {opp.difficultyScore}/10</span>
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-gray-900 text-sm">
                    ₹{opp.monthlyPotentialINR?.min?.toLocaleString('en-IN')}–{opp.monthlyPotentialINR?.max?.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-gray-400">Monthly Potential</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
