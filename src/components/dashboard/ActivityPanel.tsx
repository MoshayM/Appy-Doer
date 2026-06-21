'use client'

import { useEffect, useState } from 'react'
import { ACTION_LABELS } from '@/lib/activity'

interface ActivityLog {
  id: string
  action: string
  meta: Record<string, unknown>
  createdAt: string
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { key: 'all',     label: 'All'      },
  { key: 'ai',      label: 'AI Runs'  },
  { key: 'crm',     label: 'CRM'      },
  { key: 'emails',  label: 'Emails'   },
  { key: 'profile', label: 'Profile'  },
] as const

type TabKey = typeof TABS[number]['key']

const TAB_ACTIONS: Record<TabKey, string[]> = {
  all:     [],
  ai:      ['SKILL_ASSESSMENT','OPPORTUNITY_DISCOVERY','OFFER_BUILDER','PORTFOLIO_BUILDER','PROFILE_INTELLIGENCE','CLIENT_INTELLIGENCE','CLIENT_ACQUISITION','RELATIONSHIP_SUCCESS','WORK_SUPPORT'],
  crm:     ['LEAD_ADDED','LEAD_MOVED','LEAD_WON','PROSPECT_SAVED'],
  emails:  ['COLD_EMAIL_SENT','CONTACT'],
  profile: ['PROFILE_UPDATED','SKILLS_SAVED'],
}

const PAGE_SIZE = 8

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60)     return 'just now'
  if (seconds < 3600)   return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400)  return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatStage(s: string) {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
}

// Action-aware detail rows shown in the accordion
function detailRows(action: string, meta: Record<string, unknown>): { label: string; value: string }[] {
  switch (action) {
    case 'LEAD_ADDED':
    case 'LEAD_WON':
    case 'PROSPECT_SAVED': {
      const rows = []
      if (meta.name)    rows.push({ label: 'Name',    value: String(meta.name) })
      if (meta.company) rows.push({ label: 'Company', value: String(meta.company) })
      if (meta.email)   rows.push({ label: 'Email',   value: String(meta.email) })
      return rows
    }
    case 'LEAD_MOVED': {
      const rows = []
      if (meta.name) rows.push({ label: 'Lead',  value: String(meta.name) })
      if (meta.from) rows.push({ label: 'From',  value: formatStage(String(meta.from)) })
      if (meta.to)   rows.push({ label: 'To',    value: formatStage(String(meta.to)) })
      return rows
    }
    case 'COLD_EMAIL_SENT': {
      const rows = []
      if (meta.to)      rows.push({ label: 'To',       value: String(meta.to) })
      if (meta.company) rows.push({ label: 'Company',  value: String(meta.company) })
      if (meta.via)     rows.push({ label: 'Sent via', value: String(meta.via).charAt(0).toUpperCase() + String(meta.via).slice(1) })
      return rows
    }
    default: {
      // Generic fallback — show any non-empty string/number fields
      return Object.entries(meta)
        .filter(([k, v]) => k !== 'leadId' && (typeof v === 'string' || typeof v === 'number') && v !== '')
        .slice(0, 4)
        .map(([k, v]) => ({
          label: k.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()),
          value: String(v),
        }))
    }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActivityPanel() {
  const [logs,     setLogs]     = useState<ActivityLog[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<TabKey>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [page,     setPage]     = useState(1)

  useEffect(() => {
    fetch('/api/activity')
      .then(r => r.json())
      .then(d => { setLogs(d.logs ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function switchTab(t: TabKey) {
    setTab(t)
    setPage(1)
    setExpanded(null)
  }

  const filtered = tab === 'all' ? logs : logs.filter(l => TAB_ACTIONS[tab].includes(l.action))
  const visible  = filtered.slice(0, page * PAGE_SIZE)
  const hasMore  = visible.length < filtered.length

  function tabCount(key: TabKey) {
    return key === 'all' ? logs.length : logs.filter(l => TAB_ACTIONS[key].includes(l.action)).length
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden h-fit">

      {/* Header + tabs */}
      <div className="px-5 pt-5">
        <h2 className="font-bold text-gray-900 mb-3">Activity History</h2>

        <div className="flex gap-1 overflow-x-auto pb-3 border-b border-gray-100" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(t => {
            const count   = tabCount(t.key)
            const active  = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                {t.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                  active ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* List */}
      <div className="px-3 py-3 space-y-0.5">

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2 px-2 py-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse py-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-2 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">{tab === 'all' ? '🌱' : '🔍'}</div>
            <p className="text-sm font-medium text-gray-600">
              {tab === 'all' ? 'No activity yet' : `No ${TABS.find(t => t.key === tab)?.label} activity`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {tab === 'all' ? 'Run your first Skill Assessment to get started.' : 'Switch to All to see everything.'}
            </p>
          </div>
        )}

        {/* Activity rows */}
        {!loading && visible.map(log => {
          const info    = ACTION_LABELS[log.action] ?? { label: log.action.replace(/_/g, ' '), icon: '📌' }
          const rows    = detailRows(log.action, log.meta)
          const isOpen  = expanded === log.id
          const canOpen = rows.length > 0

          return (
            <div key={log.id} className="rounded-xl overflow-hidden">
              {/* Row */}
              <button
                onClick={() => canOpen && setExpanded(isOpen ? null : log.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 text-left transition-colors rounded-xl ${
                  isOpen
                    ? 'bg-indigo-50 rounded-b-none'
                    : canOpen
                    ? 'hover:bg-gray-50 cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                {/* Icon bubble */}
                <span className="w-8 h-8 flex items-center justify-center bg-white border border-gray-100 rounded-full text-base shrink-0 shadow-sm">
                  {info.icon}
                </span>

                {/* Label + time */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 leading-snug">{info.label}</p>
                  <time className="text-xs text-gray-400">{timeAgo(log.createdAt)}</time>
                </div>

                {/* Chevron */}
                {canOpen && (
                  <span
                    className="text-gray-400 text-xs shrink-0 transition-transform duration-200"
                    style={{ display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    ▾
                  </span>
                )}
              </button>

              {/* Accordion body */}
              {isOpen && canOpen && (
                <div className="bg-indigo-50 border-t border-indigo-100 mx-0 px-4 py-3 rounded-b-xl">
                  <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                    {rows.map(({ label, value }) => (
                      <>
                        <span key={`l-${label}`} className="text-xs text-gray-400 whitespace-nowrap">{label}</span>
                        <span key={`v-${label}`} className="text-xs font-medium text-gray-700 break-all">{value}</span>
                      </>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Load more */}
        {!loading && hasMore && (
          <button
            onClick={() => setPage(p => p + 1)}
            className="w-full text-center text-xs text-indigo-600 font-semibold py-3 hover:bg-indigo-50 rounded-xl transition-colors"
          >
            ▼ Show {Math.min(PAGE_SIZE, filtered.length - visible.length)} more
          </button>
        )}

        {/* Collapse to first page */}
        {!loading && !hasMore && page > 1 && (
          <button
            onClick={() => { setPage(1); setExpanded(null) }}
            className="w-full text-center text-xs text-gray-400 font-medium py-2 hover:text-gray-600 transition-colors"
          >
            ▲ Show less
          </button>
        )}

      </div>
    </div>
  )
}
