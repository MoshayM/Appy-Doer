'use client'

import { useState, useEffect } from 'react'
import { TranslateButton } from '@/components/TranslateButton'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServicePage  { title: string; body: string }
interface CaseStudy    { title: string; problem: string; solution: string; result: string }
interface SkillEntry   { skill: string; proficiency: 'EXPERT'|'ADVANCED'|'INTERMEDIATE'|'BEGINNER'; proof: string }
interface ServiceEntry {
  service: string; outcome: string; pricingModel: string
  priceFromINR: number; priceToINR: number
  deliverables: string[]; timeline: string
}
interface PortfolioResult {
  headline: string; bio: string
  servicePages: ServicePage[]; caseStudies: CaseStudy[]
  linkedinHeadline: string; linkedinAbout: string; resumeEnhancements: string[]
}
interface ProfileResult {
  primaryType: string; headline: string; summary: string; positioning: string
  skillsMatrix: SkillEntry[]; experienceHighlights: string[]; certifications: string[]
  serviceCatalog: ServiceEntry[]
  outputs: { websiteSlug: string; resumePdf: boolean; linkedinProfile: { headline: string; about: string } }
}

type Tab        = 'identity' | 'portfolio' | 'services' | 'outputs'
type BuildPhase = 'idle' | 'portfolio' | 'intelligence'
type ProfLevel  = 'ALL' | 'EXPERT' | 'ADVANCED' | 'INTERMEDIATE' | 'BEGINNER'
type EditSection = 'hero' | 'skills' | 'highlights' | 'certs' | 'bio' | 'servicePages' | 'caseStudies' | 'services' | 'linkedin' | 'resume' | null

// ── Constants ─────────────────────────────────────────────────────────────────

