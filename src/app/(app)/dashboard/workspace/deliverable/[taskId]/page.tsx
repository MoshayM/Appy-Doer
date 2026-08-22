'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeliverableData {
  summary?: string
  mainOutput?: string
  sections?: { title: string; content: string }[]
  emailDraft?: string
  nextSteps?: string[]
}

interface ExecutionResult {
  blueprint?: { objective?: string; clientNeeds?: string; deliverables?: string[]; urgency?: string; taskType?: string }
  plan?: { approach?: string; estimatedMinutes?: number }
  team?: string[]
  specialistOutputs?: { specialist: string; contribution: string; keyPoints: string[]; recommendations: string[] }[]
  review?: { score?: number; approved?: boolean; improvements?: string[]; consolidatedOutput?: string; keyFindings?: string[] }
  deliverable?: DeliverableData
  _revised?: boolean
  _revisionPrompt?: string
}

interface PageData {
  taskId: string
  taskTitle: string
  taskStatus: string
  workspaceTitle: string
  workspaceId: string
  result: ExecutionResult
  client: { email: string; name: string; threadSubject: string }
}

interface RevisionAgent { agent: string; stage: number; status: 'working' | 'done'; message?: string }

type Phase = 'loading' | 'error' | 'review' | 'compose' | 'sending' | 'sent'
type RevisionMode = 'finetune' | 'recreate' | 'manual' | null

const CHECK_ITEMS = [
  { id: 'req',     label: 'Deliverable addresses all client requirements' },
  { id: 'quality', label: 'Content quality and completeness reviewed' },
  { id: 'email',   label: 'Email draft is professional and ready to send' },
  { id: 'ready',   label: 'Confirmed ready to deliver to client' },
]

const FINETUNE_STAGES = ['Analyst', 'Editor', 'Review']
const RECREATE_STAGES = ['Analyst', 'Planner', 'Specialists', 'Review', 'Delivery']

// ── Small helpers ─────────────────────────────────────────────────────────────

