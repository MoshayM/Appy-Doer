'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  workflowContext?: string
  onClose: () => void
  onSuccess?: () => void
}

const PRIORITY_OPTIONS = [
  { value: 'LOW',    label: 'Low',    color: 'bg-gray-100 text-gray-700' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'HIGH',   label: 'High',   color: 'bg-orange-100 text-orange-700' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-700' },
]

export default function RaiseTicketModal({ workflowContext, onClose, onSuccess }: Props) {
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority]     = useState('MEDIUM')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setError('Please fill in both title and description.')
      return
    }
    setSubmitting(true); setError('')

    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, priority, workflowContext }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error?.message ?? 'Failed to raise ticket. Please try again.')
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
    onSuccess?.()
    setTimeout(onClose, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Raise a Support Ticket</h2>
            <p className="text-xs text-gray-400 mt-0.5">Admin will be notified immediately</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl mb-3">✅</div>
            <div className="font-semibold text-gray-900 mb-1">Ticket Raised Successfully</div>
            <div className="text-sm text-gray-500">Our admin team has been notified and will get back to you soon.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {workflowContext && (
              <div className="text-xs bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg">
                Context: <span className="font-medium">{workflowContext}</span>
              </div>
            )}

            {error && (
              <div className="text-sm bg-red-50 text-red-700 px-3 py-2 rounded-lg">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title <span className="text-red-500">*</span></label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Briefly describe the problem..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                maxLength={120}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the issue in detail — what happened, what you expected, and any steps to reproduce..."
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                maxLength={2000}
              />
              <div className="text-right text-xs text-gray-300 mt-1">{description.length}/2000</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <div className="flex gap-2 flex-wrap">
                {PRIORITY_OPTIONS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium border-2 transition-all ${
                      priority === p.value
                        ? `${p.color} border-current`
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Raise Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
