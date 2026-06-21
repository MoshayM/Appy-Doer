'use client'

import { useState, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobPortalUrl { portal: string; url: string }

interface Prospect {
  id: string
  companyName: string
  industry: string
  companySize: 'STARTUP' | 'SME' | 'ENTERPRISE'
  region: string
  contactName: string
  contactRole: string
  estimatedEmail: string
  emailPattern: string
  linkedinSearchUrl: string
  jobPortalUrls: JobPortalUrl[]
  whyGoodFit: string
  priorityScore: number
  outreachAngle: string
}

interface DiscoveryResult { prospects: Prospect[]; searchStrategy: string }

interface EditedProspect {
  companyName: string
  contactName: string
  contactRole: string
  email: string
}

interface Lead {
  id: string
  name: string
  company: string | null
  contact: string | null
  service: string | null
  notes: string | null
  stage: string
  artifacts?: Record<string, unknown> | null
  clientProfile: { temperature: string } | null
}

interface ClientInsight {
  clientTemperature: 'COLD' | 'WARM' | 'HOT'
  confidence: number
  companyProfile: { name: string; industry: string; size: string; region: string }
  communicationPreference: string
  culturalNotes: string[]
  regionExpectations: string[]
  pricingSensitivity: 'LOW' | 'MEDIUM' | 'HIGH'
  decisionMakingStyle: string
  recommendedStrategy: string
  proposalCustomization: string[]
  meetingPrep: {
    talkingPoints: string[]
    questionsToAsk: string[]
    likelyObjections: { objection: string; response: string }[]
  }
  communicationScripts: { intro: string; followUp: string; closing: string }
  pricingRecommendationINR: { min: number; max: number; rationale: string }
}

interface EmailDraft {
  subject: string; body: string; sent: boolean; profileUrl: string | null
  sentVia?: string; trackingId?: string; gmailConnected?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractEmail(contact: string): string {
  const m = contact.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/)
  return m ? m[0] : ''
}

const TEMP_COLORS: Record<string, string> = {
  HOT:  'bg-red-100 text-red-700 border-red-200',
  WARM: 'bg-orange-100 text-orange-700 border-orange-200',
  COLD: 'bg-blue-100 text-blue-700 border-blue-200',
}

const PSENS_LABEL: Record<string, string> = { LOW: 'Low sensitivity', MEDIUM: 'Moderate sensitivity', HIGH: 'Very price-sensitive' }
const PSENS_COLOR: Record<string, string> = {
  LOW:    'text-green-700 bg-green-50',
  MEDIUM: 'text-yellow-700 bg-yellow-50',
  HIGH:   'text-red-700 bg-red-50',
}

const SIZE_BADGE: Record<string, string> = {
  STARTUP:    'bg-purple-50 text-purple-700',
  SME:        'bg-blue-50 text-blue-700',
  ENTERPRISE: 'bg-gray-100 text-gray-700',
}

const STAGE_LABEL: Record<string, string> = {
  LEAD_IDENTIFIED:   'Identified',
  PROPOSAL_SENT:     'Proposal Sent',
  NEGOTIATING:       'Negotiating',
  WON:               'Won',
  LOST:              'Lost',
}

// ─── Add-client form type ─────────────────────────────────────────────────────

const SOURCES = ['LinkedIn', 'Referral', 'Cold Outreach', 'Job Board', 'Social Media', 'Website', 'Event', 'Client Intelligence', 'Manual', 'Other']
const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW']

type AddClientForm = {
  name: string; company: string; contact: string; service: string; notes: string
  source: string; priority: string; followUpDate: string; linkedinUrl: string; website: string
}
const EMPTY_ADD: AddClientForm = {
  name: '', company: '', contact: '', service: '', notes: '',
  source: 'Client Intelligence', priority: 'MEDIUM', followUpDate: '', linkedinUrl: '', website: '',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientIntelligencePage() {
  const [tab, setTab] = useState<'discover' | 'analyse'>('discover')

  // Discover tab
  const [discovery,    setDiscovery]    = useState<DiscoveryResult | null>(null)
  const [discovering,  setDiscovering]  = useState(false)
  const [discoverErr,  setDiscoverErr]  = useState('')
  const [edits,        setEdits]        = useState<Record<string, EditedProspect>>({})
  const [savedLeads,   setSavedLeads]   = useState<Record<string, boolean>>({})
  const [draftingFor,  setDraftingFor]  = useState<string | null>(null)
  const [emailModal,   setEmailModal]   = useState<{ prospect: Prospect; draft: EmailDraft; leadId?: string } | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [sendError,    setSendError]    = useState<string | null>(null)
  const [copied,       setCopied]       = useState(false)
  const [sendVia,      setSendVia]      = useState<'gmail' | 'resend'>('resend')

  // Gmail connection status (loaded once on mount)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [gmailEmail,     setGmailEmail]     = useState<string | null>(null)

  // Analyse tab
  const [leads,       setLeads]       = useState<Lead[]>([])
  const [leadsLoading, setLeadsLoading] = useState(true)
  const [selected,    setSelected]    = useState<Lead | null>(null)
  const [insight,     setInsight]     = useState<ClientInsight | null>(null)
  const [analysing,   setAnalysing]   = useState(false)
  const [analyseErr,  setAnalyseErr]  = useState('')

  // Manual add client modal (shared across tabs)
  const [showAddClient,   setShowAddClient]   = useState(false)
  const [addClientForm,   setAddClientForm]   = useState<AddClientForm>(EMPTY_ADD)
  const [addClientSaving, setAddClientSaving] = useState(false)
  const [addClientErr,    setAddClientErr]    = useState('')
  // After add: optionally jump to analyse
  const [analyseAfterAdd, setAnalyseAfterAdd] = useState(false)

  useEffect(() => {
    loadLeads()
    fetch('/api/connections')
      .then(r => r.ok ? r.json() : [])
      .then((accounts: { platform: string; accountEmail: string | null }[]) => {
        const gmail = accounts.find(a => a.platform === 'GMAIL')
        if (gmail) { setGmailConnected(true); setGmailEmail(gmail.accountEmail); setSendVia('gmail') }
      })
      .catch(() => { /* non-critical */ })
  }, [])

  // ── Discover ──────────────────────────────────────────────────────────────

  async function runDiscovery() {
    setDiscovering(true); setDiscoverErr('')
    try {
      const res  = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentType: 'CLIENT_DISCOVERY' }),
      })
      const data = await res.json()
      if (!res.ok) { setDiscoverErr(data.error?.message ?? 'Discovery failed'); return }
      setDiscovery(data.data)
    } catch {
      setDiscoverErr('Network error — please try again')
    } finally {
      setDiscovering(false)
    }
  }

  function getEdited(p: Prospect): EditedProspect {
    return edits[p.id] ?? { companyName: p.companyName, contactName: p.contactName, contactRole: p.contactRole, email: p.estimatedEmail }
  }

  function setField(id: string, field: keyof EditedProspect, value: string) {
    const base = discovery!.prospects.find(p => p.id === id)!
    setEdits(prev => ({ ...prev, [id]: { ...getEdited(base), [field]: value } }))
  }

  async function saveProspect(p: Prospect) {
    const ed = getEdited(p)
    const res = await fetch('/api/clients/prospects/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyName: ed.companyName, contactName: ed.contactName, contactRole: ed.contactRole, email: ed.email, industry: p.industry, region: p.region }),
    })
    if (res.ok) {
      setSavedLeads(prev => ({ ...prev, [p.id]: true }))
      loadLeads()
    }
  }

  async function draftEmail(p: Prospect) {
    setDraftingFor(p.id)
    const ed = getEdited(p)
    try {
      const res  = await fetch('/api/clients/cold-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectName: ed.contactName, prospectCompany: ed.companyName,
          prospectRole: ed.contactRole, prospectEmail: ed.email,
          outreachAngle: p.outreachAngle,
          draftOnly: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setDiscoverErr(data.error?.message ?? 'Failed to generate email'); return }
      setEmailModal({ prospect: p, draft: { ...(data as EmailDraft), gmailConnected } })
      setSendError(null)
    } catch {
      setDiscoverErr('Failed to draft email')
    } finally {
      setDraftingFor(null)
    }
  }

  async function draftEmailForLead(lead: Lead) {
    const leadKey = `lead-${lead.id}`
    setDraftingFor(leadKey)
    setSendError(null)
    // Use any email already edited in the card field, else parse from contact
    const existingEdit = edits[leadKey]
    const prospectEmail = existingEdit?.email ?? extractEmail(lead.contact ?? '')
    const outreachAngle = lead.service
      ? `They need help with: ${lead.service}`
      : (lead.notes ?? `Reaching out to ${lead.name}${lead.company ? ` at ${lead.company}` : ''}`)
    try {
      const res = await fetch('/api/clients/cold-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectName:    lead.name,
          prospectCompany: lead.company ?? '',
          prospectRole:    '',
          prospectEmail,
          outreachAngle,
          draftOnly: true,
          leadId:    lead.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setDiscoverErr(data.error?.message ?? 'Failed to generate email'); return }
      // Build a minimal Prospect shape so the shared email modal works
      const pseudo: Prospect = {
        id:               leadKey,
        companyName:      lead.company ?? '',
        industry:         '',
        companySize:      'SME',
        region:           '',
        contactName:      lead.name,
        contactRole:      '',
        estimatedEmail:   prospectEmail,
        emailPattern:     '',
        linkedinSearchUrl: (lead.artifacts?.linkedinUrl as string) ?? '',
        jobPortalUrls:    [],
        whyGoodFit:       lead.notes ?? '',
        priorityScore:    0,
        outreachAngle,
      }
      setEmailModal({ prospect: pseudo, draft: { ...(data as EmailDraft), gmailConnected }, leadId: lead.id })
      setSendError(null)
    } catch {
      setDiscoverErr('Failed to draft email')
    } finally {
      setDraftingFor(null)
    }
  }

  async function sendEmail() {
    if (!emailModal) return
    setSendingEmail(true)
    setSendError(null)
    const ed = getEdited(emailModal.prospect)
    try {
      const res  = await fetch('/api/clients/cold-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectName: ed.contactName, prospectCompany: ed.companyName,
          prospectRole: ed.contactRole, prospectEmail: ed.email,
          outreachAngle: emailModal.prospect.outreachAngle,
          prewrittenSubject: emailModal.draft.subject,
          prewrittenBody:    emailModal.draft.body,
          sendVia,
          leadId: emailModal.leadId,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSendError(data?.error?.message ?? 'Server error — please try again')
        return
      }
      if (data.sent) {
        setSendError(null)
        setEmailModal(m => m ? {
          ...m,
          draft: { ...m.draft, sent: true, sentVia: data.sentVia, trackingId: data.trackingId },
        } : null)
      } else {
        // Surface the exact reason so the user can act on it
        const reason = data.gmailError
          ?? (sendVia === 'gmail' ? 'Gmail send failed — check your Gmail connection in Connections.' : 'Email could not be sent — please try again.')
        setSendError(reason)
      }
    } catch {
      setSendError('Network error — please check your connection and try again.')
    } finally {
      setSendingEmail(false)
    }
  }

  function copyEmail() {
    if (!emailModal) return
    navigator.clipboard.writeText(`Subject: ${emailModal.draft.subject}\n\n${emailModal.draft.body}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  // ── Analyse ───────────────────────────────────────────────────────────────

  async function loadLeads() {
    setLeadsLoading(true)
    try {
      const res = await fetch('/api/leads')
      if (res.ok) setLeads(await res.json())
    } finally {
      setLeadsLoading(false)
    }
  }

  async function addClientManually(e: React.FormEvent) {
    e.preventDefault()
    if (!addClientForm.name.trim()) return
    setAddClientSaving(true); setAddClientErr('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addClientForm),
      })
      const lead = await res.json()
      if (!res.ok) { setAddClientErr(lead?.error?.message ?? 'Failed to add client'); return }
      setLeads(prev => [lead, ...prev])
      setShowAddClient(false)
      setAddClientForm(EMPTY_ADD)
      if (analyseAfterAdd) {
        setTab('analyse')
        analyzeClient(lead)
      }
    } catch {
      setAddClientErr('Network error — please try again')
    } finally {
      setAddClientSaving(false)
    }
  }

  async function analyzeClient(lead: Lead) {
    setTab('analyse')
    setSelected(lead); setInsight(null); setAnalysing(true); setAnalyseErr('')
    try {
      const userPrompt = [
        lead.company   ? `Company: ${lead.company}`   : null,
        lead.name      ? `Contact name: ${lead.name}` : null,
        lead.contact   ? `Contact info: ${lead.contact}` : null,
        lead.notes     ? `Notes: ${lead.notes}`       : null,
        `Pipeline stage: ${STAGE_LABEL[lead.stage] ?? lead.stage}`,
      ].filter(Boolean).join('. ')

      const res  = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentType: 'CLIENT_INTELLIGENCE', userPrompt }),
      })
      const data = await res.json()
      if (!res.ok) { setAnalyseErr(data.error?.message ?? 'Analysis failed'); return }
      setInsight(data.data as ClientInsight)
    } catch {
      setAnalyseErr('Network error — please try again')
    } finally {
      setAnalysing(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Client Intelligence</h1>
        <p className="text-gray-500 mt-1">Discover prospects, analyse leads, and send cold emails — powered by AI.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
        {(['discover', 'analyse'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'discover' ? '🔍 Discover Prospects' : '🧠 Analyse Lead'}
          </button>
        ))}
      </div>

      {/* ── DISCOVER TAB ──────────────────────────────────────────────────── */}
      {tab === 'discover' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-gray-500 max-w-lg">AI finds best-fit companies based on your skills, opportunity, and offer. Edit any field before reaching out.</p>
            <div className="flex items-center gap-2 shrink-0">
              {discovery && !discovering && (
                <button
                  onClick={() => { setDiscovery(null); setEdits({}); setSavedLeads({}); setDiscoverErr('') }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  ← Reset
                </button>
              )}
              <button
                onClick={() => { setAddClientForm(EMPTY_ADD); setAddClientErr(''); setAnalyseAfterAdd(false); setShowAddClient(true) }}
                className="border border-indigo-300 text-indigo-700 px-4 py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-50 transition-colors"
              >
                + Add Client
              </button>
              <button
                onClick={runDiscovery}
                disabled={discovering}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {discovering ? 'Finding prospects…' : discovery ? '🔄 Rediscover' : '🔍 Find Prospects'}
              </button>
            </div>
          </div>

          {discoverErr && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{discoverErr}</div>}

          {/* ── YOUR CRM LEADS ── */}
          {!discovering && !leadsLoading && leads.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Your CRM Leads
                  <span className="ml-1.5 text-gray-400 font-normal text-xs">({leads.length})</span>
                </h3>
                <a href="/dashboard/crm" className="text-xs text-indigo-600 hover:underline">Manage in CRM →</a>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {leads.map(lead => {
                  const leadKey  = `lead-${lead.id}`
                  const ed       = edits[leadKey] ?? { companyName: lead.company ?? '', contactName: lead.name, contactRole: '', email: extractEmail(lead.contact ?? '') }
                  return (
                    <div key={lead.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:border-indigo-200 transition-colors">
                      {/* Header */}
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">{lead.name}</div>
                          {lead.company && <div className="text-xs text-gray-400 truncate mt-0.5">{lead.company}</div>}
                        </div>
                        <div className="flex flex-wrap gap-1 shrink-0 justify-end">
                          {lead.clientProfile?.temperature && (
                            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${TEMP_COLORS[lead.clientProfile.temperature] ?? ''}`} style={{ fontSize: '0.65rem' }}>
                              {lead.clientProfile.temperature}
                            </span>
                          )}
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500" style={{ fontSize: '0.65rem' }}>
                            {STAGE_LABEL[lead.stage] ?? lead.stage}
                          </span>
                        </div>
                      </div>

                      {/* Editable email */}
                      <div>
                        <label className="text-xs text-gray-400 font-medium mb-0.5 block">Email (verify before sending)</label>
                        <input
                          className="w-full border border-amber-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          value={ed.email}
                          onChange={e => setEdits(prev => ({ ...prev, [leadKey]: { ...ed, email: e.target.value } }))}
                          placeholder="Enter email address…"
                        />
                      </div>

                      {/* Service / notes snippet */}
                      {(lead.service || lead.notes) && (
                        <p className="text-xs text-gray-500 bg-indigo-50 rounded-lg px-2.5 py-1.5 leading-relaxed line-clamp-2">
                          {lead.service || lead.notes}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => analyzeClient(lead)}
                          className="flex-1 py-2 rounded-lg text-xs font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          🧠 Analyse
                        </button>
                        <button
                          onClick={() => draftEmailForLead(lead)}
                          disabled={draftingFor === leadKey}
                          className="flex-1 py-2 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                          {draftingFor === leadKey ? 'Drafting…' : '✉ Cold Email'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Divider before AI prospects */}
              {discovery && (
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex-1 border-t border-gray-100" />
                  <span className="text-xs text-gray-400 font-medium shrink-0">AI-Recommended Prospects</span>
                  <div className="flex-1 border-t border-gray-100" />
                </div>
              )}
            </div>
          )}

          {!discovery && !discovering && (
            <div className={`bg-white border border-gray-200 rounded-2xl text-center ${leads.length > 0 ? 'p-6' : 'p-16'}`}>
              {leads.length === 0 && <div className="text-5xl mb-4">🎯</div>}
              <h2 className={`font-bold text-gray-900 mb-2 ${leads.length > 0 ? 'text-base' : 'text-xl'}`}>
                {leads.length > 0 ? 'Discover AI-Recommended Prospects' : 'Find Your Ideal Clients'}
              </h2>
              <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
                {leads.length > 0
                  ? 'AI finds new companies matching your skills — with contact details and outreach angles.'
                  : 'Run Skill Assessment, Opportunity Discovery, and Offer Builder first — then click Find Prospects for AI-curated leads with contact details and outreach hooks.'}
              </p>
              <button onClick={runDiscovery} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Find Prospects
              </button>
            </div>
          )}

          {discovering && (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse space-y-3">
                  <div className="flex gap-3"><div className="h-4 bg-gray-100 rounded w-1/2"/><div className="h-4 bg-gray-100 rounded w-1/4 ml-auto"/></div>
                  <div className="h-3 bg-gray-100 rounded w-3/4"/>
                  <div className="h-3 bg-gray-100 rounded w-full"/>
                  <div className="h-8 bg-gray-100 rounded-lg w-full mt-2"/>
                </div>
              ))}
            </div>
          )}

          {discovery && !discovering && (
            <>
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                ⚠ AI-generated — email addresses are estimated patterns. Verify on LinkedIn or company website before sending.
              </div>
              <p className="text-xs text-gray-400 italic">{discovery.searchStrategy}</p>

              <div className="grid md:grid-cols-2 gap-5">
                {discovery.prospects.map(p => {
                  const ed = getEdited(p)
                  return (
                    <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:border-indigo-200 transition-colors">
                      {/* Header badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${SIZE_BADGE[p.companySize] ?? 'bg-gray-100 text-gray-600'}`}>{p.companySize}</span>
                        <span className="text-xs text-gray-400">{p.industry}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-400">{p.region}</span>
                        <span className="ml-auto text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          Priority {p.priorityScore}/10
                        </span>
                      </div>

                      {/* Editable fields */}
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { label: 'Company',      field: 'companyName',  value: ed.companyName,  border: 'border-gray-200' },
                          { label: 'Contact Name', field: 'contactName',  value: ed.contactName,  border: 'border-gray-200' },
                          { label: 'Role',         field: 'contactRole',  value: ed.contactRole,  border: 'border-gray-200' },
                          { label: 'Email (verify)', field: 'email',      value: ed.email,        border: 'border-amber-200' },
                        ] as { label: string; field: keyof EditedProspect; value: string; border: string }[]).map(f => (
                          <div key={f.field}>
                            <label className="text-xs text-gray-400 font-medium">{f.label}</label>
                            <input
                              className={`w-full border ${f.border} rounded-lg px-2 py-1.5 text-sm mt-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400`}
                              value={f.value}
                              onChange={e => setField(p.id, f.field, e.target.value)}
                              placeholder={f.field === 'email' ? p.emailPattern : ''}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Why good fit */}
                      <p className="text-xs text-gray-600 bg-indigo-50 rounded-lg px-3 py-2 leading-relaxed">{p.whyGoodFit}</p>

                      {/* Outreach hook */}
                      <p className="text-xs text-gray-500 italic">Hook: {p.outreachAngle}</p>

                      {/* Verify links */}
                      <div className="flex flex-wrap gap-2">
                        <a href={p.linkedinSearchUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50 transition-colors">
                          LinkedIn Search ↗
                        </a>
                        {p.jobPortalUrls.map(j => (
                          <a key={j.portal} href={j.url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-gray-600 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 transition-colors">
                            {j.portal} ↗
                          </a>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => saveProspect(p)}
                          disabled={savedLeads[p.id]}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${savedLeads[p.id] ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                          {savedLeads[p.id] ? '✓ Saved to CRM' : 'Save to CRM'}
                        </button>
                        <button
                          onClick={() => draftEmail(p)}
                          disabled={draftingFor === p.id}
                          className="flex-1 py-2 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                          {draftingFor === p.id ? 'Drafting…' : '✉ Draft Cold Email'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ANALYSE TAB ───────────────────────────────────────────────────── */}
      {tab === 'analyse' && (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Lead list */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
                <span className="font-semibold text-gray-900 text-sm">Your Leads</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setAddClientForm(EMPTY_ADD); setAddClientErr(''); setAnalyseAfterAdd(true); setShowAddClient(true) }}
                    className="text-xs text-indigo-600 border border-indigo-200 rounded-lg px-2.5 py-1 hover:bg-indigo-50 font-medium transition-colors"
                  >
                    + Add Client
                  </button>
                  <a href="/dashboard/crm" className="text-xs text-gray-400 font-medium hover:underline">CRM →</a>
                </div>
              </div>

              {leadsLoading ? (
                <div className="divide-y divide-gray-50">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="px-5 py-4 animate-pulse">
                      <div className="h-3.5 bg-gray-100 rounded w-2/3 mb-2"/><div className="h-3 bg-gray-100 rounded w-1/2"/>
                    </div>
                  ))}
                </div>
              ) : leads.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">
                  No leads yet.<br/>
                  <a href="/dashboard/crm" className="text-indigo-600 font-medium hover:underline mt-1 inline-block">Add one in CRM →</a>
                  <span className="block mt-1 text-xs">or save a prospect from the Discover tab.</span>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {leads.map(l => (
                    <button
                      key={l.id}
                      onClick={() => analyzeClient(l)}
                      className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors ${selected?.id === l.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="font-medium text-gray-900 text-sm truncate">{l.name}</div>
                        {l.clientProfile?.temperature && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${TEMP_COLORS[l.clientProfile.temperature] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                            {l.clientProfile.temperature}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 truncate">{l.company ?? 'No company'}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400 shrink-0">{STAGE_LABEL[l.stage] ?? l.stage}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Insight panel */}
          <div className="lg:col-span-3 space-y-4">
            {/* Mobile back button — only shown when an insight is visible */}
            {selected && !analysing && (
              <button
                onClick={() => { setSelected(null); setInsight(null); setAnalyseErr('') }}
                className="lg:hidden flex items-center gap-1 text-sm text-indigo-600 font-medium hover:underline"
              >
                ← Back to leads
              </button>
            )}

            {!selected && (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">🧠</div>
                <div className="font-semibold text-gray-700 mb-1">Select a lead to analyse</div>
                <div className="text-gray-400 text-sm max-w-xs mx-auto">AI profiles their buying behaviour, preferred communication style, pricing sensitivity, and outreach strategy</div>
              </div>
            )}

            {selected && analysing && (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3 animate-bounce">🤔</div>
                <div className="font-semibold text-gray-700">Analysing {selected.name}…</div>
                <div className="text-sm text-gray-400 mt-1">Building intelligence profile</div>
              </div>
            )}

            {analyseErr && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{analyseErr}</div>
            )}

            {insight && selected && !analysing && (
              <>
                {/* Temperature + headline */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className={`text-xl font-bold px-4 py-2.5 rounded-xl border shrink-0 ${TEMP_COLORS[insight.clientTemperature]}`}>
                      {insight.clientTemperature}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-lg">{selected.name}</div>
                      <div className="text-gray-500 text-sm">{selected.company ?? insight.companyProfile.name}</div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs">
                        <span className="text-gray-500">Confidence: <strong className="text-indigo-600">{insight.confidence}%</strong></span>
                        <span className="text-gray-500">Comms: <strong className="text-gray-700">{insight.communicationPreference}</strong></span>
                        <span className={`px-2 py-0.5 rounded font-medium ${PSENS_COLOR[insight.pricingSensitivity]}`}>{PSENS_LABEL[insight.pricingSensitivity]}</span>
                      </div>
                    </div>
                    {/* Re-analyse + Send Mail + clear */}
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => analyzeClient(selected)}
                        className="text-xs text-indigo-600 border border-indigo-200 rounded-lg px-2.5 py-1 hover:bg-indigo-50 transition-colors font-medium"
                      >
                        🔄 Re-analyse
                      </button>
                      <button
                        onClick={() => draftEmailForLead(selected)}
                        disabled={draftingFor === `lead-${selected.id}`}
                        className="text-xs text-white bg-indigo-600 border border-indigo-600 rounded-lg px-2.5 py-1 hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {draftingFor === `lead-${selected.id}` ? 'Drafting…' : '✉ Send Mail'}
                      </button>
                      <button
                        onClick={() => { setInsight(null); setSelected(null); setAnalyseErr('') }}
                        className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors"
                      >
                        ← Back
                      </button>
                    </div>
                  </div>
                </div>

                {/* Company profile */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Company Profile</div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Name',     value: insight.companyProfile.name },
                      { label: 'Industry', value: insight.companyProfile.industry },
                      { label: 'Size',     value: insight.companyProfile.size },
                      { label: 'Region',   value: insight.companyProfile.region },
                    ].map(f => (
                      <div key={f.label}>
                        <div className="text-xs text-gray-400">{f.label}</div>
                        <div className="text-sm font-medium text-gray-800 mt-0.5">{f.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decision style */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Decision-Making Style</div>
                  <p className="text-sm text-gray-700">{insight.decisionMakingStyle}</p>
                </div>

                {/* Recommended strategy */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                  <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">Recommended Strategy</div>
                  <p className="text-sm text-indigo-800 leading-relaxed">{insight.recommendedStrategy}</p>
                </div>

                {/* Pricing */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pricing Intelligence</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{insight.pricingRecommendationINR.min.toLocaleString('en-IN')} – ₹{insight.pricingRecommendationINR.max.toLocaleString('en-IN')}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{insight.pricingRecommendationINR.rationale}</p>
                </div>

                {/* Cultural + regional notes */}
                {(insight.culturalNotes.length > 0 || insight.regionExpectations.length > 0) && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 grid md:grid-cols-2 gap-4">
                    {insight.culturalNotes.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Cultural Notes</div>
                        <ul className="space-y-1">
                          {insight.culturalNotes.map((n, i) => <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-yellow-500 shrink-0">◆</span>{n}</li>)}
                        </ul>
                      </div>
                    )}
                    {insight.regionExpectations.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Regional Expectations</div>
                        <ul className="space-y-1">
                          {insight.regionExpectations.map((e, i) => <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-blue-400 shrink-0">◆</span>{e}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Proposal tips */}
                {insight.proposalCustomization.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-6">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Proposal Customization Tips</div>
                    <ul className="space-y-1">
                      {insight.proposalCustomization.map((t, i) => (
                        <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-indigo-400 shrink-0">→</span>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Communication scripts */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Communication Scripts</div>
                  <div className="space-y-4">
                    {[
                      { label: 'Intro',     text: insight.communicationScripts.intro },
                      { label: 'Follow-up', text: insight.communicationScripts.followUp },
                      { label: 'Closing',   text: insight.communicationScripts.closing },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="text-xs font-medium text-gray-500 mb-1">{s.label}</div>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap leading-relaxed">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meeting prep */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Meeting Prep</div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Talking Points</div>
                      <ul className="space-y-1">
                        {insight.meetingPrep.talkingPoints.map((t, i) => (
                          <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-green-500 shrink-0">→</span>{t}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Questions to Ask</div>
                      <ul className="space-y-1">
                        {insight.meetingPrep.questionsToAsk.map((q, i) => (
                          <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-blue-400 shrink-0">?</span>{q}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Likely Objections</div>
                      <div className="space-y-2">
                        {insight.meetingPrep.likelyObjections.map((o, i) => (
                          <div key={i} className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
                            <div className="text-sm font-medium text-red-700">{o.objection}</div>
                            <div className="text-sm text-gray-600 mt-1">{o.response}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Send mail CTA — bottom of analysis */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-indigo-900 text-sm">Ready to reach out?</div>
                    <div className="text-xs text-indigo-600 mt-0.5">AI will draft a personalised email using this analysis</div>
                  </div>
                  <button
                    onClick={() => draftEmailForLead(selected)}
                    disabled={draftingFor === `lead-${selected.id}`}
                    className="shrink-0 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {draftingFor === `lead-${selected.id}` ? 'Drafting…' : '✉ Send Mail'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── EMAIL MODAL ───────────────────────────────────────────────────── */}
      {emailModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setEmailModal(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-gray-900">Cold Email Draft</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  To: <span className="font-medium text-gray-600">{getEdited(emailModal.prospect).email}</span>
                  {' '}· {getEdited(emailModal.prospect).contactName}, {emailModal.prospect.companyName}
                  {emailModal.draft.profileUrl && (
                    <> · <a href={emailModal.draft.profileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">profile link included ↗</a></>
                  )}
                </p>
              </div>
              <button onClick={() => setEmailModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none shrink-0">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Subject</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={emailModal.draft.subject}
                  onChange={e => setEmailModal(m => m ? { ...m, draft: { ...m.draft, subject: e.target.value } } : null)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Body — edit freely before sending</label>
                <textarea
                  rows={14}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  value={emailModal.draft.body}
                  onChange={e => setEmailModal(m => m ? { ...m, draft: { ...m.draft, body: e.target.value } } : null)}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 space-y-3">
              {/* Sender selector — only shown before sending */}
              {!emailModal.draft.sent && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-medium shrink-0">Send via:</span>
                  <div className="flex gap-2">
                    {gmailConnected && (
                      <button
                        onClick={() => setSendVia('gmail')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${sendVia === 'gmail' ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                      >
                        Gmail{gmailEmail ? ` (${gmailEmail.split('@')[0]}@…)` : ''}
                      </button>
                    )}
                    <button
                      onClick={() => setSendVia('resend')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${sendVia === 'resend' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                    >
                      Resend
                    </button>
                  </div>
                  {!gmailConnected && (
                    <a href="/dashboard/connections" className="text-xs text-indigo-600 hover:underline ml-1">Connect Gmail to send from your account →</a>
                  )}
                </div>
              )}

              {/* Send error */}
              {sendError && !emailModal.draft.sent && (
                <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <span className="shrink-0 mt-0.5">✗</span>
                  <div className="flex-1">
                    <span>{sendError}</span>
                    {(sendError.toLowerCase().includes('reconnect') || sendError.toLowerCase().includes('expired')) && (
                      <a href="/dashboard/connections" className="ml-2 underline font-medium">Reconnect Gmail →</a>
                    )}
                  </div>
                  <button onClick={() => setSendError(null)} className="shrink-0 text-red-400 hover:text-red-600 text-lg leading-none">×</button>
                </div>
              )}

              {/* Sent confirmation with tracking info */}
              {emailModal.draft.sent && (
                <div className="flex items-center gap-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <span className="font-medium">✓ Sent via {emailModal.draft.sentVia === 'GMAIL' ? 'Gmail' : 'Resend'}</span>
                  {emailModal.draft.trackingId && (
                    <span className="text-xs text-green-600 border-l border-green-300 pl-3">Open tracking active · check <a href="/dashboard/connections" className="underline">Connections</a> for replies</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap justify-end">
                {emailModal.draft.sent ? (
                  <>
                    <button
                      onClick={() => setEmailModal(m => m ? { ...m, draft: { ...m.draft, sent: false, sentVia: undefined, trackingId: undefined } } : null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      ← Re-edit draft
                    </button>
                    <button
                      onClick={() => setEmailModal(null)}
                      className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      Done
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={copyEmail} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      {copied ? '✓ Copied!' : 'Copy Email'}
                    </button>
                    <a
                      href={`mailto:${getEdited(emailModal.prospect).email}?subject=${encodeURIComponent(emailModal.draft.subject)}&body=${encodeURIComponent(emailModal.draft.body)}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Open in Mail
                    </a>
                    <button
                      onClick={sendEmail}
                      disabled={sendingEmail}
                      className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {sendingEmail ? 'Sending…' : `Send via ${sendVia === 'gmail' ? 'Gmail' : 'Resend'}`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── ADD CLIENT MODAL ──────────────────────────────────────────────── */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) setShowAddClient(false) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Add Client Manually</h2>
                <p className="text-xs text-gray-400 mt-0.5">Save to CRM and optionally analyse with AI immediately</p>
              </div>
              <button onClick={() => setShowAddClient(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <form onSubmit={addClientManually} className="p-6 space-y-3">
              {/* Name + Company */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                  <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={addClientForm.name} onChange={e => setAddClientForm(f => ({ ...f, name: e.target.value }))} placeholder="Contact name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={addClientForm.company} onChange={e => setAddClientForm(f => ({ ...f, company: e.target.value }))} placeholder="Company name" />
                </div>
              </div>

              {/* Contact + Service */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email / Phone</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={addClientForm.contact} onChange={e => setAddClientForm(f => ({ ...f, contact: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Service / Need</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={addClientForm.service} onChange={e => setAddClientForm(f => ({ ...f, service: e.target.value }))} placeholder="What they need" />
                </div>
              </div>

              {/* Source + Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Source</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={addClientForm.source} onChange={e => setAddClientForm(f => ({ ...f, source: e.target.value }))}>
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={addClientForm.priority} onChange={e => setAddClientForm(f => ({ ...f, priority: e.target.value }))}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Follow-up date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Next Follow-up Date</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={addClientForm.followUpDate} onChange={e => setAddClientForm(f => ({ ...f, followUpDate: e.target.value }))} />
              </div>

              {/* LinkedIn + Website */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">LinkedIn URL</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={addClientForm.linkedinUrl} onChange={e => setAddClientForm(f => ({ ...f, linkedinUrl: e.target.value }))} placeholder="https://linkedin.com/in/…" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={addClientForm.website} onChange={e => setAddClientForm(f => ({ ...f, website: e.target.value }))} placeholder="https://…" />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  value={addClientForm.notes} onChange={e => setAddClientForm(f => ({ ...f, notes: e.target.value }))} placeholder="Context about this lead…" />
              </div>

              {addClientErr && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs">{addClientErr}</div>}

              {/* Analyse immediately toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="w-4 h-4 rounded accent-indigo-600"
                  checked={analyseAfterAdd} onChange={e => setAnalyseAfterAdd(e.target.checked)} />
                <span className="text-sm text-gray-700">Analyse with AI immediately after saving</span>
              </label>

              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={addClientSaving || !addClientForm.name.trim()}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                  {addClientSaving ? 'Saving…' : analyseAfterAdd ? 'Save & Analyse' : 'Save to CRM'}
                </button>
                <button type="button" onClick={() => setShowAddClient(false)}
                  className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
