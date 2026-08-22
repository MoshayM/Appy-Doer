'use client'

import { useEffect, useRef, useState } from 'react'

const STEP_INTERVAL_MS = 3400

const AGENT_META: Record<string, { label: string; emoji: string; steps: string[] }> = {
  SKILL_ASSESSMENT: {
    label: 'Skill Assessment',
    emoji: '🎯',
    steps: [
      'Reading your professional profile',
      'Mapping skills to India market demand',
      'Scoring your readiness & experience tier',
      'Generating monetizable focus areas',
    ],
  },
  OPPORTUNITY_DISCOVERY: {
    label: 'Opportunity Discovery',
    emoji: '🔭',
    steps: [
      'Loading skill assessment results',
      'Scanning Indian freelance market',
      'Ranking opportunities by profile fit',
      'Building step-by-step action plans',
    ],
  },
  OFFER_BUILDER: {
    label: 'Offer Builder',
    emoji: '📦',
    steps: [
      'Loading skills & opportunity data',
      'Designing service tiers & deliverables',
      'Setting competitive INR pricing',
      'Writing your positioning & sales pitch',
    ],
  },
  PORTFOLIO_BUILDER: {
    label: 'Portfolio Builder',
    emoji: '🗂️',
    steps: [
      'Loading skills & offer context',
      'Crafting project case studies',
      'Writing LinkedIn headline & about',
      'Building resume highlights',
    ],
  },
  PROFILE_INTELLIGENCE: {
    label: 'Profile Intelligence',
    emoji: '👤',
    steps: [
      'Gathering full profile context',
      'Building skills matrix & proficiency levels',
      'Designing service catalog with pricing',
      'Writing professional positioning',
      'Generating your publishable profile',
    ],
  },
  CLIENT_INTELLIGENCE: {
    label: 'Client Intelligence',
    emoji: '🧠',
    steps: [
      'Loading offer & skills context',
      'Profiling the client company & industry',
      'Assessing communication style & culture',
      'Preparing meeting & objection handling',
      'Writing personalised outreach scripts',
    ],
  },
  CLIENT_DISCOVERY: {
    label: 'Client Discovery',
    emoji: '🔍',
    steps: [
      'Loading offer & skills context',
      'Searching for matching companies',
      'Estimating contact details & email patterns',
      'Scoring company fit & priority rank',
    ],
  },
  CLIENT_ACQUISITION: {
    label: 'Client Acquisition',
    emoji: '🤝',
    steps: [
      'Loading client intelligence data',
      'Drafting LinkedIn connection message',
      'Writing cold email sequence',
      'Building proposal & pricing structure',
    ],
  },
  RELATIONSHIP_SUCCESS: {
    label: 'Relationship Success',
    emoji: '💼',
    steps: [
      'Loading client history & offer context',
      'Assessing current relationship stage',
      'Finding upsell & expansion opportunities',
      'Planning nurture campaign & touchpoints',
    ],
  },
  WORK_SUPPORT: {
    label: 'Work Support',
    emoji: '⚙️',
    steps: [
      'Loading work context & skills',
      'Analysing project requirements',
      'Breaking down task plan with estimates',
      'Generating solution & documentation',
    ],
  },
}

interface AgentProgressProps {
  agentType: string
  label?: string
  compact?: boolean
}

export function AgentProgress({ agentType, label, compact = false }: AgentProgressProps) {
  const meta = AGENT_META[agentType] ?? {
    label: 'Processing',
    emoji: '⚡',
    steps: ['Processing your request…'],
  }
  const [activeStep, setActiveStep] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setActiveStep(0)
    timerRef.current = setInterval(() => {
      setActiveStep(prev => (prev < meta.steps.length - 1 ? prev + 1 : prev))
    }, STEP_INTERVAL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [agentType, meta.steps.length])

  const progressPct = Math.round(((activeStep + 0.6) / meta.steps.length) * 100)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Top gradient progress bar */}
      <div className="h-0.5 bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 transition-all duration-1000 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-white border border-indigo-200 shadow-sm flex items-center justify-center text-xl">
              {meta.emoji}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-indigo-500" />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm leading-tight">{meta.label}</div>
            <div className="text-xs text-indigo-600 mt-0.5 truncate">
              {label ?? 'Claude AI is thinking step by step…'}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-xs font-semibold text-indigo-600 tabular-nums">
              {activeStep + 1} / {meta.steps.length}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{progressPct}%</div>
          </div>
        </div>
      </div>

      {/* Steps list */}
      <div className={`px-5 ${compact ? 'py-3 space-y-2' : 'py-4 space-y-3'}`}>
        {meta.steps.map((step, i) => {
          const done   = i < activeStep
          const active = i === activeStep
          return (
            <div
              key={i}
              className={`flex items-center gap-3 text-sm transition-all duration-500 ${
                done ? 'opacity-50' : active ? 'opacity-100' : 'opacity-30'
              }`}
            >
              {/* Circle icon */}
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                  done ? 'bg-emerald-500' : active ? 'bg-indigo-500' : 'bg-gray-200'
                }`}
              >
                {done ? (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : active ? (
                  <svg className="w-3 h-3 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                )}
              </div>

              {/* Step text */}
              <span className={`flex-1 ${active ? 'text-gray-900 font-medium' : done ? 'text-gray-500 line-through decoration-gray-300' : 'text-gray-400'}`}>
                {step}
              </span>

              {active && (
                <span className="shrink-0 text-xs text-indigo-400 animate-pulse font-medium">
                  working…
                </span>
              )}
              {done && (
                <span className="shrink-0 text-xs text-emerald-500 font-medium">done</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {!compact && (
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-gray-400">Claude is processing</span>
          </div>
          <span className="text-xs text-gray-400">~15–30 seconds</span>
        </div>
      )}
    </div>
  )
}
