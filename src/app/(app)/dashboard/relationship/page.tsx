'use client'

import { useState, useEffect } from 'react'

interface RelationshipAction {
  type: string
  description: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  dueInDays: number
}

interface RelationshipOpportunity {
  type: string
  description: string
  estimatedValueINR: number
}

interface RelationshipResult {
  healthScore: number
  status: string
  actions: RelationshipAction[]
  opportunities: RelationshipOpportunity[]
  birthdayMessage?: string
  testimonialRequest?: string
  referralAsk?: string
}

interface ClientItem { id: string; name: string; company: string; temperature: string }

const PRIORITY_COLORS = { HIGH: 'bg-red-100 text-red-700', MEDIUM: 'bg-yellow-100 text-yellow-700', LOW: 'bg-green-100 text-green-700' }

export default function RelationshipSuccessPage() {
  const [clients, setClients] = useState<ClientItem[]>([])
  const [selected, setSelected] = useState<ClientItem | null>(null)
  const [result, setResult] = useState<RelationshipResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetch('/api/clients').then(r => r.json()).then(setClients) }, [])

  async function analyze(client: ClientItem) {
    setSelected(client); setResult(null); setLoading(true); setError('')
    const res = await fetch('/api/agents/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentType: 'RELATIONSHIP_SUCCESS', clientId: client.id }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error?.message ?? 'Failed'); setLoading(false); return }
    setResult(data.data)
    setLoading(false)
  }

  async function completeAction(type: string) {
    if (!selected) return
    await fetch('/api/relationship/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: selected.id, type }),
    })
  }

  const healthColor = (score: number) =>
    score >= 80 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Relationship Success Center</h1>
        <p className="text-gray-500 mt-1">Deepen client relationships — health scoring, actions, and upsell opportunities</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-900 text-sm">Your Clients</div>
            {clients.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No clients yet.</div>
            ) : clients.map(c => (
              <button
                key={c.id}
                onClick={() => analyze(c)}
                className={`w-full text-left px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${selected?.id === c.id ? 'bg-indigo-50' : ''}`}
              >
                <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                <div className="text-xs text-gray-400">{c.company}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {!selected && (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">🤝</div>
              <div className="font-semibold text-gray-700 mb-1">Select a client</div>
              <div className="text-gray-400 text-sm">AI will evaluate your relationship health and suggest next actions</div>
            </div>
          )}

          {loading && <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center animate-pulse text-gray-500">Analyzing relationship...</div>}
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

          {result && selected && !loading && (
            <>
              {/* Health score */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-6">
                <div className={`text-5xl font-black ${healthColor(result.healthScore)}`}>{result.healthScore}</div>
                <div>
                  <div className="font-bold text-gray-900">{selected.name}</div>
                  <div className="text-sm text-gray-500">{result.status}</div>
                </div>
              </div>

              {/* Actions */}
              {result.actions.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Recommended Actions</h3>
                  <div className="space-y-3">
                    {result.actions.map((a, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${PRIORITY_COLORS[a.priority]}`}>{a.priority}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{a.type.replace(/_/g, ' ')}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{a.description} · Due in {a.dueInDays}d</div>
                        </div>
                        <button onClick={() => completeAction(a.type)} className="text-xs text-indigo-600 font-medium hover:underline">Done</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Opportunities */}
              {result.opportunities.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Upsell Opportunities</h3>
                  <div className="space-y-3">
                    {result.opportunities.map((o, i) => (
                      <div key={i} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{o.type.replace(/_/g, ' ')}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{o.description}</div>
                        </div>
                        <div className="text-indigo-600 font-bold text-sm ml-4">₹{o.estimatedValueINR.toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special messages */}
              {result.testimonialRequest && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                  <div className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-2">Testimonial Request</div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{result.testimonialRequest}</p>
                </div>
              )}

              {result.referralAsk && (
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
                  <div className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-2">Referral Ask</div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{result.referralAsk}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
