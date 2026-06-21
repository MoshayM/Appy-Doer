'use client'

import { useState, useEffect, useCallback } from 'react'

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
  user: { id: string; email: string; name: string | null; plan: string }
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

export default function AdminTicketsPage() {
  const [tickets, setTickets]         = useState<Ticket[]>([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [search, setSearch]           = useState('')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [resolution, setResolution]   = useState('')
  const [newStatus, setNewStatus]     = useState('')
  const [updating, setUpdating]       = useState(false)
  const [updateMsg, setUpdateMsg]     = useState('')

  const loadTickets = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter)   params.set('status', statusFilter)
    if (priorityFilter) params.set('priority', priorityFilter)
    if (search)         params.set('search', search)

    const res = await fetch(`/api/admin/tickets?${params}`)
    if (res.ok) {
      const d = await res.json()
      setTickets(d.tickets ?? [])
      setTotal(d.total ?? 0)
    }
    setLoading(false)
  }, [statusFilter, priorityFilter, search])

  useEffect(() => { loadTickets() }, [loadTickets])

  function openTicket(ticket: Ticket) {
    setSelectedTicket(ticket)
    setNewStatus(ticket.status)
    setResolution(ticket.resolution ?? '')
    setUpdateMsg('')
  }

  async function handleUpdate() {
    if (!selectedTicket) return
    setUpdating(true); setUpdateMsg('')

    const res = await fetch(`/api/admin/tickets/${selectedTicket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, resolution }),
    })
    const data = await res.json()

    if (!res.ok) {
      setUpdateMsg(data.error?.message ?? 'Update failed')
    } else {
      setUpdateMsg('Ticket updated and user notified.')
      setSelectedTicket(data.ticket ? { ...selectedTicket, ...data.ticket } : selectedTicket)
      await loadTickets()
    }
    setUpdating(false)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-xl">🎫</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
            <p className="text-gray-500 text-sm">{total} ticket{total !== 1 ? 's' : ''} total</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tickets..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-56"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Ticket list */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading...</div>
          ) : tickets.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <div className="text-3xl mb-2">🎫</div>
              <div className="font-semibold text-gray-700">No tickets found</div>
            </div>
          ) : tickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => openTicket(ticket)}
              className={`w-full text-left bg-white border rounded-2xl px-5 py-4 hover:shadow-sm transition-all ${
                selectedTicket?.id === ticket.id ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{ticket.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">{ticket.user.email}</div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[ticket.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[ticket.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ticket.priority}
                    </span>
                    {ticket.workflowContext && (
                      <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full truncate max-w-[140px]">{ticket.workflowContext}</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0 pt-1">
                  {new Date(ticket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          {selectedTicket ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 sticky top-4">
              <div>
                <div className="font-bold text-gray-900 mb-1">{selectedTicket.title}</div>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[selectedTicket.priority]}`}>{selectedTicket.priority}</span>
                  {selectedTicket.workflowContext && (
                    <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{selectedTicket.workflowContext}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  <span className="font-medium">{selectedTicket.user.name ?? selectedTicket.user.email}</span>
                  {selectedTicket.user.name && <span className="text-gray-400"> · {selectedTicket.user.email}</span>}
                </div>
                <div className="text-xs text-gray-400">Plan: {selectedTicket.user.plan}</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Update Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Resolution / Response</label>
                <textarea
                  value={resolution}
                  onChange={e => setResolution(e.target.value)}
                  rows={3}
                  placeholder="Add a resolution or response message for the user..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                />
              </div>

              {updateMsg && (
                <div className={`text-xs px-3 py-2 rounded-lg ${updateMsg.includes('failed') || updateMsg.includes('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {updateMsg}
                </div>
              )}

              <button
                onClick={handleUpdate}
                disabled={updating}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update & Notify User'}
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <div className="text-3xl mb-2">👈</div>
              <div className="text-sm text-gray-400">Select a ticket to manage it</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
