'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { AgentProgress } from '@/components/AgentProgress'
import { TranslateButton } from '@/components/TranslateButton'

// ── Types ────────────────────────────────────────────────────────────────────
interface AssessmentResult {
  classification: string
  suggestedSkills: string[]
  monetizableSkills: string[]
  experienceTier: string
  recommendedFocusAreas: string[]
  readinessScore: number
}

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

interface OfferTier {
  name: string
  priceINR: number
  deliverables: string[]
  turnaround: string
}

interface OfferResult {
  offerName: string
  positioningStatement: string
  tiers: OfferTier[]
  idealClient: string
  salesPitch: string
}

// ── Constants ─────────────────────────────────────────────────────────────────
const EXPERTISE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const
type ExpertiseLevel = typeof EXPERTISE_LEVELS[number]

const EXPERTISE_MAP: Record<ExpertiseLevel, number> = {
  Beginner: 1, Intermediate: 3, Advanced: 7, Expert: 12,
}
const EXPERTISE_DESC: Record<ExpertiseLevel, string> = {
  Beginner:     'Just starting out, learning the basics',
  Intermediate: 'Comfortable with core work, building experience',
  Advanced:     'Handles complex tasks independently',
  Expert:       'Deep mastery, considered a go-to person',
}
const TIER_LABEL: Record<string, string> = {
  ENTRY: 'Entry Level', MID: 'Mid Level', SENIOR: 'Senior', EXPERT: 'Expert',
}
const CATEGORY_ICON: Record<string, string> = {
  SERVICE: '🛠️', DIGITAL_PRODUCT: '📦', SAAS: '💻', CONTENT: '✍️',
}
const TIER_COLORS = [
  'bg-gray-50 border-gray-200',
  'bg-indigo-50 border-indigo-200',
  'bg-purple-50 border-purple-200',
]

