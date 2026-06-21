'use client'

import { useState, useEffect } from 'react'
import RaiseTicketModal from '@/components/tickets/RaiseTicketModal'

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  priority: string
  workflowContext: string | null
  resolution: string | null
  createdAt: string
  resolvedAt: string | null
}

const STATUS_STYLES: Record<string, string> = {
  OPEN:        'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  RESOLVED:    'bg-green-100 text-green-700',
  CLOSED:      'bg-gray-100 text-gray-500',
}

const PRIORITY_STYLES: Record<string, string> = {
  LOW:    'bg-gray-100 text-gray-500',
  MEDIUM: 'bg-yellow-50 text-yellow-700',
  HIGH:   'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
}

export default function MyTicketsPage() {
  const [tickets, setTickets]         = useState<Ticket[]>([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [expandedId, setExpandedId]   = useState<string | null>(null)

  useEffect(() => { loadTickets() }, [])

  async function loadTickets() {
    setLoading(true)
    const res = await fetch('/api/tickets')
    if (res.ok) {
      const d = await res.json()
      setTickets(d.tickets ?? [])
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Support Tickets</h1>
          <p className="text-gray-500 mt-1">Track issues you have raised with the admin team</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-colors"
        >
          + Raise Ticket
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
          <div className="text-4xl mb-3">🎫</div>
          <div className="font-semibold text-gray-700 mb-1">No tickets yet</div>
          <div className="text-gray-400 text-sm mb-6">Raise a ticket whenever you encounter a problem in your workflow</div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-red-700 transition-colors"
          >
            Raise Your First Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <button
                className="w-full text-left px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{ticket.title}</div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[ticket.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[ticket.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ticket.priority}
                    </span>
                    {ticket.workflowContext && (
                      <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{ticket.workflowContext}</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0 pt-1">
                  {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </button>

              {expandedId === ticket.id && (
                <div className="px-6 pb-5 border-t border-gray-50 pt-4 space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                  </div>
                  {ticket.resolution && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Resolution</div>
                      <p className="text-sm text-green-800 whitespace-pre-wrap">{ticket.resolution}</p>
                      {ticket.resolvedAt && (
                        <p className="text-xs text-green-500 mt-2">
                          Resolved on {new Date(ticket.resolvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <RaiseTicketModal
          onClose={() => setShowModal(false)}
          onSuccess={loadTickets}
        />
      )}
    </div>
  )
}
