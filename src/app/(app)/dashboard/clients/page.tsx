'use client'

import { useState, useEffect, useRef } from 'react'
import { AgentProgress } from '@/components/AgentProgress'

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

interface EmailMessage {
  id: string
  gmailMessageId: string
  fromEmail: string
  fromName?: string
  toEmail: string
  subject: string
  bodyHtml?: string
  bodyText?: string
  isInbound: boolean
  sentAt: string
}

interface ReplyAttachment {
  id: string; name: string; mimeType: string; size: number; dataBase64: string; preview?: string
}

interface AiSuggestion {
  intent: string; confidence: number; urgency: 'LOW' | 'MEDIUM' | 'HIGH'
  summary: string; suggestedReply: string; tone: string
  communicationTips: string[]; suggestedAttachments: string[]
  nextSteps: string; keyInsight?: string
}

interface EmailThread {
  id: string
  gmailThreadId: string
  leadId?: string | null
  contactEmail: string
  contactName?: string
  subject: string
  status: 'SENT' | 'OPENED' | 'REPLIED' | 'INTERESTED' | 'NEGOTIATING' | 'WON' | 'LOST'
  lastMessageAt: string
  unreadCount: number
  aiInsight?: string
  aiIntent?: string
  messages?: EmailMessage[]
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
  GOT_REPLY:         'Got Reply',
  NEGOTIATING:       'Negotiating',
  WON:               'Won',
  LOST:              'Lost',
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SENT:        { label: 'Sent',        color: 'bg-gray-100 text-gray-600' },
  OPENED:      { label: 'Opened',      color: 'bg-blue-100 text-blue-700' },
  REPLIED:     { label: 'Replied',     color: 'bg-green-100 text-green-700' },
  INTERESTED:  { label: 'Interested',  color: 'bg-indigo-100 text-indigo-700' },
  NEGOTIATING: { label: 'Negotiating', color: 'bg-yellow-100 text-yellow-700' },
  WON:         { label: 'Won',         color: 'bg-emerald-100 text-emerald-700' },
  LOST:        { label: 'Lost',        color: 'bg-red-100 text-red-700' },
}

const INTENT_ICON: Record<string, string> = {
  INTERESTED:     '🔥',
  NEED_QUOTE:     '💰',
  NEED_MEETING:   '📅',
  NEED_SAMPLE:    '🎯',
  NOT_INTERESTED: '❌',
  WRONG_CONTACT:  '🔄',
  OUT_OF_OFFICE:  '🏖️',
  SPAM:           '⚠️',
}

const INTENT_LABEL: Record<string, string> = {
  INTERESTED: 'Interested', NEED_QUOTE: 'Needs Quote', NEED_MEETING: 'Wants Meeting',
  NEED_SAMPLE: 'Wants Sample', NOT_INTERESTED: 'Not Interested', WRONG_CONTACT: 'Wrong Contact',
  OUT_OF_OFFICE: 'Out of Office', SPAM: 'Spam',
}

