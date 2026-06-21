'use client'

import { useState } from 'react'

interface SkillEntry { skill: string; proficiency: string; proof: string }
interface ServiceEntry { service: string; outcome: string; priceFromINR: number }

interface ProfileResult {
  primaryType: string
  headline: string
  summary: string
  positioning: string
  skillsMatrix: SkillEntry[]
  experienceHighlights: string[]
  certifications: string[]
  serviceCatalog: ServiceEntry[]
  outputs: { websiteSlug: string; resumePdf: boolean; linkedinProfile: { headline: string; about: string } }
}

const PROFICIENCY_COLORS: Record<string, string> = {
  EXPERT: 'bg-purple-100 text-purple-700',
  ADVANCED: 'bg-indigo-100 text-indigo-700',
  INTERMEDIATE: 'bg-blue-100 text-blue-700',
  BEGINNER: 'bg-gray-100 text-gray-600',
}

export default function ProfileIntelligencePage() {
  const [result, setResult] = useState<ProfileResult | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function buildProfile() {
    setLoading(true); setError('')
    const res = await fetch('/api/agents/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentType: 'PROFILE_INTELLIGENCE' }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error?.message ?? 'Failed'); setLoading(false); return }
    setResult(data.data)

    // Persist profile
    const saveRes = await fetch('/api/profile/intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.data),
    })
    const saved = await saveRes.json()
    if (saved.id) setProfileId(saved.id)
    setLoading(false)
  }

  async function publishProfile() {
    if (!profileId || !result) return
    setPublishing(true)
    const res = await fetch('/api/profile/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, slug: result.outputs.websiteSlug }),
    })
    const data = await res.json()
    if (data.websiteSlug) setPublishedSlug(data.websiteSlug)
    setPublishing(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Intelligence</h1>
          <p className="text-gray-500 mt-1">Auto-build your resume, public profile, and publishable site</p>
        </div>
        <button onClick={buildProfile} disabled={loading} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50">
          {loading ? 'Building profile...' : result ? 'Rebuild' : 'Build Profile'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>}

      {publishedSlug && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <div className="font-semibold text-green-800 text-sm">Profile Published!</div>
            <div className="text-green-700 text-xs mt-0.5">{process.env.NEXT_PUBLIC_PROFILE_BASE_URL}/{publishedSlug}</div>
          </div>
          <a href={`/p/${publishedSlug}`} target="_blank" className="text-green-700 text-sm font-medium hover:underline">View Site →</a>
        </div>
      )}

      {!result && !loading && (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4">👤</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Build Your Professional Profile</h2>
          <p className="text-gray-500 text-sm mb-6">AI creates your dynamic resume, service catalog, LinkedIn profile, and a publishable profile site — all from your skills and portfolio.</p>
          <button onClick={buildProfile} disabled={loading} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            {loading ? 'Building...' : 'Build My Profile'}
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white">
            <div className="text-xs font-semibold opacity-70 mb-1 uppercase tracking-wide">{result.primaryType.replace(/_/g, ' ')}</div>
            <h2 className="text-2xl font-bold mb-2">{result.headline}</h2>
            <p className="text-indigo-100 text-sm mb-3">{result.positioning}</p>
            <p className="opacity-90 text-sm">{result.summary}</p>
          </div>

          {/* Skills Matrix */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-4">Skills Matrix</h3>
            <div className="flex flex-wrap gap-2">
              {result.skillsMatrix.map((s, i) => (
                <span key={i} className={`text-sm px-3 py-1.5 rounded-lg font-medium ${PROFICIENCY_COLORS[s.proficiency] ?? 'bg-gray-100 text-gray-700'}`}>
                  {s.skill} — {s.proficiency}
                </span>
              ))}
            </div>
          </div>

          {/* Service Catalog */}
          {result.serviceCatalog.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-bold text-gray-900 mb-4">Service Catalog</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {result.serviceCatalog.map((svc, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <div className="font-semibold text-gray-900 text-sm mb-1">{svc.service}</div>
                    <div className="text-gray-500 text-xs mb-2">{svc.outcome}</div>
                    <div className="text-indigo-600 font-bold text-sm">From ₹{svc.priceFromINR.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Publish */}
          <div className="flex gap-3">
            {!publishedSlug && (
              <button
                onClick={publishProfile}
                disabled={publishing || !profileId}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : '🌐 Publish Profile Site'}
              </button>
            )}
            <a href="/dashboard/clients" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold text-center hover:bg-indigo-700 transition-colors">
              Client Intelligence →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
