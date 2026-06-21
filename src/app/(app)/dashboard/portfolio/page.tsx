'use client'

import { useState } from 'react'

interface CaseStudy { title: string; problem: string; solution: string; result: string }
interface ServicePage { title: string; body: string }

interface PortfolioResult {
  headline: string
  bio: string
  servicePages: ServicePage[]
  caseStudies: CaseStudy[]
  linkedinHeadline: string
  linkedinAbout: string
  resumeEnhancements: string[]
}

export default function PortfolioBuilderPage() {
  const [result, setResult] = useState<PortfolioResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'portfolio' | 'linkedin' | 'resume'>('portfolio')
  const [error, setError] = useState('')

  async function buildPortfolio() {
    setLoading(true); setError('')
    const res = await fetch('/api/agents/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentType: 'PORTFOLIO_BUILDER' }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error?.message ?? 'Failed'); setLoading(false); return }
    setResult(data.data)

    // Persist assets
    await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'portfolio', content: data.data }),
    })
    setLoading(false)
  }

  const TABS = [
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'resume', label: 'Resume' },
  ] as const

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Builder</h1>
          <p className="text-gray-500 mt-1">Generate your portfolio, LinkedIn content, and resume enhancements</p>
        </div>
        <button
          onClick={buildPortfolio}
          disabled={loading}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Building...' : result ? 'Rebuild' : 'Build Portfolio'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>}

      {!result && !loading && (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">🗂️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Build Your Portfolio</h2>
          <p className="text-gray-500 text-sm mb-6">AI generates your portfolio headline, bio, case studies, service pages, LinkedIn content and resume enhancements — all in one click.</p>
          <button onClick={buildPortfolio} disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            {loading ? 'Building...' : 'Build My Portfolio'}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'portfolio' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Headline</div>
                <p className="text-xl font-bold text-gray-900">{result.headline}</p>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 mt-4">Bio</div>
                <p className="text-gray-700">{result.bio}</p>
              </div>

              {result.servicePages.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Service Pages</h3>
                  <div className="space-y-4">
                    {result.servicePages.map((sp, i) => (
                      <div key={i} className="border-l-4 border-indigo-300 pl-4">
                        <div className="font-semibold text-gray-900 mb-1">{sp.title}</div>
                        <p className="text-sm text-gray-600">{sp.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.caseStudies.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Case Studies</h3>
                  <div className="space-y-6">
                    {result.caseStudies.map((cs, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-4">
                        <div className="font-semibold text-gray-900 mb-3">{cs.title}</div>
                        <div className="grid gap-2 md:grid-cols-3 text-sm">
                          <div><span className="font-medium text-gray-500 block text-xs mb-1">Problem</span>{cs.problem}</div>
                          <div><span className="font-medium text-gray-500 block text-xs mb-1">Solution</span>{cs.solution}</div>
                          <div><span className="font-medium text-gray-500 block text-xs mb-1">Result</span><span className="text-green-700">{cs.result}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'linkedin' && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">LinkedIn Headline</div>
                <p className="text-lg font-semibold text-gray-900">{result.linkedinHeadline}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">About Section</div>
                <p className="text-gray-700 whitespace-pre-wrap">{result.linkedinAbout}</p>
              </div>
            </div>
          )}

          {tab === 'resume' && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-4">Resume Enhancements</h3>
              <ul className="space-y-3">
                {result.resumeEnhancements.map((e, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-gray-700">{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <a href="/dashboard/profile" className="block w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold text-center hover:bg-indigo-700 transition-colors">
            Build Profile Intelligence →
          </a>
        </div>
      )}
    </div>
  )
}
