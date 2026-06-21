'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'

interface ProfileSummary {
  name?: string
  education?: { degree?: string; field?: string; institution?: string }[]
  interests?: string[]
  skills?: string[]
  location?: string
  experienceYears?: number
}


const EXPERTISE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const
type ExpertiseLevel = typeof EXPERTISE_LEVELS[number]

const EXPERTISE_MAP: Record<ExpertiseLevel, number> = {
  Beginner:     1,
  Intermediate: 3,
  Advanced:     7,
  Expert:       12,
}

const EXPERTISE_TIER_LABEL: Record<string, string> = {
  ENTRY:  'Entry Level',
  MID:    'Mid Level',
  SENIOR: 'Senior',
  EXPERT: 'Expert',
}

interface AssessmentResult {
  classification:        string
  suggestedSkills:       string[]
  monetizableSkills:     string[]
  experienceTier:        string
  recommendedFocusAreas: string[]
  readinessScore:        number
}

export default function SkillAssessmentPage() {
  const [profession,     setProfession]     = useState('')
  const [expertiseLevel, setExpertiseLevel] = useState<ExpertiseLevel>('Intermediate')
  const [result,         setResult]         = useState<AssessmentResult | null>(null)
  const [editedSkills,   setEditedSkills]   = useState<string[]>([])
  const [newSkill,       setNewSkill]       = useState('')
  const [loading,        setLoading]        = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState('')
  const [primaryProfile, setPrimaryProfile] = useState<ProfileSummary | null>(null)
  const skillInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Load connected profile to show profile-grounded banner
    fetch('/api/connections')
      .then(r => r.ok ? r.json() : [])
      .then((accounts: { platform: string; profileData: Record<string, unknown> | null }[]) => {
        const priority = ['RESUME', 'NAUKRI_TEXT', 'LINKEDIN', 'GITHUB']
        const sorted = [...accounts].sort(
          (a, b) => priority.indexOf(b.platform) - priority.indexOf(a.platform)
        )
        const merged: ProfileSummary = {}
        for (const acc of [...sorted].reverse()) {
          const d = (acc.profileData ?? {}) as Record<string, unknown>
          if (d.name        && !merged.name)        merged.name        = d.name as string
          if (d.location    && !merged.location)    merged.location    = d.location as string
          if (d.experienceYears && !merged.experienceYears) merged.experienceYears = d.experienceYears as number
          if ((d.education  as ProfileSummary['education'])?.length && !merged.education?.length) merged.education = d.education as ProfileSummary['education']
          if ((d.interests  as string[])?.length && !merged.interests?.length) merged.interests = d.interests as string[]
          if ((d.skills     as string[])?.length && !merged.skills?.length)    merged.skills    = d.skills    as string[]
        }
        if (Object.keys(merged).length > 0) setPrimaryProfile(merged)
      })
      .catch(() => {})
  }, [])

  async function runAssessment(e: React.FormEvent) {
    e.preventDefault()
    if (!profession.trim()) return
    setLoading(true)
    setError('')

    // Save profession + expertise to profile
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profession: profession.trim(),
        experienceYears: EXPERTISE_MAP[expertiseLevel],
      }),
    })

    const res = await fetch('/api/agents/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentType: 'SKILL_ASSESSMENT',
        userPrompt: `Profession/role: ${profession.trim()}. Expertise level: ${expertiseLevel}. Assess this professional and suggest the skills they likely have based on their role and expertise level.`,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error?.message ?? 'Assessment failed')
      setLoading(false)
      return
    }

    const assessment: AssessmentResult = data.data
    setResult(assessment)
    setEditedSkills(assessment.suggestedSkills)
    setLoading(false)
  }

  function addSkill() {
    const s = newSkill.trim()
    if (s && !editedSkills.includes(s)) {
      setEditedSkills(prev => [...prev, s])
    }
    setNewSkill('')
    skillInputRef.current?.focus()
  }

  function removeSkill(skill: string) {
    setEditedSkills(prev => prev.filter(s => s !== skill))
  }

  function handleSkillKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addSkill() }
    if (e.key === 'Backspace' && !newSkill && editedSkills.length > 0) {
      setEditedSkills(prev => prev.slice(0, -1))
    }
  }

  async function saveAndContinue() {
    setSaving(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skills: editedSkills }),
    })
    setSaving(false)
    window.location.href = '/dashboard/opportunities'
  }

  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skill Assessment</h1>
          <p className="text-gray-500 mt-1">{profession} · {expertiseLevel}</p>
        </div>

        {/* Profile-grounded banner */}
        {primaryProfile && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex gap-3 items-start">
            <span className="text-lg shrink-0">🎓</span>
            <div className="text-sm">
              <span className="font-semibold text-indigo-800">Profile-grounded assessment</span>
              <span className="text-indigo-600"> — skills are matched to your actual background</span>
              {primaryProfile.education?.length ? (
                <div className="mt-1 text-xs text-indigo-700">
                  {primaryProfile.education.slice(0, 2).map((e, i) => (
                    <span key={i} className="mr-2">
                      {[e.degree, e.field, e.institution].filter(Boolean).join(' · ')}
                    </span>
                  ))}
                </div>
              ) : null}
              {primaryProfile.interests?.length ? (
                <div className="mt-0.5 text-xs text-indigo-600">
                  Interests: {primaryProfile.interests.slice(0, 4).join(', ')}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Score */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="text-sm opacity-80 mb-1">Readiness Score</div>
          <div className="text-5xl font-bold mb-2">
            {result.readinessScore}<span className="text-2xl">/100</span>
          </div>
          <div className="font-medium">
            {result.classification} — {EXPERTISE_TIER_LABEL[result.experienceTier] ?? result.experienceTier}
          </div>
        </div>

        {/* Editable Skills */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Your Skills</h2>
            <span className="text-xs text-gray-400">AI-suggested · click × to remove · type to add</span>
          </div>
          <div
            className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-xl min-h-[56px] cursor-text"
            onClick={() => skillInputRef.current?.focus()}
          >
            {editedSkills.map(skill => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full font-medium"
              >
                {skill}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeSkill(skill) }}
                  className="text-indigo-400 hover:text-indigo-700 leading-none ml-0.5"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              ref={skillInputRef}
              type="text"
              value={newSkill}
              onChange={e => setNewSkill(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              onBlur={addSkill}
              placeholder={editedSkills.length === 0 ? 'Type a skill and press Enter…' : '+ Add skill'}
              className="flex-1 min-w-[140px] text-sm outline-none bg-transparent placeholder-gray-400"
            />
          </div>
        </div>

        {/* Monetizable Skills */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-bold text-gray-900 mb-3">Monetizable Skills</h2>
          <div className="flex flex-wrap gap-2">
            {result.monetizableSkills.map(s => (
              <span key={s} className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full font-medium">{s}</span>
            ))}
          </div>
        </div>

        {/* Focus Areas */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-bold text-gray-900 mb-3">Recommended Focus Areas</h2>
          <ul className="space-y-2">
            {result.recommendedFocusAreas.map((area, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-indigo-500 font-bold mt-0.5">→</span>
                {area}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={saveAndContinue}
          disabled={saving || editedSkills.length === 0}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Skills & Discover Opportunities →'}
        </button>

        <button
          onClick={() => { setResult(null); setEditedSkills([]) }}
          className="w-full border border-gray-300 py-3 rounded-xl text-gray-700 text-sm hover:bg-gray-50 transition-colors"
        >
          Retake Assessment
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Skill Assessment</h1>
        <p className="text-gray-500 mt-1">AI maps your monetizable skills from your actual background — education, experience, and interests.</p>
      </div>

      {/* Profile status banner */}
      {primaryProfile ? (
        <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex gap-3 items-start">
          <span className="text-lg shrink-0">✅</span>
          <div className="text-sm">
            <span className="font-semibold text-indigo-800">Social profile connected</span>
            <span className="text-indigo-600"> — assessment will be grounded in your real education, experience, and interests.</span>
            {primaryProfile.education?.length ? (
              <div className="mt-1 text-xs text-indigo-700 font-medium">
                🎓 {primaryProfile.education.slice(0, 2).map(e => [e.degree, e.field].filter(Boolean).join(' in ')).join(' · ')}
              </div>
            ) : null}
            {primaryProfile.interests?.length ? (
              <div className="mt-0.5 text-xs text-indigo-600">
                Interests: {primaryProfile.interests.slice(0, 4).join(', ')}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3 items-start">
          <span className="text-lg shrink-0">💡</span>
          <div className="text-sm">
            <span className="font-semibold text-amber-800">Tip: Connect your profile for smarter results</span>
            <span className="text-amber-700"> — import your Naukri profile or resume so AI uses your actual education, interests, and experience instead of guessing.</span>
            <a href="/dashboard/connections" className="block mt-1 text-xs text-amber-700 underline font-medium">Import profile →</a>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <form onSubmit={runAssessment} className="space-y-6">

          {/* Profession */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profession / Job Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Software Engineer, Marketing Manager, Graphic Designer"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={profession}
              onChange={e => setProfession(e.target.value)}
            />
          </div>

          {/* Expertise Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Level of Expertise
            </label>
            <div className="grid grid-cols-4 gap-2">
              {EXPERTISE_LEVELS.map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setExpertiseLevel(level)}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    expertiseLevel === level
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {expertiseLevel === 'Beginner'     && 'Just starting out, learning the basics'}
              {expertiseLevel === 'Intermediate' && 'Comfortable with core work, building experience'}
              {expertiseLevel === 'Advanced'     && 'Handles complex tasks independently'}
              {expertiseLevel === 'Expert'       && 'Deep mastery, considered a go-to person'}
            </p>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !profession.trim()}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyzing your profile…' : 'Assess My Skills'}
          </button>
        </form>
      </div>
    </div>
  )
}