function Spinner({ size = 'sm' }: { size?: 'sm' | 'xs' }) {
  const s = size === 'xs' ? 'w-3 h-3' : 'w-4 h-4'
  return (
    <svg className={`${s} animate-spin text-current`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 85 ? 'from-green-400 to-emerald-500' : score >= 70 ? 'from-amber-400 to-orange-400' : 'from-red-400 to-rose-500'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-white font-bold text-sm">{score}/100</span>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DeliverablePage({ params }: { params: { taskId: string } }) {
  const { taskId } = params

  const [phase, setPhase]       = useState<Phase>('loading')
  const [data, setData]         = useState<PageData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [checked, setChecked]   = useState<Record<string, boolean>>({})
  const [showDraft, setShowDraft] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sentVia, setSentVia]   = useState('')

  // Email compose
  const [toEmail, setToEmail]   = useState('')
  const [toName, setToName]     = useState('')
  const [subject, setSubject]   = useState('')
  const [body, setBody]         = useState('')
  const [format, setFormat]     = useState<'html' | 'text' | 'none'>('html')

  // Revision system
  const [revisionMode, setRevisionMode]     = useState<RevisionMode>(null)
  const [revisionPrompt, setRevisionPrompt] = useState('')
  const [isRevising, setIsRevising]         = useState(false)
  const [revisionAgents, setRevisionAgents] = useState<RevisionAgent[]>([])
  const [revisionError, setRevisionError]   = useState('')
  const [revisionSuccess, setRevisionSuccess] = useState(false)

  // Manual edit
  const [editDraft, setEditDraft]   = useState<DeliverableData | null>(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [saveEditOk, setSaveEditOk] = useState(false)

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/workspace/tasks/${taskId}/deliverable`)
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          setErrorMsg(d.error === 'NO_DELIVERABLE'
            ? 'No deliverable found for this task. Run the AI team first.'
            : d.error)
          setPhase('error')
          return
        }
        setData(d as PageData)
        setPhase('review')
      })
      .catch(() => { setErrorMsg('Failed to load deliverable.'); setPhase('error') })
  }, [taskId])

  // ── Submit AI revision ──────────────────────────────────────────────────────
  async function submitRevision() {
    if (!revisionPrompt.trim() || !data) return
    setIsRevising(true)
    setRevisionAgents([])
    setRevisionError('')
    setRevisionSuccess(false)

    try {
      const res = await fetch(`/api/workspace/tasks/${taskId}/revise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revisionPrompt,
          mode: revisionMode === 'recreate' ? 'recreate' : 'finetune',
          currentResult: data.result,
        }),
      })
      if (!res.ok || !res.body) {
        setRevisionError('Failed to start revision.')
        setIsRevising(false)
        return
      }

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const msgs = buf.split('\n\n')
        buf = msgs.pop() ?? ''

        for (const msg of msgs) {
          let eventType = 'message', dataStr = ''
          for (const line of msg.split('\n')) {
            if (line.startsWith('event: ')) eventType = line.slice(7).trim()
            else if (line.startsWith('data: '))  dataStr  = line.slice(6).trim()
          }
          if (!dataStr) continue
          try {
            const payload = JSON.parse(dataStr)
            if (eventType === 'progress') {
              setRevisionAgents(prev => {
                const idx = prev.findIndex(a => a.agent === payload.agent)
                const entry: RevisionAgent = { agent: payload.agent, stage: payload.stage, status: payload.status, message: payload.message }
                if (idx >= 0) { const n = [...prev]; n[idx] = entry; return n }
                return [...prev, entry]
              })
            } else if (eventType === 'complete') {
              // Update page data with revised result
              setData(prev => prev ? { ...prev, result: payload.result as ExecutionResult } : prev)
              setIsRevising(false)
              setRevisionSuccess(true)
              setRevisionMode(null)
              setRevisionPrompt('')
              setChecked({}) // Reset review checklist — user must re-review
              window.scrollTo({ top: 0, behavior: 'smooth' })
            } else if (eventType === 'error') {
              setRevisionError(payload.message ?? 'Revision failed.')
              setIsRevising(false)
            }
          } catch { /* skip bad chunk */ }
        }
      }
    } catch {
      setRevisionError('Network error during revision.')
      setIsRevising(false)
    }
  }

  // ── Save manual edits ───────────────────────────────────────────────────────
  async function saveManualEdits() {
    if (!editDraft) return
    setSavingEdit(true)
    setSaveEditOk(false)
    try {
      const res = await fetch(`/api/workspace/tasks/${taskId}/deliverable`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliverable: editDraft }),
      })
      const d = await res.json()
      if (d.ok) {
        setData(prev => prev ? { ...prev, result: d.result as ExecutionResult } : prev)
        setSaveEditOk(true)
        setRevisionMode(null)
        setEditDraft(null)
        setChecked({})
        setRevisionSuccess(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setRevisionError(d.error ?? 'Failed to save.')
      }
    } catch { setRevisionError('Network error.') }
    finally { setSavingEdit(false) }
  }

  // ── Enter manual edit mode ──────────────────────────────────────────────────
  function enterManualEdit() {
    if (!data?.result.deliverable) return
    setEditDraft(JSON.parse(JSON.stringify(data.result.deliverable))) // deep clone
    setRevisionMode('manual')
  }

  // ── Prepare compose email form ──────────────────────────────────────────────
  function accept() {
    if (!data) return
    const draft = data.result.deliverable?.emailDraft ?? ''
    let subj = `Deliverable: ${data.taskTitle}`
    let emailBody = draft
    const m = draft.match(/^Subject:\s*(.+)\n/i)
    if (m) { subj = m[1].trim(); emailBody = draft.replace(/^Subject:.*\n/i, '').trim() }
    if (data.client.threadSubject && !m) subj = `Re: ${data.client.threadSubject}`
    setToEmail(data.client.email)
    setToName(data.client.name)
    setSubject(subj)
    setBody(emailBody)
    setFormat('html')
    setPhase('compose')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Send ────────────────────────────────────────────────────────────────────
  async function send() {
    if (!toEmail || !subject) return
    setPhase('sending')
    setSendError('')
    try {
      const res = await fetch(`/api/workspace/tasks/${taskId}/send-deliverable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail, toName: toName || undefined, subject, emailBody: body, attachmentFormat: format }),
      })
      const d = await res.json()
      if (d.sent) { setSentVia(d.sentVia ?? 'Gmail'); setPhase('sent') }
      else { setSendError(d.error ?? 'Failed to send.'); setPhase('compose') }
    } catch { setSendError('Network error.'); setPhase('compose') }
  }

  const allChecked   = CHECK_ITEMS.every(c => checked[c.id])
  const stages       = revisionMode === 'recreate' ? RECREATE_STAGES : FINETUNE_STAGES
  const doneStage    = revisionAgents.length > 0 ? Math.max(0, ...revisionAgents.filter(a => a.status === 'done').map(a => a.stage)) : 0
  const workingStage = revisionAgents.find(a => a.status === 'working')?.stage ?? 0

  // ── Render: loading ─────────────────────────────────────────────────────────
  if (phase === 'loading') return (
    <div className="max-w-5xl mx-auto px-4 py-20 flex items-center justify-center gap-3 text-gray-400">
      <Spinner /><span className="text-sm">Loading deliverable…</span>
    </div>
  )

  if (phase === 'error') return (
    <div className="max-w-5xl mx-auto px-4 py-20 text-center">
      <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">⚠</div>
      <p className="text-gray-600 mb-6">{errorMsg}</p>
      <Link href="/dashboard/workspace" className="text-indigo-600 font-semibold hover:underline">← Back to Workspace</Link>
    </div>
  )

  if (!data) return null

  const r     = data.result
  const d     = revisionMode === 'manual' && editDraft ? editDraft : (r.deliverable ?? {})
  const rv    = r.review ?? {}
  const score = rv.score ?? 0

  // ── Render: sent ────────────────────────────────────────────────────────────
  if (phase === 'sent') return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg">✓</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Sent Successfully!</h1>
      <p className="text-gray-500 mb-1">Sent to <span className="font-semibold text-gray-700">{toEmail}</span></p>
      {toName && <p className="text-gray-400 text-sm mb-1">Client: {toName}</p>}
      <p className="text-gray-400 text-sm mb-8">Via {sentVia} · {format !== 'none' ? `${format.toUpperCase()} report attached` : 'No attachment'}</p>
      <div className="flex gap-3 justify-center">
        <Link href="/dashboard/workspace" className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">← Back to Workspace</Link>
        <button onClick={() => { setPhase('compose'); setSendError('') }} className="px-5 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors">Send Again</button>
      </div>
    </div>
  )

  // ── Render: compose / sending ───────────────────────────────────────────────
  if (phase === 'compose' || phase === 'sending') return (
    <div className="max-w-2xl mx-auto px-4 pb-16">
      <div className="flex items-center gap-2 text-xs text-gray-400 pt-6 pb-5">
        <Link href="/dashboard/workspace" className="hover:text-gray-600 transition-colors">Workspace</Link>
        <span>/</span>
        <button onClick={() => setPhase('review')} className="hover:text-gray-600 transition-colors">{data.taskTitle}</button>
        <span>/</span>
        <span className="text-gray-600 font-medium">Send to Client</span>
      </div>
      <div className="flex items-center gap-2 mb-6">
        <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-sm">✓</div>
        <div>
          <div className="text-sm font-bold text-green-700">Deliverable Accepted</div>
          <div className="text-xs text-gray-400">Compose your email to {data.client.name || 'the client'}</div>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <h2 className="font-bold text-gray-900">Compose Email</h2>
          <p className="text-xs text-gray-500 mt-0.5">Review and send your deliverable to the client</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Client Email *</label>
              <input type="email" value={toEmail} onChange={e => setToEmail(e.target.value)} placeholder="client@company.com"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Client Name</label>
              <input type="text" value={toName} onChange={e => setToName(e.target.value)} placeholder="Rahul Sharma"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Subject *</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">Report Attachment</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'html', icon: '🌐', label: 'HTML Report', desc: 'Styled report' },
                { value: 'text', icon: '📄', label: 'Text File',   desc: 'Plain .txt' },
                { value: 'none', icon: '✉️', label: 'Email Only',  desc: 'No attachment' },
              ] as const).map(opt => (
                <button key={opt.value} onClick={() => setFormat(opt.value)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${format === opt.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-base mb-1">{opt.icon}</div>
                  <div className={`text-xs font-bold mb-0.5 ${format === opt.value ? 'text-indigo-700' : 'text-gray-700'}`}>{opt.label}</div>
                  <div className="text-xs text-gray-400 leading-tight">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5">Email Body</label>
            <textarea rows={10} value={body} onChange={e => setBody(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y font-mono leading-relaxed"/>
          </div>
          {sendError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <span>⚠</span> {sendError}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button onClick={() => setPhase('review')} disabled={phase === 'sending'} className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors disabled:opacity-50">← Edit Deliverable</button>
          <button onClick={send} disabled={phase === 'sending' || !toEmail || !subject}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2 transition-all">
            {phase === 'sending' ? <><Spinner size="xs" /> Sending…</> : <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
              Send via Gmail
            </>}
          </button>
        </div>
      </div>
    </div>
  )

  // ── Render: review (main) ───────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto px-4 pb-16">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-400 pt-6 pb-5">
        <Link href="/dashboard/workspace" className="hover:text-gray-600">Workspace</Link>
        <span>/</span>
        <span className="text-gray-500">{data.workspaceTitle}</span>
        <span>/</span>
        <span className="text-gray-700 font-medium truncate max-w-xs">{data.taskTitle}</span>
        <span>/</span>
        <span className="text-indigo-600 font-semibold">Deliverable Review</span>
      </div>

      {/* Page title */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            Review Deliverable
            {r._revised && <span className="text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Revised</span>}
            {(data.result as {_manualEdit?: boolean})._manualEdit && <span className="text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">Manually Edited</span>}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Review the work before sending to your client</p>
        </div>
        {score > 0 && (
          <div className="flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl px-4 py-2 text-center">
            <div className="text-xl font-black text-white">{score}</div>
            <div className="text-xs text-white/70 font-medium">Quality</div>
          </div>
        )}
      </div>

      {/* Revision success banner */}
      {revisionSuccess && !isRevising && (
        <div className="mb-5 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-green-500 text-lg">✓</span>
          <div>
            <p className="text-sm font-bold text-green-700">Deliverable Updated</p>
            <p className="text-xs text-green-600">Please re-review and tick all checklist items before sending.</p>
          </div>
          <button onClick={() => setRevisionSuccess(false)} className="ml-auto text-green-400 hover:text-green-600 text-xs">Dismiss</button>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-5">

        {/* ── Left: deliverable content ── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Summary card */}
          {d.summary && (
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white">
              <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-2">Executive Summary</div>
              {revisionMode === 'manual' ? (
                <textarea rows={3} value={editDraft?.summary ?? ''} onChange={e => setEditDraft(p => p ? { ...p, summary: e.target.value } : p)}
                  className="w-full text-sm bg-white/20 text-white placeholder-white/50 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"/>
              ) : (
                <p className="text-sm leading-relaxed opacity-90">{d.summary}</p>
              )}
              {score > 0 && <div className="mt-4"><ScoreBar score={score} /></div>}
            </div>
          )}

          {/* AI Team (non-editable info) */}
          {(r.team?.length ?? 0) > 0 && revisionMode !== 'manual' && (
            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5">AI Specialists</p>
              <div className="flex flex-wrap gap-1.5">
                {r.team!.map((t, i) => <span key={i} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full font-medium">{t}</span>)}
              </div>
            </div>
          )}

          {/* Main output */}
          {(d.mainOutput || revisionMode === 'manual') && (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700">Deliverable Output</h3>
                {revisionMode === 'manual' && <span className="text-xs text-blue-500 font-medium">Editing</span>}
              </div>
              <div className="px-5 py-4">
                {revisionMode === 'manual' ? (
                  <textarea rows={10} value={editDraft?.mainOutput ?? ''} onChange={e => setEditDraft(p => p ? { ...p, mainOutput: e.target.value } : p)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y leading-relaxed"/>
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{d.mainOutput}</p>
                )}
              </div>
            </div>
          )}

          {/* Sections */}
          {revisionMode === 'manual' ? (
            <div className="space-y-3">
              {(editDraft?.sections ?? []).map((s, i) => (
                <div key={i} className="bg-white border border-blue-200 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 bg-blue-50 flex items-center gap-2">
                    <input value={s.title} onChange={e => setEditDraft(p => {
                      if (!p) return p
                      const ss = [...(p.sections ?? [])]
                      ss[i] = { ...ss[i], title: e.target.value }
                      return { ...p, sections: ss }
                    })} className="flex-1 text-sm font-bold bg-transparent focus:outline-none text-gray-700"/>
                    <button onClick={() => setEditDraft(p => {
                      if (!p) return p
                      const ss = (p.sections ?? []).filter((_, j) => j !== i)
                      return { ...p, sections: ss }
                    })} className="text-xs text-red-400 hover:text-red-600 transition-colors">Remove</button>
                  </div>
                  <div className="px-5 py-4">
                    <textarea rows={4} value={s.content} onChange={e => setEditDraft(p => {
                      if (!p) return p
                      const ss = [...(p.sections ?? [])]
                      ss[i] = { ...ss[i], content: e.target.value }
                      return { ...p, sections: ss }
                    })} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"/>
                  </div>
                </div>
              ))}
              <button onClick={() => setEditDraft(p => p ? { ...p, sections: [...(p.sections ?? []), { title: 'New Section', content: '' }] } : p)}
                className="w-full py-2.5 border-2 border-dashed border-indigo-300 rounded-xl text-sm text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors">
                + Add Section
              </button>
            </div>
          ) : (
            (d.sections?.length ?? 0) > 0 && d.sections!.map((s, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50"><h3 className="text-sm font-bold text-gray-700">{s.title}</h3></div>
                <div className="px-5 py-4"><p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{s.content}</p></div>
              </div>
            ))
          )}

          {/* Key findings */}
          {(rv.keyFindings?.length ?? 0) > 0 && revisionMode !== 'manual' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-amber-700 mb-3">Key Findings</h3>
              <ul className="space-y-2">
                {rv.keyFindings!.map((f, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-amber-800">
                    <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex-shrink-0 flex items-center justify-center font-bold text-xs mt-0.5">{i + 1}</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next steps */}
          {revisionMode === 'manual' ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-green-700 mb-3">Next Steps for Client</h3>
              <div className="space-y-2">
                {(editDraft?.nextSteps ?? []).map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-200 text-green-700 flex-shrink-0 flex items-center justify-center font-bold text-xs mt-2">{i + 1}</span>
                    <input value={s} onChange={e => setEditDraft(p => {
                      if (!p) return p
                      const ns = [...(p.nextSteps ?? [])]
                      ns[i] = e.target.value
                      return { ...p, nextSteps: ns }
                    })} className="flex-1 text-sm border border-green-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"/>
                    <button onClick={() => setEditDraft(p => p ? { ...p, nextSteps: (p.nextSteps ?? []).filter((_, j) => j !== i) } : p)}
                      className="text-xs text-red-400 hover:text-red-600 px-2">✕</button>
                  </div>
                ))}
                <button onClick={() => setEditDraft(p => p ? { ...p, nextSteps: [...(p.nextSteps ?? []), ''] } : p)}
                  className="text-xs text-green-600 font-semibold hover:underline">+ Add step</button>
              </div>
            </div>
          ) : (
            (d.nextSteps?.length ?? 0) > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-green-700 mb-3">Next Steps for Client</h3>
                <ol className="space-y-2">
                  {d.nextSteps!.map((s, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-green-800">
                      <span className="w-5 h-5 rounded-full bg-green-200 text-green-700 flex-shrink-0 flex items-center justify-center font-bold text-xs mt-0.5">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )
          )}

          {/* Email draft (collapsible) */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <button onClick={() => setShowDraft(p => !p)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                <span className="text-sm font-bold text-gray-700">Email Draft</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">AI-generated</span>
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${showDraft ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            {showDraft && (
              <div className="border-t border-gray-100 px-5 py-4">
                {revisionMode === 'manual' ? (
                  <textarea rows={8} value={editDraft?.emailDraft ?? ''} onChange={e => setEditDraft(p => p ? { ...p, emailDraft: e.target.value } : p)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y font-mono"/>
                ) : (
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-mono bg-gray-50 rounded-xl p-3.5">{d.emailDraft}</p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* ── Right: review + revision panel (sticky) ── */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 space-y-4">

            {/* ── Revising: live progress ── */}
            {isRevising && (
              <div className="bg-white border border-indigo-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 text-white">
                  <div className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-0.5">AI Revision</div>
                  <div className="font-bold">{revisionMode === 'recreate' ? 'Recreating Deliverable…' : 'Applying Changes…'}</div>
                </div>
                {/* Stage pipeline */}
                <div className="px-5 pt-4 pb-2">
                  <div className="flex items-center gap-1">
                    {stages.map((name, i) => {
                      const stageNum  = i + 1
                      const isDone    = doneStage >= stageNum
                      const isWorking = workingStage === stageNum && !isDone
                      return (
                        <div key={i} className="flex items-center flex-1 min-w-0">
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDone ? 'bg-green-500 text-white' : isWorking ? 'bg-indigo-500 text-white ring-4 ring-indigo-100' : 'bg-gray-100 text-gray-400'}`}>
                              {isDone ? '✓' : isWorking ? <Spinner size="xs" /> : stageNum}
                            </div>
                            <span className={`truncate max-w-full ${isDone ? 'text-green-600' : isWorking ? 'text-indigo-600 font-semibold' : 'text-gray-400'}`} style={{ fontSize: '9px' }}>{name}</span>
                          </div>
                          {i < stages.length - 1 && <div className={`flex-1 h-0.5 mx-0.5 mb-3 rounded-full ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="px-4 pb-4 space-y-1.5">
                  {revisionAgents.map((a, i) => (
                    <div key={i} className={`flex items-center gap-2.5 p-2 rounded-lg ${a.status === 'working' ? 'bg-indigo-50' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${a.status === 'done' ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {a.status === 'done' ? '✓' : <Spinner size="xs" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-semibold truncate ${a.status === 'working' ? 'text-indigo-700' : 'text-gray-700'}`}>{a.agent}</div>
                        {a.message && <div className="text-xs text-gray-400 truncate">{a.message}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Review checklist (hidden while revising) ── */}
            {!isRevising && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="font-bold text-gray-900 text-sm">Review Checklist</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Tick all items to proceed to send</p>
                </div>
                <div className="px-5 py-4 space-y-3">
                  {CHECK_ITEMS.map(item => (
                    <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
                      <div className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all ${checked[item.id] ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}
                        onClick={() => setChecked(p => ({ ...p, [item.id]: !p[item.id] }))}>
                        {checked[item.id] && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                      </div>
                      <span className={`text-sm leading-snug ${checked[item.id] ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.label}</span>
                    </label>
                  ))}
                </div>
                <div className="px-5 pb-5 space-y-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-400">{Object.values(checked).filter(Boolean).length}/{CHECK_ITEMS.length} reviewed</span>
                    {allChecked && <span className="text-xs font-bold text-green-600">Ready ✓</span>}
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div className={`h-full rounded-full transition-all duration-500 ${allChecked ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-indigo-400 to-purple-500'}`}
                      style={{ width: `${(Object.values(checked).filter(Boolean).length / CHECK_ITEMS.length) * 100}%` }} />
                  </div>
                  {revisionMode === 'manual' ? (
                    <div className="space-y-2">
                      {revisionError && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{revisionError}</p>}
                      <div className="flex gap-2">
                        <button onClick={saveManualEdits} disabled={savingEdit}
                          className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
                          {savingEdit ? <><Spinner size="xs" /> Saving…</> : '💾 Save Edits'}
                        </button>
                        <button onClick={() => { setRevisionMode(null); setEditDraft(null) }}
                          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:text-gray-700 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={accept} disabled={!allChecked}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                      Accept &amp; Compose Email
                    </button>
                  )}
                  {!allChecked && revisionMode !== 'manual' && <p className="text-xs text-center text-gray-400">Tick all {CHECK_ITEMS.length} items to proceed</p>}
                </div>
              </div>
            )}

            {/* ── Request Changes panel ── */}
            {!isRevising && (
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                    <span className="text-base">🔧</span> Found an Issue?
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Correct, fine-tune, or recreate the deliverable</p>
                </div>

                {/* Mode selector */}
                <div className="px-4 pt-4 pb-2 grid grid-cols-3 gap-2">
                  {([
                    { id: 'finetune' as RevisionMode, icon: '✏️', label: 'Fine-tune',    desc: 'Targeted AI change' },
                    { id: 'recreate' as RevisionMode, icon: '🔄', label: 'Recreate',     desc: 'Full fresh rebuild' },
                    { id: 'manual'   as RevisionMode, icon: '📝', label: 'Edit Manually', desc: 'Edit sections yourself' },
                  ]).map(opt => (
                    <button key={opt.id!}
                      onClick={() => {
                        if (opt.id === 'manual') { enterManualEdit(); return }
                        setRevisionMode(prev => prev === opt.id ? null : opt.id)
                      }}
                      className={`text-left p-2.5 rounded-xl border-2 transition-all ${revisionMode === opt.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                    >
                      <div className="text-sm mb-1">{opt.icon}</div>
                      <div className={`text-xs font-bold leading-tight ${revisionMode === opt.id ? 'text-indigo-700' : 'text-gray-700'}`}>{opt.label}</div>
                      <div className="text-xs text-gray-400 leading-tight mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Prompt input for finetune / recreate */}
                {(revisionMode === 'finetune' || revisionMode === 'recreate') && (
                  <div className="px-4 pb-4 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5">
                        {revisionMode === 'finetune' ? 'What specifically needs to change?' : 'What was wrong? What should the fresh version focus on?'}
                      </label>
                      <textarea
                        rows={4}
                        value={revisionPrompt}
                        onChange={e => setRevisionPrompt(e.target.value)}
                        placeholder={revisionMode === 'finetune'
                          ? 'e.g. The cost estimates are too generic — add market-specific rates and a detailed breakdown…'
                          : 'e.g. The entire approach was wrong — focus on structural engineering calculations, not just design…'}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                      />
                    </div>
                    {revisionError && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{revisionError}</p>}
                    <div className="flex gap-2">
                      <button onClick={submitRevision} disabled={!revisionPrompt.trim() || isRevising}
                        className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        {revisionMode === 'finetune'
                          ? <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>Apply Changes</>
                          : <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Recreate All</>}
                      </button>
                      <button onClick={() => { setRevisionMode(null); setRevisionPrompt(''); setRevisionError('') }}
                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:text-gray-700 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {!revisionMode && <div className="px-4 pb-4 pt-1"><p className="text-xs text-gray-400 text-center">Select an option above to fix the deliverable</p></div>}
              </div>
            )}

            {/* Task metadata */}
            <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Task</p>
                <p className="text-sm font-semibold text-gray-800">{data.taskTitle}</p>
              </div>
              {data.client.email && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Client</p>
                  <p className="text-sm font-medium text-gray-700">{data.client.name || data.client.email}</p>
                  <p className="text-xs text-gray-400">{data.client.email}</p>
                </div>
              )}
              {r.blueprint?.taskType && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Type</p>
                  <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">{r.blueprint.taskType}</span>
                </div>
              )}
            </div>

            <Link href="/dashboard/workspace" className="block text-center text-xs text-gray-400 hover:text-gray-600 py-1">← Back to Workspace</Link>

          </div>
        </div>
      </div>
    </div>
  )
}