const PROFICIENCY_STYLE: Record<string, { tag: string; bar: string; label: string }> = {
  EXPERT:       { tag: 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200',    bar: 'bg-indigo-500',  label: 'Expert' },
  ADVANCED:     { tag: 'bg-blue-100 text-blue-800 ring-1 ring-blue-200',          bar: 'bg-blue-500',    label: 'Advanced' },
  INTERMEDIATE: { tag: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200', bar: 'bg-emerald-500', label: 'Intermediate' },
  BEGINNER:     { tag: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',          bar: 'bg-gray-400',    label: 'Beginner' },
}

const PROF_BAR_WIDTH: Record<string, string> = {
  EXPERT: 'w-full', ADVANCED: 'w-3/4', INTERMEDIATE: 'w-1/2', BEGINNER: 'w-1/4',
}

const PRICING_LABEL: Record<string, string> = {
  PER_PROJECT: 'Per Project', PER_TASK: 'Per Task', HOURLY: 'Hourly',
  MONTHLY_RETAINER: 'Monthly Retainer', CUSTOM_QUOTE: 'Custom Quote',
}

const PROF_OPTIONS: SkillEntry['proficiency'][] = ['EXPERT', 'ADVANCED', 'INTERMEDIATE', 'BEGINNER']
const PRICING_OPTIONS = Object.keys(PRICING_LABEL)

function rupee(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000)   return `₹${(n / 1000).toFixed(0)}K`
  return `₹${n}`
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'identity',  label: 'Identity',     icon: '🧠' },
  { id: 'portfolio', label: 'Portfolio',     icon: '💼' },
  { id: 'services',  label: 'Services',      icon: '💰' },
  { id: 'outputs',   label: 'LinkedIn / CV', icon: '🔗' },
]

// ── Input style constants ─────────────────────────────────────────────────────

const inp = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white'
const ta  = `${inp} resize-none`
const sel = 'px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white'

// ── Sub-components ────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
        copied
          ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
          : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:ring-1 hover:ring-indigo-200'
      }`}>
      {copied ? '✓ Copied!' : `⎘ ${label}`}
    </button>
  )
}

function StatPill({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm">
      <span className="text-xl font-bold text-white">{count}</span>
      <span className="text-xs font-medium text-indigo-200">{label}</span>
    </div>
  )
}

function SaveCancel({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div className="flex items-center gap-2 pt-4 mt-4 border-t border-gray-100">
      <button onClick={onSave} disabled={saving}
        className="flex items-center gap-1.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-60">
        {saving
          ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Saving…</>
          : '✓ Save changes'}
      </button>
      <button onClick={onCancel}
        className="text-sm font-semibold text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
        Cancel
      </button>
    </div>
  )
}

function FL({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{children}</p>
}

function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 px-3 py-1.5 rounded-lg transition-all">
      ✏ Edit
    </button>
  )
}

function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-base font-bold transition-colors flex-shrink-0">
      ×
    </button>
  )
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-2 rounded-xl hover:bg-indigo-50 transition-colors mt-3">
      + {label}
    </button>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MyProfilePage() {
  // ── Data state ────────────────────────────────────────────────────────────
  const [portfolioData, setPortfolioData] = useState<PortfolioResult | null>(null)
  const [profileData,   setProfileData]   = useState<ProfileResult | null>(null)
  const [profileId,     setProfileId]     = useState<string | null>(null)
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null)
  const [buildPhase,    setBuildPhase]    = useState<BuildPhase>('idle')
  const [error,         setError]         = useState('')
  const [tab,           setTab]           = useState<Tab>('identity')
  const [publishing,    setPublishing]    = useState(false)
  const [translated,    setTranslated]    = useState<{ data: ProfileResult; lang: string } | null>(null)

  // ── View-mode interactive state ───────────────────────────────────────────
  const [skillFilter,  setSkillFilter]  = useState<ProfLevel>('ALL')
  const [expandedCase, setExpandedCase] = useState<number | null>(null)
  const [expandedSvc,  setExpandedSvc]  = useState<number | null>(null)
  const [hoveredSkill, setHoveredSkill] = useState<number | null>(null)

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editSection,    setEditSection]    = useState<EditSection>(null)
  const [profileDraft,   setProfileDraft]   = useState<ProfileResult | null>(null)
  const [portfolioDraft, setPortfolioDraft] = useState<PortfolioResult | null>(null)
  const [saving,         setSaving]         = useState(false)

  // ── Derived ───────────────────────────────────────────────────────────────
  const profile    = translated?.data ?? profileData
  const isBuilding = buildPhase !== 'idle'
  const hasData    = !!(portfolioData || profileData)

  const skillCount   = profile?.skillsMatrix?.length ?? 0
  const serviceCount = profile?.serviceCatalog?.length ?? 0
  const caseCount    = portfolioData?.caseStudies?.length ?? 0

  const filteredSkills = profile?.skillsMatrix?.filter(
    s => skillFilter === 'ALL' || s.proficiency === skillFilter,
  ) ?? []

  const profCounts = profile?.skillsMatrix?.reduce((acc, s) => {
    acc[s.proficiency] = (acc[s.proficiency] ?? 0) + 1
    return acc
  }, {} as Record<string, number>) ?? {}

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [pRes, iRes] = await Promise.all([
        fetch('/api/portfolio'),
        fetch('/api/profile/intelligence'),
      ])
      if (pRes.ok) {
        const assets = await pRes.json()
        if (Array.isArray(assets) && assets.length > 0)
          setPortfolioData(assets[0].content as PortfolioResult)
      }
      if (iRes.ok) {
        const profiles = await iRes.json()
        if (Array.isArray(profiles) && profiles.length > 0) {
          const latest = profiles[0]
          setProfileData(latest.detail as ProfileResult)
          setProfileId(latest.id)
          if (latest.published && latest.websiteSlug) setPublishedSlug(latest.websiteSlug)
        }
      }
    }
    load()
  }, [])

  // ── Build ─────────────────────────────────────────────────────────────────
  async function buildProfile() {
    setBuildPhase('portfolio')
    setError('')
    setTranslated(null)
    setSkillFilter('ALL')
    setExpandedCase(null)
    setExpandedSvc(null)
    cancelEdit()

    try {
      const r1 = await fetch('/api/agents/run', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentType: 'PORTFOLIO_BUILDER' }),
      })
      const d1 = await r1.json()
      if (!r1.ok) throw new Error(d1.error?.message ?? 'Portfolio build failed')
      const pResult = d1.data as PortfolioResult
      setPortfolioData(pResult)
      await fetch('/api/portfolio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'portfolio', content: pResult }),
      })
    } catch (e: unknown) { setError((e as Error).message); setBuildPhase('idle'); return }

    setBuildPhase('intelligence')
    try {
      const r2 = await fetch('/api/agents/run', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentType: 'PROFILE_INTELLIGENCE' }),
      })
      const d2 = await r2.json()
      if (!r2.ok) throw new Error(d2.error?.message ?? 'Profile intelligence failed')
      const iResult = d2.data as ProfileResult
      setProfileData(iResult)
      const saveRes = await fetch('/api/profile/intelligence', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(iResult),
      })
      if (saveRes.ok) { const saved = await saveRes.json(); setProfileId(saved.id) }
    } catch (e: unknown) { setError((e as Error).message); setBuildPhase('idle'); return }

    setBuildPhase('idle')
    setTab('identity')
  }

  // ── Publish ───────────────────────────────────────────────────────────────
  async function publish() {
    if (!profileId) return
    setPublishing(true)
    try {
      const slug = profileData?.outputs?.websiteSlug ?? profileId
      const res  = await fetch('/api/profile/publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, slug }),
      })
      if (res.ok) { const d = await res.json(); setPublishedSlug(d.websiteSlug) }
    } finally { setPublishing(false) }
  }

  // ── Edit helpers ──────────────────────────────────────────────────────────
  function startProfileEdit(section: EditSection) {
    if (translated) return
    setProfileDraft(profileData ? JSON.parse(JSON.stringify(profileData)) : null)
    setEditSection(section)
  }

  function startPortfolioEdit(section: EditSection) {
    setPortfolioDraft(portfolioData ? JSON.parse(JSON.stringify(portfolioData)) : null)
    setEditSection(section)
  }

  function cancelEdit() {
    setEditSection(null)
    setProfileDraft(null)
    setPortfolioDraft(null)
  }

  async function saveProfileEdit() {
    if (!profileDraft) return
    setSaving(true)
    setProfileData(profileDraft)
    setEditSection(null)
    setProfileDraft(null)
    try {
      const res = await fetch('/api/profile/intelligence', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileDraft),
      })
      if (res.ok) { const saved = await res.json(); if (saved.id) setProfileId(saved.id) }
    } finally { setSaving(false) }
  }

  async function savePortfolioEdit() {
    if (!portfolioDraft) return
    setSaving(true)
    setPortfolioData(portfolioDraft)
    setEditSection(null)
    setPortfolioDraft(null)
    try {
      await fetch('/api/portfolio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'portfolio', content: portfolioDraft }),
      })
    } finally { setSaving(false) }
  }

  // Shorthand draft updaters
  function updProf<K extends keyof ProfileResult>(key: K, val: ProfileResult[K]) {
    setProfileDraft(p => p ? { ...p, [key]: val } : p)
  }
  function updPort<K extends keyof PortfolioResult>(key: K, val: PortfolioResult[K]) {
    setPortfolioDraft(p => p ? { ...p, [key]: val } : p)
  }
  function updSvc(i: number, patch: Partial<ServiceEntry>) {
    setProfileDraft(p => {
      if (!p) return p
      const updated = [...p.serviceCatalog]
      updated[i] = { ...updated[i], ...patch }
      return { ...p, serviceCatalog: updated }
    })
  }

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Professional Profile</h1>
            <p className="text-sm text-gray-500 mt-0.5">Your complete professional identity — ready to share with clients</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasData && profile && (
              <TranslateButton
                content={profile}
                isTranslated={!!translated}
                onTranslated={(t, lang) => setTranslated({ data: t as ProfileResult, lang })}
                onReset={() => setTranslated(null)}
              />
            )}
            {profileId && !publishedSlug && (
              <button onClick={publish} disabled={publishing}
                className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl transition-colors disabled:opacity-50">
                {publishing ? '⏳' : '🌐'} {publishing ? 'Publishing…' : 'Publish Profile'}
              </button>
            )}
            <button onClick={buildProfile} disabled={isBuilding}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-4 py-2 rounded-xl shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              {isBuilding ? (
                <><span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Building…</>
              ) : hasData ? '↺ Rebuild Profile' : '✨ Build My Profile'}
            </button>
          </div>
        </div>

        {/* Published banner */}
        {publishedSlug && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3">
            <span className="text-emerald-600 text-lg">✅</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-800">Profile is live</p>
              <a href={`/p/${publishedSlug}`} target="_blank" rel="noreferrer"
                className="text-xs text-emerald-600 hover:underline truncate block">/p/{publishedSlug}</a>
            </div>
            <CopyButton text={`/p/${publishedSlug}`} label="Copy link" />
            <a href={`/p/${publishedSlug}`} target="_blank" rel="noreferrer"
              className="text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
              View →
            </a>
          </div>
        )}

        {/* Build progress */}
        {isBuilding && (
          <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 mb-5">Building your professional profile…</p>
            <div className="space-y-3">
              {([
                { phase: 'portfolio',    label: 'Portfolio Builder',    desc: 'Crafting bio, service pages & case studies',  step: 1 },
                { phase: 'intelligence', label: 'Profile Intelligence', desc: 'Generating skills matrix, services & pricing', step: 2 },
              ] as const).map(({ phase, label, desc, step }) => {
                const done   = phase === 'portfolio' && buildPhase === 'intelligence'
                const active = buildPhase === phase
                return (
                  <div key={phase} className={`flex items-start gap-4 p-4 rounded-xl transition-all ${active ? 'bg-indigo-50 border border-indigo-100' : done ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${active ? 'bg-indigo-600 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {done ? '✓' : step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${active ? 'text-indigo-700' : done ? 'text-emerald-700' : 'text-gray-400'}`}>{label}</div>
                      <div className={`text-xs mt-0.5 ${active ? 'text-indigo-500' : done ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {active ? `${desc}…` : done ? 'Completed' : 'Waiting'}
                      </div>
                      {active && (
                        <div className="mt-2 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse" style={{ width: '65%' }} />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-3">
            <span>⚠️</span>
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
          </div>
        )}

        {/* Empty state */}
        {!hasData && !isBuilding && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-8 pt-10 pb-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl mx-auto mb-4">🧑‍💼</div>
                <h2 className="text-2xl font-bold text-white mb-2">Build your professional identity</h2>
                <p className="text-indigo-200 text-sm max-w-md mx-auto">
                  One click generates everything — headline, skills matrix, service catalog with INR pricing, portfolio case studies, and ready-to-paste LinkedIn content.
                </p>
              </div>
            </div>
            <div className="-mt-8 mx-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { icon: '🧠', label: 'Skills Matrix',  desc: 'Proficiency-ranked' },
                  { icon: '💼', label: 'Case Studies',    desc: 'Problem → Result' },
                  { icon: '💰', label: 'Service Catalog', desc: 'With INR pricing' },
                  { icon: '🔗', label: 'LinkedIn Copy',   desc: 'Ready to paste' },
                ].map(f => (
                  <div key={f.label} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="text-2xl mb-1">{f.icon}</div>
                    <p className="text-xs font-semibold text-gray-700">{f.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
              <button onClick={buildProfile}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold px-7 py-3.5 rounded-xl shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all text-sm">
                ✨ Build My Profile — takes about 30 seconds
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ MAIN CONTENT ═══════════════ */}
        {hasData && (
          <>
            {/* ── HERO — editable ── */}
            {editSection === 'hero' && profileDraft ? (
              <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">✏ Edit Profile Header</h3>
                <div className="space-y-4">
                  <div><FL>Professional Type</FL>
                    <input value={profileDraft.primaryType ?? ''} onChange={e => updProf('primaryType', e.target.value)} className={inp} placeholder="e.g. FREELANCE_CONSULTANT" /></div>
                  <div><FL>Headline</FL>
                    <textarea value={profileDraft.headline ?? ''} onChange={e => updProf('headline', e.target.value)} className={ta} rows={2} placeholder="Your professional headline" /></div>
                  <div><FL>Positioning Statement</FL>
                    <input value={profileDraft.positioning ?? ''} onChange={e => updProf('positioning', e.target.value)} className={inp} placeholder="Short positioning line shown as italic quote" /></div>
                  <div><FL>Summary</FL>
                    <textarea value={profileDraft.summary ?? ''} onChange={e => updProf('summary', e.target.value)} className={ta} rows={4} placeholder="2–3 sentence professional summary" /></div>
                </div>
                <SaveCancel onSave={saveProfileEdit} onCancel={cancelEdit} saving={saving} />
              </div>
            ) : profile && (
              <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl overflow-hidden shadow-xl group">
                <div className="absolute inset-0 pointer-events-none opacity-10"
                  style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-purple-500/30 blur-3xl pointer-events-none" />
                <div className="relative p-8">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
                    <span className="text-xs font-bold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full uppercase tracking-widest text-white/90">
                      {profile.primaryType?.replace(/_/g, ' ') ?? 'Professional Profile'}
                    </span>
                    <div className="flex items-center gap-2">
                      {publishedSlug && (
                        <a href={`/p/${publishedSlug}`} target="_blank" rel="noreferrer"
                          className="text-xs font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors flex items-center gap-1.5 text-white">
                          🔗 Public Profile
                        </a>
                      )}
                      {!translated && (
                        <button onClick={() => startProfileEdit('hero')}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full">
                          ✏ Edit
                        </button>
                      )}
                    </div>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{profile.headline}</h2>
                  {profile.positioning && <p className="mt-2 text-indigo-200 font-medium italic text-sm">"{profile.positioning}"</p>}
                  {profile.summary && <p className="mt-3 text-indigo-100/90 text-sm leading-relaxed max-w-2xl">{profile.summary}</p>}
                  {(skillCount > 0 || serviceCount > 0 || caseCount > 0) && (
                    <div className="mt-6 pt-6 border-t border-white/15 flex flex-wrap gap-3">
                      {skillCount > 0   && <StatPill count={skillCount}   label="Skills" />}
                      {serviceCount > 0 && <StatPill count={serviceCount} label="Services" />}
                      {caseCount > 0    && <StatPill count={caseCount}    label="Case Studies" />}
                      {(profile.certifications?.length ?? 0) > 0 && <StatPill count={profile.certifications.length} label="Certifications" />}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Translate notice */}
            {translated && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700">
                <span>🌍</span>
                <span>Showing translated version ({translated.lang}) — reset to edit</span>
                <button onClick={() => setTranslated(null)} className="ml-auto text-amber-500 hover:text-amber-700 font-semibold text-xs">Reset</button>
              </div>
            )}

            {/* ── Tab bar ── */}
            <div className="flex gap-1 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-sm">
              {TABS.map(t => {
                const count = t.id === 'identity' ? skillCount : t.id === 'services' ? serviceCount : t.id === 'portfolio' ? caseCount : 0
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-sm font-semibold rounded-xl transition-all ${
                      tab === t.id ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}>
                    <span>{t.icon}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                    {count > 0 && (
                      <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${tab === t.id ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* ══════════ IDENTITY TAB ══════════ */}
            {tab === 'identity' && profile && (
              <div className="space-y-5">

                {/* ── Skills Matrix ── */}
                {skillCount > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">Skills Matrix</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Verified proficiency across {skillCount} skills</p>
                      </div>
                      {editSection !== 'skills' && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {skillFilter !== 'ALL' && (
                            <div className="flex items-center gap-1.5">
                              {(['ALL', 'EXPERT', 'ADVANCED', 'INTERMEDIATE', 'BEGINNER'] as ProfLevel[]).map(level => {
                                const cnt = level === 'ALL' ? skillCount : (profCounts[level] ?? 0)
                                if (level !== 'ALL' && cnt === 0) return null
                                const active = skillFilter === level
                                const style = level === 'ALL'
                                  ? (active ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                                  : (active ? PROFICIENCY_STYLE[level].tag + ' shadow-sm' : 'bg-gray-50 text-gray-500 hover:bg-gray-100')
                                return (
                                  <button key={level} onClick={() => setSkillFilter(level)}
                                    className={`text-xs font-semibold px-3 py-1 rounded-full transition-all ${style}`}>
                                    {level === 'ALL' ? `All (${cnt})` : `${level === 'INTERMEDIATE' ? 'Mid' : level.charAt(0) + level.slice(1).toLowerCase()} · ${cnt}`}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                          {skillFilter === 'ALL' && (
                            <div className="flex items-center gap-1.5">
                              {(['EXPERT', 'ADVANCED', 'INTERMEDIATE', 'BEGINNER'] as ProfLevel[]).map(level => {
                                const cnt = profCounts[level] ?? 0
                                if (cnt === 0) return null
                                return (
                                  <button key={level} onClick={() => setSkillFilter(level)}
                                    className={`text-xs font-semibold px-3 py-1 rounded-full transition-all ${PROFICIENCY_STYLE[level].tag}`}>
                                    {level === 'INTERMEDIATE' ? 'Mid' : level.charAt(0) + level.slice(1).toLowerCase()} · {cnt}
                                  </button>
                                )
                              })}
                            </div>
                          )}
                          {!translated && <EditBtn onClick={() => startProfileEdit('skills')} />}
                        </div>
                      )}
                    </div>

                    {editSection === 'skills' && profileDraft ? (
                      <div className="p-6">
                        <div className="space-y-2">
                          {profileDraft.skillsMatrix.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                              <input
                                value={s.skill}
                                onChange={e => {
                                  const u = [...profileDraft.skillsMatrix]
                                  u[i] = { ...u[i], skill: e.target.value }
                                  updProf('skillsMatrix', u)
                                }}
                                placeholder="Skill name"
                                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white min-w-0"
                              />
                              <select
                                value={s.proficiency}
                                onChange={e => {
                                  const u = [...profileDraft.skillsMatrix]
                                  u[i] = { ...u[i], proficiency: e.target.value as SkillEntry['proficiency'] }
                                  updProf('skillsMatrix', u)
                                }}
                                className={`${sel} w-36 flex-shrink-0`}
                              >
                                {PROF_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
                              </select>
                              <input
                                value={s.proof}
                                onChange={e => {
                                  const u = [...profileDraft.skillsMatrix]
                                  u[i] = { ...u[i], proof: e.target.value }
                                  updProf('skillsMatrix', u)
                                }}
                                placeholder="Evidence / proof"
                                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white min-w-0"
                              />
                              <DelBtn onClick={() => updProf('skillsMatrix', profileDraft.skillsMatrix.filter((_, j) => j !== i))} />
                            </div>
                          ))}
                        </div>
                        <AddBtn onClick={() => updProf('skillsMatrix', [...profileDraft.skillsMatrix, { skill: '', proficiency: 'INTERMEDIATE', proof: '' }])} label="Add skill" />
                        <SaveCancel onSave={saveProfileEdit} onCancel={cancelEdit} saving={saving} />
                      </div>
                    ) : (
                      <div className="p-4 space-y-1">
                        {filteredSkills.map((s, i) => {
                          const style = PROFICIENCY_STYLE[s.proficiency] ?? PROFICIENCY_STYLE.BEGINNER
                          return (
                            <div key={i}
                              onMouseEnter={() => setHoveredSkill(i)}
                              onMouseLeave={() => setHoveredSkill(null)}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-default ${
                                hoveredSkill === i ? 'border-indigo-200 bg-indigo-50/60 shadow-sm' : 'border-transparent hover:border-gray-100 hover:bg-gray-50'
                              }`}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-sm font-semibold text-gray-800">{s.skill}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${style.tag}`}>{style.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[180px]">
                                    <div className={`h-full rounded-full ${style.bar} ${PROF_BAR_WIDTH[s.proficiency]}`} />
                                  </div>
                                  <span className="text-xs text-gray-400 truncate max-w-[220px]">{s.proof}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        {skillFilter !== 'ALL' && (
                          <button onClick={() => setSkillFilter('ALL')} className="text-xs text-indigo-500 hover:text-indigo-700 px-3 py-1.5 mt-1">Show all skills</button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Experience Highlights ── */}
                {((profile.experienceHighlights?.length ?? 0) > 0 || editSection === 'highlights') && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Experience Highlights</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Key achievements that define your professional value</p>
                      </div>
                      {editSection !== 'highlights' && !translated && <EditBtn onClick={() => startProfileEdit('highlights')} />}
                    </div>

                    {editSection === 'highlights' && profileDraft ? (
                      <div className="p-6">
                        <div className="space-y-2">
                          {profileDraft.experienceHighlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <textarea
                                value={h}
                                onChange={e => {
                                  const u = [...profileDraft.experienceHighlights]
                                  u[i] = e.target.value
                                  updProf('experienceHighlights', u)
                                }}
                                className={`${ta} flex-1`}
                                rows={2}
                                placeholder={`Highlight ${i + 1}`}
                              />
                              <DelBtn onClick={() => updProf('experienceHighlights', profileDraft.experienceHighlights.filter((_, j) => j !== i))} />
                            </div>
                          ))}
                        </div>
                        <AddBtn onClick={() => updProf('experienceHighlights', [...profileDraft.experienceHighlights, ''])} label="Add highlight" />
                        <SaveCancel onSave={saveProfileEdit} onCancel={cancelEdit} saving={saving} />
                      </div>
                    ) : (
                      <div className="px-6 py-5">
                        <ul className="space-y-3">
                          {profile.experienceHighlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-4">
                              <div className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-indigo-600">{i + 1}</span>
                              </div>
                              <p className="text-sm text-gray-700 leading-relaxed flex-1 pt-1">{h}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Certifications ── */}
                {((profile.certifications?.length ?? 0) > 0 || editSection === 'certs') && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Certifications & Credentials</h3>
                      {editSection !== 'certs' && !translated && <EditBtn onClick={() => startProfileEdit('certs')} />}
                    </div>

                    {editSection === 'certs' && profileDraft ? (
                      <div className="p-6">
                        <div className="space-y-2">
                          {profileDraft.certifications.map((c, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                value={c}
                                onChange={e => {
                                  const u = [...profileDraft.certifications]
                                  u[i] = e.target.value
                                  updProf('certifications', u)
                                }}
                                className={`${inp} flex-1`}
                                placeholder={`Certification ${i + 1}`}
                              />
                              <DelBtn onClick={() => updProf('certifications', profileDraft.certifications.filter((_, j) => j !== i))} />
                            </div>
                          ))}
                        </div>
                        <AddBtn onClick={() => updProf('certifications', [...profileDraft.certifications, ''])} label="Add certification" />
                        <SaveCancel onSave={saveProfileEdit} onCancel={cancelEdit} saving={saving} />
                      </div>
                    ) : (
                      <div className="px-6 py-5 flex flex-wrap gap-2">
                        {profile.certifications.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl font-medium">
                            <span>🏅</span> {c}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══════════ PORTFOLIO TAB ══════════ */}
            {tab === 'portfolio' && (
              <div className="space-y-5">

                {/* ── Professional Bio ── */}
                {portfolioData && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Professional Bio</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Your story — how you help clients succeed</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {editSection !== 'bio' && <CopyButton text={`${portfolioData.headline}\n\n${portfolioData.bio}`} label="Copy bio" />}
                        {editSection !== 'bio' && <EditBtn onClick={() => startPortfolioEdit('bio')} />}
                      </div>
                    </div>

                    {editSection === 'bio' && portfolioDraft ? (
                      <div className="p-6 space-y-4">
                        <div><FL>Headline</FL>
                          <input value={portfolioDraft.headline ?? ''} onChange={e => updPort('headline', e.target.value)} className={inp} placeholder="Portfolio headline" /></div>
                        <div><FL>Bio</FL>
                          <textarea value={portfolioDraft.bio ?? ''} onChange={e => updPort('bio', e.target.value)} className={ta} rows={6} placeholder="Your professional bio" /></div>
                        <SaveCancel onSave={savePortfolioEdit} onCancel={cancelEdit} saving={saving} />
                      </div>
                    ) : (
                      <div className="px-6 py-5">
                        <p className="text-base font-bold text-indigo-700 mb-3 leading-snug">{portfolioData.headline}</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{portfolioData.bio}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Service Pages ── */}
                {((portfolioData?.servicePages?.length ?? 0) > 0 || editSection === 'servicePages') && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Service Pages</h3>
                        <p className="text-xs text-gray-500 mt-0.5">What you offer — written for your ideal client</p>
                      </div>
                      {editSection !== 'servicePages' && <EditBtn onClick={() => startPortfolioEdit('servicePages')} />}
                    </div>

                    {editSection === 'servicePages' && portfolioDraft ? (
                      <div className="p-6">
                        <div className="space-y-4">
                          {portfolioDraft.servicePages.map((s, i) => (
                            <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                                <input
                                  value={s.title}
                                  onChange={e => {
                                    const u = [...portfolioDraft.servicePages]
                                    u[i] = { ...u[i], title: e.target.value }
                                    updPort('servicePages', u)
                                  }}
                                  className="flex-1 px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                                  placeholder="Service title"
                                />
                                <DelBtn onClick={() => updPort('servicePages', portfolioDraft.servicePages.filter((_, j) => j !== i))} />
                              </div>
                              <textarea
                                value={s.body}
                                onChange={e => {
                                  const u = [...portfolioDraft.servicePages]
                                  u[i] = { ...u[i], body: e.target.value }
                                  updPort('servicePages', u)
                                }}
                                className={`${ta} text-sm`}
                                rows={3}
                                placeholder="Service description"
                              />
                            </div>
                          ))}
                        </div>
                        <AddBtn onClick={() => updPort('servicePages', [...portfolioDraft.servicePages, { title: '', body: '' }])} label="Add service page" />
                        <SaveCancel onSave={savePortfolioEdit} onCancel={cancelEdit} saving={saving} />
                      </div>
                    ) : (
                      <div className="p-4 space-y-3">
                        {portfolioData!.servicePages.map((s, i) => (
                          <div key={i} className="group flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0">{i + 1}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 mb-1">{s.title}</p>
                              <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pt-0.5">
                              <CopyButton text={`${s.title}\n\n${s.body}`} label="Copy" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Case Studies ── */}
                {((portfolioData?.caseStudies?.length ?? 0) > 0 || editSection === 'caseStudies') && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Case Studies</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Real outcomes that prove your expertise</p>
                      </div>
                      {editSection !== 'caseStudies' && <EditBtn onClick={() => startPortfolioEdit('caseStudies')} />}
                    </div>

                    {editSection === 'caseStudies' && portfolioDraft ? (
                      <div className="p-6">
                        <div className="space-y-4">
                          {portfolioDraft.caseStudies.map((cs, i) => (
                            <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                                <input
                                  value={cs.title}
                                  onChange={e => {
                                    const u = [...portfolioDraft.caseStudies]
                                    u[i] = { ...u[i], title: e.target.value }
                                    updPort('caseStudies', u)
                                  }}
                                  className="flex-1 px-3 py-1.5 text-sm font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                                  placeholder="Case study title"
                                />
                                <DelBtn onClick={() => updPort('caseStudies', portfolioDraft.caseStudies.filter((_, j) => j !== i))} />
                              </div>
                              <div className="grid sm:grid-cols-3 gap-3">
                                {(['problem', 'solution', 'result'] as const).map(field => (
                                  <div key={field}>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                      {field === 'problem' ? '🔴 Challenge' : field === 'solution' ? '💡 Solution' : '✅ Result'}
                                    </p>
                                    <textarea
                                      value={cs[field]}
                                      onChange={e => {
                                        const u = [...portfolioDraft.caseStudies]
                                        u[i] = { ...u[i], [field]: e.target.value }
                                        updPort('caseStudies', u)
                                      }}
                                      className={`${ta} text-sm`}
                                      rows={3}
                                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <AddBtn
                          onClick={() => updPort('caseStudies', [...portfolioDraft.caseStudies, { title: '', problem: '', solution: '', result: '' }])}
                          label="Add case study"
                        />
                        <SaveCancel onSave={savePortfolioEdit} onCancel={cancelEdit} saving={saving} />
                      </div>
                    ) : (
                      <div className="p-4 space-y-3">
                        {portfolioData!.caseStudies.map((cs, i) => {
                          const isOpen = expandedCase === i
                          return (
                            <div key={i} className={`rounded-xl border transition-all ${isOpen ? 'border-indigo-200 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
                              <button onClick={() => setExpandedCase(isOpen ? null : i)} className="w-full flex items-center gap-4 px-5 py-4 text-left">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${isOpen ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{i + 1}</div>
                                <span className={`flex-1 text-sm font-bold ${isOpen ? 'text-indigo-700' : 'text-gray-800'}`}>{cs.title}</span>
                                <span className={`text-gray-400 transition-transform text-sm ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                              </button>
                              {isOpen && (
                                <div className="px-5 pb-5">
                                  <div className="grid sm:grid-cols-3 gap-3">
                                    {([
                                      { label: 'Challenge', text: cs.problem,  icon: '🔴', bg: 'bg-red-50',     border: 'border-red-100',     tc: 'text-red-700' },
                                      { label: 'Solution',  text: cs.solution, icon: '💡', bg: 'bg-amber-50',   border: 'border-amber-100',   tc: 'text-amber-700' },
                                      { label: 'Result',    text: cs.result,   icon: '✅', bg: 'bg-emerald-50', border: 'border-emerald-100', tc: 'text-emerald-700' },
                                    ] as const).map(({ label, text, icon, bg, border, tc }) => (
                                      <div key={label} className={`p-4 rounded-xl ${bg} border ${border}`}>
                                        <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${tc}`}>{icon} {label}</p>
                                        <p className="text-sm text-gray-700 leading-relaxed">{text}</p>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-3 flex justify-end">
                                    <CopyButton text={`${cs.title}\n\nChallenge: ${cs.problem}\n\nSolution: ${cs.solution}\n\nResult: ${cs.result}`} label="Copy case study" />
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══════════ SERVICES TAB ══════════ */}
            {tab === 'services' && (
              <div className="space-y-4">
                {/* Edit mode */}
                {editSection === 'services' && profileDraft ? (
                  <div className="bg-white rounded-2xl border border-indigo-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">✏ Edit Service Catalog</h3>
                    </div>
                    <div className="p-6 space-y-5">
                      {profileDraft.serviceCatalog.map((svc, i) => (
                        <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Service {i + 1}</span>
                            <DelBtn onClick={() => updProf('serviceCatalog', profileDraft.serviceCatalog.filter((_, j) => j !== i))} />
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div><FL>Service Name</FL>
                              <input value={svc.service} onChange={e => updSvc(i, { service: e.target.value })} className={inp} placeholder="e.g. Brand Strategy Workshop" /></div>
                            <div><FL>Pricing Model</FL>
                              <select value={svc.pricingModel} onChange={e => updSvc(i, { pricingModel: e.target.value })} className={`${sel} w-full`}>
                                {PRICING_OPTIONS.map(p => <option key={p} value={p}>{PRICING_LABEL[p]}</option>)}
                              </select></div>
                          </div>
                          <div><FL>Outcome / Value Proposition</FL>
                            <textarea value={svc.outcome} onChange={e => updSvc(i, { outcome: e.target.value })} className={ta} rows={2} placeholder="What outcome does the client get?" /></div>
                          <div className="grid sm:grid-cols-3 gap-3">
                            <div><FL>Price From (₹)</FL>
                              <input type="number" value={svc.priceFromINR} onChange={e => updSvc(i, { priceFromINR: Number(e.target.value) })} className={inp} placeholder="e.g. 25000" /></div>
                            <div><FL>Price To (₹)</FL>
                              <input type="number" value={svc.priceToINR} onChange={e => updSvc(i, { priceToINR: Number(e.target.value) })} className={inp} placeholder="e.g. 50000" /></div>
                            <div><FL>Timeline</FL>
                              <input value={svc.timeline} onChange={e => updSvc(i, { timeline: e.target.value })} className={inp} placeholder="e.g. 2 weeks" /></div>
                          </div>
                          <div>
                            <FL>Deliverables</FL>
                            <div className="space-y-2">
                              {(svc.deliverables ?? []).map((d, j) => (
                                <div key={j} className="flex items-center gap-2">
                                  <input
                                    value={d}
                                    onChange={e => {
                                      const u = [...(svc.deliverables ?? [])]
                                      u[j] = e.target.value
                                      updSvc(i, { deliverables: u })
                                    }}
                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                                    placeholder={`Deliverable ${j + 1}`}
                                  />
                                  <DelBtn onClick={() => updSvc(i, { deliverables: (svc.deliverables ?? []).filter((_, k) => k !== j) })} />
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => updSvc(i, { deliverables: [...(svc.deliverables ?? []), ''] })}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 mt-2 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors">
                              + Add deliverable
                            </button>
                          </div>
                        </div>
                      ))}
                      <AddBtn
                        onClick={() => updProf('serviceCatalog', [...profileDraft.serviceCatalog, { service: '', outcome: '', pricingModel: 'PER_PROJECT', priceFromINR: 0, priceToINR: 0, timeline: '', deliverables: [] }])}
                        label="Add service"
                      />
                      <SaveCancel onSave={saveProfileEdit} onCancel={cancelEdit} saving={saving} />
                    </div>
                  </div>
                ) : serviceCount === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                    <div className="text-5xl mb-4">💰</div>
                    <p className="text-gray-500 text-sm">No service catalog yet — rebuild to generate pricing.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        {serviceCount} service{serviceCount !== 1 ? 's' : ''} · Click any card to expand details
                      </p>
                      {!translated && <EditBtn onClick={() => startProfileEdit('services')} />}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {profile!.serviceCatalog.map((svc, i) => {
                        const isOpen  = expandedSvc === i
                        const isRange = svc.priceFromINR !== svc.priceToINR
                        const priceStr = isRange
                          ? `${rupee(svc.priceFromINR)} – ${rupee(svc.priceToINR)}`
                          : rupee(svc.priceFromINR)
                        const pitchText = `${svc.service}\n\n${svc.outcome}\n\nPricing: ${priceStr} (${PRICING_LABEL[svc.pricingModel] ?? svc.pricingModel})\nTimeline: ${svc.timeline}\n\nDeliverables:\n${(svc.deliverables ?? []).map(d => `• ${d}`).join('\n')}`
                        return (
                          <div key={i} className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-all ${isOpen ? 'border-indigo-300 shadow-md' : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'}`}>
                            <button onClick={() => setExpandedSvc(isOpen ? null : i)} className="text-left w-full">
                              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-5 py-4 flex items-end justify-between gap-3">
                                <div>
                                  <p className="text-2xl font-bold text-white">{priceStr}</p>
                                  <p className="text-xs text-indigo-300 mt-0.5">⏱ {svc.timeline}</p>
                                </div>
                                <span className="text-xs font-bold bg-white/20 text-white px-2.5 py-1 rounded-full whitespace-nowrap">
                                  {PRICING_LABEL[svc.pricingModel] ?? svc.pricingModel}
                                </span>
                              </div>
                              <div className="px-5 pt-4 pb-3">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-bold text-gray-900 leading-snug">{svc.service}</p>
                                  <span className={`text-gray-400 transition-transform flex-shrink-0 text-sm mt-0.5 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{svc.outcome}</p>
                              </div>
                            </button>
                            {isOpen && (
                              <div className="px-5 pb-5 flex-1 flex flex-col gap-4 border-t border-gray-100 pt-4">
                                {(svc.deliverables?.length ?? 0) > 0 && (
                                  <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">What you get</p>
                                    <ul className="space-y-2">
                                      {svc.deliverables.map((d, j) => (
                                        <li key={j} className="flex items-start gap-2.5 text-sm text-gray-700">
                                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">✓</span>
                                          {d}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <CopyButton text={pitchText} label="Copy service pitch" />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ══════════ OUTPUTS TAB ══════════ */}
            {tab === 'outputs' && (
              <div className="space-y-5">

                {/* ── LinkedIn content ── */}
                {(portfolioData?.linkedinHeadline || profile?.outputs?.linkedinProfile?.headline || editSection === 'linkedin') && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">in</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">LinkedIn Content</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Copy and paste directly into your LinkedIn profile</p>
                      </div>
                      {editSection !== 'linkedin' && <EditBtn onClick={() => startPortfolioEdit('linkedin')} />}
                    </div>

                    {editSection === 'linkedin' && portfolioDraft ? (
                      <div className="p-6 space-y-4">
                        <div><FL>Headline</FL>
                          <input value={portfolioDraft.linkedinHeadline ?? ''} onChange={e => updPort('linkedinHeadline', e.target.value)} className={inp} placeholder="LinkedIn headline" /></div>
                        <div><FL>About Section</FL>
                          <textarea value={portfolioDraft.linkedinAbout ?? ''} onChange={e => updPort('linkedinAbout', e.target.value)} className={ta} rows={8} placeholder="LinkedIn about section" /></div>
                        <SaveCancel onSave={savePortfolioEdit} onCancel={cancelEdit} saving={saving} />
                      </div>
                    ) : (
                      <div className="p-6 space-y-5">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Headline</p>
                            <CopyButton text={profile?.outputs?.linkedinProfile?.headline ?? portfolioData?.linkedinHeadline ?? ''} label="Copy headline" />
                          </div>
                          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                            <p className="text-sm font-semibold text-blue-900 leading-snug">
                              {profile?.outputs?.linkedinProfile?.headline ?? portfolioData?.linkedinHeadline}
                            </p>
                          </div>
                        </div>
                        {(profile?.outputs?.linkedinProfile?.about ?? portfolioData?.linkedinAbout) && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">About Section</p>
                              <CopyButton text={profile?.outputs?.linkedinProfile?.about ?? portfolioData?.linkedinAbout ?? ''} label="Copy about" />
                            </div>
                            <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-4">
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {profile?.outputs?.linkedinProfile?.about ?? portfolioData?.linkedinAbout}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="pt-2 border-t border-gray-100 flex justify-end">
                          <CopyButton
                            text={[
                              profile?.outputs?.linkedinProfile?.headline ?? portfolioData?.linkedinHeadline,
                              '',
                              profile?.outputs?.linkedinProfile?.about ?? portfolioData?.linkedinAbout,
                            ].filter(Boolean).join('\n')}
                            label="Copy all LinkedIn content"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Resume Enhancements ── */}
                {((portfolioData?.resumeEnhancements?.length ?? 0) > 0 || editSection === 'resume') && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Resume Enhancements</h3>
                        {portfolioData && <p className="text-xs text-gray-500 mt-0.5">{portfolioData.resumeEnhancements.length} suggested improvements</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {editSection !== 'resume' && portfolioData && (
                          <CopyButton text={portfolioData.resumeEnhancements.map((r, i) => `${i + 1}. ${r}`).join('\n')} label="Copy all" />
                        )}
                        {editSection !== 'resume' && <EditBtn onClick={() => startPortfolioEdit('resume')} />}
                      </div>
                    </div>

                    {editSection === 'resume' && portfolioDraft ? (
                      <div className="p-6">
                        <div className="space-y-2">
                          {portfolioDraft.resumeEnhancements.map((r, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-2">{i + 1}</span>
                              <textarea
                                value={r}
                                onChange={e => {
                                  const u = [...portfolioDraft.resumeEnhancements]
                                  u[i] = e.target.value
                                  updPort('resumeEnhancements', u)
                                }}
                                className={`${ta} flex-1`}
                                rows={2}
                                placeholder={`Enhancement ${i + 1}`}
                              />
                              <DelBtn onClick={() => updPort('resumeEnhancements', portfolioDraft.resumeEnhancements.filter((_, j) => j !== i))} />
                            </div>
                          ))}
                        </div>
                        <AddBtn onClick={() => updPort('resumeEnhancements', [...portfolioDraft.resumeEnhancements, ''])} label="Add enhancement" />
                        <SaveCancel onSave={savePortfolioEdit} onCancel={cancelEdit} saving={saving} />
                      </div>
                    ) : (
                      <div className="p-4">
                        <ol className="space-y-2">
                          {portfolioData!.resumeEnhancements.map((r, i) => (
                            <li key={i} className="group flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                              <p className="text-sm text-gray-700 leading-relaxed flex-1">{r}</p>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <CopyButton text={r} label="Copy" />
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty */}
                {!portfolioData?.linkedinHeadline && !profile?.outputs?.linkedinProfile?.headline && (portfolioData?.resumeEnhancements?.length ?? 0) === 0 && editSection !== 'linkedin' && editSection !== 'resume' && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                    <div className="text-5xl mb-4">🔗</div>
                    <p className="text-gray-500 text-sm">No LinkedIn content yet — rebuild your profile to generate it.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
