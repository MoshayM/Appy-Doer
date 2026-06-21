'use client'

import { useState, useEffect, useMemo } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

const STAGES = ['LEAD_IDENTIFIED', 'CONTACTED', 'INTERESTED', 'PROPOSAL_SENT', 'WON', 'LOST'] as const
type LeadStage = typeof STAGES[number]

interface Interaction {
  id: string
  type: string
  note: string
  date: string
}

interface LeadArtifacts {
  source?: string
  priority?: string
  followUpDate?: string
  linkedinUrl?: string
  website?: string
  interactions?: Interaction[]
  [key: string]: unknown
}

interface Lead {
  id: string
  name: string
  company?: string
  contact?: string
  service?: string
  notes?: string
  stage: LeadStage
  lastActivityAt: string
  artifacts?: LeadArtifacts | null
  clientProfile?: { temperature: string } | null
}

type LeadForm = {
  name: string; company: string; contact: string; service: string; notes: string
  source: string; priority: string; followUpDate: string; linkedinUrl: string; website: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<LeadStage, string> = {
  LEAD_IDENTIFIED: 'Lead Identified',
  CONTACTED:       'Contacted',
  INTERESTED:      'Interested',
  PROPOSAL_SENT:   'Proposal Sent',
  WON:             'Won',
  LOST:            'Lost',
}

const STAGE_COLOR: Record<LeadStage, string> = {
  LEAD_IDENTIFIED: 'text-gray-500',
  CONTACTED:       'text-blue-600',
  INTERESTED:      'text-indigo-600',
  PROPOSAL_SENT:   'text-purple-600',
  WON:             'text-green-600',
  LOST:            'text-red-500',
}

const TEMP_COLORS: Record<string, string> = {
  COLD: 'text-blue-600 bg-blue-50 border-blue-200',
  WARM: 'text-amber-600 bg-amber-50 border-amber-200',
  HOT:  'text-red-600 bg-red-50 border-red-200',
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH:   'text-red-600 bg-red-50',
  MEDIUM: 'text-amber-600 bg-amber-50',
  LOW:    'text-gray-500 bg-gray-100',
}

const SOURCES = ['LinkedIn', 'Referral', 'Cold Outreach', 'Job Board', 'Social Media', 'Website', 'Event', 'Client Intelligence', 'Manual', 'Other']
const PRIORITIES = ['HIGH', 'MEDIUM', 'LOW']
const INTERACTION_TYPES = ['Note', 'Call', 'Email', 'Meeting', 'WhatsApp', 'Follow-up']

const EMPTY_FORM: LeadForm = {
  name: '', company: '', contact: '', service: '', notes: '',
  source: '', priority: 'MEDIUM', followUpDate: '', linkedinUrl: '', website: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function followUpBadge(date?: string): { label: string; color: string } | null {
  if (!date) return null
  const now  = new Date()
  const due  = new Date(date)
  const days = Math.round((due.getTime() - now.getTime()) / 86400000)
  if (days < 0)  return { label: `Overdue ${Math.abs(days)}d`, color: 'bg-red-100 text-red-700' }
  if (days === 0) return { label: 'Due today',                  color: 'bg-orange-100 text-orange-700' }
  if (days <= 3)  return { label: `Due in ${days}d`,             color: 'bg-amber-100 text-amber-700' }
  return { label: `Follow up ${due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`, color: 'bg-gray-100 text-gray-500' }
}

function timeAgo(dt: string) {
  const s = Math.floor((Date.now() - new Date(dt).getTime()) / 1000)
  if (s < 60)    return 'just now'
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

// ─── Lead form fields ─────────────────────────────────────────────────────────

function LeadFormFields({ form, onChange }: { form: LeadForm; onChange: (f: LeadForm) => void }) {
  const set = (field: keyof LeadForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    onChange({ ...form, [field]: e.target.value })

  return (
    <div className="space-y-3">
      {/* Row 1 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
          <input required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.name} onChange={set('name')} placeholder="Contact name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.company} onChange={set('company')} placeholder="Company name" />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Contact (email / phone)</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.contact} onChange={set('contact')} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Service / Project</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.service} onChange={set('service')} placeholder="What they need" />
        </div>
      </div>

      {/* Row 3 — Source + Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Source</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.source} onChange={set('source')}>
            <option value="">Select source…</option>
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Row 4 — Follow-up date */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Next Follow-up Date</label>
        <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={form.followUpDate} onChange={set('followUpDate')} />
      </div>

      {/* Row 5 — Links */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">LinkedIn URL</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/…" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.website} onChange={set('website')} placeholder="https://…" />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
        <textarea rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          value={form.notes} onChange={set('notes')} placeholder="Any context about this lead…" />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CRMPage() {
  const [leads,      setLeads]      = useState<Lead[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')

  // Add modal
  const [showAdd,    setShowAdd]    = useState(false)
  const [addForm,    setAddForm]    = useState<LeadForm>(EMPTY_FORM)

  // Edit modal
  const [editLead,   setEditLead]   = useState<Lead | null>(null)
  const [editForm,   setEditForm]   = useState<LeadForm>(EMPTY_FORM)

  // Delete confirm
  const [deleteId,   setDeleteId]   = useState<string | null>(null)

  // Detail drawer
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null)
  const [noteType,   setNoteType]   = useState('Note')
  const [noteText,   setNoteText]   = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    loadLeads()
  }, [])

  async function loadLeads() {
    const res = await fetch('/api/leads')
    const data = await res.json()
    setLeads(data)
    setLoading(false)
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async function addLead(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res  = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    })
    const lead = await res.json()
    setLeads(prev => [lead, ...prev])
    setAddForm(EMPTY_FORM)
    setShowAdd(false)
    setSaving(false)
  }

  function openEdit(lead: Lead) {
    const a = lead.artifacts ?? {}
    setEditLead(lead)
    setEditForm({
      name:        lead.name,
      company:     lead.company    ?? '',
      contact:     lead.contact    ?? '',
      service:     lead.service    ?? '',
      notes:       lead.notes      ?? '',
      source:      (a.source      as string) ?? '',
      priority:    (a.priority    as string) ?? 'MEDIUM',
      followUpDate:(a.followUpDate as string) ?? '',
      linkedinUrl: (a.linkedinUrl as string) ?? '',
      website:     (a.website     as string) ?? '',
    })
  }

  async function saveLead(e: React.FormEvent) {
    e.preventDefault()
    if (!editLead) return
    setSaving(true)
    const res = await fetch(`/api/leads/${editLead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    const updated = await res.json()
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))
    if (drawerLead?.id === updated.id) setDrawerLead(updated)
    setEditLead(null)
    setSaving(false)
  }

  async function deleteLead(id: string) {
    await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    setLeads(prev => prev.filter(l => l.id !== id))
    if (drawerLead?.id === id) setDrawerLead(null)
    setDeleteId(null)
  }

  async function updateStage(id: string, stage: LeadStage) {
    const res  = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    })
    const updated = await res.json()
    setLeads(prev => prev.map(l => l.id === id ? updated : l))
    if (drawerLead?.id === id) setDrawerLead(updated)
  }

  // ── Activity log ────────────────────────────────────────────────────────────

  async function addInteraction() {
    if (!drawerLead || !noteText.trim()) return
    setAddingNote(true)
    const res = await fetch(`/api/leads/${drawerLead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addInteraction: { type: noteType, note: noteText.trim() } }),
    })
    const updated = await res.json()
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))
    setDrawerLead(updated)
    setNoteText('')
    setAddingNote(false)
  }

  // ── Filtered + grouped leads ────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return q
      ? leads.filter(l =>
          l.name.toLowerCase().includes(q) ||
          (l.company ?? '').toLowerCase().includes(q) ||
          (l.contact ?? '').toLowerCase().includes(q)
        )
      : leads
  }, [leads, search])

  const byStage = (stage: LeadStage) => filtered.filter(l => l.stage === stage)

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Pipeline</h1>
          <p className="text-gray-500 text-sm mt-0.5">{leads.length} leads · {leads.filter(l => l.stage === 'WON').length} won</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              className="border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
              placeholder="Search leads…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => { setShowAdd(true); setAddForm(EMPTY_FORM) }}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors whitespace-nowrap"
          >
            + Add Client
          </button>
        </div>
      </div>

      {/* Stage stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
        {STAGES.map(s => {
          const count = leads.filter(l => l.stage === s).length
          return (
            <div key={s} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
              <div className={`text-xl font-bold ${STAGE_COLOR[s]}`}>{count}</div>
              <div className="text-xs text-gray-400 mt-0.5 truncate">{STAGE_LABELS[s]}</div>
            </div>
          )
        })}
      </div>

      {/* ── Main: Kanban + Drawer ── */}
      <div className={`flex gap-6 transition-all ${drawerLead ? 'items-start' : ''}`}>

        {/* Kanban */}
        <div className={`flex-1 min-w-0 transition-all ${drawerLead ? 'hidden lg:block' : ''}`}>
          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading pipeline…</div>
          ) : (
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              {STAGES.map(stage => (
                <div key={stage} className="min-w-0">
                  <div className={`text-xs font-semibold uppercase tracking-wide mb-3 ${STAGE_COLOR[stage]}`}>
                    {STAGE_LABELS[stage]} ({byStage(stage).length})
                  </div>
                  <div className="space-y-2">
                    {byStage(stage).length === 0 && (
                      <div className="border-2 border-dashed border-gray-100 rounded-xl p-4 text-center text-xs text-gray-300">Empty</div>
                    )}
                    {byStage(stage).map(lead => {
                      const a      = lead.artifacts ?? {}
                      const fuBadge = followUpBadge(a.followUpDate as string | undefined)
                      const isSelected = drawerLead?.id === lead.id

                      return (
                        <div
                          key={lead.id}
                          onClick={() => setDrawerLead(isSelected ? null : lead)}
                          className={`bg-white border rounded-xl p-3 text-sm group relative cursor-pointer transition-all hover:shadow-sm ${
                            isSelected ? 'border-indigo-400 ring-1 ring-indigo-300' : stage === 'WON' ? 'border-green-200' : 'border-gray-200 hover:border-indigo-200'
                          }`}
                        >
                          {/* Edit / Delete — stop propagation so click doesn't open drawer */}
                          <div className="absolute top-2 right-2 hidden group-hover:flex gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openEdit(lead)} title="Edit"
                              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded text-xs">✎</button>
                            <button onClick={() => setDeleteId(lead.id)} title="Delete"
                              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded text-xs">×</button>
                          </div>

                          <div className="font-medium text-gray-900 truncate pr-10 text-xs">{lead.name}</div>
                          {lead.company && <div className="text-gray-400 text-xs truncate mt-0.5">{lead.company}</div>}

                          {/* Badges row */}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {lead.clientProfile?.temperature && (
                              <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${TEMP_COLORS[lead.clientProfile.temperature] ?? ''}`} style={{ fontSize: '0.65rem' }}>
                                {lead.clientProfile.temperature}
                              </span>
                            )}
                            {a.priority && a.priority !== 'MEDIUM' && (
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[a.priority as string] ?? ''}`} style={{ fontSize: '0.65rem' }}>
                                {String(a.priority)}
                              </span>
                            )}
                          </div>

                          {fuBadge && (
                            <div className={`text-xs px-1.5 py-0.5 rounded mt-1 font-medium w-fit ${fuBadge.color}`} style={{ fontSize: '0.65rem' }}>
                              📅 {fuBadge.label}
                            </div>
                          )}

                          {/* Stage select — stop propagation */}
                          <div onClick={e => e.stopPropagation()}>
                            <select
                              className="mt-2 w-full text-xs border border-gray-200 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                              value={lead.stage}
                              onChange={e => updateStage(lead.id, e.target.value as LeadStage)}
                            >
                              {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                            </select>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Detail Drawer ── */}
        {drawerLead && (
          <div className="w-full lg:w-96 shrink-0 space-y-4">
            {/* Drawer header */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h2 className="font-bold text-gray-900 text-base">{drawerLead.name}</h2>
                  {drawerLead.company && <p className="text-sm text-gray-500 mt-0.5">{drawerLead.company}</p>}
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(drawerLead)}
                    className="text-xs text-indigo-600 border border-indigo-200 rounded-lg px-2.5 py-1 hover:bg-indigo-50 font-medium">Edit</button>
                  <button onClick={() => setDrawerLead(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl leading-none w-6 h-6 flex items-center justify-center">×</button>
                </div>
              </div>

              {/* Stage + quick info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-20 shrink-0">Stage</span>
                  <select
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={drawerLead.stage}
                    onChange={e => updateStage(drawerLead.id, e.target.value as LeadStage)}
                  >
                    {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                  </select>
                </div>
                {drawerLead.contact && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-400 w-20 shrink-0">Contact</span>
                    <span className="text-xs text-gray-700 break-all">{drawerLead.contact}</span>
                  </div>
                )}
                {drawerLead.service && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-gray-400 w-20 shrink-0">Service</span>
                    <span className="text-xs text-gray-700">{drawerLead.service}</span>
                  </div>
                )}
                {drawerLead.artifacts?.source && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-20 shrink-0">Source</span>
                    <span className="text-xs text-gray-700">{String(drawerLead.artifacts.source)}</span>
                  </div>
                )}
                {drawerLead.artifacts?.priority && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-20 shrink-0">Priority</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${PRIORITY_COLORS[String(drawerLead.artifacts.priority)] ?? ''}`}>
                      {String(drawerLead.artifacts.priority)}
                    </span>
                  </div>
                )}
                {drawerLead.artifacts?.followUpDate && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-20 shrink-0">Follow-up</span>
                    {(() => { const b = followUpBadge(String(drawerLead.artifacts.followUpDate)); return b ? <span className={`text-xs px-2 py-0.5 rounded font-medium ${b.color}`}>{b.label}</span> : null })()}
                  </div>
                )}
              </div>

              {/* Links */}
              {(drawerLead.artifacts?.linkedinUrl || drawerLead.artifacts?.website) && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {drawerLead.artifacts.linkedinUrl && (
                    <a href={String(drawerLead.artifacts.linkedinUrl)} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50">
                      💼 LinkedIn ↗
                    </a>
                  )}
                  {drawerLead.artifacts.website && (
                    <a href={String(drawerLead.artifacts.website)} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-gray-600 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50">
                      🌐 Website ↗
                    </a>
                  )}
                </div>
              )}

              {/* Notes */}
              {drawerLead.notes && (
                <div className="mt-3 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 leading-relaxed">{drawerLead.notes}</div>
              )}

              {/* AI link */}
              <div className="flex gap-2 mt-3">
                <a href={`/dashboard/clients?analyse=${drawerLead.id}`}
                  className="flex-1 text-center text-xs bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 transition-colors">
                  🧠 Analyse with AI
                </a>
                <a href={`/dashboard/clients?email=${drawerLead.id}`}
                  className="flex-1 text-center text-xs border border-indigo-200 text-indigo-600 rounded-lg py-2 font-medium hover:bg-indigo-50 transition-colors">
                  ✉ Cold Email
                </a>
              </div>
            </div>

            {/* Activity log */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 font-semibold text-sm text-gray-900">
                Activity Log
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {(drawerLead.artifacts?.interactions ?? []).length} entries
                </span>
              </div>

              {/* Add interaction */}
              <div className="p-4 border-b border-gray-50 space-y-2">
                <div className="flex gap-2">
                  <select className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    value={noteType} onChange={e => setNoteType(e.target.value)}>
                    {INTERACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    placeholder={`Log a ${noteType.toLowerCase()}…`}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addInteraction() } }}
                  />
                  <button onClick={addInteraction} disabled={addingNote || !noteText.trim()}
                    className="text-xs bg-indigo-600 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                    {addingNote ? '…' : 'Log'}
                  </button>
                </div>
              </div>

              {/* Interactions list */}
              <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                {((drawerLead.artifacts?.interactions ?? []) as Interaction[]).length === 0 ? (
                  <div className="px-5 py-6 text-center text-xs text-gray-400">No activity yet — log your first interaction above.</div>
                ) : (
                  [...((drawerLead.artifacts?.interactions ?? []) as Interaction[])].reverse().map(int => (
                    <div key={int.id} className="px-5 py-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{int.type}</span>
                        <span className="text-xs text-gray-400">{timeAgo(int.date)}</span>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{int.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════ Modals ═══════════ */}

      {/* Add Lead modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) setShowAdd(false) }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-gray-900">Add New Client</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={addLead} className="space-y-4">
              <LeadFormFields form={addForm} onChange={setAddForm} />
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving || !addForm.name.trim()}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Adding…' : 'Add Client'}
                </button>
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Lead modal */}
      {editLead && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={e => { if (e.target === e.currentTarget) setEditLead(null) }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl my-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-gray-900">Edit Client</h2>
              <button onClick={() => setEditLead(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={saveLead} className="space-y-4">
              <LeadFormFields form={editForm} onChange={setEditForm} />
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditLead(null)}
                  className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
            <div className="text-3xl mb-3">🗑</div>
            <h2 className="font-bold text-gray-900 mb-1">Delete this client?</h2>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone. All activity logs and data will be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => deleteLead(deleteId)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-red-700">Delete</button>
              <button onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
