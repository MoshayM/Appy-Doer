'use client'

import { useState, useEffect, useRef } from 'react'

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

interface EmailThread {
  id: string
  gmailThreadId: string
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
  INTERESTED:    '🔥',
  NEED_QUOTE:    '💰',
  NEED_MEETING:  '📅',
  NEED_SAMPLE:   '🎯',
  NOT_INTERESTED:'❌',
  WRONG_CONTACT: '🔄',
  OUT_OF_OFFICE: '🏖️',
  SPAM:          '⚠️',
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

export default function OutreachPage() {
  const [threads,       setThreads]       = useState<EmailThread[]>([])
  const [loading,       setLoading]       = useState(true)
  const [selected,      setSelected]      = useState<EmailThread | null>(null)
  const [threadLoading, setThreadLoading] = useState(false)
  const [syncing,       setSyncing]       = useState(false)
  const [filter,        setFilter]        = useState<string>('ALL')
  const [replyBody,     setReplyBody]     = useState('')
  const [replying,      setReplying]      = useState(false)
  const [replyError,    setReplyError]    = useState('')
  const [replySuccess,  setReplySuccess]  = useState(false)
  const autoOpenDone = useRef(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { loadThreads() }, [])

  // Auto-open thread from ?thread= param — runs once after threads load
  useEffect(() => {
    if (autoOpenDone.current || !threads.length) return
    const threadId = new URLSearchParams(window.location.search).get('thread')
    if (!threadId) return
    const match = threads.find(t => t.id === threadId)
    if (match) { autoOpenDone.current = true; openThread(match) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads])

  useEffect(() => {
    if (selected?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selected?.messages])

  async function loadThreads() {
    setLoading(true)
    try {
      const res = await fetch('/api/email/threads')
      if (res.ok) setThreads(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function openThread(thread: EmailThread) {
    setSelected({ ...thread, messages: undefined })
    setReplyBody('')
    setReplyError('')
    setReplySuccess(false)
    setThreadLoading(true)
    try {
      const res = await fetch(`/api/email/threads/${thread.id}`)
      if (res.ok) {
        const data = await res.json()
        setSelected(data)
        // Mark as read in local state
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
    if (!selected || !replyBody.trim()) return
    setReplying(true)
    setReplyError('')
    setReplySuccess(false)
    try {
      const res = await fetch(`/api/email/threads/${selected.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody }),
      })
      const data = await res.json()
      if (!res.ok) {
        setReplyError(data.error?.message ?? 'Reply failed')
        return
      }
      setReplySuccess(true)
      setReplyBody('')
      // Refresh thread
      const refreshed = await fetch(`/api/email/threads/${selected.id}`)
      if (refreshed.ok) setSelected(await refreshed.json())
    } finally {
      setReplying(false)
    }
  }

  async function updateStatus(threadId: string, status: string) {
    await fetch(`/api/email/threads/${threadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, status: status as EmailThread['status'] } : t))
    if (selected?.id === threadId) setSelected(s => s ? { ...s, status: status as EmailThread['status'] } : null)
  }

  const filteredThreads = filter === 'ALL' ? threads
    : filter === 'UNREAD' ? threads.filter(t => t.unreadCount > 0)
    : threads.filter(t => t.status === filter)

  // Stats
  const stats = {
    total:     threads.length,
    replied:   threads.filter(t => ['REPLIED', 'INTERESTED', 'NEGOTIATING', 'WON'].includes(t.status)).length,
    interested:threads.filter(t => ['INTERESTED', 'NEGOTIATING'].includes(t.status)).length,
    won:       threads.filter(t => t.status === 'WON').length,
    unread:    threads.reduce((s, t) => s + t.unreadCount, 0),
  }
  const replyRate = stats.total > 0 ? Math.round((stats.replied / stats.total) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outreach</h1>
          <p className="text-gray-500 text-sm mt-0.5">Track email conversations and manage replies</p>
        </div>
        <button
          onClick={syncNow}
          disabled={syncing}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {syncing ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          ) : '🔄'} {syncing ? 'Syncing…' : 'Sync Gmail'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Emails Sent',    value: stats.total,     color: 'text-gray-900' },
          { label: 'Replies',        value: stats.replied,   color: 'text-green-700' },
          { label: 'Reply Rate',     value: replyRate + '%', color: 'text-indigo-700' },
          { label: 'Interested',     value: stats.interested,color: 'text-orange-700' },
          { label: 'Won',            value: stats.won,       color: 'text-emerald-700' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-5 gap-4" style={{ height: 'calc(100vh - 320px)', minHeight: '500px' }}>
        {/* Thread list */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden">
          {/* Filter tabs */}
          <div className="px-4 py-3 border-b border-gray-100 flex gap-1.5 flex-wrap">
            {['ALL', 'UNREAD', 'REPLIED', 'INTERESTED', 'WON', 'LOST'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {f === 'UNREAD' && stats.unread > 0 ? `Unread (${stats.unread})` : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
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
                <div className="text-xs text-gray-400 mt-1">Send emails from Client Intelligence to start tracking</div>
              </div>
            ) : filteredThreads.map(thread => (
              <button
                key={thread.id}
                onClick={() => openThread(thread)}
                className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors ${selected?.id === thread.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className={`flex-1 min-w-0 text-sm font-medium text-gray-900 truncate ${thread.unreadCount > 0 ? 'font-semibold' : ''}`}>
                    {thread.contactName || thread.contactEmail}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {thread.unreadCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600"/>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STATUS_CONFIG[thread.status]?.color}`}>
                      {STATUS_CONFIG[thread.status]?.label}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 truncate mb-1">{thread.subject}</div>
                <div className="flex items-center justify-between gap-2">
                  {thread.aiIntent && (
                    <span className="text-xs text-gray-400">
                      {INTENT_ICON[thread.aiIntent]} {thread.aiIntent.replace(/_/g, ' ').toLowerCase()}
                    </span>
                  )}
                  <span className="text-xs text-gray-300 ml-auto">{timeAgo(thread.lastMessageAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation panel */}
        <div className="lg:col-span-3 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="text-4xl mb-3">💬</div>
              <div className="font-semibold text-gray-700">Select a conversation</div>
              <div className="text-sm text-gray-400 mt-1">Click any thread to read the full conversation</div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {selected.contactName || selected.contactEmail}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate">{selected.contactEmail} · {selected.subject}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={selected.status}
                      onChange={e => updateStatus(selected.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-lg border font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 ${STATUS_CONFIG[selected.status]?.color}`}
                    >
                      {Object.entries(STATUS_CONFIG).map(([v, { label }]) => (
                        <option key={v} value={v}>{label}</option>
                      ))}
                    </select>
                    <a href="/dashboard/crm" className="text-xs text-indigo-600 border border-indigo-200 rounded-lg px-2 py-1 hover:bg-indigo-50 transition-colors">
                      CRM →
                    </a>
                  </div>
                </div>
                {selected.aiInsight && (
                  <div className="mt-2 text-xs text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2 flex items-start gap-2">
                    <span className="shrink-0">🧠</span>
                    <span>{selected.aiInsight}</span>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {threadLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-2xl animate-bounce mb-2">💬</div>
                      <div className="text-sm text-gray-400">Loading conversation…</div>
                    </div>
                  </div>
                ) : selected.messages?.length === 0 ? (
                  <div className="text-center text-sm text-gray-400 py-8">No messages stored yet. Click "Sync Gmail" to fetch them.</div>
                ) : selected.messages?.map(msg => (
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

              {/* Reply composer */}
              <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                {replySuccess && (
                  <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    ✓ Reply sent via Gmail
                  </div>
                )}
                {replyError && (
                  <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span>{replyError}</span>
                    <button onClick={() => setReplyError('')} className="text-red-400 ml-2">×</button>
                  </div>
                )}
                <div className="flex gap-2">
                  <textarea
                    rows={3}
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    placeholder="Write your reply…"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendReply()
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={sendReply}
                      disabled={replying || !replyBody.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                      {replying ? 'Sending…' : 'Reply'}
                    </button>
                    <span className="text-xs text-gray-300 text-center">⌘↵</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
