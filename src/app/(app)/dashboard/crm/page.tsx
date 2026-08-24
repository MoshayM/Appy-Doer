'use client'

import { useState, useEffect, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

const STAGES = ['LEAD_IDENTIFIED', 'PROPOSAL_SENT', 'GOT_REPLY', 'WON', 'LOST'] as const
type Stage = typeof STAGES[number]

interface Interaction { id: string; type: string; note: string; date: string }

interface Lead {
  id: string; name: string; company?: string; contact?: string
  service?: string; notes?: string; stage: Stage; lastActivityAt: string
  artifacts?: {
    source?: string; priority?: string; followUpDate?: string
    linkedinUrl?: string; website?: string; interactions?: Interaction[]
  } | null
  clientProfile?: { temperature: string } | null
}

interface LeadForm {
  name: string; company: string; contact: string; service: string
  notes: string; source: string; priority: string; followUpDate: string
  linkedinUrl: string; website: string
}

interface ClientItem {
  id: string; name: string; company: string; temperature: string
  lastContactedAt: string | null
}

interface ThreadSummary {
  id: string; contactEmail: string; contactName?: string; subject: string
  status: string; lastMessageAt: string; aiInsight?: string; aiIntent?: string
}

interface RelationshipAction {
  type: string; description: string; priority: 'HIGH'|'MEDIUM'|'LOW'; dueInDays: number
}

interface RelationshipResult {
  healthScore: number; status: string
  actions: RelationshipAction[]
  opportunities: { type: string; description: string; estimatedValueINR: number }[]
  testimonialRequest?: string; referralAsk?: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGE_LABEL: Record<Stage, string> = {
  LEAD_IDENTIFIED: 'Identified', PROPOSAL_SENT: 'Proposal',
  GOT_REPLY: 'Replied', WON: 'Won', LOST: 'Lost',
}
const STAGE_DOT: Record<Stage, string> = {
  LEAD_IDENTIFIED: 'bg-gray-400', PROPOSAL_SENT: 'bg-blue-500',
  GOT_REPLY: 'bg-indigo-500', WON: 'bg-emerald-500', LOST: 'bg-red-400',
}
const TEMP_COLOR: Record<string, string> = {
  HOT: 'bg-red-100 text-red-700', WARM: 'bg-orange-100 text-orange-700', COLD: 'bg-sky-100 text-sky-700',
}
const PRIORITY_COLOR: Record<string, string> = {
  HIGH: 'bg-rose-100 text-rose-700', MEDIUM: 'bg-amber-100 text-amber-700', LOW: 'bg-gray-100 text-gray-500',
}
const SOURCES = ['LinkedIn','Referral','Cold Outreach','Job Board','Social Media','Website','Event','Client Intelligence','Manual','Other']
const INTERACTION_TYPES = ['Note','Call','Email','Meeting','WhatsApp','Follow-up']
const EMPTY_FORM: LeadForm = {
  name:'', company:'', contact:'', service:'',
  notes:'', source:'', priority:'MEDIUM', followUpDate:'', linkedinUrl:'', website:'',
}

function relTime(iso: string | null) {
  if (!iso) return '—'
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m/60)}h ago`
  return `${Math.floor(m/1440)}d ago`
}
function rupee(n: number) {
  return n >= 100000 ? `₹${(n/100000).toFixed(1)}L` : n >= 1000 ? `₹${(n/1000).toFixed(0)}K` : `₹${n}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ClientHubPage() {
  const [tab, setTab] = useState<'pipeline'|'relationships'>('pipeline')

  // Pipeline state
  const [leads,       setLeads]       = useState<Lead[]>([])
  const [loadingLeads,setLoadingLeads]= useState(true)
  const [search,      setSearch]      = useState('')
  const [showAdd,     setShowAdd]     = useState(false)
  const [addForm,     setAddForm]     = useState<LeadForm>(EMPTY_FORM)
  const [editLead,    setEditLead]    = useState<Lead | null>(null)
  const [editForm,    setEditForm]    = useState<LeadForm>(EMPTY_FORM)
  const [deleteId,    setDeleteId]    = useState<string | null>(null)
  const [drawerLead,  setDrawerLead]  = useState<Lead | null>(null)
  const [noteType,    setNoteType]    = useState('Note')
  const [noteText,    setNoteText]    = useState('')
  const [addingNote,  setAddingNote]  = useState(false)
  const [saving,      setSaving]      = useState(false)

  // Relationship state
  const [clients,      setClients]      = useState<ClientItem[]>([])
  const [threads,      setThreads]      = useState<ThreadSummary[]>([])
  const [selClient,    setSelClient]    = useState<ClientItem | null>(null)
  const [relResult,    setRelResult]    = useState<RelationshipResult | null>(null)
  const [relLoading,   setRelLoading]   = useState(false)
  const [relError,     setRelError]     = useState('')
  const [relTab,       setRelTab]       = useState<'analysis'|'conversations'>('analysis')
  const [relSearch,    setRelSearch]    = useState('')

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadLeads()
    timerRef.current = setInterval(loadLeads, 30000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  useEffect(() => {
    Promise.all([fetch('/api/clients'), fetch('/api/email/threads')]).then(async ([cR, tR]) => {
      if (cR.ok) { const d = await cR.json(); setClients(Array.isArray(d) ? d : []) }
      if (tR.ok) { const d = await tR.json(); setThreads(Array.isArray(d) ? d : []) }
    })
  }, [])

  async function loadLeads() {
    const r = await fetch('/api/leads')
    if (r.ok) { const d = await r.json(); setLeads(Array.isArray(d) ? d : []) }
    setLoadingLeads(false)
  }

  // ── CRM ──────────────────────────────────────────────────────────────────

  async function addLead() {
    if (!addForm.name.trim()) return
    setSaving(true)
    const r = await fetch('/api/leads', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(addForm) })
    if (r.ok) { const l = await r.json(); setLeads(p => [l, ...p]); setAddForm(EMPTY_FORM); setShowAdd(false) }
    setSaving(false)
  }

  async function saveLead() {
    if (!editLead) return
    setSaving(true)
    const r = await fetch(`/api/leads/${editLead.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(editForm) })
    if (r.ok) {
      const u = await r.json()
      setLeads(p => p.map(l => l.id === editLead.id ? u : l))
      if (drawerLead?.id === editLead.id) setDrawerLead(u)
      setEditLead(null)
    }
    setSaving(false)
  }

  async function updateStage(id: string, stage: Stage) {
    const r = await fetch(`/api/leads/${id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ stage }) })
    if (r.ok) {
      const u = await r.json()
      setLeads(p => p.map(l => l.id === id ? u : l))
      if (drawerLead?.id === id) setDrawerLead(u)
    }
  }

  function deleteLead(id: string) {
    setLeads(p => p.filter(l => l.id !== id))
    if (drawerLead?.id === id) setDrawerLead(null)
    setDeleteId(null)
    fetch(`/api/leads/${id}`, { method: 'DELETE' })
  }

  async function addNote(leadId: string) {
    if (!noteText.trim()) return
    setAddingNote(true)
    const r = await fetch(`/api/leads/${leadId}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ addInteraction:{ type:noteType, note:noteText } }) })
    if (r.ok) { const u = await r.json(); setLeads(p => p.map(l => l.id === leadId ? u : l)); setDrawerLead(u); setNoteText('') }
    setAddingNote(false)
  }

  function openEdit(lead: Lead) {
    setEditForm({ name:lead.name, company:lead.company??'', contact:lead.contact??'', service:lead.service??'', notes:lead.notes??'', source:lead.artifacts?.source??'', priority:lead.artifacts?.priority??'MEDIUM', followUpDate:lead.artifacts?.followUpDate??'', linkedinUrl:lead.artifacts?.linkedinUrl??'', website:lead.artifacts?.website??'' })
    setEditLead(lead)
  }

  // ── Relationships ─────────────────────────────────────────────────────────

  async function analyzeClient(client: ClientItem) {
    setSelClient(client)
    setRelResult(null)
    setRelError('')
    setRelLoading(true)
    setRelTab('analysis')
    try {
      const r = await fetch('/api/agents/run', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ agentType:'RELATIONSHIP_SUCCESS', clientId:client.id }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error?.message ?? 'Analysis failed')
      setRelResult(d.data)
    } catch (e: unknown) { setRelError((e as Error).message) }
    setRelLoading(false)
  }

  async function markAction(type: string) {
    if (!selClient) return
    await fetch('/api/relationship/actions', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ clientId:selClient.id, type }) })
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const filteredLeads   = leads.filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || (l.company??'').toLowerCase().includes(search.toLowerCase()))
  const filteredClients = clients.filter(c => !relSearch || c.name.toLowerCase().includes(relSearch.toLowerCase()) || (c.company??'').toLowerCase().includes(relSearch.toLowerCase()))
  const wonCount        = leads.filter(l => l.stage === 'WON').length

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Client Hub</h1>
            <p className="text-xs text-gray-500 mt-0.5">{leads.length} leads · {wonCount} won</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {(['pipeline','relationships'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t === 'pipeline' ? '📋 Pipeline' : '🤝 Relationships'}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm">
              + Add Client
            </button>
          </div>
        </div>
        <div className="mt-3">
          <input
            value={tab === 'pipeline' ? search : relSearch}
            onChange={e => tab === 'pipeline' ? setSearch(e.target.value) : setRelSearch(e.target.value)}
            placeholder={tab === 'pipeline' ? 'Search leads…' : 'Search clients…'}
            className="w-full max-w-sm text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400"
          />
        </div>
      </div>

      {/* ── Pipeline tab ── */}
      {tab === 'pipeline' && (
        <div className="flex-1 overflow-auto p-5">
          {/* Stage chips */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {STAGES.map(s => (
              <div key={s} className="bg-white rounded-xl border border-gray-200 px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${STAGE_DOT[s]}`} />
                <span className="text-xs font-semibold text-gray-600">{STAGE_LABEL[s]}</span>
                <span className="text-xs font-bold text-gray-900 bg-gray-100 px-1.5 rounded-full">{leads.filter(l => l.stage === s).length}</span>
              </div>
            ))}
          </div>

          {/* Kanban */}
          {loadingLeads ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Loading…</div>
          ) : (
            <div className="flex gap-4" style={{ minWidth: `${STAGES.length * 210}px` }}>
              {STAGES.map(stage => {
                const cols = filteredLeads.filter(l => l.stage === stage)
                return (
                  <div key={stage} className="flex-1 min-w-[195px]">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className={`w-2 h-2 rounded-full ${STAGE_DOT[stage]}`} />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{STAGE_LABEL[stage]}</span>
                      <span className="ml-auto text-xs font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{cols.length}</span>
                    </div>
                    <div className="space-y-2">
                      {cols.map(lead => (
                        <div key={lead.id} onClick={() => setDrawerLead(lead)}
                          className="group bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all">
                          <div className="flex items-start gap-1">
                            <p className="text-sm font-semibold text-gray-900 truncate flex-1 leading-tight">{lead.name}</p>
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-0.5 flex-shrink-0">
                              <button onClick={e => { e.stopPropagation(); openEdit(lead) }} className="p-1 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50 text-xs">✏️</button>
                              <button onClick={e => { e.stopPropagation(); setDeleteId(lead.id) }} className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 text-xs">🗑️</button>
                            </div>
                          </div>
                          {lead.company && <p className="text-xs text-gray-500 mt-0.5 truncate">{lead.company}</p>}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {lead.clientProfile?.temperature && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${TEMP_COLOR[lead.clientProfile.temperature] ?? 'bg-gray-100 text-gray-600'}`}>{lead.clientProfile.temperature}</span>
                            )}
                            {lead.artifacts?.priority && (
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[lead.artifacts.priority] ?? 'bg-gray-100 text-gray-500'}`}>{lead.artifacts.priority}</span>
                            )}
                            {lead.artifacts?.followUpDate && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-purple-50 text-purple-600">
                                📅 {new Date(lead.artifacts.followUpDate).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {cols.length === 0 && (
                        <div className="py-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">No leads</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Relationships tab ── */}
      {tab === 'relationships' && (
        <div className="flex-1 overflow-hidden flex">

          {/* Client list */}
          <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
            {filteredClients.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">
                {clients.length === 0 ? 'No clients yet. Won leads become clients.' : 'No results.'}
              </p>
            ) : filteredClients.map(c => (
              <button key={c.id} onClick={() => analyzeClient(c)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-indigo-50 transition-colors ${selClient?.id === c.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {c.name.slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                    {c.company && <p className="text-xs text-gray-500 truncate">{c.company}</p>}
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${TEMP_COLOR[c.temperature] ?? 'bg-gray-100 text-gray-600'}`}>{c.temperature}</span>
                </div>
                {c.lastContactedAt && <p className="text-xs text-gray-400 mt-1 ml-10">{relTime(c.lastContactedAt)}</p>}
              </button>
            ))}
          </div>

          {/* Analysis panel */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selClient ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-5xl mb-4">🤝</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a client</h3>
                <p className="text-sm text-gray-400 max-w-xs">Choose a client to get an instant AI-powered relationship health analysis.</p>
              </div>
            ) : (
              <div className="max-w-2xl space-y-5">

                {/* Client hero */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {selClient.name.slice(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900">{selClient.name}</h2>
                    {selClient.company && <p className="text-sm text-gray-500">{selClient.company}</p>}
                  </div>
                  <span className={`text-sm px-3 py-1 rounded-full font-semibold ${TEMP_COLOR[selClient.temperature] ?? 'bg-gray-100 text-gray-600'}`}>{selClient.temperature}</span>
                </div>

                {/* Sub-tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                  {(['analysis','conversations'] as const).map(t => (
                    <button key={t} onClick={() => setRelTab(t)}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${relTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                      {t === 'analysis' ? '🧠 AI Analysis' : '💬 Conversations'}
                    </button>
                  ))}
                </div>

                {/* Loading */}
                {relLoading && (
                  <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm flex items-center gap-3">
                    <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-indigo-700">Analysing relationship…</p>
                      <p className="text-xs text-indigo-400 mt-0.5">AI is reviewing interaction history and signals</p>
                    </div>
                  </div>
                )}

                {relError && <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 text-sm text-red-700">{relError}</div>}

                {/* Analysis content */}
                {relTab === 'analysis' && relResult && !relLoading && (
                  <div className="space-y-4">
                    {/* Health score ring */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-5">
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" strokeLinecap="round"
                            stroke={relResult.healthScore >= 70 ? '#10b981' : relResult.healthScore >= 40 ? '#f59e0b' : '#ef4444'}
                            strokeDasharray={`${relResult.healthScore} 100`} />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-900">{relResult.healthScore}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Relationship Health</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">{relResult.status}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    {(relResult.actions?.length ?? 0) > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-3">⚡ Recommended Actions</h3>
                        <div className="space-y-2">
                          {relResult.actions.map((a, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 mt-0.5 ${PRIORITY_COLOR[a.priority] ?? 'bg-gray-100 text-gray-500'}`}>{a.priority}</span>
                              <p className="text-sm text-gray-700 flex-1">{a.description}</p>
                              {a.dueInDays != null && <span className="text-xs text-gray-400 flex-shrink-0">in {a.dueInDays}d</span>}
                              <button onClick={() => markAction(a.type)} className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex-shrink-0">Done</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Opportunities */}
                    {(relResult.opportunities?.length ?? 0) > 0 && (
                      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-3">💎 Upsell Opportunities</h3>
                        <div className="space-y-2">
                          {relResult.opportunities.map((o, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                              <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-semibold flex-shrink-0 mt-0.5">{o.type}</span>
                              <p className="text-sm text-gray-700 flex-1">{o.description}</p>
                              {o.estimatedValueINR > 0 && <span className="text-sm font-bold text-emerald-700 flex-shrink-0">{rupee(o.estimatedValueINR)}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Testimonial + Referral */}
                    <div className="grid sm:grid-cols-2 gap-3">
                      {relResult.testimonialRequest && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                          <p className="text-xs font-bold text-emerald-700 mb-1.5">🌟 Testimonial Request</p>
                          <p className="text-sm text-emerald-800">{relResult.testimonialRequest}</p>
                        </div>
                      )}
                      {relResult.referralAsk && (
                        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                          <p className="text-xs font-bold text-purple-700 mb-1.5">🔄 Referral Ask</p>
                          <p className="text-sm text-purple-800">{relResult.referralAsk}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Conversations */}
                {relTab === 'conversations' && (
                  <div className="space-y-3">
                    {threads.length === 0 ? (
                      <p className="text-center py-10 text-sm text-gray-400">No tracked email conversations yet.</p>
                    ) : threads.map(t => (
                      <div key={t.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{t.subject}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{t.contactName ?? t.contactEmail}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">{t.status}</span>
                            <span className="text-xs text-gray-400">{relTime(t.lastMessageAt)}</span>
                          </div>
                        </div>
                        {t.aiInsight && (
                          <p className="mt-2 text-xs text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl">💡 {t.aiInsight}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Detail drawer ── */}
      {drawerLead && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setDrawerLead(null)}>
          <div className="absolute inset-0 bg-black/20" />
          <div onClick={e => e.stopPropagation()} className="relative w-96 bg-white h-full shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{drawerLead.name}</p>
                {drawerLead.company && <p className="text-xs text-gray-500">{drawerLead.company}</p>}
              </div>
              <button onClick={() => openEdit(drawerLead)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50">✏️</button>
              <button onClick={() => setDrawerLead(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Stage */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Stage</p>
                <select value={drawerLead.stage} onChange={e => updateStage(drawerLead.id, e.target.value as Stage)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  {STAGES.map(s => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                </select>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2">
                {[['Contact', drawerLead.contact], ['Service', drawerLead.service], ['Source', drawerLead.artifacts?.source], ['Priority', drawerLead.artifacts?.priority]].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">{k}</p>
                    <p className="text-sm font-medium text-gray-800 truncate">{v}</p>
                  </div>
                ))}
              </div>

              {/* Links */}
              {(drawerLead.artifacts?.linkedinUrl || drawerLead.artifacts?.website) && (
                <div className="flex gap-2 flex-wrap">
                  {drawerLead.artifacts?.linkedinUrl && <a href={drawerLead.artifacts.linkedinUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">LinkedIn ↗</a>}
                  {drawerLead.artifacts?.website && <a href={drawerLead.artifacts.website} target="_blank" rel="noreferrer" className="text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">Website ↗</a>}
                </div>
              )}

              {/* Notes */}
              {drawerLead.notes && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Notes</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">{drawerLead.notes}</p>
                </div>
              )}

              {/* Log activity */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Log Activity</p>
                <select value={noteType} onChange={e => setNoteType(e.target.value)}
                  className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-300">
                  {INTERACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="flex gap-2">
                  <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="What happened?"
                    onKeyDown={e => e.key === 'Enter' && addNote(drawerLead.id)}
                    className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                  <button onClick={() => addNote(drawerLead.id)} disabled={addingNote || !noteText.trim()}
                    className="text-sm bg-indigo-600 text-white px-3 py-2 rounded-xl disabled:opacity-50 hover:bg-indigo-700 font-medium transition-colors">
                    {addingNote ? '…' : 'Log'}
                  </button>
                </div>
              </div>

              {/* Activity history */}
              {(drawerLead.artifacts?.interactions?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">History</p>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {[...(drawerLead.artifacts!.interactions!)].reverse().map(n => (
                      <div key={n.id} className="flex items-start gap-2 text-sm">
                        <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5">{n.type}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-700 leading-snug">{n.note}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(n.date).toLocaleDateString('en-IN',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Add New Lead</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-6 py-4"><LeadFormFields form={addForm} onChange={setAddForm} /></div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={addLead} disabled={saving || !addForm.name.trim()}
                className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-colors">
                {saving ? 'Saving…' : 'Add Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Edit Lead</h3>
              <button onClick={() => setEditLead(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="px-6 py-4"><LeadFormFields form={editForm} onChange={setEditForm} /></div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setEditLead(null)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button onClick={saveLead} disabled={saving}
                className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-colors">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <p className="text-lg font-bold text-gray-900 mb-2">Delete this lead?</p>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteId(null)} className="px-5 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
              <button onClick={() => deleteLead(deleteId)} className="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Form fields sub-component ─────────────────────────────────────────────────

function LeadFormFields({ form, onChange }: { form: LeadForm; onChange: (f: LeadForm) => void }) {
  const set = (k: keyof LeadForm) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    onChange({ ...form, [k]: e.target.value })
  const cls = 'w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300'

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Name *</label>
        <input value={form.name} onChange={set('name')} placeholder="Client name" className={cls} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Company</label>
        <input value={form.company} onChange={set('company')} placeholder="Company" className={cls} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Contact</label>
        <input value={form.contact} onChange={set('contact')} placeholder="email / phone" className={cls} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Service</label>
        <input value={form.service} onChange={set('service')} placeholder="What they need" className={cls} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Priority</label>
        <select value={form.priority} onChange={set('priority')} className={cls}>
          {['HIGH','MEDIUM','LOW'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Source</label>
        <select value={form.source} onChange={set('source')} className={cls}>
          <option value="">— Select —</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Follow-up date</label>
        <input type="date" value={form.followUpDate} onChange={set('followUpDate')} className={cls} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">LinkedIn URL</label>
        <input value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/…" className={cls} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Website</label>
        <input value={form.website} onChange={set('website')} placeholder="https://…" className={cls} />
      </div>
      <div className="col-span-2">
        <label className="text-xs font-semibold text-gray-500 mb-1 block">Notes</label>
        <textarea value={form.notes} onChange={set('notes')} placeholder="Context, requirements…" rows={3} className={`${cls} resize-none`} />
      </div>
    </div>
  )
}
