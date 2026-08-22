'use client'

import { useState } from 'react'

interface Flag {
  id: string
  key: string
  description: string | null
  type: string
  value: unknown
  phase: string | null
  updatedAt: string
}

export default function FlagsClient({ initialFlags }: { initialFlags: Flag[] }) {
  const [flags,   setFlags]   = useState<Flag[]>(initialFlags)
  const [saving,  setSaving]  = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')
  const [error,   setError]   = useState('')

  async function toggleBoolean(flag: Flag) {
    setSaving(flag.key)
    setError('')
    try {
      const res = await fetch(`/api/admin/flags/${encodeURIComponent(flag.key)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: !flag.value }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error?.message ?? 'Update failed'); return }
      setFlags(prev => prev.map(f => f.key === flag.key ? { ...f, value: data.value, updatedAt: data.updatedAt } : f))
    } catch { setError('Network error') }
    finally { setSaving(null) }
  }

  function startEdit(flag: Flag) {
    setEditing(flag.key)
    setEditVal(typeof flag.value === 'string' ? flag.value : JSON.stringify(flag.value))
  }

  async function saveEdit(flag: Flag) {
    setSaving(flag.key)
    setError('')
    try {
      let parsed: unknown
      try { parsed = JSON.parse(editVal) } catch { parsed = editVal }

      const res = await fetch(`/api/admin/flags/${encodeURIComponent(flag.key)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: parsed }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error?.message ?? 'Update failed'); setSaving(null); return }
      setFlags(prev => prev.map(f => f.key === flag.key ? { ...f, value: data.value, updatedAt: data.updatedAt } : f))
      setEditing(null)
    } catch { setError('Network error') }
    finally { setSaving(null) }
  }

  const PHASE_BADGE: Record<string, string> = {
    MVP:     'bg-green-100 text-green-700',
    PHASE_2: 'bg-blue-100 text-blue-700',
    PHASE_3: 'bg-purple-100 text-purple-700',
    PHASE_4: 'bg-amber-100 text-amber-700',
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>⚠ {error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Feature Flags</h2>
            <p className="text-xs text-gray-400 mt-0.5">{flags.length} flag{flags.length !== 1 ? 's' : ''} · changes take effect immediately</p>
          </div>
        </div>

        {flags.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">No feature flags configured yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {flags.map(flag => (
              <div key={flag.key} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                {/* Key + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <code className="text-sm font-mono font-semibold text-indigo-700">{flag.key}</code>
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">{flag.type}</span>
                    {flag.phase && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PHASE_BADGE[flag.phase] ?? 'bg-gray-100 text-gray-500'}`}>
                        {flag.phase.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  {flag.description && <p className="text-xs text-gray-500 mb-2">{flag.description}</p>}

                  {/* Value display / edit */}
                  {flag.type === 'boolean' ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium ${flag.value ? 'text-green-700' : 'text-gray-400'}`}>
                        {flag.value ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  ) : editing === flag.key ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        className="flex-1 border border-indigo-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(flag); if (e.key === 'Escape') setEditing(null) }}
                        autoFocus
                      />
                      <button onClick={() => saveEdit(flag)} disabled={saving === flag.key}
                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                        {saving === flag.key ? '…' : 'Save'}
                      </button>
                      <button onClick={() => setEditing(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancel</button>
                    </div>
                  ) : (
                    <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">
                      {JSON.stringify(flag.value)}
                    </code>
                  )}
                  <p className="text-xs text-gray-300 mt-1.5">
                    Updated {new Date(flag.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>

                {/* Action */}
                <div className="shrink-0 mt-0.5">
                  {flag.type === 'boolean' ? (
                    <button
                      onClick={() => toggleBoolean(flag)}
                      disabled={saving === flag.key}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                        flag.value ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                      aria-label={`${flag.value ? 'Disable' : 'Enable'} ${flag.key}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        flag.value ? 'translate-x-6' : 'translate-x-1'
                      } ${saving === flag.key ? 'opacity-60' : ''}`}/>
                    </button>
                  ) : editing !== flag.key ? (
                    <button onClick={() => startEdit(flag)}
                      className="text-xs text-indigo-500 border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors font-medium">
                      Edit
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
