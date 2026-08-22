'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Paperclip, Send, Trash2, AlertCircle, CheckCircle, Clock, RotateCcw } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Attachment  { id: string; filename: string; mimeType: string; sizeBytes: number }
interface Message     { id: string; senderRole: string; senderName: string; body: string; createdAt: string; attachments: Attachment[] }
interface Ticket      {
  id: string; title: string; description: string; status: string; priority: string
  workflowContext: string | null; resolution: string | null
  createdAt: string; resolvedAt: string | null; messages: Message[]
}
interface FileItem    { filename: string; mimeType: string; sizeBytes: number; dataBase64: string; localUrl: string }

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  OPEN:        { label: 'Open',        cls: 'bg-blue-100 text-blue-700',    icon: <RotateCcw size={11} /> },
  IN_PROGRESS: { label: 'In Progress', cls: 'bg-amber-100 text-amber-700',  icon: <Clock size={11} /> },
  RESOLVED:    { label: 'Resolved',    cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle size={11} /> },
  CLOSED:      { label: 'Closed',      cls: 'bg-gray-100 text-gray-500',    icon: <X size={11} /> },
}

const PRIORITY_META: Record<string, { label: string; cls: string; dot: string }> = {
  LOW:    { label: 'Low',    cls: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400' },
  MEDIUM: { label: 'Medium', cls: 'bg-yellow-50 text-yellow-700', dot: 'bg-yellow-400' },
  HIGH:   { label: 'High',   cls: 'bg-orange-100 text-orange-700',dot: 'bg-orange-500' },
  URGENT: { label: 'Urgent', cls: 'bg-red-100 text-red-700',      dot: 'bg-red-500' },
}

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
const ACCEPT_TYPES = 'image/*,application/pdf,.doc,.docx,.txt,.xlsx,.csv,.zip'
const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.endsWith('.csv')) return '📊'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return '🗜️'
  return '📎'
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.OPEN
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${m.cls}`}>
      {m.icon} {m.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const m = PRIORITY_META[priority] ?? PRIORITY_META.MEDIUM
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}

function AttachmentChip({ att, ticketId }: { att: Attachment; ticketId?: string }) {
  const href = `/api/tickets/attachments/${att.id}`
  const isImage = att.mimeType.startsWith('image/')
  return (
    <a href={href} target="_blank" rel="noreferrer" download={!isImage}
      className="flex items-center gap-2 bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 transition-all group max-w-xs">
      {isImage ? (
        <img src={href} alt={att.filename} className="w-8 h-8 object-cover rounded-lg flex-shrink-0" />
      ) : (
        <span className="text-base flex-shrink-0">{fileIcon(att.mimeType)}</span>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold text-gray-800">{att.filename}</p>
        <p className="text-gray-400">{fmtSize(att.sizeBytes)}</p>
      </div>
    </a>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MyTicketsPage() {
  const [tickets,       setTickets]       = useState<Ticket[]>([])
  const [loadingList,   setLoadingList]   = useState(true)
  const [selectedId,    setSelectedId]    = useState<string | null>(null)
  const [messages,      setMessages]      = useState<Message[]>([])
  const [loadingMsgs,   setLoadingMsgs]   = useState(false)
  const [replyText,     setReplyText]     = useState('')
  const [files,         setFiles]         = useState<FileItem[]>([])
  const [sending,       setSending]       = useState(false)
  const [deleteId,      setDeleteId]      = useState<string | null>(null)
  const [deleting,      setDeleting]      = useState(false)
  const [showNewForm,   setShowNewForm]   = useState(false)
  const [fileError,     setFileError]     = useState('')

  // New-ticket form state
  const [ntTitle,    setNtTitle]    = useState('')
  const [ntDesc,     setNtDesc]     = useState('')
  const [ntPriority, setNtPriority] = useState<'LOW'|'MEDIUM'|'HIGH'|'URGENT'>('MEDIUM')
  const [ntContext,  setNtContext]   = useState('')
  const [ntFiles,    setNtFiles]    = useState<FileItem[]>([])
  const [ntError,    setNtError]    = useState('')
  const [ntSending,  setNtSending]  = useState(false)

  const threadRef   = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const ntFileRef   = useRef<HTMLInputElement>(null)

  const selectedTicket = tickets.find(t => t.id === selectedId) ?? null

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => { loadTickets() }, [])

  useEffect(() => {
    if (selectedId) loadMessages(selectedId)
    else setMessages([])
  }, [selectedId])

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages])

  async function loadTickets() {
    setLoadingList(true)
    const res = await fetch('/api/tickets')
    if (res.ok) { const d = await res.json(); setTickets(d.tickets ?? []) }
    setLoadingList(false)
  }

  async function loadMessages(ticketId: string) {
    setLoadingMsgs(true)
    const res = await fetch(`/api/tickets/${ticketId}/messages`)
    if (res.ok) { const d = await res.json(); setMessages(d.messages ?? []) }
    setLoadingMsgs(false)
  }

  // ── File pick ───────────────────────────────────────────────────────────────
  async function handleFilePick(raw: FileList | null, setter: (f: FileItem[]) => void, current: FileItem[]) {
    if (!raw) return
    setFileError('')
    const added: FileItem[] = []
    for (const file of Array.from(raw)) {
      if (file.size > MAX_FILE_BYTES) { setFileError(`"${file.name}" exceeds 5 MB limit`); continue }
      const dataBase64 = await readFileAsBase64(file)
      added.push({
        filename:   file.name,
        mimeType:   file.type || 'application/octet-stream',
        sizeBytes:  file.size,
        dataBase64,
        localUrl:   URL.createObjectURL(file),
      })
    }
    setter([...current, ...added])
  }

  // ── Send reply ──────────────────────────────────────────────────────────────
  async function sendReply() {
    if (!selectedId || (!replyText.trim() && files.length === 0)) return
    setSending(true)
    const res = await fetch(`/api/tickets/${selectedId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: replyText,
        attachments: files.map(f => ({ filename: f.filename, mimeType: f.mimeType, sizeBytes: f.sizeBytes, dataBase64: f.dataBase64 })),
      }),
    })
    if (res.ok) {
      const d = await res.json()
      setMessages(p => [...p, d.message])
      setReplyText('')
      files.forEach(f => URL.revokeObjectURL(f.localUrl))
      setFiles([])
      // If ticket was reopened, update local status
      setTickets(p => p.map(t => t.id === selectedId && (t.status === 'RESOLVED' || t.status === 'CLOSED')
        ? { ...t, status: 'OPEN' } : t))
    }
    setSending(false)
  }

  // ── Delete ticket ───────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteId) return
    setDeleting(true)
    const res = await fetch(`/api/tickets/${deleteId}`, { method: 'DELETE' })
    if (res.ok) {
      setTickets(p => p.filter(t => t.id !== deleteId))
      if (selectedId === deleteId) { setSelectedId(null); setMessages([]) }
    }
    setDeleteId(null)
    setDeleting(false)
  }

  // ── Create new ticket ───────────────────────────────────────────────────────
  async function createTicket(e: React.FormEvent) {
    e.preventDefault()
    if (!ntTitle.trim() || !ntDesc.trim()) { setNtError('Title and description are required.'); return }
    setNtSending(true); setNtError('')
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: ntTitle, description: ntDesc, priority: ntPriority, workflowContext: ntContext || undefined }),
    })
    const data = await res.json()
    if (!res.ok) { setNtError(data.error?.message ?? 'Failed to create ticket.'); setNtSending(false); return }

    const newTicket: Ticket = { ...data.ticket, messages: [] }
    setTickets(p => [newTicket, ...p])
    setNtTitle(''); setNtDesc(''); setNtPriority('MEDIUM'); setNtContext(''); setNtFiles([])
    setShowNewForm(false)
    setSelectedId(newTicket.id)
    setNtSending(false)

    // If there were files, send them as the first message
    if (ntFiles.length > 0) {
      await fetch(`/api/tickets/${newTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: '',
          attachments: ntFiles.map(f => ({ filename: f.filename, mimeType: f.mimeType, sizeBytes: f.sizeBytes, dataBase64: f.dataBase64 })),
        }),
      })
      ntFiles.forEach(f => URL.revokeObjectURL(f.localUrl))
      setNtFiles([])
      loadMessages(newTicket.id)
    }
  }

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full -m-8 overflow-hidden bg-gray-50">

      {/* ══ LEFT PANEL — ticket list ══ */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
          <div>
            <h1 className="font-bold text-gray-900 text-base">Support Center</h1>
            <p className="text-xs text-gray-400 mt-0.5">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => { setShowNewForm(true); setSelectedId(null) }}
            className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-xl transition-colors">
            + New
          </button>
        </div>

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">Loading…</div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-6">
              <div className="text-4xl mb-2">🎫</div>
              <p className="text-sm font-semibold text-gray-600">No tickets yet</p>
              <p className="text-xs text-gray-400 mt-1">Click + New to raise your first ticket</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {tickets.map(ticket => {
                const isSelected = selectedId === ticket.id
                const sm = STATUS_META[ticket.status] ?? STATUS_META.OPEN
                const pm = PRIORITY_META[ticket.priority] ?? PRIORITY_META.MEDIUM
                return (
                  <div key={ticket.id}
                    className={`group relative cursor-pointer px-4 py-3.5 transition-all ${isSelected ? 'bg-indigo-50 border-l-2 border-indigo-500' : 'hover:bg-gray-50 border-l-2 border-transparent'}`}
                    onClick={() => { setSelectedId(ticket.id); setShowNewForm(false) }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className={`text-sm font-semibold leading-snug flex-1 truncate ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>
                        {ticket.title}
                      </p>
                      {/* Delete button */}
                      {deleteId === ticket.id ? (
                        <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          <button onClick={confirmDelete} disabled={deleting}
                            className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded-md transition-colors">
                            {deleting ? '…' : 'Yes'}
                          </button>
                          <button onClick={() => setDeleteId(null)}
                            className="text-xs text-gray-400 hover:text-gray-600 px-1">No</button>
                        </div>
                      ) : (
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteId(ticket.id) }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                          title="Delete ticket"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate mb-2">{ticket.description}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full ${sm.cls}`}>
                        {sm.icon} {sm.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full ${pm.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pm.dot}`} /> {pm.label}
                      </span>
                      <span className="text-xs text-gray-300 ml-auto">
                        {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ RIGHT PANEL ══ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── New Ticket Form ── */}
        {showNewForm && (
          <div className="flex flex-col h-full overflow-y-auto">
            <div className="max-w-2xl w-full mx-auto px-8 py-8 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Raise a Support Ticket</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Describe your issue — admin will be notified immediately</p>
                </div>
                <button onClick={() => setShowNewForm(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {ntError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={14} /> {ntError}
                </div>
              )}

              <form onSubmit={createTicket} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Issue Title <span className="text-red-400">*</span></label>
                  <input value={ntTitle} onChange={e => setNtTitle(e.target.value)} maxLength={120}
                    placeholder="Briefly describe the problem…"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description <span className="text-red-400">*</span></label>
                  <textarea value={ntDesc} onChange={e => setNtDesc(e.target.value)} maxLength={3000} rows={5}
                    placeholder="What happened? What did you expect? Steps to reproduce…"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white resize-none"
                  />
                  <p className="text-right text-xs text-gray-300 mt-1">{ntDesc.length}/3000</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                  <div className="flex gap-2 flex-wrap">
                    {PRIORITY_OPTIONS.map(p => {
                      const m = PRIORITY_META[p]
                      return (
                        <button key={p} type="button" onClick={() => setNtPriority(p)}
                          className={`text-xs px-4 py-2 rounded-full font-semibold border-2 transition-all ${ntPriority === p ? `${m.cls} border-current` : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                          {m.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Workflow Context <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input value={ntContext} onChange={e => setNtContext(e.target.value)}
                    placeholder="e.g. Skill Assessment, Offer Builder…"
                    className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white"
                  />
                </div>

                {/* File attachments for new ticket */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Attachments <span className="text-gray-400 font-normal">(optional, max 5 MB each)</span></label>
                  <input ref={ntFileRef} type="file" multiple accept={ACCEPT_TYPES}
                    className="hidden"
                    onChange={e => handleFilePick(e.target.files, setNtFiles, ntFiles).then(() => { if (ntFileRef.current) ntFileRef.current.value = '' })}
                  />
                  {ntFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {ntFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs">
                          <span>{fileIcon(f.mimeType)}</span>
                          <span className="font-medium text-gray-700 max-w-[120px] truncate">{f.filename}</span>
                          <span className="text-gray-400">{fmtSize(f.sizeBytes)}</span>
                          <button type="button" onClick={() => setNtFiles(p => p.filter((_, j) => j !== i))}
                            className="text-gray-400 hover:text-red-500 transition-colors"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button type="button" onClick={() => ntFileRef.current?.click()}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 border border-dashed border-gray-300 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl px-4 py-2.5 transition-all">
                    <Paperclip size={14} /> Attach files
                  </button>
                </div>

                {fileError && <p className="text-xs text-red-500">{fileError}</p>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowNewForm(false)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={ntSending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-60">
                    {ntSending ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Raising…</> : '🎫 Raise Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Empty state (no ticket selected) ── */}
        {!showNewForm && !selectedId && (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center text-4xl mb-5">🎫</div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Your Support Center</h2>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              Select a ticket to view the conversation, or raise a new one. Attach screenshots, PDFs, or documents to give admin the full picture.
            </p>
            <button onClick={() => setShowNewForm(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-sm hover:shadow-md transition-all text-sm">
              + Raise a New Ticket
            </button>
          </div>
        )}

        {/* ── Conversation view ── */}
        {!showNewForm && selectedId && selectedTicket && (
          <div className="flex flex-col h-full overflow-hidden">

            {/* Ticket header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-gray-900 text-base leading-snug">{selectedTicket.title}</h2>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <StatusBadge status={selectedTicket.status} />
                    <PriorityBadge priority={selectedTicket.priority} />
                    {selectedTicket.workflowContext && (
                      <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                        {selectedTicket.workflowContext}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      Opened {new Date(selectedTicket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteId(selectedTicket.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-xl transition-all border border-transparent hover:border-red-100 flex-shrink-0"
                  title="Delete this ticket"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
              {deleteId === selectedTicket.id && (
                <div className="mt-3 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700 flex-1">Delete this ticket and all its messages permanently?</span>
                  <button onClick={confirmDelete} disabled={deleting}
                    className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60">
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                  <button onClick={() => setDeleteId(null)}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Message thread */}
            <div ref={threadRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

              {/* Original description — shown as opening message */}
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  You
                </div>
                <div className="flex-1 max-w-xl">
                  <div className="bg-indigo-600 text-white rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 ml-1">{fmtDate(selectedTicket.createdAt)}</p>
                </div>
              </div>

              {/* Resolution banner (if resolved) */}
              {selectedTicket.resolution && (
                <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
                  <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Resolution from Admin</p>
                    <p className="text-sm text-emerald-800 leading-relaxed whitespace-pre-wrap">{selectedTicket.resolution}</p>
                    {selectedTicket.resolvedAt && (
                      <p className="text-xs text-emerald-500 mt-2">{fmtDate(selectedTicket.resolvedAt)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Conversation messages */}
              {loadingMsgs ? (
                <div className="flex items-center justify-center py-8 text-sm text-gray-400">Loading conversation…</div>
              ) : messages.map(msg => {
                const isUser = msg.senderRole === 'USER'
                return (
                  <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                      isUser ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {isUser ? 'You' : 'A'}
                    </div>

                    <div className={`flex-1 max-w-xl ${isUser ? 'flex flex-col items-end' : ''}`}>
                      {/* Sender label */}
                      <p className="text-xs text-gray-400 mb-1 mx-1">
                        {isUser ? 'You' : `Admin · ${msg.senderName}`}
                      </p>

                      {/* Bubble */}
                      {msg.body && (
                        <div className={`px-4 py-3 rounded-2xl ${
                          isUser
                            ? 'bg-indigo-600 text-white rounded-tr-sm'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                        </div>
                      )}

                      {/* Attachments */}
                      {msg.attachments.length > 0 && (
                        <div className={`flex flex-wrap gap-2 mt-2 ${isUser ? 'justify-end' : ''}`}>
                          {msg.attachments.map(att => (
                            <AttachmentChip key={att.id} att={att} />
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-1.5 mx-1">{fmtDate(msg.createdAt)}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Reply box */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-4">
              {fileError && <p className="text-xs text-red-500 mb-2">{fileError}</p>}

              {/* Attached files preview */}
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs">
                      {f.mimeType.startsWith('image/') ? (
                        <img src={f.localUrl} alt="" className="w-6 h-6 object-cover rounded-lg" />
                      ) : (
                        <span>{fileIcon(f.mimeType)}</span>
                      )}
                      <span className="font-medium text-gray-700 max-w-[100px] truncate">{f.filename}</span>
                      <span className="text-gray-400">{fmtSize(f.sizeBytes)}</span>
                      <button onClick={() => setFiles(p => { const n = [...p]; URL.revokeObjectURL(f.localUrl); n.splice(i,1); return n })}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-0.5">
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply() }}
                  placeholder="Write a reply… (Ctrl+Enter to send)"
                  rows={2}
                  className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 resize-none bg-gray-50 focus:bg-white transition-colors"
                />
                <input ref={fileInputRef} type="file" multiple accept={ACCEPT_TYPES}
                  className="hidden"
                  onChange={e => handleFilePick(e.target.files, setFiles, files).then(() => { if (fileInputRef.current) fileInputRef.current.value = '' })}
                />
                <button onClick={() => fileInputRef.current?.click()}
                  title="Attach files"
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex-shrink-0">
                  <Paperclip size={16} />
                </button>
                <button onClick={sendReply} disabled={sending || (!replyText.trim() && files.length === 0)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all disabled:opacity-40 flex-shrink-0 shadow-sm">
                  {sending
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Send size={15} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 text-right">Supports images, PDF, Word, Excel, ZIP · max 5 MB each</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