type ActiveStep = 'skills' | 'opportunities' | 'offer'

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spin({ cls = 'w-4 h-4' }: { cls?: string }) {
  return (
    <svg className={`${cls} animate-spin shrink-0`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CareerBuilderPage() {
  // Step 1 — Skills
  const [profession,     setProfession]     = useState('')
  const [expertiseLevel, setExpertiseLevel] = useState<ExpertiseLevel>('Intermediate')
  const [skillResult,    setSkillResult]    = useState<AssessmentResult | null>(null)
  const [editedSkills,   setEditedSkills]   = useState<string[]>([])
  const [newSkill,       setNewSkill]       = useState('')
  const [s1Loading,      setS1Loading]      = useState(false)
  const [s1Saving,       setS1Saving]       = useState(false)
  const [s1Error,        setS1Error]        = useState('')
  const [step1Done,      setStep1Done]      = useState(false)
  const skillInputRef = useRef<HTMLInputElement>(null)

  // Step 2 — Opportunities
  const [oppResult,  setOppResult]  = useState<DiscoveryResult | null>(null)
  const [selectedOpp,setSelectedOpp]= useState<string | null>(null)
  const [s2Loading,  setS2Loading]  = useState(false)
  const [s2Error,    setS2Error]    = useState('')
  const [step2Done,  setStep2Done]  = useState(false)

  // Step 3 — Offer
  const [offerResult,     setOfferResult]     = useState<OfferResult | null>(null)
  const [offerTranslated, setOfferTranslated] = useState<{ data: OfferResult; lang: string } | null>(null)
  const [s3Loading,       setS3Loading]       = useState(false)
  const [s3Error,         setS3Error]         = useState('')
  const [step3Done,       setStep3Done]       = useState(false)

  // UI
  const [activeStep,  setActiveStep]  = useState<ActiveStep>('skills')
  const [preLoading,  setPreLoading]  = useState(true)

  // ── Pre-load previous session data ────────────────────────────────────────
  useEffect(() => {
    fetch('/api/career/status')
      .then(r => r.ok ? r.json() : null)
      .then((d: {
        profile?: { profession?: string | null }
        skills?: AssessmentResult | null
        opportunities?: DiscoveryResult | null
        offer?: OfferResult | null
      } | null) => {
        if (!d) return

        if (d.profile?.profession) setProfession(d.profile.profession)

        if (d.skills) {
          setSkillResult(d.skills)
          setEditedSkills(d.skills.suggestedSkills)
          setStep1Done(true)
          setActiveStep('opportunities')
        }

        if (d.opportunities) {
          setOppResult(d.opportunities)
          setSelectedOpp(d.opportunities.topRecommendationId)
          if (d.offer) {
            setStep2Done(true)
            setActiveStep('offer')
          }
        }

        if (d.offer) {
          setOfferResult(d.offer)
          setStep3Done(true)
        }
      })
      .catch(() => {})
      .finally(() => setPreLoading(false))
  }, [])

  // ── Step 1 handlers ───────────────────────────────────────────────────────
  async function runSkillAssessment(e: React.FormEvent) {
    e.preventDefault()
    if (!profession.trim()) return
    setS1Loading(true); setS1Error('')

    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profession: profession.trim(), experienceYears: EXPERTISE_MAP[expertiseLevel] }),
    })

    const res = await fetch('/api/agents/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentType: 'SKILL_ASSESSMENT',
        userPrompt: `Profession/role: ${profession.trim()}. Expertise level: ${expertiseLevel}.`,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setS1Error(data.error?.message ?? 'Assessment failed'); setS1Loading(false); return }
    setSkillResult(data.data)
    setEditedSkills(data.data.suggestedSkills)
    setS1Loading(false)
  }

  function addSkill() {
    const s = newSkill.trim()
    if (s && !editedSkills.includes(s)) setEditedSkills(p => [...p, s])
    setNewSkill('')
    skillInputRef.current?.focus()
  }

  function handleSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter')     { e.preventDefault(); addSkill() }
    if (e.key === 'Backspace' && !newSkill && editedSkills.length > 0)
      setEditedSkills(p => p.slice(0, -1))
  }

  async function saveSkills() {
    setS1Saving(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills: editedSkills }),
    })
    setS1Saving(false)
    setStep1Done(true)
    setActiveStep('opportunities')
  }

  // ── Step 2 handlers ───────────────────────────────────────────────────────
  async function discoverOpportunities() {
    setS2Loading(true); setS2Error('')
    const res = await fetch('/api/agents/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentType: 'OPPORTUNITY_DISCOVERY' }),
    })
    const data = await res.json()
    if (!res.ok) { setS2Error(data.error?.message ?? 'Discovery failed'); setS2Loading(false); return }
    setOppResult(data.data)
    setSelectedOpp(data.data.topRecommendationId)
    setS2Loading(false)
  }

  async function selectOpportunity(oppId: string) {
    setSelectedOpp(oppId)
    await fetch(`/api/opportunities/${oppId}/select`, { method: 'POST' })
  }

  function confirmOpportunity() {
    setStep2Done(true)
    setActiveStep('offer')
  }

  // ── Step 3 handlers ───────────────────────────────────────────────────────
  async function buildOffer() {
    setS3Loading(true); setS3Error(''); setOfferTranslated(null)
    const res = await fetch('/api/agents/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentType: 'OFFER_BUILDER' }),
    })
    const data = await res.json()
    if (!res.ok) { setS3Error(data.error?.message ?? 'Build failed'); setS3Loading(false); return }
    setOfferResult(data.data)
    await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.data.offerName, detail: data.data }),
    })
    setStep3Done(true)
    setS3Loading(false)
  }

  // ── Loading splash ────────────────────────────────────────────────────────
  if (preLoading) {
    return (
      <div className="flex items-center justify-center h-48 gap-2 text-gray-400 text-sm">
        <Spin cls="w-5 h-5" /> Loading your career profile…
      </div>
    )
  }

  const displayOffer = offerTranslated?.data ?? offerResult

  // ── Step indicator helper ─────────────────────────────────────────────────
  function StepBtn({
    num, step, title, subtitle, done, locked,
  }: {
    num: number; step: ActiveStep; title: string; subtitle?: string
    done: boolean; locked: boolean
  }) {
    const isActive = activeStep === step
    return (
      <button
        disabled={locked}
        onClick={() => !locked && setActiveStep(step)}
        className={`flex-1 flex flex-col items-center gap-1 text-center transition-colors disabled:cursor-not-allowed ${
          locked ? 'opacity-40' : 'cursor-pointer'
        }`}
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
          done     ? 'bg-green-500 text-white' :
          isActive ? 'bg-indigo-600 text-white' :
                     'bg-gray-200 text-gray-500'
        }`}>
          {done ? '✓' : num}
        </div>
        <span className={`text-xs font-semibold ${
          isActive ? 'text-indigo-700' : done ? 'text-green-700' : locked ? 'text-gray-400' : 'text-gray-600'
        }`}>{title}</span>
        {subtitle && <span className="text-xs text-gray-400 max-w-[100px] truncate">{subtitle}</span>}
      </button>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ── Page header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Income Planner</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Three AI steps — assess your skills → find your income path → build a market-ready offer
        </p>
      </div>

      {/* ── Step stepper ──────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5">
        <div className="flex items-start gap-0">
          <StepBtn
            num={1} step="skills" title="Skills" done={step1Done} locked={false}
            subtitle={step1Done && skillResult
              ? `${skillResult.readinessScore}/100 · ${TIER_LABEL[skillResult.experienceTier] ?? skillResult.experienceTier}`
              : profession || undefined}
          />
          <div className={`flex-1 mt-4 h-0.5 mx-1 transition-colors ${step1Done ? 'bg-green-300' : 'bg-gray-200'}`}/>
          <StepBtn
            num={2} step="opportunities" title="Opportunities" done={step2Done} locked={!step1Done}
            subtitle={step2Done && oppResult ? `${oppResult.opportunities.length} found` : undefined}
          />
          <div className={`flex-1 mt-4 h-0.5 mx-1 transition-colors ${step2Done ? 'bg-green-300' : 'bg-gray-200'}`}/>
          <StepBtn
            num={3} step="offer" title="Offer" done={step3Done} locked={!step2Done}
            subtitle={step3Done && offerResult ? offerResult.offerName : undefined}
          />
        </div>
      </div>

      {/* ── Step content ──────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

        {/* ─ STEP 1: Skills ─────────────────────────────────────── */}
        {activeStep === 'skills' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">🧠 Skill Assessment</h2>
                <p className="text-sm text-gray-500 mt-0.5">AI maps your monetizable skills from your actual background</p>
              </div>
              {step1Done && skillResult && (
                <button
                  onClick={() => { setSkillResult(null); setEditedSkills([]); setStep1Done(false) }}
                  className="text-xs text-indigo-500 hover:underline"
                >↺ Re-assess</button>
              )}
            </div>

            {s1Loading ? (
              <AgentProgress agentType="SKILL_ASSESSMENT" label={`Assessing skills for ${profession}…`} />
            ) : skillResult ? (
              /* ── Result ── */
              <div className="space-y-5">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white flex items-center justify-between">
                  <div>
                    <div className="text-xs opacity-75 mb-0.5">Readiness Score</div>
                    <div className="text-4xl font-bold leading-none">
                      {skillResult.readinessScore}<span className="text-xl opacity-60">/100</span>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">{skillResult.classification}</div>
                    <div className="opacity-75">{TIER_LABEL[skillResult.experienceTier] ?? skillResult.experienceTier}</div>
                  </div>
                </div>

                {/* Editable skills */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Your Skills</span>
                    <span className="text-xs text-gray-400">× to remove · type to add more</span>
                  </div>
                  <div
                    className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-xl min-h-[56px] cursor-text"
                    onClick={() => skillInputRef.current?.focus()}
                  >
                    {editedSkills.map(skill => (
                      <span key={skill} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full font-medium">
                        {skill}
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setEditedSkills(p => p.filter(s => s !== skill)) }}
                          className="text-indigo-400 hover:text-indigo-700 leading-none"
                        >×</button>
                      </span>
                    ))}
                    <input
                      ref={skillInputRef}
                      type="text" value={newSkill}
                      onChange={e => setNewSkill(e.target.value)}
                      onKeyDown={handleSkillKeyDown}
                      onBlur={addSkill}
                      placeholder={editedSkills.length === 0 ? 'Type a skill and press Enter…' : '+ Add skill'}
                      className="flex-1 min-w-[140px] text-sm outline-none bg-transparent placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Monetizable + Focus areas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">💰 Monetizable Skills</div>
                    <div className="flex flex-wrap gap-1.5">
                      {skillResult.monetizableSkills.map(s => (
                        <span key={s} className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">🎯 Focus Areas</div>
                    <ul className="space-y-1">
                      {skillResult.recommendedFocusAreas.slice(0, 4).map((a, i) => (
                        <li key={i} className="text-xs text-amber-800 flex gap-1.5">
                          <span className="shrink-0 mt-0.5 text-amber-500">→</span>{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button
                  onClick={saveSkills}
                  disabled={s1Saving || editedSkills.length === 0}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {s1Saving
                    ? <span className="flex items-center justify-center gap-2"><Spin/> Saving…</span>
                    : 'Save Skills & Discover Opportunities →'}
                </button>
              </div>
            ) : (
              /* ── Input form ── */
              <form onSubmit={runSkillAssessment} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Profession / Job Title</label>
                  <input
                    type="text" required
                    placeholder="e.g. Software Engineer, Marketing Manager, Graphic Designer"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={profession} onChange={e => setProfession(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Level of Expertise</label>
                  <div className="grid grid-cols-4 gap-2">
                    {EXPERTISE_LEVELS.map(level => (
                      <button key={level} type="button" onClick={() => setExpertiseLevel(level)}
                        className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                          expertiseLevel === level
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                        }`}>
                        {level}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">{EXPERTISE_DESC[expertiseLevel]}</p>
                </div>

                {s1Error && <p className="text-sm text-red-600">{s1Error}</p>}

                <button type="submit" disabled={!profession.trim()}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                  Assess My Skills ✨
                </button>
              </form>
            )}
          </div>
        )}

        {/* ─ STEP 2: Opportunities ──────────────────────────────── */}
        {activeStep === 'opportunities' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">🎯 Opportunity Discovery</h2>
                <p className="text-sm text-gray-500 mt-0.5">Your best income paths based on skills, effort, and India market fit</p>
              </div>
              {oppResult && (
                <button
                  onClick={() => { setOppResult(null); setSelectedOpp(null); setStep2Done(false) }}
                  className="text-xs text-indigo-500 hover:underline"
                >↺ Rediscover</button>
              )}
            </div>

            {s2Loading ? (
              <AgentProgress agentType="OPPORTUNITY_DISCOVERY" />
            ) : oppResult ? (
              <div className="space-y-3">
                {oppResult.opportunities.map(opp => (
                  <div
                    key={opp.id}
                    onClick={() => selectOpportunity(opp.id)}
                    className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-sm ${
                      selectedOpp === opp.id
                        ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-200'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="text-xl shrink-0 mt-0.5">{CATEGORY_ICON[opp.category] ?? '💡'}</span>
                        <div className="min-w-0">
                          <div className="flex items-center flex-wrap gap-1.5 mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm">{opp.title}</h3>
                            {oppResult.topRecommendationId === opp.id && (
                              <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-medium">⭐ Top Pick</span>
                            )}
                            {selectedOpp === opp.id && (
                              <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-medium">✓ Selected</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{opp.actionPlanSummary}</p>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                            <span>⏱ {opp.timeToFirstIncome}</span>
                            <span>⚡ {opp.requiredEffortHoursPerWeek}h/week</span>
                            <span>📊 {opp.difficultyScore}/10 difficulty</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-gray-900 text-sm whitespace-nowrap">
                          ₹{opp.monthlyPotentialINR.min.toLocaleString('en-IN')}–{opp.monthlyPotentialINR.max.toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-gray-400">/month</div>
                      </div>
                    </div>
                  </div>
                ))}

                {s2Error && <p className="text-sm text-red-600">{s2Error}</p>}

                <button
                  onClick={confirmOpportunity}
                  disabled={!selectedOpp}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-2"
                >
                  Continue with Selected Opportunity →
                </button>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="font-semibold text-gray-900 mb-1">Find Your Best Income Path</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                  AI analyses your skills and recommends the highest-potential income opportunities tailored for the Indian freelance market.
                </p>
                {s2Error && <p className="text-sm text-red-600 mb-3">{s2Error}</p>}
                <button
                  onClick={discoverOpportunities}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Discover Opportunities ✨
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─ STEP 3: Offer Builder ──────────────────────────────── */}
        {activeStep === 'offer' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">📦 Offer Builder</h2>
                <p className="text-sm text-gray-500 mt-0.5">Package your skills into a compelling, priced service offer</p>
              </div>
              <div className="flex items-center gap-2">
                {offerResult && (
                  <TranslateButton
                    content={offerResult}
                    onTranslated={(data, lang) => setOfferTranslated({ data: data as OfferResult, lang })}
                    isTranslated={!!offerTranslated}
                    activeLanguage={offerTranslated?.lang}
                    onReset={() => setOfferTranslated(null)}
                  />
                )}
                {offerResult && (
                  <button
                    onClick={() => { setOfferResult(null); setOfferTranslated(null); setStep3Done(false) }}
                    className="text-xs text-indigo-500 hover:underline"
                  >↺ Rebuild</button>
                )}
              </div>
            </div>

            {s3Loading ? (
              <AgentProgress agentType="OFFER_BUILDER" />
            ) : displayOffer ? (
              <div className="space-y-5">
                {/* Offer header */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{displayOffer.offerName}</h3>
                    {step3Done && <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium border border-green-200 shrink-0">Saved ✓</span>}
                  </div>
                  <p className="text-indigo-700 font-medium text-sm mb-3">{displayOffer.positioningStatement}</p>
                  <div className="bg-white/70 rounded-lg px-3 py-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Ideal Client — </span>
                    <span className="text-sm text-gray-700">{displayOffer.idealClient}</span>
                  </div>
                </div>

                {/* Tiers */}
                <div className="grid grid-cols-3 gap-3">
                  {displayOffer.tiers.map((tier, i) => (
                    <div key={i} className={`border rounded-xl p-4 ${TIER_COLORS[i % TIER_COLORS.length]}`}>
                      <div className="font-bold text-gray-900 text-sm mb-0.5">{tier.name}</div>
                      <div className="text-xl font-bold text-indigo-700 mb-0.5">
                        ₹{(offerResult?.tiers[i]?.priceINR ?? tier.priceINR).toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-gray-400 mb-3">{tier.turnaround}</div>
                      <ul className="space-y-1.5">
                        {tier.deliverables.map((d, j) => (
                          <li key={j} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <span className="text-green-500 shrink-0 mt-0.5">✓</span>{d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Sales pitch */}
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Sales Pitch</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{displayOffer.salesPitch}</p>
                </div>

                <a
                  href="/dashboard/profile"
                  className="block w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-center hover:bg-indigo-700 transition-colors"
                >
                  Build Your Profile →
                </a>
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="text-5xl mb-4">📦</div>
                <h3 className="font-semibold text-gray-900 mb-1">Package Your Services</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                  AI builds a 3-tier priced offer — starter, standard, premium — with deliverables, positioning, and a sales pitch ready to share with clients.
                </p>
                {s3Error && <p className="text-sm text-red-600 mb-3">{s3Error}</p>}
                <button
                  onClick={buildOffer}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Build My Offer ✨
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