const URGENCY_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  LOW:    { label: 'Low urgency',    dot: 'bg-green-400',  badge: 'text-green-700 bg-green-50 border-green-200' },
  MEDIUM: { label: 'Medium urgency', dot: 'bg-yellow-400', badge: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  HIGH:   { label: 'High urgency',   dot: 'bg-red-500',    badge: 'text-red-700 bg-red-50 border-red-200' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

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

export default function ClientOutreachPage() {
  const [tab, setTab] = useState<'discover' | 'analyse' | 'outreach'>('discover')

  // ── Discover/Analyse state ────────────────────────────────────────────────
  const [discovery,      setDiscovery]      = useState<DiscoveryResult | null>(null)
  const [discovering,    setDiscovering]    = useState(false)
  const [discoverErr,    setDiscoverErr]    = useState('')
  const [edits,          setEdits]          = useState<Record<string, EditedProspect>>({})
  const [savedLeads,     setSavedLeads]     = useState<Record<string, boolean>>({})
  const [draftingFor,    setDraftingFor]    = useState<string | null>(null)
  const [emailModal,     setEmailModal]     = useState<{ prospect: Prospect; draft: EmailDraft; leadId?: string } | null>(null)
  const [sendingEmail,   setSendingEmail]   = useState(false)
  const [sendError,      setSendError]      = useState<string | null>(null)
  const [copied,         setCopied]         = useState(false)
  const [sendVia,        setSendVia]        = useState<'gmail' | 'resend'>('resend')
  const [gmailConnected, setGmailConnected] = useState(false)
  const [gmailEmail,     setGmailEmail]     = useState<string | null>(null)

  const [leads,          setLeads]          = useState<Lead[]>([])
  const [leadsLoading,   setLeadsLoading]   = useState(true)
  const [selectedLead,   setSelectedLead]   = useState<Lead | null>(null)
  const [insight,        setInsight]        = useState<ClientInsight | null>(null)
  const [analysing,      setAnalysing]      = useState(false)
  const [analyseErr,     setAnalyseErr]     = useState('')

  const [showAddClient,   setShowAddClient]   = useState(false)
  const [addClientForm,   setAddClientForm]   = useState<AddClientForm>(EMPTY_ADD)
  const [addClientSaving, setAddClientSaving] = useState(false)
  const [addClientErr,    setAddClientErr]    = useState('')
  const [analyseAfterAdd, setAnalyseAfterAdd] = useState(false)

  // ── Outreach (Gmail threads) state ────────────────────────────────────────
  const [threads,        setThreads]        = useState<EmailThread[]>([])
  const [threadsLoading, setThreadsLoading] = useState(true)
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null)
  const [threadLoading,  setThreadLoading]  = useState(false)
  const [syncing,        setSyncing]        = useState(false)
  const [threadFilter,   setThreadFilter]   = useState<string>('ALL')
  const [search,         setSearch]         = useState('')
  const [replyBody,      setReplyBody]      = useState('')
  const [replying,       setReplying]       = useState(false)
  const [replyError,     setReplyError]     = useState('')
  const [replySuccess,   setReplySuccess]   = useState(false)
  const [showWoModal,    setShowWoModal]    = useState(false)
  const [woTitle,        setWoTitle]        = useState('')
  const [woCreating,     setWoCreating]     = useState(false)
  const [woSuccess,      setWoSuccess]      = useState<string | null>(null)

  // AI suggestion state
  const [aiSuggestion,  setAiSuggestion]  = useState<AiSuggestion | null>(null)
  const [aiSuggesting,  setAiSuggesting]  = useState(false)
  const [aiSuggestErr,  setAiSuggestErr]  = useState('')
  const [showAiPanel,   setShowAiPanel]   = useState(false)
  // Reply attachments
  const [replyFiles,    setReplyFiles]    = useState<ReplyAttachment[]>([])
  const replyFileInputRef = useRef<HTMLInputElement>(null)

  const autoOpenDone = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadLeads()
    loadThreads()
    fetch('/api/connections')
      .then(r => r.ok ? r.json() : [])
      .then((accounts: { platform: string; accountEmail: string | null }[]) => {
        const gmail = accounts.find(a => a.platform === 'GMAIL')
        if (gmail) { setGmailConnected(true); setGmailEmail(gmail.accountEmail); setSendVia('gmail') }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (autoOpenDone.current || !threads.length) return
    const threadId = new URLSearchParams(window.location.search).get('thread')
    if (!threadId) return
    const match = threads.find(t => t.id === threadId)
    if (match) { autoOpenDone.current = true; setTab('outreach'); openThread(match) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads])

  useEffect(() => {
    if (selectedThread?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      // Auto-trigger AI suggestion when thread loads with inbound messages
      const hasInbound = selectedThread.messages.some(m => m.isInbound)
      if (hasInbound && !aiSuggestion && !aiSuggesting) {
        getAiSuggestion(selectedThread)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThread?.messages])

  // ── Discover functions ────────────────────────────────────────────────────

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

  // ── Analyse functions ─────────────────────────────────────────────────────

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
    setSelectedLead(lead); setInsight(null); setAnalysing(true); setAnalyseErr('')
    try {
      const userPrompt = [
        lead.company   ? `Company: ${lead.company}`      : null,
        lead.name      ? `Contact name: ${lead.name}`    : null,
        lead.contact   ? `Contact info: ${lead.contact}` : null,
        lead.notes     ? `Notes: ${lead.notes}`          : null,
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

  // ── Outreach (Gmail) functions ────────────────────────────────────────────

  async function loadThreads() {
    setThreadsLoading(true)
    try {
      const res = await fetch('/api/email/threads')
      if (res.ok) setThreads(await res.json())
    } finally {
      setThreadsLoading(false)
    }
  }

  async function openThread(thread: EmailThread) {
    setSelectedThread({ ...thread, messages: undefined })
    setReplyBody('')
    setReplyError('')
    setReplySuccess(false)
    setReplyFiles([])
    setAiSuggestion(null)
    setAiSuggestErr('')
    setShowAiPanel(false)
    setThreadLoading(true)
    try {
      const res = await fetch(`/api/email/threads/${thread.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelectedThread(data)
        setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, unreadCount: 0 } : t))
      }
    } finally {
      setThreadLoading(false)
    }
  }

  async function syncNow() {
    setSyncing(true)
    try {
      await fetch('/api/gmail/sync')
      await loadThreads()
    } finally {
      setSyncing(false)
    }
  }

  async function sendReply() {
    if (!selectedThread || !replyBody.trim()) return
    setReplying(true)
    setReplyError('')
    setReplySuccess(false)
    try {
      const res = await fetch(`/api/email/threads/${selectedThread.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: replyBody,
          attachments: replyFiles.map(f => ({
            filename: f.name,
            mimeType: f.mimeType,
            dataBase64: f.dataBase64,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setReplyError(data.error?.message ?? 'Reply failed')
        return
      }
      setReplySuccess(true)
      setReplyBody('')
      setReplyFiles([])
      setAiSuggestion(null)
      setShowAiPanel(false)
      const refreshed = await fetch(`/api/email/threads/${selectedThread.id}`)
      if (refreshed.ok) setSelectedThread(await refreshed.json())
    } finally {
      setReplying(false)
    }
  }

  async function getAiSuggestion(thread: EmailThread) {
    setAiSuggesting(true)
    setAiSuggestErr('')
    try {
      const res = await fetch(`/api/email/threads/${thread.id}/ai-suggest`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setAiSuggestErr(data.error?.message ?? 'AI analysis failed'); return }
      setAiSuggestion(data)
      setShowAiPanel(true)
    } catch {
      setAiSuggestErr('Could not reach AI — please try again')
    } finally {
      setAiSuggesting(false)
    }
  }

  function readFileBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleAttachFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) { setReplyError(`${file.name} is over 10 MB`); continue }
      const dataBase64 = await readFileBase64(file)
      const preview = file.type.startsWith('image/') ? `data:${file.type};base64,${dataBase64}` : undefined
      setReplyFiles(prev => [...prev, {
        id: Math.random().toString(36).slice(2),
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        dataBase64,
        preview,
      }])
    }
    e.target.value = ''
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function openWoModal(thread: EmailThread) {
    setWoTitle(`Work for ${thread.contactName || thread.contactEmail}`)
    setWoSuccess(null)
    setShowWoModal(true)
  }

  async function createWorkOrder() {
    if (!selectedThread || !woTitle.trim()) return
    setWoCreating(true)
    try {
      const wsRes = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: woTitle.trim() }),
      })
      if (!wsRes.ok) return
      const ws = await wsRes.json()
      await fetch(`/api/workspace/${ws.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedThread.subject,
          description: selectedThread.aiInsight
            ? `Client: ${selectedThread.contactEmail}\n\nAI Insight: ${selectedThread.aiInsight}`
            : `Client: ${selectedThread.contactEmail}`,
        }),
      })
      setWoSuccess(ws.id)
      let resolvedLeadId = selectedThread.leadId ?? null
      if (!resolvedLeadId && selectedThread.contactEmail) {
        try {
          const leadsRes = await fetch('/api/leads')
          if (leadsRes.ok) {
            const allLeads: { id: string; contact?: string }[] = await leadsRes.json()
            const match = allLeads.find(l =>
              l.contact && l.contact.toLowerCase().includes(selectedThread!.contactEmail.toLowerCase())
            )
            resolvedLeadId = match?.id ?? null
          }
        } catch { /* non-critical */ }
      }
      if (resolvedLeadId) {
        await fetch(`/api/leads/${resolvedLeadId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: 'WON' }),
        }).catch(() => {})
      }
    } finally {
      setWoCreating(false)
    }
  }

  async function updateStatus(threadId: string, status: string) {
    await fetch(`/api/email/threads/${threadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, status: status as EmailThread['status'] } : t))
    if (selectedThread?.id === threadId) setSelectedThread(s => s ? { ...s, status: status as EmailThread['status'] } : null)
  }

  const q = search.trim().toLowerCase()
  const filteredThreads = threads
    .filter(t =>
      threadFilter === 'ALL'    ? true :
      threadFilter === 'UNREAD' ? t.unreadCount > 0 :
      t.status === threadFilter
    )
    .filter(t =>
      !q ||
      (t.contactName?.toLowerCase().includes(q)) ||
      t.contactEmail.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q)
    )

  const threadStats = {
    total:      threads.length,
    replied:    threads.filter(t => ['REPLIED', 'INTERESTED', 'NEGOTIATING', 'WON'].includes(t.status)).length,
    interested: threads.filter(t => ['INTERESTED', 'NEGOTIATING'].includes(t.status)).length,
    won:        threads.filter(t => t.status === 'WON').length,
    unread:     threads.reduce((s, t) => s + t.unreadCount, 0),
  }
  const replyRate = threadStats.total > 0 ? Math.round((threadStats.replied / threadStats.total) * 100) : 0

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Client Outreach</h1>
        <p className="text-gray-500 mt-1">Discover prospects, analyse leads, and track email conversations — powered by AI.</p>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
        {(['discover', 'analyse', 'outreach'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'discover' ? '🔍 Discover' : t === 'analyse' ? '🧠 Analyse' : '📧 Outreach'}
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
                  const leadKey = `lead-${lead.id}`
                  const ed = edits[leadKey] ?? { companyName: lead.company ?? '', contactName: lead.name, contactRole: '', email: extractEmail(lead.contact ?? '') }
                  return (
                    <div key={lead.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:border-indigo-200 transition-colors">
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

                      <div>
                        <label className="text-xs text-gray-400 font-medium mb-0.5 block">Email (verify before sending)</label>
                        <input
                          className="w-full border border-amber-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          value={ed.email}
                          onChange={e => setEdits(prev => ({ ...prev, [leadKey]: { ...ed, email: e.target.value } }))}
                          placeholder="Enter email address…"
                        />
                      </div>

                      {(lead.service || lead.notes) && (
                        <p className="text-xs text-gray-500 bg-indigo-50 rounded-lg px-2.5 py-1.5 leading-relaxed line-clamp-2">
                          {lead.service || lead.notes}
                        </p>
                      )}

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
            <AgentProgress agentType="CLIENT_DISCOVERY" label="Searching for high-fit prospect companies…" />
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${SIZE_BADGE[p.companySize] ?? 'bg-gray-100 text-gray-600'}`}>{p.companySize}</span>
                        <span className="text-xs text-gray-400">{p.industry}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-400">{p.region}</span>
                        <span className="ml-auto text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          Priority {p.priorityScore}/10
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { label: 'Company',        field: 'companyName', value: ed.companyName, border: 'border-gray-200' },
                          { label: 'Contact Name',   field: 'contactName', value: ed.contactName, border: 'border-gray-200' },
                          { label: 'Role',           field: 'contactRole', value: ed.contactRole, border: 'border-gray-200' },
                          { label: 'Email (verify)', field: 'email',       value: ed.email,       border: 'border-amber-200' },
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

                      <p className="text-xs text-gray-600 bg-indigo-50 rounded-lg px-3 py-2 leading-relaxed">{p.whyGoodFit}</p>
                      <p className="text-xs text-gray-500 italic">Hook: {p.outreachAngle}</p>

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
                      className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors ${selectedLead?.id === l.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}
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

          <div className="lg:col-span-3 space-y-4">
            {selectedLead && !analysing && (
              <button
                onClick={() => { setSelectedLead(null); setInsight(null); setAnalyseErr('') }}
                className="lg:hidden flex items-center gap-1 text-sm text-indigo-600 font-medium hover:underline"
              >
                ← Back to leads
              </button>
            )}

            {!selectedLead && (
              <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">🧠</div>
                <div className="font-semibold text-gray-700 mb-1">Select a lead to analyse</div>
                <div className="text-gray-400 text-sm max-w-xs mx-auto">AI profiles their buying behaviour, preferred communication style, pricing sensitivity, and outreach strategy</div>
              </div>
            )}

            {selectedLead && analysing && (
              <AgentProgress agentType="CLIENT_INTELLIGENCE" label={`Building intelligence profile for ${selectedLead.name}…`} />
            )}

            {analyseErr && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{analyseErr}</div>
            )}

            {insight && selectedLead && !analysing && (
              <>
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className={`text-xl font-bold px-4 py-2.5 rounded-xl border shrink-0 ${TEMP_COLORS[insight.clientTemperature]}`}>
                      {insight.clientTemperature}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-lg">{selectedLead.name}</div>
                      <div className="text-gray-500 text-sm">{selectedLead.company ?? insight.companyProfile.name}</div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs">
                        <span className="text-gray-500">Confidence: <strong className="text-indigo-600">{insight.confidence}%</strong></span>
                        <span className="text-gray-500">Comms: <strong className="text-gray-700">{insight.communicationPreference}</strong></span>
                        <span className={`px-2 py-0.5 rounded font-medium ${PSENS_COLOR[insight.pricingSensitivity]}`}>{PSENS_LABEL[insight.pricingSensitivity]}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button onClick={() => analyzeClient(selectedLead)} className="text-xs text-indigo-600 border border-indigo-200 rounded-lg px-2.5 py-1 hover:bg-indigo-50 transition-colors font-medium">
                        🔄 Re-analyse
                      </button>
                      <button onClick={() => draftEmailForLead(selectedLead)} disabled={draftingFor === `lead-${selectedLead.id}`}
                        className="text-xs text-white bg-indigo-600 border border-indigo-600 rounded-lg px-2.5 py-1 hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50">
                        {draftingFor === `lead-${selectedLead.id}` ? 'Drafting…' : '✉ Send Mail'}
                      </button>
                      <button onClick={() => { setInsight(null); setSelectedLead(null); setAnalyseErr('') }}
                        className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors">
                        ← Back
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Company Profile</div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Name', value: insight.companyProfile.name },
                      { label: 'Industry', value: insight.companyProfile.industry },
                      { label: 'Size', value: insight.companyProfile.size },
                      { label: 'Region', value: insight.companyProfile.region },
                    ].map(f => (
                      <div key={f.label}>
                        <div className="text-xs text-gray-400">{f.label}</div>
                        <div className="text-sm font-medium text-gray-800 mt-0.5">{f.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Decision-Making Style</div>
                  <p className="text-sm text-gray-700">{insight.decisionMakingStyle}</p>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                  <div className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">Recommended Strategy</div>
                  <p className="text-sm text-indigo-800 leading-relaxed">{insight.recommendedStrategy}</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pricing Intelligence</div>
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{insight.pricingRecommendationINR.min.toLocaleString('en-IN')} – ₹{insight.pricingRecommendationINR.max.toLocaleString('en-IN')}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{insight.pricingRecommendationINR.rationale}</p>
                </div>

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

                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Communication Scripts</div>
                  <div className="space-y-4">
                    {[
                      { label: 'Intro', text: insight.communicationScripts.intro },
                      { label: 'Follow-up', text: insight.communicationScripts.followUp },
                      { label: 'Closing', text: insight.communicationScripts.closing },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="text-xs font-medium text-gray-500 mb-1">{s.label}</div>
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap leading-relaxed">{s.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

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

                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-indigo-900 text-sm">Ready to reach out?</div>
                    <div className="text-xs text-indigo-600 mt-0.5">AI will draft a personalised email using this analysis</div>
                  </div>
                  <button
                    onClick={() => draftEmailForLead(selectedLead)}
                    disabled={draftingFor === `lead-${selectedLead.id}`}
                    className="shrink-0 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {draftingFor === `lead-${selectedLead.id}` ? 'Drafting…' : '✉ Send Mail'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── OUTREACH TAB ──────────────────────────────────────────────────── */}
      {tab === 'outreach' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="grid grid-cols-5 gap-3 flex-1">
              {[
                { label: 'Emails Sent', value: threadStats.total,      color: 'text-gray-900' },
                { label: 'Replies',     value: threadStats.replied,    color: 'text-green-700' },
                { label: 'Reply Rate',  value: replyRate + '%',        color: 'text-indigo-700' },
                { label: 'Interested',  value: threadStats.interested, color: 'text-orange-700' },
                { label: 'Won',         value: threadStats.won,        color: 'text-emerald-700' },
              ].map(s => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <button
              onClick={syncNow}
              disabled={syncing}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
            >
              {syncing ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              ) : '🔄'} {syncing ? 'Syncing…' : 'Sync Gmail'}
            </button>
          </div>

          <div className="grid lg:grid-cols-5 gap-4" style={{ height: 'calc(100vh - 340px)', minHeight: '500px' }}>
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-3 pt-3 pb-2">
                <div className="relative">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, email or subject…"
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="px-4 pb-3 border-b border-gray-100 flex gap-1.5 flex-wrap">
                {['ALL', 'UNREAD', 'REPLIED', 'INTERESTED', 'WON', 'LOST'].map(f => (
                  <button key={f} onClick={() => setThreadFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${threadFilter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {f === 'UNREAD' && threadStats.unread > 0 ? `Unread (${threadStats.unread})` : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                {threadsLoading ? (
                  [1,2,3].map(i => (
                    <div key={i} className="px-4 py-4 animate-pulse">
                      <div className="h-3.5 bg-gray-100 rounded w-2/3 mb-2"/>
                      <div className="h-3 bg-gray-100 rounded w-1/2"/>
                    </div>
                  ))
                ) : filteredThreads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="text-4xl mb-3">📭</div>
                    <div className="font-medium text-gray-700 text-sm">No threads yet</div>
                    <div className="text-xs text-gray-400 mt-1">Send emails from the Discover tab to start tracking</div>
                  </div>
                ) : filteredThreads.map(thread => (
                  <button
                    key={thread.id}
                    onClick={() => openThread(thread)}
                    className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${selectedThread?.id === thread.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <div className={`flex-1 min-w-0 text-sm font-medium text-gray-900 truncate ${thread.unreadCount > 0 ? 'font-semibold' : ''}`}>
                        {thread.contactName || thread.contactEmail}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {thread.unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-indigo-600"/>}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_CONFIG[thread.status]?.color}`}>
                          {STATUS_CONFIG[thread.status]?.label}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 truncate mb-1">{thread.subject}</div>
                    <div className="flex items-center justify-between gap-2">
                      {thread.aiIntent && (
                        <span className="text-xs text-gray-400">{INTENT_ICON[thread.aiIntent]} {thread.aiIntent.replace(/_/g, ' ').toLowerCase()}</span>
                      )}
                      <span className="text-xs text-gray-300 ml-auto">{timeAgo(thread.lastMessageAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden">
              {!selectedThread ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="text-4xl mb-3">💬</div>
                  <div className="font-semibold text-gray-700">Select a conversation</div>
                  <div className="text-sm text-gray-400 mt-1">Click any thread to read the full conversation</div>
                </div>
              ) : (
                <>
                  <div className="px-5 py-4 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{selectedThread.contactName || selectedThread.contactEmail}</div>
                        <div className="text-xs text-gray-400 mt-0.5 truncate">{selectedThread.contactEmail} · {selectedThread.subject}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={selectedThread.status}
                          onChange={e => updateStatus(selectedThread.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-lg border font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 ${STATUS_CONFIG[selectedThread.status]?.color}`}
                        >
                          {Object.entries(STATUS_CONFIG).map(([v, { label }]) => (
                            <option key={v} value={v}>{label}</option>
                          ))}
                        </select>
                        <button onClick={() => openWoModal(selectedThread)}
                          className="text-xs text-emerald-700 border border-emerald-200 rounded-lg px-2 py-1 hover:bg-emerald-50 transition-colors font-medium">
                          + Work Order
                        </button>
                        <a href="/dashboard/crm" className="text-xs text-indigo-600 border border-indigo-200 rounded-lg px-2 py-1 hover:bg-indigo-50 transition-colors">
                          CRM →
                        </a>
                      </div>
                    </div>
                    {selectedThread.aiInsight && (
                      <div className="mt-2 text-xs text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2 flex items-start gap-2">
                        <span className="shrink-0">🧠</span>
                        <span>{selectedThread.aiInsight}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {threadLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-2xl animate-bounce mb-2">💬</div>
                          <div className="text-sm text-gray-400">Loading conversation…</div>
                        </div>
                      </div>
                    ) : selectedThread.messages?.length === 0 ? (
                      <div className="text-center text-sm text-gray-400 py-8">No messages stored yet. Click &quot;Sync Gmail&quot; to fetch them.</div>
                    ) : selectedThread.messages?.map(msg => (
                      <div key={msg.id} className={`flex ${msg.isInbound ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.isInbound ? 'bg-gray-100 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none'}`}>
                          <div className={`text-xs mb-1.5 font-medium ${msg.isInbound ? 'text-gray-500' : 'text-indigo-200'}`}>
                            {msg.isInbound ? (msg.fromName || msg.fromEmail) : 'You'} · {timeAgo(msg.sentAt)}
                          </div>
                          {msg.bodyHtml ? (
                            <div
                              className={`text-sm prose prose-sm max-w-none ${msg.isInbound ? 'text-gray-800' : 'text-white prose-invert'}`}
                              dangerouslySetInnerHTML={{ __html: msg.bodyHtml.slice(0, 5000) }}
                            />
                          ) : (
                            <div className={`text-sm whitespace-pre-wrap ${msg.isInbound ? 'text-gray-800' : 'text-white'}`}>
                              {msg.bodyText || '(empty)'}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef}/>
                  </div>

                  {/* ── AI Suggestion Panel ────────────────────────────────── */}
                  {(aiSuggesting || aiSuggestion || aiSuggestErr) && (
                    <div className="border-t border-gray-100">
                      {aiSuggesting && (
                        <div className="px-4 py-3 flex items-center gap-2.5 text-xs text-indigo-600 bg-indigo-50/60">
                          <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                          </svg>
                          <span>AI is analyzing the conversation and crafting a smart reply…</span>
                        </div>
                      )}

                      {aiSuggestErr && !aiSuggesting && (
                        <div className="px-4 py-2 flex items-center justify-between text-xs text-red-600 bg-red-50">
                          <span>⚠ {aiSuggestErr}</span>
                          <div className="flex gap-2">
                            <button onClick={() => selectedThread && getAiSuggestion(selectedThread)} className="underline font-medium">Retry</button>
                            <button onClick={() => setAiSuggestErr('')} className="text-red-400 hover:text-red-600">×</button>
                          </div>
                        </div>
                      )}

                      {aiSuggestion && !aiSuggesting && (
                        <div className="bg-gradient-to-b from-indigo-50/80 to-white">
                          {/* Suggestion header — always visible */}
                          <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-indigo-800">✨ AI Reply Intelligence</span>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700">
                                {INTENT_ICON[aiSuggestion.intent]} {INTENT_LABEL[aiSuggestion.intent] ?? aiSuggestion.intent}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${URGENCY_CONFIG[aiSuggestion.urgency]?.badge ?? ''}`}>
                                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${URGENCY_CONFIG[aiSuggestion.urgency]?.dot ?? ''}`}/>
                                {URGENCY_CONFIG[aiSuggestion.urgency]?.label ?? aiSuggestion.urgency}
                              </span>
                              <span className="text-xs text-gray-400">{aiSuggestion.confidence}% confidence</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button onClick={() => selectedThread && getAiSuggestion(selectedThread)} disabled={aiSuggesting}
                                className="text-xs text-indigo-500 hover:text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 transition-colors">
                                ↺ Refresh
                              </button>
                              <button onClick={() => setShowAiPanel(v => !v)}
                                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                                {showAiPanel ? '↑ Hide' : '↓ Show'}
                              </button>
                            </div>
                          </div>

                          <div className="px-4 pb-1">
                            <p className="text-xs text-indigo-700 bg-indigo-100/70 rounded-lg px-3 py-1.5 leading-relaxed">
                              💬 {aiSuggestion.summary}
                            </p>
                          </div>

                          {showAiPanel && (
                            <div className="px-4 pb-3 space-y-3 mt-1">
                              {/* Suggested Reply Draft */}
                              <div className="bg-white border border-indigo-100 rounded-xl overflow-hidden shadow-sm">
                                <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 border-b border-indigo-100">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-indigo-800">Suggested Reply</span>
                                    <span className="text-xs text-indigo-500 bg-white border border-indigo-200 px-2 py-0.5 rounded-full">{aiSuggestion.tone}</span>
                                  </div>
                                  <button
                                    onClick={() => setReplyBody(aiSuggestion.suggestedReply)}
                                    className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                  >
                                    Use Draft ↓
                                  </button>
                                </div>
                                <div className="px-3 py-2.5 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                                  {aiSuggestion.suggestedReply}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                {/* Communication Tips */}
                                {aiSuggestion.communicationTips.length > 0 && (
                                  <div className="bg-white border border-gray-200 rounded-xl p-3">
                                    <div className="text-xs font-semibold text-gray-600 mb-2">💡 Communication Tips</div>
                                    <ul className="space-y-1">
                                      {aiSuggestion.communicationTips.map((tip, i) => (
                                        <li key={i} className="text-xs text-gray-600 flex gap-1.5 leading-relaxed">
                                          <span className="text-indigo-400 shrink-0 mt-0.5">→</span>{tip}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Suggested Attachments + Next Steps */}
                                <div className="space-y-2">
                                  {aiSuggestion.suggestedAttachments.length > 0 && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-3">
                                      <div className="text-xs font-semibold text-gray-600 mb-2">📎 Suggested to Attach</div>
                                      <ul className="space-y-1">
                                        {aiSuggestion.suggestedAttachments.map((att, i) => (
                                          <li key={i} className="text-xs text-gray-600 flex gap-1.5 leading-relaxed">
                                            <span className="text-amber-500 shrink-0 mt-0.5">◆</span>{att}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                                    <div className="text-xs font-semibold text-emerald-700 mb-1">🎯 Next Step</div>
                                    <p className="text-xs text-emerald-800 leading-relaxed">{aiSuggestion.nextSteps}</p>
                                  </div>
                                  {aiSuggestion.keyInsight && (
                                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                      <div className="text-xs font-semibold text-amber-700 mb-1">🔑 Key Insight</div>
                                      <p className="text-xs text-amber-800 leading-relaxed">{aiSuggestion.keyInsight}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Compose Area ──────────────────────────────────────────── */}
                  <div className="px-4 py-3 border-t border-gray-100 space-y-2 bg-white">
                    {replySuccess && (
                      <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                        <span className="text-green-500">✓</span> Reply sent via Gmail
                        {!aiSuggestion && selectedThread && (
                          <button onClick={() => selectedThread && getAiSuggestion(selectedThread)}
                            className="ml-auto text-indigo-600 hover:underline font-medium">Get AI tips for next reply →</button>
                        )}
                      </div>
                    )}
                    {replyError && (
                      <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center justify-between">
                        <span>{replyError}</span>
                        <button onClick={() => setReplyError('')} className="text-red-400 ml-2">×</button>
                      </div>
                    )}

                    {/* Attachment chips */}
                    {replyFiles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 px-1">
                        {replyFiles.map(f => (
                          <div key={f.id} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-1 text-xs text-indigo-700 max-w-[180px]">
                            {f.preview ? (
                              <img src={f.preview} alt={f.name} className="w-5 h-5 rounded object-cover shrink-0"/>
                            ) : (
                              <span className="shrink-0">
                                {f.mimeType.includes('pdf') ? '📄' : f.mimeType.includes('word') || f.mimeType.includes('document') ? '📝' : '📎'}
                              </span>
                            )}
                            <span className="truncate font-medium">{f.name}</span>
                            <span className="text-indigo-400 shrink-0">{formatBytes(f.size)}</span>
                            <button onClick={() => setReplyFiles(prev => prev.filter(r => r.id !== f.id))}
                              className="shrink-0 text-indigo-400 hover:text-red-500 transition-colors ml-0.5">×</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Textarea */}
                    <div className="relative">
                      <textarea
                        rows={4}
                        value={replyBody}
                        onChange={e => setReplyBody(e.target.value)}
                        placeholder={aiSuggestion ? 'Click "Use Draft ↓" above to fill this, or write your own reply…' : 'Write your reply… (⌘↵ to send)'}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none placeholder:text-gray-400"
                        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendReply() }}
                      />
                      {replyBody && (
                        <span className="absolute bottom-2 right-3 text-xs text-gray-300 pointer-events-none">
                          {replyBody.length} chars
                        </span>
                      )}
                    </div>

                    {/* Toolbar row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* Attach files */}
                        <input ref={replyFileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="hidden" onChange={handleAttachFiles}/>
                        <button onClick={() => replyFileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                          title="Attach files (images, PDF, Word, Excel, PPT)">
                          <span>📎</span> Attach
                        </button>
                        {/* AI Suggest */}
                        {!aiSuggesting && (
                          <button onClick={() => selectedThread && getAiSuggestion(selectedThread)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                            title="Get AI reply suggestion based on conversation">
                            <span>✨</span> AI Suggest
                          </button>
                        )}
                        {aiSuggesting && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-500 border border-indigo-200 rounded-lg bg-indigo-50">
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                            </svg>
                            Analyzing…
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {replyFiles.length > 0 && (
                          <span className="text-xs text-gray-400">{replyFiles.length} file{replyFiles.length > 1 ? 's' : ''}</span>
                        )}
                        <button onClick={sendReply} disabled={replying || !replyBody.trim()}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors">
                          {replying ? (
                            <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Sending…</>
                          ) : (
                            <>Send Reply <span className="opacity-70">⌘↵</span></>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
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
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={emailModal.draft.subject}
                  onChange={e => setEmailModal(m => m ? { ...m, draft: { ...m.draft, subject: e.target.value } } : null)} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Body — edit freely before sending</label>
                <textarea rows={14} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  value={emailModal.draft.body}
                  onChange={e => setEmailModal(m => m ? { ...m, draft: { ...m.draft, body: e.target.value } } : null)} />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 space-y-3">
              {!emailModal.draft.sent && (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-medium shrink-0">Send via:</span>
                  <div className="flex gap-2">
                    {gmailConnected && (
                      <button onClick={() => setSendVia('gmail')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${sendVia === 'gmail' ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                        Gmail{gmailEmail ? ` (${gmailEmail.split('@')[0]}@…)` : ''}
                      </button>
                    )}
                    <button onClick={() => setSendVia('resend')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${sendVia === 'resend' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      Resend
                    </button>
                  </div>
                  {!gmailConnected && (
                    <a href="/dashboard/connections" className="text-xs text-indigo-600 hover:underline ml-1">Connect Gmail to send from your account →</a>
                  )}
                </div>
              )}

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
                    <button onClick={() => setEmailModal(m => m ? { ...m, draft: { ...m.draft, sent: false, sentVia: undefined, trackingId: undefined } } : null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      ← Re-edit draft
                    </button>
                    <button onClick={() => setEmailModal(null)}
                      className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                      Done
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={copyEmail} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      {copied ? '✓ Copied!' : 'Copy Email'}
                    </button>
                    <a href={`mailto:${getEdited(emailModal.prospect).email}?subject=${encodeURIComponent(emailModal.draft.subject)}&body=${encodeURIComponent(emailModal.draft.body)}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      Open in Mail
                    </a>
                    <button onClick={sendEmail} disabled={sendingEmail}
                      className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50">
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
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Next Follow-up Date</label>
                <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={addClientForm.followUpDate} onChange={e => setAddClientForm(f => ({ ...f, followUpDate: e.target.value }))} />
              </div>
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
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  value={addClientForm.notes} onChange={e => setAddClientForm(f => ({ ...f, notes: e.target.value }))} placeholder="Context about this lead…" />
              </div>
              {addClientErr && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs">{addClientErr}</div>}
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

      {/* ── WORK ORDER MODAL ──────────────────────────────────────────────── */}
      {showWoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Create Work Order</h2>
              <button onClick={() => { setShowWoModal(false); setWoSuccess(null) }} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>
            {woSuccess ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm font-medium">
                  ✓ Work order created successfully
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => { setShowWoModal(false); setWoSuccess(null) }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Close</button>
                  <a href="/dashboard/workspace" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl font-medium hover:bg-indigo-700">View in Work Support →</a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Work Order Title</label>
                  <input type="text" value={woTitle} onChange={e => setWoTitle(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="e.g. Work for Acme Corp" autoFocus />
                </div>
                {selectedThread && (
                  <div className="bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-500 space-y-1">
                    <div><span className="font-medium">Client:</span> {selectedThread.contactName || selectedThread.contactEmail}</div>
                    <div><span className="font-medium">Subject:</span> {selectedThread.subject}</div>
                    {selectedThread.aiInsight && <div><span className="font-medium">AI Insight:</span> {selectedThread.aiInsight}</div>}
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowWoModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                  <button onClick={createWorkOrder} disabled={woCreating || !woTitle.trim()}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50">
                    {woCreating ? 'Creating…' : 'Create Work Order'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
