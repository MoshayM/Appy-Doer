'use client'

import { useState, useEffect, useRef } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  meta?: Record<string, unknown>
  createdAt: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const TYPE_ICON: Record<string, string> = {
  REPLY_RECEIVED:     '💬',
  CELEBRATION:        '🎉',
  TRIAL_REMINDER:     '⏰',
  RELATIONSHIP_REMINDER: '🤝',
  WEEKLY_DIGEST:      '📊',
}

export default function NotificationBell() {
  const [open,          setOpen]          = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread,        setUnread]        = useState(0)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadNotifications()

    // SSE connection for real-time updates
    let es: EventSource | null = null
    try {
      es = new EventSource('/api/sse/notifications')
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'count') {
            setUnread(data.unread)
          } else if (data.type === 'notifications') {
            setUnread(data.unread)
            setNotifications(prev => [...data.notifications, ...prev].slice(0, 50))
          }
        } catch { /* ignore */ }
      }
      es.onerror = () => { es?.close() }
    } catch { /* SSE not supported */ }

    // Also poll every 60s as fallback
    const poll = setInterval(loadNotifications, 60_000)

    return () => {
      es?.close()
      clearInterval(poll)
    }
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function loadNotifications() {
    try {
      const res = await fetch('/api/notifications?limit=20')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnread(data.unread)
      }
    } catch { /* non-critical */ }
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  async function deleteNotification(id: string) {
    const wasUnread = notifications.find(n => n.id === id && !n.read)
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (wasUnread) setUnread(prev => Math.max(0, prev - 1))
  }

  async function clearAll() {
    await Promise.all(notifications.map(n => fetch(`/api/notifications/${n.id}`, { method: 'DELETE' })))
    setNotifications([])
    setUnread(0)
  }

  return (
    <div className="relative" ref={drawerRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-900 text-sm">Notifications</span>
            <div className="flex items-center gap-3">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-indigo-600 hover:underline">
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-600 hover:underline">
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : notifications.map(n => (
              <div key={n.id} className={`group px-4 py-3 ${n.read ? 'bg-white' : 'bg-indigo-50'}`}>
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">{TYPE_ICON[n.type] ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${n.read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>{n.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</div>
                    <div className="text-xs text-gray-300 mt-1">{timeAgo(n.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500"/>}
                    <button
                      onClick={() => deleteNotification(n.id)}
                      title="Delete"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-300 hover:text-red-400 hover:bg-red-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
                {n.type === 'REPLY_RECEIVED' && !!n.meta?.threadId && (
                  <a
                    href="/dashboard/outreach"
                    onClick={() => setOpen(false)}
                    className="mt-2 block text-xs text-indigo-600 hover:underline"
                  >
                    View conversation →
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="px-4 py-2.5 border-t border-gray-100 text-center">
            <a href="/dashboard/outreach" onClick={() => setOpen(false)} className="text-xs text-indigo-600 hover:underline">
              View all in Outreach →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
